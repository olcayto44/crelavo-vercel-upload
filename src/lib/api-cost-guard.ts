import type { SupabaseClient } from "@supabase/supabase-js";
import { clientIpFromRequest, rateLimit, rateLimitResponse } from "./security.ts";

export type RouteBudgetOptions = {
  route: string;
  userId?: string;
  ipLimit: number;
  userLimit?: number;
  windowMs: number;
};

export type ProductionDailyBudgetOptions = {
  userId: string;
  estimatedCredits: number;
  now?: Date;
  allowProviderProofTest?: boolean;
};

function numericEnv(name: string, fallback: number, min: number, max: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function apiCostGuardConfig() {
  return {
    singleProductionCreditLimit: numericEnv("MAX_SINGLE_PRODUCTION_CREDITS", 50000, 1000, 500000),
    dailyProductionCreditLimit: numericEnv("DAILY_PRODUCTION_CREDIT_LIMIT", 100000, 1000, 1000000),
    lowCostProductionTestLimit: numericEnv("LOW_COST_PRODUCTION_TEST_CREDITS", 15000, 1000, 100000),
    dailyProductionCountLimit: numericEnv("DAILY_PRODUCTION_COUNT_LIMIT", 20, 1, 200),
    assistantChatIpLimit: numericEnv("ASSISTANT_CHAT_IP_LIMIT", 30, 1, 500),
    assistantChatUserLimit: numericEnv("ASSISTANT_CHAT_USER_LIMIT", 20, 1, 500),
    assistantPlanIpLimit: numericEnv("ASSISTANT_PLAN_IP_LIMIT", 20, 1, 300),
    assistantPlanUserLimit: numericEnv("ASSISTANT_PLAN_USER_LIMIT", 12, 1, 300),
    automationStartIpLimit: numericEnv("AUTOMATION_START_IP_LIMIT", 20, 1, 300),
    automationStartUserLimit: numericEnv("AUTOMATION_START_USER_LIMIT", 10, 1, 300),
    automationStatusIpLimit: numericEnv("AUTOMATION_STATUS_IP_LIMIT", 120, 1, 2000),
    automationStatusUserLimit: numericEnv("AUTOMATION_STATUS_USER_LIMIT", 120, 1, 2000),
    maxConcurrentProviderJobs: numericEnv("MAX_CONCURRENT_PROVIDER_JOBS", 2, 1, 25),
    maxProviderRetries: numericEnv("MAX_PROVIDER_RETRIES", 2, 0, 5),
    providerBackoffBaseSeconds: numericEnv("PROVIDER_BACKOFF_BASE_SECONDS", 30, 5, 600),
    providerBackoffMaxSeconds: numericEnv("PROVIDER_BACKOFF_MAX_SECONDS", 300, 30, 3600)
  };
}

export function enforceRouteBudget(request: Request, options: RouteBudgetOptions) {
  const ip = clientIpFromRequest(request);
  const ipLimit = rateLimit({ key: `${options.route}:ip:${ip}`, limit: options.ipLimit, windowMs: options.windowMs });
  if (!ipLimit.allowed) return { ok: false as const, response: rateLimitResponse(ipLimit.resetAt) };

  const userKey = String(options.userId ?? "").trim();
  if (userKey && options.userLimit) {
    const userLimit = rateLimit({ key: `${options.route}:user:${userKey}`, limit: options.userLimit, windowMs: options.windowMs });
    if (!userLimit.allowed) return { ok: false as const, response: rateLimitResponse(userLimit.resetAt) };
    return { ok: true as const, remaining: Math.min(ipLimit.remaining, userLimit.remaining), resetAt: Math.min(ipLimit.resetAt, userLimit.resetAt) };
  }

  return { ok: true as const, remaining: ipLimit.remaining, resetAt: ipLimit.resetAt };
}

export function providerBackoffSeconds(retryCount: number) {
  const config = apiCostGuardConfig();
  const attempt = Math.max(0, Math.floor(Number(retryCount) || 0));
  const raw = config.providerBackoffBaseSeconds * Math.pow(2, attempt);
  return Math.min(config.providerBackoffMaxSeconds, Math.floor(raw));
}

export function budgetBlockResponse(message: string, status = 429, details: Record<string, unknown> = {}) {
  return Response.json(
    {
      error: message,
      abuseProtection: true,
      ...details
    },
    {
      status,
      headers: { "Cache-Control": "no-store" }
    }
  );
}

export async function enforceDailyProductionBudget(supabase: SupabaseClient, options: ProductionDailyBudgetOptions) {
  const config = apiCostGuardConfig();
  const estimatedCredits = Math.max(0, Math.floor(Number(options.estimatedCredits) || 0));

  if (estimatedCredits > config.singleProductionCreditLimit) {
    return {
      ok: false as const,
      response: budgetBlockResponse(
        `This production exceeds the single-job launch safety limit. Required: ${estimatedCredits}, limit: ${config.singleProductionCreditLimit}. Please split the job or contact support.`,
        402,
        { requiredCredits: estimatedCredits, singleProductionCreditLimit: config.singleProductionCreditLimit }
      )
    };
  }

  const now = options.now ?? new Date();
  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from("production_requests")
    .select("id, estimated_credits, reserved_credits, created_at, status, automation_status, generation_status, output_json")
    .eq("user_id", options.userId)
    .gte("created_at", dayStart.toISOString());

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const billableRows = rows.filter((row) => {
    const record = row as Record<string, unknown>;
    const output = record.output_json && typeof record.output_json === "object" ? record.output_json as Record<string, unknown> : {};
    const statusText = `${record.status ?? ""} ${record.automation_status ?? ""} ${record.generation_status ?? ""} ${String(output.automationStatus ?? "")} ${String(output.providerStatus ?? "")}`.toLowerCase();
    const hasProviderJob = Boolean(output.visualJob || output.renderJob || output.providerFinalUrl || output.finalVideoUrl);
    if (/deleted|cancelled|failed|expired_before_provider_start|provider_start_failed|waiting_provider_config|queued_for_render_slot|automation_queued/.test(statusText) && !hasProviderJob) return false;
    return hasProviderJob || /in_production|provider_started|provider_visual_job_created|render_job_created|completed|ready/.test(statusText);
  });
  const dailyCount = billableRows.length;
  const dailyCredits = billableRows.reduce((sum, row) => {
    const record = row as Record<string, unknown>;
    return sum + (Number(record.reserved_credits ?? record.estimated_credits ?? 0) || 0);
  }, 0);

  const lowCostTestAllowed = estimatedCredits > 0 && estimatedCredits <= config.lowCostProductionTestLimit;

// Do not block production starts by raw daily job count. Cost safety is enforced by
// single-job credit limit, daily credit limit, credit reservation and provider-start guards.
// The old count blocker interrupted legitimate provider integration tests before any provider job could start.

if (dailyCredits + estimatedCredits > config.dailyProductionCreditLimit && !lowCostTestAllowed) {
    return {
      ok: false as const,
      response: budgetBlockResponse(
        "Daily production credit safety limit reached. Please wait before starting more high-cost jobs or contact support.",
        402,
        { dailyProductionCreditLimit: config.dailyProductionCreditLimit, lowCostProductionTestLimit: config.lowCostProductionTestLimit, dailyCredits, requiredCredits: estimatedCredits }
      )
    };
  }

  return { ok: true as const, dailyCount, dailyCredits, estimatedCredits, lowCostTestAllowed };
}
