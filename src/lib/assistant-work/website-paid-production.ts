import { z } from "zod";
import { getCategory } from "@/lib/crelavo/categoryCatalog";
import { supabaseAdmin } from "@/lib/supabase";
import { websitePlanHash, normalizeAssistantWebsiteBrief, missingWebsiteBrief, unsupportedWebsiteScope } from "./website-brief";
import { createWebsiteCreditLedger } from "./website-credit-ledger";
import { runIsolatedWebsiteGeneration } from "./website-atomic-runner";

// Explicitly disabled until a reviewed Vercel Production release enables the switch.
// Never reuse the mock/isolated test database or the legacy non-atomic spend API.
export function websitePaidProductionEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.VERCEL_ENV === "production" &&
    env.CRELAVO_WEBSITE_ATOMIC_PAID_ENABLED === "true" &&
    env.STUDIO_AGENT_ISOLATED_PREVIEW !== "true" &&
    Boolean(env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL);
}

const inputSchema = z.strictObject({
  productionId: z.string().uuid(),
  planHash: z.string().regex(/^[a-f0-9]{64}$/),
});

const reply = (payload: Record<string, unknown>, status: number) => ({
  status, payload: { ...payload, executionReady: status === 200, safeToRetryAutomatically: false },
});

export async function executePaidWebsiteProduction(raw: unknown, user: { id: string }) {
  if (!websitePaidProductionEnabled()) {
    return reply({ ok: false, code: "website_atomic_production_not_enabled" }, 503);
  }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return reply({ ok: false, code: "website_render_invalid_request" }, 400);
  const { productionId, planHash } = parsed.data;
  const db = supabaseAdmin();
  const { data: row, error } = await db.from("production_requests")
    .select("id,user_id,production_type,status,estimated_credits,output_json")
    .eq("id", productionId).eq("user_id", user.id)
    .eq("production_type", "website").maybeSingle();
  if (error) return reply({ ok: false, code: "website_production_database_unavailable" }, 503);
  if (!row) return reply({ ok: false, code: "website_project_not_found" }, 404);
  const state = row.output_json?.websiteAssistant;
  // Legacy finished records are never converted or charged retroactively.
  if (row.status === "ready" && row.output_json?.websiteBillingMode === "atomic_v1")
    return reply({ ok: true, state: "already_ready", productionId, charged: 0 }, 200);
  if (state?.phase !== "approved" || state?.planHash !== planHash || state?.approvedHash !== planHash)
    return reply({ ok: false, code: "website_current_approval_required" }, 409);
  const pack = getCategory("website")?.packs.find(p => p.id === state.packId);
  const credits = pack?.credits;
  const brief = normalizeAssistantWebsiteBrief(state.brief);
  if (!pack || typeof credits !== "number" || !Number.isSafeInteger(credits) || credits <= 0 ||
      /admin|commerce|checkout/i.test(pack.label) ||
      state.credits !== credits || row.estimated_credits !== credits ||
      websitePlanHash(brief, String(state.packId)) !== planHash ||
      missingWebsiteBrief(brief).length || unsupportedWebsiteScope(brief).length) {
    return reply({ ok: false, code: "website_approved_package_or_brief_changed" }, 409);
  }
  const ledger = createWebsiteCreditLedger(async (name, args) => {
    const { data, error } = await db.rpc(name, args);
    return { data, error };
  });
  const loadReserved = async (id: string, ownerId: string): Promise<unknown> => {
    const { data: project, error: loadError } = await db.from("production_requests")
      .select("id,user_id,production_type,output_json").eq("id", id).eq("user_id", ownerId)
      .eq("production_type", "website").maybeSingle();
    if (loadError || !project) throw new Error("website_owned_project_unavailable");
    const saved = project.output_json?.websiteAssistant;
    return { productionId: project.id, userId: project.user_id, phase: saved?.phase,
      planHash: saved?.planHash, approvedHash: saved?.approvedHash, packId: saved?.packId,
      credits: saved?.credits, brief: saved?.brief };
  };
  try {
    const result = await runIsolatedWebsiteGeneration(
      { userId: user.id, productionId, planHash, credits },
      { ledger, loadReserved },
    );
    if (result.state === "ready") return reply({
      ok: true, state: "ready", productionId, charged: credits,
      previewUrl: `/api/productions/${productionId}/delivery?file=preview`,
      deliveryZipUrl: `/api/productions/${productionId}/delivery?file=zip`,
    }, 200);
    if (result.state === "already_reserved_or_finished")
      return reply({ ok: false, state: result.state, code: "website_generation_reconciliation_pending" }, 409);
    if (result.state === "generation_failed")
      return reply({ ok: false, state: result.state, code: "website_generation_failed_credits_released" }, 502);
    return reply({ ok: false, state: result.state, code: "website_generation_reconciliation_required" }, 409);
  } catch {
    // The reservation may already exist. Never auto-retry or call legacy spending.
    return reply({ ok: false, code: "website_generation_reconciliation_required" }, 503);
  }
}
