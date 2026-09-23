import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_DAYS } from "./authConfig";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

type Payload = SessionUser & { exp: number };

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is missing");
  return s;
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function encode(user: SessionUser) {
  const payload: Payload = { ...user, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionUser | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (!payload?.id || !payload?.email || payload.exp < Date.now()) return null;
    return { id: payload.id, email: payload.email, name: payload.name ?? null, image: payload.image ?? null };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decode(raw);
}

export async function setSessionUser(user: SessionUser) {
  (await cookies()).set(SESSION_COOKIE, encode(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSession() {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
