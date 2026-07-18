import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `partner-apply:${ip}`, limit: 4, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json().catch(() => ({}));
  const fullName = cleanText(body.fullName, 120);
  const email = cleanText(body.email, 180).toLowerCase();
  const channelType = cleanText(body.channelType, 80);
  const channelUrl = cleanText(body.channelUrl, 300);
  const audienceSize = cleanText(body.audienceSize, 80);
  const mainAudience = cleanText(body.mainAudience, 120);
  const promotionIdea = cleanText(body.promotionIdea, 3000);
  const verification = cleanText(body.verification, 40).toUpperCase();
  const honeypot = cleanText(body.website, 200);

  if (honeypot) return Response.json({ message: "Partner application received." });
  if (!fullName || !isEmail(email) || !channelType || !isUrl(channelUrl) || !mainAudience || promotionIdea.length < 20) {
    return Response.json({ error: "Enter your name, valid email, channel, channel URL, audience and a promotion idea with at least 20 characters." }, { status: 400 });
  }
  if (verification !== "CRELAVO") {
    return Response.json({ error: "Security check failed. Type CRELAVO exactly." }, { status: 400 });
  }

  const suspicious = rejectSuspiciousText([fullName, email, channelType, channelUrl, audienceSize, mainAudience, promotionIdea]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.PARTNER_APPLICATION_EMAIL || process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";

  if (!apiKey) {
    return Response.json({
      error: "Partner application intake is ready, but email delivery is not configured yet. Add RESEND_API_KEY and PARTNER_APPLICATION_EMAIL before live partner intake."
    }, { status: 503 });
  }

  const { error: insertError } = await supabaseAdmin()
    .from("partner_applications")
    .insert({
      full_name: fullName,
      email,
      channel_type: channelType,
      channel_url: channelUrl,
      audience_size: audienceSize || null,
      main_audience: mainAudience,
      promotion_idea: promotionIdea,
      status: "pending",
      inbox: "affiliate",
      application_ip: ip,
      application_country: "Unknown",
      application_city: "Unknown"
    });

  if (insertError) {
    return Response.json({ error: `Could not save partner application. ${insertError.message}` }, { status: 502 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Crelavo partner application: ${channelType}`,
      text: [
        "New Crelavo Partner Program application",
        "Inbox: Affiliate / Partner Program only — keep this separate from normal customer support messages.",
        "",
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Channel type: ${channelType}`,
        `Channel URL: ${channelUrl}`,
        `Audience size: ${audienceSize || "-"}`,
        `Main audience: ${mainAudience}`,
        `Application IP: ${ip}`,
        "Geo lookup: country/city will be attached after the geolocation provider is connected.",
        "",
        "Promotion idea:",
        promotionIdea,
        "",
        "Admin next step: review channel fit, set status to contacted/approved, then assign referral code after tracking provider is connected.",
        "After approval: ask the partner to add payout bank details in the dashboard. Any later IBAN/bank change must be requested by email and verified by finance before Monday payout."
      ].join("\n")
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    return Response.json({ error: `Email provider rejected the partner application. ${details}`.trim() }, { status: 502 });
  }

  return Response.json({ message: "Partner application received. We will review your channel before the program opens." });
}
