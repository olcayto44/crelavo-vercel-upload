function cleanText(value: unknown, maxLength: number) {
  return String(value ?? "").trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = cleanText(body.email, 180).toLowerCase();
  const fullName = cleanText(body.fullName, 140) || "Crelavo user";

  if (!isEmail(email)) {
    return Response.json({ error: "Valid email is required." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json({ skipped: true, reason: "RESEND_API_KEY is not configured." });
  }

  const from = process.env.SUPPORT_FROM_EMAIL || "Crelavo <support@crelavo.com>";
  const now = new Date().toISOString();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Crelavo account sign-in notice",
      text: [
        `Hello ${fullName},`,
        "",
        "Your Crelavo account was signed in successfully.",
        `Time: ${now}`,
        "",
        "If this was you, no action is needed. If you did not sign in, reset your password immediately from the Crelavo login page."
      ].join("\n")
    })
  });

  if (!response.ok) {
    return Response.json({ skipped: true, reason: "Email provider rejected the login notification." });
  }

  return Response.json({ sent: true });
}
