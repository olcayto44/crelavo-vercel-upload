import { NextRequest, NextResponse } from "next/server";
import { handleAssistantWork, quote } from "@/lib/assistant-work/core";
import { GET as creditsGet } from "@/app/api/credits/route";
import { POST as creditsSpend } from "@/app/api/credits/spend/route";
import {
  isLocalCategory,
  isCopyLayoutColorOnly as isLocalCopyOnly,
  runLocalEngine,
} from "@/lib/assistant-work/runLocalEngine";
import {
  engineConfigured,
  getCategoryEngine,
  runMediaEngine,
  isCopyLayoutColorOnly,
} from "@/lib/assistant-work/runMediaEngine";
import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { runVideoClippingPipeline } from "@/lib/pipelines/video-clipping-pipeline";
import { mirrorProviderAsset } from "@/lib/providers/storage";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const out = await handleAssistantWork(req, { action: "balance" });
  return NextResponse.json(out.payload, { status: out.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body && typeof body === "object" && typeof body.prompt === "string") {
    const token = bearerTokenFromRequest(req);
    if (!token) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const supabase = supabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    const user = data.user;
    if (error || !user) {
      return NextResponse.json(
        { ok: false, spend: false, code: "sign_in", message: "Sign in to start production." },
        { status: 401 },
      );
    }

    const category = String(body.category || "").trim();
    const prompt = String(body.prompt || "").trim();
    const type = String(body.type || "");
    const scene = String(body.scene || "01");
    const action = String(body.action || "revise");

    if (!prompt) {
      return NextResponse.json(
        { ok: false, code: "empty_prompt", message: "Write something first." },
        { status: 400 },
      );
    }

    if (isLocalCopyOnly(prompt) || isCopyLayoutColorOnly(prompt)) {
      if (isLocalCategory(category, type)) {
        const local = await runLocalEngine({ prompt, type, category, scene, action });
        return NextResponse.json({ ...local, spend: false });
      }
      const copy = await runMediaEngine({ prompt, type, category, scene });
      return NextResponse.json({ ...copy, spend: false });
    }

    const priced = quote(category, [], "revise", prompt);
    const creditUrl = new URL(req.url);
    creditUrl.pathname = "/api/credits";
    creditUrl.search = "user_id=" + encodeURIComponent(user.id);
    const creditResponse = await creditsGet(new Request(creditUrl.toString(), { headers: req.headers }));
    const creditData = await creditResponse.json().catch(() => ({})) as Record<string, unknown>;
    if (!creditResponse.ok) return NextResponse.json({ ok: false, spend: false, code: "credit_read_failed", message: String(creditData.error || "Credit balance could not be read.") }, { status: creditResponse.status });
    const available = Number(creditData.available ?? creditData.balance ?? creditData.credits ?? 0);
    if (priced.credits > 0 && available < priced.credits) {
      return NextResponse.json({ ok: false, spend: false, code: "insufficient", message: `Not enough credits. Need ${priced.credits}. Balance ${available}.`, balance: available, need: priced.credits }, { status: 402 });
    }

    let result;
    if (category === "video_clipping") {
      const sourceVideoUrl = String(body.sourceVideoUrl || body.source_video_url || (prompt.match(/https:\/\/[^\s<>"]+/i)?.[0] || "")).replace(/[),.;]+$/g, "");
      if (!sourceVideoUrl || !/^https:\/\//i.test(sourceVideoUrl) || !/\.(mp4|mov|webm|m4v)(\?|$)/i.test(sourceVideoUrl)) {
        return NextResponse.json({ ok: false, spend: false, code: "source_video_required", message: "Video clipping requires an uploaded MP4, MOV, WEBM or M4V source video." }, { status: 400 });
      }
      try {
        const clipping = await runVideoClippingPipeline({ productionId: "assistant-" + user.id + "-" + crypto.randomUUID(), title: prompt.slice(0, 100), prompt, requestMetadata: { sourceVideoUrl }, requestedClipCount: Number(body.requestedClipCount || 3), targetDurationSeconds: Number(body.targetDurationSeconds || 18) });
        const render = clipping.renderJob as unknown as Record<string, unknown> | null;
        const finalUrl = typeof render?.outputUrl === "string" && render.outputUrl ? render.outputUrl : clipping.clipUrls[0] || null;
        result = { ok: true, spend: true, engine: "local", category, status: finalUrl ? "ready" : "queued", title: "Video clips ready", body: prompt, media: finalUrl ? { kind: "video", url: finalUrl } : null, taskId: typeof render?.id === "string" ? render.id : undefined, files: [{ name: "clips.json", mime: "application/json", content: JSON.stringify({ sourceVideoUrl: clipping.sourceVideoUrl, clips: clipping.selectedHighlights, subtitleUrl: clipping.subtitleUrl, clipUrls: clipping.clipUrls }, null, 2) }] };
      } catch (error) {
        return NextResponse.json({ ok: false, spend: false, code: "video_clipping_failed", message: error instanceof Error ? error.message : "Video clipping failed." }, { status: 400 });
      }
    } else if (isLocalCategory(category, type)) {
      result = await runLocalEngine({ prompt, type, category, scene, action });
    } else {
      if (!getCategoryEngine(category)) return NextResponse.json({ ok: false, spend: false, code: "unknown_category", message: "Unknown production category." }, { status: 400 });
      if (!engineConfigured(category)) return NextResponse.json({ ok: false, spend: false, code: "engine_not_configured", message: "The selected provider is not configured on this host." }, { status: 503 });
      result = await runMediaEngine({ prompt, type, category, scene });
    }
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    if (result.media?.url && result.status === "ready" && result.engine !== "local") {
      try { result.media.url = await mirrorProviderAsset({ productionId: "assistant-" + user.id, sourceUrl: result.media.url, filenameBase: "media-" + ("taskId" in result && result.taskId ? result.taskId : crypto.randomUUID()), fallbackContentType: result.media.kind === "image" ? "image/jpeg" : result.media.kind === "audio" ? "audio/mpeg" : "video/mp4" }); } catch { /* retain provider URL when storage mirroring is unavailable */ }
    }

    let balance = available;
    let charged = 0;
    const providerTaskId = "taskId" in result ? result.taskId : undefined;
    if (result.spend && priced.credits > 0) {
      const spendHeaders = new Headers(req.headers);
      spendHeaders.set("Content-Type", "application/json");
      const spendResponse = await creditsSpend(new Request(new URL("/api/credits/spend", req.url), {
        method: "POST",
        headers: spendHeaders,
        body: JSON.stringify({ user_id: user.id, amount: priced.credits, session: providerTaskId ?? `assistant-${category}-${scene}-${Date.now()}`, type: category }),
      }));
      const paid = await spendResponse.json().catch(() => ({})) as Record<string, unknown>;
      if (!spendResponse.ok || paid.ok === false) return NextResponse.json({ ok: false, spend: false, code: String(paid.code || "credit_charge_failed"), message: String(paid.error || paid.message || "Credit charge failed."), balance: Number(paid.available ?? paid.balance ?? available), providerTaskId: providerTaskId ?? null }, { status: spendResponse.status || 500 });
      balance = Number(paid.available ?? paid.balance ?? available - priced.credits);
      charged = Number(paid.spent ?? priced.credits);
    }
    const resultStatus = "status" in result && typeof result.status === "string" ? result.status : "ready";
    const assistantProduction = await supabase.from("production_requests").insert({
      user_id: user.id,
      production_type: category || "assistant_work",
      package_id: null,
      title: result.title || category || "Assistant production",
      prompt,
      status: resultStatus === "ready" ? "ready" : "in_production",
      generation_status: resultStatus || "queued",
      estimated_credits: priced.credits,
      reserved_credits: 0,
      input_json: { source: "cinema_assistant", type, scene },
      output_json: { assistant: true, provider: result.engine, taskId: providerTaskId ?? null, media: result.media ?? null, files: result.files ?? [], charged },
      preview_url: result.media?.url ?? null,
      delivery_zip_url: null,
      request_metadata: { source: "cinema_assistant", assistant_task_id: providerTaskId ?? null, provider: result.engine, category, scene, charged, balance },
      completed_at: resultStatus === "ready" ? new Date().toISOString() : null,
    }).select("id").single();
    if (assistantProduction.error) return NextResponse.json({ ...result, balance, charged, productionPersisted: false, productionPersistError: assistantProduction.error.message });
    return NextResponse.json({ ...result, balance, charged, productionId: assistantProduction.data.id });
  }

  const out = await handleAssistantWork(req, body || {});
  return NextResponse.json(out.payload, { status: out.status });
}
