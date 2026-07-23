import { clientIpFromRequest, noStoreJson, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

const ATTRIBUTION_KEYS = ["utmSource", "utmMedium", "utmCampaign", "utmTerm", "utmContent", "ref", "fbclid", "gclid", "gbraid", "wbraid", "landingUrl", "firstTouchAt", "firstTouchPath"] as const;

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
type LeadPayload = Record<string, unknown> & {
  attribution?: Partial<Record<AttributionKey, unknown>>;
};

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function cleanEmail(value: unknown) {
  return cleanText(value, 180).toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function attributionValue(payload: LeadPayload, key: AttributionKey, maxLength = 500) {
  return cleanText(payload.attribution?.[key], maxLength);
}

async function sendAdminLeadNotification(input: {
  email: string;
  source: string;
  offer: string;
  pageUrl: string;
  landingUrl: string;
  utmSource: string;
  utmCampaign: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = (process.env.LEAD_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || "").trim().toLowerCase();
  if (!apiKey || !isEmail(to)) return { skipped: true };

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://crelavo.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject: "New Crelavo exit-intent lead",
      text: [
        "New Crelavo lead captured.",
        "",
        `Email: ${input.email}`,
        `Source: ${input.source}`,
        `Offer: ${input.offer}`,
        `Current page: ${input.pageUrl || "Not provided"}`,
        `Landing URL: ${input.landingUrl || "Not provided"}`,
        `UTM source: ${input.utmSource || "Not provided"}`,
        `UTM campaign: ${input.utmCampaign || "Not provided"}`,
        "",
        `Admin dashboard: ${appUrl}/admin/growth`
      ].join("\n")
    })
  });

  return response.ok ? { sent: true } : { skipped: true };
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const ipLimit = rateLimit({ key: `exit-lead:ip:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!ipLimit.allowed) return rateLimitResponse(ipLimit.resetAt);

  const body = await request.json().catch(() => ({})) as LeadPayload;
  const email = cleanEmail(body.email);
  const consent = body.consent === true;
  const honeypot = cleanText(body.website, 200);
  const source = cleanText(body.source, 80) || "exit_intent";
  const offer = cleanText(body.offer, 160) || "ecommerce_video_ad_strategy_guide_trial_credits";
  const pageUrl = cleanText(body.pageUrl, 800);
  const referrer = cleanText(body.referrer, 800);
  const landingUrl = attributionValue(body, "landingUrl", 800);

  if (honeypot) return noStoreJson({ message: "Thanks. Your Crelavo guide request was received." });
  if (!isEmail(email)) return noStoreJson({ error: "Enter a valid email address." }, { status: 400 });
  if (!consent) return noStoreJson({ error: "Consent is required before we can send strategy emails or preview offers." }, { status: 400 });

  const emailLimit = rateLimit({ key: `exit-lead:email:${email}`, limit: 2, windowMs: 24 * 60 * 60 * 1000 });
  if (!emailLimit.allowed) return rateLimitResponse(emailLimit.resetAt);

  const suspicious = rejectSuspiciousText([email, source, offer, pageUrl, referrer, landingUrl]);
  if (!suspicious.ok) return noStoreJson({ error: suspicious.message }, { status: 400 });

  const lead = {
    email,
    source,
    offer,
    status: "captured",
    consent,
    bonus_credits: 500,
    ip_address: ip,
    user_agent: cleanText(request.headers.get("user-agent"), 500),
    landing_url: landingUrl,
    page_url: pageUrl,
    referrer,
    utm_source: attributionValue(body, "utmSource", 200),
    utm_medium: attributionValue(body, "utmMedium", 200),
    utm_campaign: attributionValue(body, "utmCampaign", 240),
    utm_term: attributionValue(body, "utmTerm", 240),
    utm_content: attributionValue(body, "utmContent", 240),
    ref: attributionValue(body, "ref", 240),
    fbclid: attributionValue(body, "fbclid", 500),
    gclid: attributionValue(body, "gclid", 500),
    gbraid: attributionValue(body, "gbraid", 500),
    wbraid: attributionValue(body, "wbraid", 500),
    metadata: {
      firstTouchAt: attributionValue(body, "firstTouchAt", 80),
      firstTouchPath: attributionValue(body, "firstTouchPath", 500),
      capturedAt: new Date().toISOString(),
      creditActivationRule: "Trial credits are an opt-in offer and should be activated after signup/admin review, not automatically granted to anonymous leads."
    }
  };

  try {
    const { error } = await supabaseAdmin()
      .from("lead_captures")
      .upsert(lead, { onConflict: "email,source" });

    if (error) {
      return noStoreJson({ error: "Lead capture could not be saved yet. Please try again shortly." }, { status: 502 });
    }
  } catch {
    return noStoreJson({ error: "Lead capture storage is not configured yet." }, { status: 503 });
  }

  await sendAdminLeadNotification({
    email,
    source,
    offer,
    pageUrl,
    landingUrl,
    utmSource: lead.utm_source,
    utmCampaign: lead.utm_campaign
  }).catch(() => undefined);

  return noStoreJson({
    message: "Thanks. Your Crelavo ecommerce video ad guide request was received.",
    nextStep: "Check your email for the strategy guide and activate the trial credit offer after signup."
  });
}
