import { computeExpiredBeforeProviderStartRefund } from "@/lib/credit-resolution";
import { isActiveProviderJob } from "@/lib/provider-jobs";
import { buildProductionWorkflowState } from "@/lib/production-workflow";
import { supabaseAdmin } from "@/lib/supabase";

const STALE_PROVIDER_START_MS = 24 * 60 * 60 * 1000;
const AUTO_EXPIRE_SECRET = process.env.PRODUCTION_AUTO_EXPIRE_SECRET || process.env.CRON_SECRET || "";

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value): value is string => typeof value === "string" && value.length > 0);
    if (parts.length > 0) return parts.join(" | ");
  }
  return fallback;
}

function objectValue(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function hasProviderStarted(production: { automation_status?: string | null; generation_status?: string | null; output_json?: unknown }) {
  const automationStatus = String(production.automation_status ?? "").toLowerCase();
  const generationStatus = String(production.generation_status ?? "").toLowerCase();
  const output = objectValue(production.output_json);
  if (isActiveProviderJob(output.visualJob) || isActiveProviderJob(output.renderJob)) return true;
  return /running|processing|provider_started|scrape_analyze_running|strategy_running/.test(automationStatus) || /running|processing|provider_started|succeeded|completed/.test(generationStatus);
}

function isExpireAuthorized(request: Request) {
  if (!AUTO_EXPIRE_SECRET) return process.env.NODE_ENV !== "production";
  const auth = request.headers.get("authorization") || "";
  const headerSecret = request.headers.get("x-cron-secret") || request.headers.get("x-production-auto-expire-secret") || "";
  return auth === `Bearer ${AUTO_EXPIRE_SECRET}` || headerSecret === AUTO_EXPIRE_SECRET;
}

async function expireStaleProductions(request: Request) {
  if (!isExpireAuthorized(request)) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() - STALE_PROVIDER_START_MS).toISOString();
    const supabase = supabaseAdmin();
    const { data: productions, error: productionsError } = await supabase
      .from("production_requests")
      .select("id, user_id, title, status, automation_status, generation_status, reserved_credits, estimated_credits, output_json, created_at, updated_at")
      .neq("status", "deleted")
      .in("status", ["queued"])
      .in("generation_status", ["automation_queued", "queued_for_render_slot", "waiting_provider_config", "provider_ready", "provider_ready_queued"])
      .lte("created_at", cutoff)
      .limit(50);

    if (productionsError) throw productionsError;

    const expired: Array<{ id: string; released_credits: number }> = [];
    const skipped: Array<{ id: string; reason: string }> = [];

    for (const production of productions ?? []) {
      const outputJson = objectValue(production.output_json);
      const existingResolution = objectValue(outputJson.creditResolution);
      if (hasProviderStarted(production)) {
        skipped.push({ id: production.id, reason: "provider_started" });
        continue;
      }
      if (String(existingResolution.status ?? "") === "expired_before_provider_start_refunded") {
        skipped.push({ id: production.id, reason: "already_expired" });
        continue;
      }

      const reservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
      if (reservedCredits <= 0) {
        const { error: closeNoReserveError } = await supabase
          .from("production_requests")
          .update({
            status: "cancelled",
            automation_status: "expired_before_provider_start",
            generation_status: "expired_no_provider_cost",
            output_json: {
              ...outputJson,
              creditResolution: {
                status: "expired_before_provider_start_no_reserved_credit",
                reason: "provider_not_started_within_24h",
                spentCredits: 0,
                refundedCredits: 0,
                releasedReservedCredits: 0,
                resolvedAt: now.toISOString()
              },
              workflowState: buildProductionWorkflowState({ ...production, status: "cancelled", automation_status: "expired_before_provider_start", generation_status: "expired_no_provider_cost", reserved_credits: 0, output_json: outputJson })
            },
            error_message: "Auto-cancelled after 24 hours before provider start. No provider cost was incurred.",
            updated_at: now.toISOString()
          })
          .eq("id", production.id);
        if (closeNoReserveError) throw closeNoReserveError;
        expired.push({ id: production.id, released_credits: 0 });
        continue;
      }

      const { data: balanceRow, error: balanceError } = await supabase
        .from("credit_balances")
        .select("balance, reserved")
        .eq("user_id", production.user_id)
        .maybeSingle();
      if (balanceError) throw balanceError;

      const creditDecision = computeExpiredBeforeProviderStartRefund({
        balance: Number(balanceRow?.balance ?? 0) || 0,
        reserved: Number(balanceRow?.reserved ?? 0) || 0,
        reservedCredits,
        productionTitle: production.title ?? production.id,
        productionId: production.id,
        now: now.toISOString()
      });

      const { error: balanceUpdateError } = await supabase
        .from("credit_balances")
        .upsert({
          user_id: production.user_id,
          balance: creditDecision.nextBalance,
          reserved: creditDecision.nextReserved,
          updated_at: now.toISOString()
        }, { onConflict: "user_id" });
      if (balanceUpdateError) throw balanceUpdateError;

      if (creditDecision.event) {
        const { error: eventError } = await supabase
          .from("credit_events")
          .insert({ user_id: production.user_id, ...creditDecision.event });
        if (eventError) throw eventError;
      }

      const nextOutput = {
        ...outputJson,
        creditResolution: creditDecision.creditResolution,
        autoExpiredBeforeProviderStart: true,
        autoExpiredAt: now.toISOString(),
        workflowState: buildProductionWorkflowState({ ...production, status: "cancelled", automation_status: "expired_before_provider_start", generation_status: "expired_no_provider_cost", reserved_credits: 0, output_json: outputJson })
      };

      const { error: updateProductionError } = await supabase
        .from("production_requests")
        .update({
          status: "cancelled",
          automation_status: "expired_before_provider_start",
          generation_status: "expired_no_provider_cost",
          reserved_credits: 0,
          output_json: nextOutput,
          admin_notes: `Auto-cancelled after 24 hours before provider start. Released reserved credits: ${creditDecision.releaseAmount}. No provider cost incurred.`,
          error_message: "Auto-cancelled after 24 hours before provider start. Reserved credits were fully released because no provider job started.",
          updated_at: now.toISOString()
        })
        .eq("id", production.id);
      if (updateProductionError) throw updateProductionError;

      expired.push({ id: production.id, released_credits: creditDecision.releaseAmount });
    }

    return Response.json({ ok: true, cutoff, expired_count: expired.length, skipped_count: skipped.length, expired, skipped });
  } catch (error) {
    return Response.json({ error: errorMessage(error, "Could not expire stale productions") }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return expireStaleProductions(request);
}

export async function GET(request: Request) {
  return expireStaleProductions(request);
}
