import { normalizePartnerCode } from "@/lib/partner-program";
import { clientIpFromRequest } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

const allowedEventTypes = ["click", "signup", "purchase", "commission_pending", "commission_approved", "commission_rejected"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const partnerCode = normalizePartnerCode(body.partnerCode ?? body.partner_code ?? body.ref);
  const eventType = String(body.eventType ?? body.event_type ?? "click").trim();

  if (!partnerCode) {
    return Response.json({ error: "Missing partner referral code." }, { status: 400 });
  }

  if (!allowedEventTypes.includes(eventType)) {
    return Response.json({ error: "Invalid referral event type." }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ tracked: false, mode: "missing_supabase_service_role" });
  }

  try {
    const ip = clientIpFromRequest(request);
    const { error } = await supabaseAdmin()
      .from("partner_referral_events")
      .insert({
        partner_code: partnerCode,
        event_type: eventType,
        source_path: String(body.sourcePath ?? body.source_path ?? "").slice(0, 500) || null,
        landing_url: String(body.landingUrl ?? body.landing_url ?? "").slice(0, 1000) || null,
        referrer_url: String(body.referrerUrl ?? body.referrer_url ?? "").slice(0, 1000) || null,
        visitor_id: String(body.visitorId ?? body.visitor_id ?? "").slice(0, 160) || null,
        user_id: body.userId ?? body.user_id ?? null,
        email: String(body.email ?? "").slice(0, 320) || null,
        ip_address: ip,
        country: "Unknown",
        city: "Unknown",
        user_agent: request.headers.get("user-agent")?.slice(0, 1000) ?? null,
        metadata: {
          pageTitle: String(body.pageTitle ?? "").slice(0, 300),
          storedAt: new Date().toISOString()
        }
      });

    if (error) throw error;

    return Response.json({ tracked: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not track referral event.";
    return Response.json({ error: message }, { status: 500 });
  }
}
