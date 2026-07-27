import { supabaseAdmin } from "@/lib/supabase";

type ActivityItem = {
  id: string;
  kind: "checkout_intent" | "lead_capture" | "production_ready";
  label: string;
  occurredAt: string;
};

function timeAgoLabel(value: unknown) {
  const timestamp = typeof value === "string" ? Date.parse(value) : NaN;
  if (!Number.isFinite(timestamp)) return "recently";
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)} day ago`;
}

function safeId(prefix: string, value: unknown, index: number) {
  return `${prefix}-${String(value ?? index).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || index}`;
}

export async function GET() {
  try {
    const supabase = supabaseAdmin();
    const [leadResult, productionResult] = await Promise.all([
      supabase
        .from("lead_captures")
        .select("id, source, offer, created_at")
        .in("source", ["checkout_intent", "exit_intent"])
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("production_requests")
        .select("id, status, automation_status, generation_status, production_type, created_at, updated_at")
        .or("status.eq.ready,automation_status.eq.completed,generation_status.eq.final_video_ready")
        .order("updated_at", { ascending: false })
        .limit(6)
    ]);

    const leads = Array.isArray(leadResult.data) ? leadResult.data : [];
    const productions = Array.isArray(productionResult.data) ? productionResult.data : [];

    const leadEvents: ActivityItem[] = leads.map((item, index) => {
      const source = String(item.source ?? "");
      const kind = source === "checkout_intent" ? "checkout_intent" : "lead_capture";
      return {
        id: safeId(kind, item.id, index),
        kind,
        label: kind === "checkout_intent" ? "Someone started a secure Whop preview checkout" : "Someone requested the ecommerce ad guide",
        occurredAt: timeAgoLabel(item.created_at)
      };
    });

    const productionEvents: ActivityItem[] = productions.map((item, index) => ({
      id: safeId("production", item.id, index),
      kind: "production_ready",
      label: `A ${String(item.production_type ?? "production").replace(/_/g, " ")} request reached dashboard delivery/review`,
      occurredAt: timeAgoLabel(item.updated_at ?? item.created_at)
    }));

    const activity = [...leadEvents, ...productionEvents].slice(0, 6);
    return Response.json({
      activity,
      source: "real_database_events_only",
      emptyState: activity.length === 0 ? "No public live activity is shown until real checkout, lead or production events exist." : null,
      guardrail: "Events are anonymized and only shown when backed by real lead_captures or production_requests records; no fake counters or fabricated urgency."
    });
  } catch (error) {
    return Response.json({
      activity: [],
      source: "unavailable",
      emptyState: "Live activity is hidden until the database is reachable and real events exist.",
      guardrail: "No fake activity is generated when the database is unavailable.",
      error: error instanceof Error ? error.message : "Could not load live activity."
    }, { status: 200 });
  }
}
