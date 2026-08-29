import { SupabaseClient } from "@supabase/supabase-js";

export const WELCOME_ASSISTANT_CREDITS = 250;

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
  const { data, error } = await supabase.rpc("grant_welcome_assistant_credits", { p_user_id: userId, p_email: cleanEmail, p_ip: cleanIp });
  if (error) throw error;
  return data as { granted: boolean; credits: number; reason?: string; assistantBalance?: number };
}
