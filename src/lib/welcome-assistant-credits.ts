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
  if (!userId || !cleanEmail) return { granted: false, credits: 0, reason: "missing_user" };

  const { data: existingClaim, error: claimReadError } = await supabase
    .from("welcome_credit_claims")
    .select("id")
    .or(`user_id.eq.${userId},email.eq.${cleanEmail}`)
    .maybeSingle();

  if (claimReadError) throw claimReadError;
  if (existingClaim) return { granted: false, credits: 0, reason: "already_claimed" };

  const { data: balanceRow, error: balanceReadError } = await supabase
    .from("credit_balances")
    .select("balance, reserved")
    .eq("user_id", userId)
    .maybeSingle();

  if (balanceReadError) throw balanceReadError;

  if (balanceRow) return { granted: false, credits: 0, reason: "existing_balance" };

  const reserved = 0;
  const nextBalance = WELCOME_ASSISTANT_CREDITS;

  const { error: balanceError } = await supabase
    .from("credit_balances")
    .upsert({ user_id: userId, balance: nextBalance, reserved, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

  if (balanceError) throw balanceError;

  const { error: eventError } = await supabase
    .from("credit_events")
    .insert({ user_id: userId, type: "adjustment", amount: WELCOME_ASSISTANT_CREDITS, note: "Welcome AI Assistant credits" });

  if (eventError) throw eventError;

  const { error: claimError } = await supabase
    .from("welcome_credit_claims")
    .insert({ user_id: userId, email: cleanEmail, ip_address: ipAddress || "unknown", credits_granted: WELCOME_ASSISTANT_CREDITS });

  if (claimError) {
    const message = String(claimError.message ?? "");
    if (message.toLowerCase().includes("duplicate") || claimError.code === "23505") {
      return { granted: false, credits: 0, reason: "already_claimed" };
    }
    throw claimError;
  }

  return { granted: true, credits: WELCOME_ASSISTANT_CREDITS, balance: nextBalance };
}
