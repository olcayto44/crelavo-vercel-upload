import { supabaseAdmin } from "@/lib/supabase";
import { getClientIp, grantWelcomeAssistantCreditsOnce } from "@/lib/welcome-assistant-credits";

function cleanPartnerCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 80);
}

export async function POST(request: Request) {
  const body = await request.json();
  const userId = String(body.user_id ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = String(body.full_name ?? "").trim();
  const partnerReferralCode = cleanPartnerCode(body.partner_referral_code ?? body.partnerReferralCode);
  const referralVisitorId = String(body.referral_visitor_id ?? body.referralVisitorId ?? "").trim().slice(0, 160);
  const ipAddress = getClientIp(request);

  if (!userId || !email) {
    return Response.json({ error: "User id and email are required." }, { status: 400 });
  }

  try {
    const supabase = supabaseAdmin();

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: userId, email, full_name: fullName || null, role: "user" }, { onConflict: "id" });

    if (profileError) throw profileError;

    let partnerReferralTracked = false;

    if (partnerReferralCode) {
      const { data: existingSignupEvent } = await supabase
        .from("partner_referral_events")
        .select("id")
        .eq("partner_code", partnerReferralCode)
        .eq("event_type", "signup")
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .maybeSingle();

      if (!existingSignupEvent) {
        const { error: referralError } = await supabase
          .from("partner_referral_events")
          .insert({
            partner_code: partnerReferralCode,
            event_type: "signup",
            source_path: "/auth/register",
            landing_url: null,
            referrer_url: null,
            visitor_id: referralVisitorId || null,
            user_id: userId,
            email,
            ip_address: ipAddress,
            country: "Unknown",
            city: "Unknown",
            user_agent: request.headers.get("user-agent")?.slice(0, 1000) ?? null,
            metadata: {
              fullName,
              provider: String(body.provider ?? "email"),
              welcomeCreditFlow: "before_credit_claim_check"
            }
          });
        partnerReferralTracked = !referralError;
      } else {
        partnerReferralTracked = true;
      }
    }

    const welcomeCredit = await grantWelcomeAssistantCreditsOnce({ supabase, userId, email, ipAddress });

    return Response.json({ ...welcomeCredit, partnerReferralTracked });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Welcome assistant credits could not be granted.";
    return Response.json({ error: message }, { status: 500 });
  }
}
