import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "crelavo_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

type AdminSessionPayload = {
  email: string;
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function adminSessionSecret() {
  return String(process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_API_TOKEN || process.env.NEXTAUTH_SECRET || "").trim();
}

function signPayload(encodedPayload: string) {
  const secret = adminSessionSecret();
  if (!secret) return "";
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function getExpectedAdminEmail() {
  return String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
}

export function getExpectedAdminUsername() {
  const explicit = String(process.env.ADMIN_USERNAME ?? process.env.ADMIN_PANEL_USERNAME ?? "").trim().toLowerCase();
  if (explicit) return explicit;
  const email = getExpectedAdminEmail();
  return email.includes("@") ? email.split("@")[0] : "admin";
}

export function getExpectedAdminPassword() {
  return String(process.env.ADMIN_PASSWORD || process.env.ADMIN_PANEL_PASSWORD || process.env.ADMIN_API_TOKEN || "").trim();
}

export function createAdminSessionToken(email: string) {
  const payload: AdminSessionPayload = {
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  if (!signature) return "";
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  if (!token || !token.includes(".")) return false;
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;
  const expectedSignature = signPayload(encodedPayload);
  if (!expectedSignature) return false;

  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminSessionPayload;
    if (!payload.email || !payload.email.includes("@")) return false;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export function adminSessionCookieHeader(token: string) {
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Strict; Secure`;
}

export function clearAdminSessionCookieHeader() {
  return `${ADMIN_SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure`;
}

export function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return "";
  const cookies = cookieHeader.split(";").map((item) => item.trim());
  const match = cookies.find((item) => item.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}
