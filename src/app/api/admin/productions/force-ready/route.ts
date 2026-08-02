import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { getProviderStatus } from "@/lib/providers/status";
import type { ProviderJob } from "@/lib/providers/types";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { supabaseAdmin } from "@/lib/supabase";

function firstUrl(value: unknown): string {
  if (typeof value === "string") {
    const direct = value.trim();
    if (/^https?:\/\//i.test(direct)) return direct;
    const match = direct.match(/https?:\/\/[^\s"'<>]+/i);
    return match?.[0] ?? "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["output", "url", "video", "video_url", "result", "src", "preview_url", "download_url", "file", "files"]) {
      const found = firstUrl(record[key]);
      if (found) return found;
    }
    for (const nested of Object.values(record)) {
      const found = firstUrl(nested);
      if (found) return found;
    }
  }
  return "";
}

function isRealVideoUrl(url: string) {
  if (!/^https?:\/\//i.test(url)) return false;
  if (/api\.replicate\.com\/v1\/predictions|\/api\/productions\/.*\/delivery\?file=|manifest|readme|preview\.html|placeholder|generated_on_download/i.test(url)) return false;
  return /\.mp4(\?|$)|\.mov(\?|$)|\.webm(\?|$)|replicate\.delivery|fal\.media|storage\.googleapis|cloudfront|r2\.dev|supabase/i.test(url);
}

function urlValue(...values: unknown[]) {
  for (const value of values) {
    const url = firstUrl(value);
    if (url && isRealVideoUrl(url)) return url;
  }
  return "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();

  const productionId = String(body.production_id ?? body.productionId ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });

  const supabase = supabaseAdmin();
  const { data: current, error: readError } = await supabase
    .from("production_requests")
    .select("*")
    .eq("id", productionId)
    .maybeSingle();

  if (readError) return Response.json({ error: readError.message }, { status: 500 });
  if (!current) return Response.json({ error: "Production not found." }, { status: 404 });

  const outputJson = current.output_json && typeof current.output_json === "object" ? current.output_json as Record<string, unknown> : {};
  const visualStatus = outputJson.visualStatus && typeof outputJson.visualStatus === "object" ? outputJson.visualStatus as Record<string, unknown> : {};
  const renderStatus = outputJson.renderStatus && typeof outputJson.renderStatus === "object" ? outputJson.renderStatus as Record<string, unknown> : {};
  const visualJob = outputJson.visualJob && typeof outputJson.visualJob === "object" ? outputJson.visualJob as ProviderJob : null;
  const renderJob = outputJson.renderJob && typeof outputJson.renderJob === "object" ? outputJson.renderJob as ProviderJob : null;
  let liveProviderStatus: Record<string, unknown> | null = null;
  let releaseSource = "stored_or_final_output";
  let finalUrl = urlValue(outputJson.finalVideoUrl, outputJson.providerFinalUrl, renderStatus.outputUrl, renderStatus, current.delivery_link, current.preview_url);
  if (!finalUrl) {
    finalUrl = urlValue(visualStatus.outputUrl, visualStatus, outputJson.rawVisualPreviewUrl, outputJson.visualJob, outputJson);
    if (finalUrl) releaseSource = "raw_visual_fallback";
  }

  if (!finalUrl && renderJob?.id) {
    const status = await getProviderStatus(renderJob);
    liveProviderStatus = status as Record<string, unknown>;
    finalUrl = urlValue(status.outputUrl, status.raw, status);
    if (finalUrl) releaseSource = "live_render_status";
  }
  if (!finalUrl && visualJob?.id) {
    const status = await getProviderStatus(visualJob);
    liveProviderStatus = status as Record<string, unknown>;
    finalUrl = urlValue(status.outputUrl, status.raw, status);
    if (finalUrl) releaseSource = "live_raw_visual_fallback";
  }

  if (!finalUrl) {
    const failedOutput = {
      ...outputJson,
      finalVideoUrl: null,
      providerFinalUrl: null,
      previewUrl: null,
      deliveryLink: null,
      providerStatus: "provider_succeeded_no_video_url",
      adminPolledProviderStatus: liveProviderStatus,
      releaseError: "Provider job succeeded, but no real MP4/MOV/WEBM media URL was found. Prediction API URLs and preview.html placeholders are not deliverable video files."
    };
    const { data: repaired } = await supabase
      .from("production_requests")
      .update({
        status: "in_production",
        automation_status: "provider_output_missing",
        generation_status: "provider_succeeded_no_video_url",
        output_json: failedOutput,
        preview_url: null,
        delivery_link: null,
        delivery_zip_url: null,
        admin_notes: "Provider reported success, but no real video file URL was found. Check Replicate raw output/model result before releasing.",
        updated_at: new Date().toISOString()
      })
      .eq("id", productionId)
      .select("*")
      .maybeSingle();
    return Response.json({ error: "Provider succeeded, but no real video file URL was found. Prediction API URLs and preview.html placeholders were rejected.", production: repaired, providerStatus: liveProviderStatus, visualJob, renderJob }, { status: 409 });
  }

  const readyOutput = {
    ...outputJson,
    finalVideoUrl: finalUrl,
    providerFinalUrl: finalUrl,
    previewUrl: finalUrl,
    deliveryLink: finalUrl,
    providerStatus: "admin_force_ready",
    releaseSource,
    adminPolledProviderStatus: liveProviderStatus,
    qualityGate: {
      status: "admin_override_passed",
      checkedAt: new Date().toISOString(),
      reason: releaseSource.includes("raw_visual") ? "Admin released raw visual provider output because final voice/subtitle render was unavailable." : "Admin released provider video output after quality gate blocked delivery."
    },
    readyGate: {
      passed: true,
      required: ["preview", "final_video"],
      missing: [],
      warnings: releaseSource.includes("raw_visual") ? ["admin_force_ready", "raw_visual_fallback_no_final_audio_subtitles"] : ["admin_force_ready"]
    }
  };

  const finalState = {
    ...current,
    status: "ready",
    automation_status: "completed",
    generation_status: "final_video_ready",
    preview_url: finalUrl,
    delivery_link: finalUrl,
    delivery_zip_url: finalUrl,
    reserved_credits: 0,
    output_json: readyOutput
  };

  const outputWithWorkflow = {
    ...readyOutput,
    workflowState: buildProductionWorkflowState(finalState)
  };

  const { data, error } = await supabase
    .from("production_requests")
    .update({
      status: "ready",
      automation_status: "completed",
      generation_status: "final_video_ready",
      preview_url: finalUrl,
      delivery_link: finalUrl,
      delivery_zip_url: finalUrl,
      reserved_credits: 0,
      output_json: outputWithWorkflow,
      admin_notes: "Admin released provider video output. Customer can preview and download final MP4.",
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq("id", productionId)
    .select("*")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true, production: data, finalVideoUrl: finalUrl });
}
