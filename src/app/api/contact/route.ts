import { clientIpFromRequest, rateLimit, rateLimitResponse, rejectSuspiciousText } from "@/lib/security";

function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const ip = clientIpFromRequest(request);
  const limit = rateLimit({ key: `contact:${ip}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const body = await request.json().catch(() => ({}));
  const fullName = cleanText(body.fullName, 120);
  const email = cleanText(body.email, 180).toLowerCase();
  const topic = cleanText(body.topic, 120);
  const message = cleanText(body.message, 4000);
  const company = cleanText(body.company, 160);
  const verification = cleanText(body.verification, 40).toUpperCase();
  const honeypot = cleanText(body.website, 200);

  if (honeypot) return Response.json({ message: "Contact request received." });
  if (!fullName || !isEmail(email) || !topic || message.length < 20) {
    return Response.json({ error: "Enter your name, a valid email, topic, and a message with at least 20 characters." }, { status: 400 });
  }
  if (verification !== "CRELAVO") {
    return Response.json({ error: "Security check failed. Type CRELAVO exactly." }, { status: 400 });
  }
  const suspicious = rejectSuspiciousText([fullName, email, topic, message, company]);
  if (!suspicious.ok) return Response.json({ error: suspicious.message }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL || "support@crelavo.com";
  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";

  if (!apiKey) {
    return Response.json({ error: "Email provider is not configured yet. Add RESEND_API_KEY before live contact delivery." }, { status: 503 });
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
      subject: `Crelavo contact: ${topic}`,
      text: [
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Company/project: ${company || "-"}`,
        `Topic: ${topic}`,
        "",
        message
      ].join("\n")
    })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    return Response.json({ error: `Email provider rejected the request. ${details}`.trim() }, { status: 502 });
  }

  return Response.json({ message: "Contact request sent. Crelavo support will review it." });
}
