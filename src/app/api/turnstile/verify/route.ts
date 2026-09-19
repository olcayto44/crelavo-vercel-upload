import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["www.crelavo.com", "crelavo.com", "localhost"]);

export async function POST(req: Request) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  let token = "";
  try {
    const body = await req.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!token || token.length > 2048) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const remoteip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (remoteip) form.append("remoteip", remoteip);

  const cf = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await cf.json()) as {
    success?: boolean;
    hostname?: string;
    action?: string;
  };

  const hostOk = !data.hostname || ALLOWED_HOSTS.has(data.hostname);
  const actionOk = !data.action || data.action === "register";

  if (!data.success || !hostOk || !actionOk) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
