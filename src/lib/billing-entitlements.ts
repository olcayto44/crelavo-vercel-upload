import type { SupabaseClient } from "@supabase/supabase-js";

export const PREVIEW_LIMITS: Record<string, number> = { pro: 2, business: 3, ultra: 4, team: 5 };

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function previewLimitForPlan(planId: string, isTrial = false) {
  if (isTrial && planId.toLowerCase() === "business") return 1;
  return PREVIEW_LIMITS[planId.toLowerCase()] ?? 0;
}

export async function billingAccess(supabase: SupabaseClient<any, any, any>, userId: string) {
  const { data, error } = await supabase.from("profiles").select("billing_status,billing_failed_at,billing_update_url").eq("id", userId).maybeSingle();
  if (error) throw error;
  const rawStatus = String(data?.billing_status ?? "active");
  const failedAt = data?.billing_failed_at ? new Date(String(data.billing_failed_at)).getTime() : 0;
  const pastDue = rawStatus === "payment_failed" && failedAt > 0 && Date.now() - failedAt >= 24 * 60 * 60 * 1000;
  const status = pastDue ? "payment_past_due" : rawStatus;
  if (pastDue) {
    await supabase.from("profiles").update({ billing_status: status, billing_restricted_at: new Date().toISOString() }).eq("id", userId);
    await supabase.from("credit_balances").update({ subscription_status: status, updated_at: new Date().toISOString() }).eq("user_id", userId);
  }
  return { allowed: !["payment_past_due", "restricted", "suspended"].includes(status), status, updateUrl: String(data?.billing_update_url ?? "").trim() };
}

export async function claimPreview(supabase: SupabaseClient<any, any, any>, userId: string, planId: string, isTrial: boolean) {
  const limit = previewLimitForPlan(planId, isTrial);
  if (!limit) return { ok: false, reason: "preview_plan_required", remaining: 0 };
  const { data: entitlement } = await supabase.from("preview_entitlements").select("user_id").eq("user_id", userId).maybeSingle();
  if (!entitlement) {
    await supabase.from("preview_entitlements").insert({ user_id: userId, plan_id: planId, preview_limit: isTrial ? 0 : limit, trial_preview_limit: isTrial ? 1 : 0 });
  }
  const { data, error } = await supabase.rpc("claim_preview_entitlement", { p_user_id: userId, p_plan_id: planId, p_is_trial: isTrial });
  if (error) throw error;
  return data as { ok: boolean; reason?: string; remaining?: number; preview_used?: number; trial_preview_used?: number };
}
