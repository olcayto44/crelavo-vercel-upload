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
    dailyProductionCountLimit: numericEnv("DAILY_PRODUCTION_COUNT_LIMIT", 20, 1, 200),
    assistantChatIpLimit: numericEnv("ASSISTANT_CHAT_IP_LIMIT", 30, 1, 500),
    assistantChatUserLimit: numericEnv("ASSISTANT_CHAT_USER_LIMIT", 20, 1, 500),
    assistantPlanIpLimit: numericEnv("ASSISTANT_PLAN_IP_LIMIT", 20, 1, 300),
    assistantPlanUserLimit: numericEnv("ASSISTANT_PLAN_USER_LIMIT", 12, 1, 300),
    automationStartIpLimit: numericEnv("AUTOMATION_START_IP_LIMIT", 20, 1, 300),
    automationStartUserLimit: numericEnv("AUTOMATION_START_USER_LIMIT", 10, 1, 300),
    automationStatusIpLimit: numericEnv("AUTOMATION_STATUS_IP_LIMIT", 120, 1, 2000),
    automationStatusUserLimit: numericEnv("AUTOMATION_STATUS_USER_LIMIT", 120, 1, 2000)
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
    .select("id, estimated_credits, reserved_credits, created_at")
    .eq("user_id", options.userId)
    .gte("created_at", dayStart.toISOString());

  if (error) throw error;

  const rows = Array.isArray(data) ? data : [];
  const dailyCount = rows.length;
  const dailyCredits = rows.reduce((sum, row) => {
    const record = row as Record<string, unknown>;
    return sum + (Number(record.reserved_credits ?? record.estimated_credits ?? 0) || 0);
  }, 0);

  if (dailyCount >= config.dailyProductionCountLimit) {
    return {
      ok: false as const,
      response: budgetBlockResponse(
        "Daily production start limit reached. Please wait before creating more jobs or contact support.",
        429,
        { dailyProductionCountLimit: config.dailyProductionCountLimit, dailyCount }
      )
    };
  }

  if (dailyCredits + estimatedCredits > config.dailyProductionCreditLimit) {
    return {
      ok: false as const,
      response: budgetBlockResponse(
        "Daily production credit safety limit reached. Please wait before starting more high-cost jobs or contact support.",
        402,
        { dailyProductionCreditLimit: config.dailyProductionCreditLimit, dailyCredits, requiredCredits: estimatedCredits }
      )
    };
  }

  return { ok: true as const, dailyCount, dailyCredits, estimatedCredits };
}
