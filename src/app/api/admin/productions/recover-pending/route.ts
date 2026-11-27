import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  const productionId = String(body.production_id ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });
  if (process.env.CRELAVO_ATOMIC_LEGACY_REFUND_ENABLED !== "true") return Response.json({ error: "atomic_refund_not_enabled", refunded_credits: 0 }, { status: 409 });
  const { data, error } = await supabaseAdmin().rpc("studio_legacy_refund_reviewed", { p_production: productionId });
  if (error || !data) return Response.json({ error: "atomic_refund_unconfirmed", automatic_retry: false }, { status: 503 });
  if (data.state === "not_found") return Response.json({ error: "Production not found." }, { status: 404 });
  if (!["refunded", "already_refunded"].includes(data.state)) return Response.json({ error: "verified_provider_reconciliation_required", refunded_credits: 0 }, { status: 409 });
  return Response.json({ production: data.production, balance: data.balance, recovered: data.state === "refunded", already_recovered: data.state === "already_refunded", refunded_credits: data.refunded_credits });
}
