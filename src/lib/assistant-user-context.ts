type SupabaseLike = {
  from: (table: string) => {
    select: (columns: string) => unknown;
  };
};

type AssistantUserContext = {
  availableCredits: number;
  assistantCredits: number;
  openProductions: Array<Record<string, unknown>>;
  recentProductions: Array<Record<string, unknown>>;
  growthIntelligenceRequests: Array<Record<string, unknown>>;
};

type QueryLike = {
  eq: (column: string, value: string) => QueryLike;
  order: (column: string, options?: Record<string, unknown>) => QueryLike;
  limit: (count: number) => QueryLike;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error?: unknown }>;
};

function asQuery(value: unknown) {
  return value as QueryLike;
}

async function safeMaybeSingle(query: unknown) {
  try {
    const result = await asQuery(query).maybeSingle();
    return result.data ?? null;
  } catch {
    return null;
  }
}

async function safeList(query: unknown) {
  try {
    const result = await (query as Promise<{ data: Record<string, unknown>[] | null; error?: unknown }>);
    return Array.isArray(result.data) ? result.data : [];
  } catch {
    return [];
  }
}

function trimText(value: unknown, max = 80) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function rowLine(row: Record<string, unknown>, fields: string[]) {
  return fields.map((field) => trimText(row[field])).filter(Boolean).join(" · ");
}

export async function loadAssistantUserContext(supabase: SupabaseLike, userId: string): Promise<AssistantUserContext> {
  const creditBalanceQuery = asQuery(supabase.from("credit_balances").select("balance, reserved"));
  const assistantBalanceQuery = asQuery(supabase.from("assistant_credit_balances").select("balance"));

  const creditBalance = await safeMaybeSingle(creditBalanceQuery.eq("user_id", userId));
  const assistantBalance = await safeMaybeSingle(assistantBalanceQuery.eq("user_id", userId));
  const balance = Number(creditBalance?.balance ?? 0) || 0;
  const reserved = Number(creditBalance?.reserved ?? 0) || 0;

  const productionBase = asQuery(supabase.from("production_requests").select("id, production_type, title, status, generation_status, delivery_link, delivery_zip_url, preview_url, created_at"));
  const openProductions = await safeList(
    asQuery(productionBase.eq("user_id", userId)).order("created_at", { ascending: false }).limit(5)
  );
  const recentProductionBase = asQuery(supabase.from("production_requests").select("id, production_type, title, status, delivery_link, delivery_zip_url, preview_url, created_at"));
  const recentProductions = await safeList(
    asQuery(recentProductionBase.eq("user_id", userId)).order("created_at", { ascending: false }).limit(5)
  );

  const growthBase = asQuery(supabase.from("growth_intelligence_requests").select("id, brand_name, status, entitlement_status, report_file_url, report_file_name, created_at"));
  const growthIntelligenceRequests = await safeList(
    asQuery(growthBase.eq("user_id", userId)).order("created_at", { ascending: false }).limit(5)
  );

  return {
    availableCredits: Math.max(0, balance - reserved),
    assistantCredits: Number(assistantBalance?.balance ?? 0) || 0,
    openProductions: openProductions.filter((row) => !["ready", "cancelled", "failed"].includes(String(row.status ?? ""))).slice(0, 5),
    recentProductions,
    growthIntelligenceRequests
  };
}

export function buildAssistantUserContextPrompt(context: AssistantUserContext) {
  const lines = [
    "Current user context (use quietly when relevant; do not dump it unless the user asks):",
    `- Available production credits: ${context.availableCredits}`,
    `- Assistant credits: ${context.assistantCredits}`
  ];

  if (context.openProductions.length) {
    lines.push("- Open productions:");
    context.openProductions.forEach((row) => lines.push(`  • ${rowLine(row, ["title", "production_type", "status", "generation_status"])}`));
  } else {
    lines.push("- Open productions: none found");
  }

  if (context.growthIntelligenceRequests.length) {
    lines.push("- Growth Intelligence requests:");
    context.growthIntelligenceRequests.forEach((row) => {
      const delivery = row.report_file_url ? "report file ready" : "report file not ready";
      lines.push(`  • ${rowLine(row, ["brand_name", "status", "entitlement_status"])} · ${delivery}`);
    });
  } else {
    lines.push("- Growth Intelligence requests: none found");
  }

  if (context.recentProductions.length) {
    lines.push("- Recent productions:");
    context.recentProductions.forEach((row) => lines.push(`  • ${rowLine(row, ["title", "production_type", "status"])}`));
  }

  lines.push("Guidance: if the user asks what is next or asks about an existing job/report, reference this context and suggest the single most useful next action.");
  return lines.join("\n");
}
