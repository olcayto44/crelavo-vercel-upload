export async function sendMagicEmail(email: string, url: string) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Crelavo <noreply@crelavo.com>";
  if (!key) {
    console.log("[crelavo-auth] magic link (no RESEND_API_KEY)", email, url);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email, subject: "Your Crelavo sign-in link", html: `<p>Sign in to Crelavo (no password):</p><p><a href="${url}">${url}</a></p><p>This link expires in 15 minutes.</p>` }),
  });
  if (!res.ok) throw new Error(`magic email failed: ${res.status} ${await res.text()}`);
}
