import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request) {
  const expectedCronSecret = String(process.env.CRON_SECRET ?? "").trim();
  const expectedAdminToken = String(process.env.ADMIN_API_TOKEN ?? "").trim();
  const auth = String(request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const url = new URL(request.url);
  const token = String(url.searchParams.get("token") ?? "").trim();

  if (expectedCronSecret && (auth === expectedCronSecret || token === expectedCronSecret)) return true;
  if (expectedAdminToken && (auth === expectedAdminToken || token === expectedAdminToken)) return true;
  return process.env.NODE_ENV !== "production";
}

function summarizeStatusBody(text: string) {
  try {
    const payload = JSON.parse(text) as Record<string, unknown>;
    const production = payload.production && typeof payload.production === "object" ? payload.production as Record<string, unknown> : {};
    const output = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
    const visualStatus = payload.visualStatus && typeof payload.visualStatus === "object" ? payload.visualStatus as Record<string, unknown> : null;
    const renderStatus = payload.renderStatus && typeof payload.renderStatus === "object" ? payload.renderStatus as Record<string, unknown> : null;
    const visualJob = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : null;
    const renderJob = output.renderJob && typeof output.renderJob === "object" ? output.renderJob as Record<string, unknown> : null;
    return {
      id: production.id ?? null,
      status: production.status ?? null,
      automation_status: production.automation_status ?? null,
      generation_status: production.generation_status ?? null,
      preview_url: Boolean(production.preview_url),
      delivery_link: Boolean(production.delivery_link),
      providerStatus: output.providerStatus ?? null,
      visualProvider: visualStatus?.provider ?? visualJob?.provider ?? null,
      visualStatus: visualStatus?.status ?? visualJob?.status ?? null,
      visualOutputUrl: Boolean(visualStatus?.outputUrl ?? visualJob?.url),
      visualJobId: visualJob?.id ?? null,
      renderProvider: renderStatus?.provider ?? renderJob?.provider ?? null,
      renderStatus: renderStatus?.status ?? renderJob?.status ?? null,
      renderOutputUrl: Boolean(renderStatus?.outputUrl ?? renderJob?.url),
      renderJobId: renderJob?.id ?? null,
      renderError: output.renderError ?? renderStatus?.error ?? null,
      voiceAudioUrl: Boolean(output.voiceAudioUrl),
      voiceAudioSegments: Array.isArray(output.voiceAudioSegments) ? output.voiceAudioSegments.length : 0,
      subtitleUrl: Boolean(output.subtitleUrl),
      message: payload.message ?? null,
      renderPending: payload.renderPending ?? null
    };
  } catch {
    return { parseError: true, body: text.slice(0, 700) };
  }
}

function isAutomationActive(row: Record<string, unknown>) {
  const status = String(row.status ?? "").toLowerCase();
  const automationStatus = String(row.automation_status ?? "").toLowerCase();
  const generationStatus = String(row.generation_status ?? "").toLowerCase();
  const output = row.output_json && typeof row.output_json === "object" ? row.output_json as Record<string, unknown> : {};
  const providerStatus = String(output.providerStatus ?? "").toLowerCase();
  const requiredPipeline = String(output.requiredPipeline ?? "").toLowerCase();
  const hasDedicatedPlan = Boolean(output.characterDialoguePlan) || requiredPipeline === "character_consistent_dialogue_animation";
  const hasGenericProviderJob = Boolean(output.visualJob || output.renderJob || (Array.isArray(output.visualJobs) && output.visualJobs.length > 0));
  const hasFinal = Boolean(output.finalVideoUrl || output.providerFinalUrl);
  if (hasFinal) return false;
  if (["ready", "completed", "cancelled", "failed"].includes(status)) return false;
  if (["completed", "cancelled", "failed"].includes(automationStatus)) return false;
  const videoAgentQueued = String(row.production_type ?? "").toLowerCase() === "video_agent" && (status === "queued" || generationStatus === "automation_queued" || automationStatus === "queued");
  const activeState = videoAgentQueued || status === "in_production" || automationStatus === "running" || generationStatus.includes("provider") || generationStatus.includes("render") || generationStatus.includes("polling");
  return activeState && (videoAgentQueued || hasDedicatedPlan || hasGenericProviderJob || requiredPipeline === "generic_video" || requiredPipeline === "minimax_video_agent" || providerStatus.includes("provider_started") || providerStatus.includes("render"));
}

async function runWorkerPass(origin: string, targetProductionId?: string) {
  const supabase = supabaseAdmin();
  let query = supabase
    .from("production_requests")
    .select("id,status,automation_status,generation_status,production_type,package_id,preview_url,delivery_link,output_json,updated_at")
    .order("updated_at", { ascending: false })
    .limit(25);

  if (targetProductionId) query = query.eq("id", targetProductionId);
  const { data, error } = await query;
  if (error) throw error;

  const candidates = targetProductionId
    ? (data ?? []).slice(0, 1)
    : (data ?? []).filter((row) => isAutomationActive(row as Record<string, unknown>)).slice(0, 5);
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim();
  const adminToken = String(process.env.ADMIN_API_TOKEN ?? "").trim();
  const results: Array<Record<string, unknown>> = [];

  for (const row of candidates) {
    const productionId = String(row.id ?? "").trim();
    if (!productionId) continue;
    try {
      const rowOutput = row.output_json && typeof row.output_json === "object" ? row.output_json as Record<string, unknown> : {};
      const hasProviderJob = Boolean(rowOutput.visualJob || rowOutput.providerJob || (Array.isArray(rowOutput.visualJobs) && rowOutput.visualJobs.length > 0));
      const productionType = String(row.production_type ?? "").toLowerCase();
      const automationStatus = String(row.automation_status ?? row.generation_status ?? row.status ?? "").toLowerCase();
      const startableProduction = [
        "video_agent", "image", "brand_kit", "visual_clone", "virtual_model_studio", "video", "campaign",
        "cinematic_video", "documentary", "music_video", "drama", "drone_video", "video_tools", "video_clipping",
        "talking_video", "avatar", "lip_sync", "animation", "anime_short_film", "stickman_animation", "animal_video",
        "nature_video", "planet_space_video"
      ].includes(productionType) || String(row.package_id ?? "").toLowerCase().startsWith("image_");
      const needsProviderStart = startableProduction && !hasProviderJob && ["queued", "automation_queued", "provider_ready", "provider_ready_queued"].includes(automationStatus);
      if (needsProviderStart) {
        await fetch(`${origin}/api/automation/start`, {
          method: "POST",
          headers: { "content-type": "application/json", "x-automation-worker": "backend-worker" },
          body: JSON.stringify({ production_id: productionId, auto: true, admin_email: adminEmail, admin_token: adminToken })
        }).catch(() => null);
      }
      const response = await fetch(`${origin}/api/automation/status`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-automation-worker": "backend-worker" },
        body: JSON.stringify({ production_id: productionId, auto: true, admin_email: adminEmail, admin_token: adminToken })
      });
      const text = await response.text();
      results.push({ productionId, ok: response.ok, status: response.status, summary: summarizeStatusBody(text), body: text.slice(0, 300) });
    } catch (workerError) {
      results.push({ productionId, ok: false, error: workerError instanceof Error ? workerError.message : "Worker status call failed" });
    }
  }

  return { checked: data?.length ?? 0, candidates: candidates.length, results };
}

export async function GET(request: Request) {
  const startedAt = Date.now();
  const url = new URL(request.url);
  const origin = url.origin;
  const productionId = String(url.searchParams.get("production_id") ?? "").trim();
  const targetedKick = Boolean(productionId) && String(url.searchParams.get("kick") ?? "") === "dedicated";
  if (!isAuthorized(request) && !targetedKick) {
    return Response.json({ error: "Unauthorized automation worker." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const rounds = Math.min(Math.max(Number(url.searchParams.get("rounds") ?? 3) || 3, 1), 5);
  const delayMs = Math.min(Math.max(Number(url.searchParams.get("delay_ms") ?? 12000) || 12000, 1000), 20000);
  const chain = Math.max(Number(url.searchParams.get("chain") ?? 0) || 0, 0);
  const maxChains = Math.min(Math.max(Number(url.searchParams.get("max_chains") ?? 20) || 20, 1), 60);
  const results: Array<Record<string, unknown>> = [];

  for (let index = 0; index < rounds; index += 1) {
    if (index > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
    const pass = await runWorkerPass(origin, productionId || undefined);
    results.push({ round: index + 1, ...pass });
    if (pass.candidates === 0) break;
  }

  const shouldChain = results.some((pass) => Number(pass.candidates ?? 0) > 0) && chain < maxChains;
  if (shouldChain) {
    after(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20000));
      const token = String(process.env.CRON_SECRET || process.env.ADMIN_API_TOKEN || "").trim();
      const chainUrl = `${origin}/api/automation/worker?rounds=3&delay_ms=12000&chain=${chain + 1}&max_chains=${maxChains}${productionId ? `&production_id=${encodeURIComponent(productionId)}` : ""}${token ? `&token=${encodeURIComponent(token)}` : targetedKick ? "&kick=dedicated" : ""}`;
      await fetch(chainUrl).catch(() => null);
    });
  }

  return Response.json({
    ok: true,
    rounds,
    chained: shouldChain,
    results,
    elapsedMs: Date.now() - startedAt
  }, { headers: { "Cache-Control": "no-store" } });
}
