import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";
import { supabaseAdmin } from "@/lib/supabase";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function emailHtml({ title, preheader, rows, body }: { title: string; preheader: string; rows: { label: string; value: string }[]; body: string }) {
  const safeRows = rows.map((row) => `<tr><td style="padding:8px 0;color:#64748b;font-size:13px;">${escapeHtml(row.label)}</td><td style="padding:8px 0;color:#0f172a;font-weight:700;font-size:13px;text-align:right;">${escapeHtml(row.value)}</td></tr>`).join("");
  return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;"><div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 12px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;"><tr><td style="padding:24px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:white;"><div style="font-size:26px;font-weight:900;letter-spacing:-0.04em;">▶ Crelavo</div><div style="margin-top:8px;font-size:13px;color:#bfdbfe;">AI Production Studio</div></td></tr><tr><td style="padding:28px;"><h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#0f172a;">${escapeHtml(title)}</h1><p style="margin:0 0 20px;color:#475569;font-size:15px;line-height:1.65;">${body}</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;margin:18px 0;padding:8px 0;">${safeRows}</table><p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:1.55;">Crelavo yetkilileri mesajı inceleyip en kısa sürede dönüş yapacaktır. Bu e-posta otomatik bilgilendirmedir.</p></td></tr></table></td></tr></table></body></html>`;
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json().catch(() => ({}));
  const fullName = cleanText(body.fullName, 120);
  const email = cleanText(body.email, 180).toLowerCase();
  const requesterType = cleanText(body.requesterType ?? body.requester_type, 120);
  const topic = cleanText(body.topic, 120);
  const message = cleanText(body.message, 4000);
  const company = cleanText(body.company, 160);
  const verification = cleanText(body.verification, 40).toUpperCase();
  const honeypot = cleanText(body.website, 200);

  if (honeypot) return Response.json({ message: "Contact request received." });
  if (!fullName || !isEmail(email) || !requesterType || !topic || message.length < 20) {
    return Response.json({ error: "Enter your name, a valid email, who is contacting us, topic, and a message with at least 20 characters." }, { status: 400 });
  }
  if (verification !== "CRELAVO") {
    return Response.json({ error: "Security check failed. Type CRELAVO exactly." }, { status: 400 });
  }
  const suspicious = rejectSuspiciousText([fullName, email, requesterType, topic, message, company]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });

  try {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      await supabaseAdmin().from("lead_captures").insert({
        email,
        source: "contact_request",
        offer: topic,
        status: "captured",
        consent: true,
        bonus_credits: 0,
        ip_address: ip,
        user_agent: cleanText(request.headers.get("user-agent"), 500),
        page_url: "/contact",
        metadata: { fullName, company, message, requesterType, topic, capturedAt: new Date().toISOString(), adminInboxType: "contact_request" }
      });
    }
  } catch {
    // Email delivery below remains the source of truth if optional admin inbox storage is unavailable.
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";

  if (!apiKey) {
    return Response.json({ error: "Email provider is not configured yet. Add RESEND_API_KEY before live contact delivery." }, { status: 503 });
  }

  const summaryRows = [
    { label: "Who", value: requesterType },
    { label: "Name", value: fullName },
    { label: "Email", value: email },
    { label: "Company/project", value: company || "-" },
    { label: "Topic", value: topic }
  ];

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
      subject: `Crelavo contact: ${requesterType} · ${topic}`,
      text: [
        `Who: ${requesterType}`,
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Company/project: ${company || "-"}`,
        `Topic: ${topic}`,
        "",
        message
      ].join("\n"),
      html: emailHtml({
        title: "New Crelavo contact request",
        preheader: `${requesterType} wrote about ${topic}`,
        rows: summaryRows,
        body: escapeHtml(message).replace(/\n/g, "<br />")
      })
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    return Response.json({ error: `Email provider rejected the request. ${details}`.trim() }, { status: 502 });
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "We received your Crelavo message",
      text: [
        `Hello ${fullName},`,
        "",
        "Your message has been received by Crelavo. Our team will review it and get back to you as soon as possible.",
        "",
        `Topic: ${topic}`,
        `Requester type: ${requesterType}`,
        "",
        "Crelavo Support"
      ].join("\n"),
      html: emailHtml({
        title: "Your message has reached Crelavo",
        preheader: "Crelavo support received your message.",
        rows: summaryRows,
        body: `Hello ${escapeHtml(fullName)},<br /><br />Your message has been received successfully. Crelavo support will review your request and get back to you as soon as possible.`
      })
    })
  }).catch(() => null);

  return Response.json({ message: "Contact request sent. Crelavo support will review it." });
}
