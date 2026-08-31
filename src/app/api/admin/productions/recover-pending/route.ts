import { adminRequiredResponse, isAdminRequest } from "@/lib/admin-guard";
import { computeAdminReservedRefund } from "@/lib/credit-resolution";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (!isAdminRequest(request, body)) return adminRequiredResponse();
  const productionId = String(body.production_id ?? "").trim();
  if (!productionId) return Response.json({ error: "production_id is required." }, { status: 400 });
  const supabase = supabaseAdmin();
  const { data: production, error } = await supabase.from("production_requests").select("id,user_id,title,status,automation_status,generation_status,reserved_credits,estimated_credits,output_json").eq("id", productionId).single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const output = production.output_json && typeof production.output_json === "object" ? production.output_json as Record<string, unknown> : {};
  const resolution = output.creditResolution && typeof output.creditResolution === "object" ? output.creditResolution as Record<string, unknown> : null;
  if (["refunded_reserved", "refunded_reserved_no_provider_cost", "expired_before_provider_start_refunded"].includes(String(resolution?.status ?? ""))) return Response.json({ production, already_recovered: true, refunded_credits: 0 });
  const visualJob = output.visualJob && typeof output.visualJob === "object" ? output.visualJob as Record<string, unknown> : null;
  const hasProviderJob = Boolean(output.providerJob || visualJob?.id && !String(visualJob.id).startsWith("pending-") || output.renderJob);
  const eligibleStatus = production.status === "in_production" && production.generation_status === "provider_pending_unknown"
    || production.status === "failed" && production.generation_status === "provider_start_failed_no_job";
  const eligible = eligibleStatus && !hasProviderJob && Number(production.reserved_credits ?? 0) > 0;
  if (!eligible) return Response.json({ error: "Production is not an eligible pending no-job recovery candidate." }, { status: 409 });
  const reservedCredits = Number(production.reserved_credits ?? production.estimated_credits ?? 0) || 0;
  const { data: balance, error: balanceError } = await supabase.from("credit_balances").select("balance,reserved").eq("user_id", production.user_id).single();
  if (balanceError) return Response.json({ error: balanceError.message }, { status: 500 });
  const decision = computeAdminReservedRefund({ balance: Number(balance.balance ?? 0), reserved: Number(balance.reserved ?? 0), reservedCredits, productionTitle: production.title ?? production.id, existingResolution: resolution });
  const { error: balanceUpdateError } = await supabase.from("credit_balances").upsert({ user_id: production.user_id, balance: decision.nextBalance, reserved: decision.nextReserved, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (balanceUpdateError) return Response.json({ error: balanceUpdateError.message }, { status: 500 });
  const message = "Provider job was not created; production was stopped safely and reserved credits were released. Create a new production after provider configuration is fixed.";
  const { data: updated, error: updateError } = await supabase.from("production_requests").update({ status: "failed", automation_status: "failed", generation_status: "provider_start_failed_no_job", reserved_credits: 0, output_json: { ...output, automationStatus: "failed", providerStatus: "provider_start_failed", providerJobCreated: false, providerErrors: { visual_generation: message }, creditResolution: decision.creditResolution }, admin_notes: message, error_message: message, updated_at: new Date().toISOString() }).eq("id", productionId).eq("reserved_credits", reservedCredits).select("*").single();
  if (updateError) return Response.json({ error: updateError.message }, { status: 500 });
  if (decision.event) await supabase.from("credit_events").insert({ user_id: production.user_id, ...decision.event });
  return Response.json({ production: updated, recovered: true, refunded_credits: decision.refundAmount });
}
