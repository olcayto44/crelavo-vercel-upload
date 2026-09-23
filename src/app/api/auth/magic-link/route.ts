import { NextResponse } from "next/server";
import { AUTH_VERIFY, SIGNUP_DISABLED } from "@/lib/crelavo/authConfig";
import { hashToken, newToken, normalizeEmail, saveMagicToken } from "@/lib/crelavo/userStore";
import { sendMagicEmail } from "@/lib/crelavo/sendMagicEmail";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { email?: string; intent?: "login" | "register"; next?: string };
  const email = normalizeEmail(body.email || "");
  const intent = body.intent === "register" ? "register" : "login";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  if (SIGNUP_DISABLED && intent === "register") return NextResponse.json({ error: "signup_disabled" }, { status: 403 });
  const token = newToken();
  await saveMagicToken(email, hashToken(token), new Date(Date.now() + 15 * 60 * 1000));
  const appUrl = process.env.APP_URL || new URL(req.url).origin;
  const verify = new URL(AUTH_VERIFY, appUrl);
  verify.searchParams.set("token", token);
  verify.searchParams.set("intent", intent);
  if (body.next) verify.searchParams.set("next", body.next);
  await sendMagicEmail(email, verify.toString());
  return NextResponse.json({ ok: true });
}
