import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { apiCostGuardConfig } from "@/lib/api-cost-guard";
import { supabaseAdmin } from "@/lib/supabase";

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return adminRequiredResponse();

  try {
    const config = apiCostGuardConfig();
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setUTCHours(0, 0, 0, 0);

    const supabase = supabaseAdmin();
    const { data, error } = await supabase
      .from("production_requests")
      .select("id, user_id, title, status, automation_status, generation_status, estimated_credits, reserved_credits, created_at")
      .gte("created_at", dayStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const productions = Array.isArray(data) ? data : [];
    const totalCredits = productions.reduce((sum, item) => sum + numberValue(item.reserved_credits ?? item.estimated_credits), 0);
    const activeStatuses = new Set(["pending", "queued", "waiting_provider_config", "in_production"]);
    const activeProductions = productions.filter((item) => activeStatuses.has(String(item.status ?? ""))).length;
    const failedProductions = productions.filter((item) => String(item.status ?? "") === "failed").length;

    const userMap = new Map<string, { userId: string; count: number; credits: number; latestAt: string | null }>();
    for (const item of productions) {
      const userId = String(item.user_id ?? "unknown");
      const current = userMap.get(userId) ?? { userId, count: 0, credits: 0, latestAt: null };
      current.count += 1;
      current.credits += numberValue(item.reserved_credits ?? item.estimated_credits);
      const createdAt = typeof item.created_at === "string" ? item.created_at : null;
      if (createdAt && (!current.latestAt || createdAt > current.latestAt)) current.latestAt = createdAt;
      userMap.set(userId, current);
    }

    const topUsers = Array.from(userMap.values())
      .sort((a, b) => b.credits - a.credits || b.count - a.count)
      .slice(0, 10)
      .map((user) => ({
        ...user,
        creditUtilizationPct: roundPercent((user.credits / config.dailyProductionCreditLimit) * 100),
        countUtilizationPct: roundPercent((user.count / config.dailyProductionCountLimit) * 100),
        nearLimit: user.credits >= config.dailyProductionCreditLimit * 0.7 || user.count >= config.dailyProductionCountLimit * 0.7
      }));

    const nearLimitUsers = topUsers.filter((user) => user.nearLimit);
    const recentProductions = productions.slice(0, 12).map((item) => ({
      id: item.id,
      userId: item.user_id,
      title: item.title ?? "Untitled production",
      status: item.status ?? "unknown",
      automationStatus: item.automation_status ?? null,
      generationStatus: item.generation_status ?? null,
      credits: numberValue(item.reserved_credits ?? item.estimated_credits),
      createdAt: item.created_at ?? null
    }));

    return Response.json({
      generatedAt: now.toISOString(),
      dayStart: dayStart.toISOString(),
      config,
      today: {
        totalProductions: productions.length,
        activeProductions,
        failedProductions,
        estimatedCredits: totalCredits,
        dailyCreditLimit: config.dailyProductionCreditLimit,
        dailyCountLimit: config.dailyProductionCountLimit,
        creditUtilizationPct: roundPercent((totalCredits / config.dailyProductionCreditLimit) * 100),
        countUtilizationPct: roundPercent((productions.length / config.dailyProductionCountLimit) * 100)
      },
      topUsers,
      nearLimitUsers,
      recentProductions,
      intervention: {
        canInspectUserCredits: true,
        canSuspendUser: true,
        canRefreshAutomationStatus: true,
        canRetryProviderJobs: true,
        usersAdminPath: "/admin/users",
        productionsAdminPath: "/admin/productions"
      },
      notes: [
        "Route/IP rate-limit counters are live in-memory guards and are not persisted as a historical event log yet.",
        "This panel shows active limit configuration, today's production credit usage, users approaching daily limits and admin intervention links."
      ]
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load API guard report";
    return Response.json({ error: message }, { status: 500 });
  }
}
