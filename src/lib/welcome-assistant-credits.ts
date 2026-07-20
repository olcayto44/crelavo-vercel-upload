import { SupabaseClient } from "@supabase/supabase-js";

export const WELCOME_ASSISTANT_CREDITS = 1000;

type GrantWelcomeAssistantCreditsInput = {
  supabase: SupabaseClient<any, any, any>;
  userId: string;
  email: string;
  ipAddress: string;
};

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function grantWelcomeAssistantCreditsOnce({ supabase, userId, email, ipAddress }: GrantWelcomeAssistantCreditsInput) {
  const cleanEmail = email.trim().toLowerCase();
  const cleanIp = ipAddress.trim() || "unknown";
  if (!userId || !cleanEmail) return { granted: false, credits: 0, reason: "missing_user" };

  const { data: existingClaim, error: claimReadError } = await supabase
    .from("welcome_credit_claims")
    .select("id, user_id, email, ip_address")
    .or(`user_id.eq.${userId},email.eq.${cleanEmail},ip_address.eq.${cleanIp}`)
    .limit(1)
    .maybeSingle();

  if (claimReadError) throw claimReadError;
  if (existingClaim) return { granted: false, credits: 0, reason: "already_claimed" };

  const { data: assistantBalanceRow, error: assistantBalanceReadError } = await supabase
    .from("assistant_credit_balances")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();

  if (assistantBalanceReadError) throw assistantBalanceReadError;
  if ((assistantBalanceRow?.balance ?? 0) > 0) return { granted: false, credits: 0, reason: "existing_assistant_balance" };

  const { data: productionBalanceRow, error: productionBalanceReadError } = await supabase
    .from("credit_balances")
    .select("balance, reserved")
    .eq("user_id", userId)
    .maybeSingle();

  if (productionBalanceReadError) throw productionBalanceReadError;
  if (productionBalanceRow) return { granted: false, credits: 0, reason: "existing_balance" };

  const nextAssistantBalance = WELCOME_ASSISTANT_CREDITS;

  const { error: balanceError } = await supabase
    .from("assistant_credit_balances")
    .upsert({ user_id: userId, balance: nextAssistantBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (balanceError) throw balanceError;

  const { error: eventError } = await supabase
    .from("credit_events")
    .insert({ user_id: userId, type: "adjustment", amount: WELCOME_ASSISTANT_CREDITS, note: "Welcome AI Assistant trial credits" });

  if (eventError) throw eventError;

  const { error: claimError } = await supabase
    .from("welcome_credit_claims")
    .insert({ user_id: userId, email: cleanEmail, ip_address: cleanIp, credits_granted: WELCOME_ASSISTANT_CREDITS });

  if (claimError) {
    const message = String(claimError.message ?? "");
    if (message.toLowerCase().includes("duplicate") || claimError.code === "23505") {
      return { granted: false, credits: 0, reason: "already_claimed" };
    }
    throw claimError;
  }

  return { granted: true, credits: WELCOME_ASSISTANT_CREDITS, assistantBalance: nextAssistantBalance };
}
