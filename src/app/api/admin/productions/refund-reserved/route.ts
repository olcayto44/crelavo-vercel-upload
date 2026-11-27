import { requireAdminPermission } from "@/lib/admin-guard";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const access = await requireAdminPermission(request, "credits", body);
  if (!access.ok) return access.response;
  const productionId = String(body.production_id ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });
  if (process.env.CRELAVO_ATOMIC_LEGACY_REFUND_ENABLED !== "true") return Response.json({ error: "atomic_refund_not_enabled" }, { status: 409 });
  if (body.cost_aware === true || body.allow_non_failed === true || body.hide_after_refund === true) return Response.json({ error: "complex_refund_manual_reconciliation_required" }, { status: 409 });
  const db = supabaseAdmin();
  let result;
  if (body.manual_provider_reconciliation === true) {
    const stamp = String(body.expected_updated_at ?? ""), task = String(body.provider_task_id ?? ""), evidence = String(body.evidence_reference ?? ""), credits = body.expected_reserved_credits;
    if (body.zero_provider_cost_attested !== true || body.no_usable_output_attested !== true || !stamp || !task || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/.test(evidence) || typeof credits !== "number" || !Number.isSafeInteger(credits) || credits <= 0) return Response.json({ error: "provider_billing_attestation_required" }, { status: 400 });
    result = await db.rpc("studio_legacy_confirm_zero_cost_refund", { p_job: productionId, p_stamp: stamp, p_task: task, p_evidence: evidence, p_expected_credits: credits, p_reviewer: access.context.email });
  } else {
    result = await db.rpc("studio_legacy_refund_reviewed", { p_production: productionId });
  }
  const { data, error } = result;
  if (error || !data) return Response.json({ error: "atomic_refund_unconfirmed", automatic_retry: false }, { status: 503 });
  if (data.state === "not_found") return Response.json({ error: "Production not found." }, { status: 404 });
  if (!["refunded", "already_refunded"].includes(data.state)) return Response.json({ error: "wallet_reconciliation_required", state: data.state }, { status: 409 });
  return Response.json({ production: data.production, balance: data.balance, refunded_credits: data.refunded_credits, spent_credits: 0, idempotent: data.state === "already_refunded" }, { headers: { "Cache-Control": "no-store" } });
}
