import { ADMIN_SESSION_COOKIE, getCookieValue, verifyAdminSessionToken } from "@/lib/admin-session";

export function getAdminApiToken(request: Request, body?: Record<string, unknown>) {
  const { searchParams } = new URL(request.url);
  return String(
    request.headers.get("x-admin-api-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    searchParams.get("admin_token") ??
    body?.admin_token ??
    body?.adminToken ??
    ""
  ).trim();
}

export function getAdminEmail(request: Request, body?: Record<string, unknown>) {
  const { searchParams } = new URL(request.url);
  return String(
    request.headers.get("x-admin-email") ??
    searchParams.get("admin_email") ??
    body?.admin_email ??
    body?.adminEmail ??
    ""
  ).trim().toLowerCase();
}

export function isAdminRequest(request: Request, body?: Record<string, unknown>) {
  const sessionToken = getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (verifyAdminSessionToken(sessionToken)) return true;

  const expectedAdminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const expectedAdminToken = String(process.env.ADMIN_API_TOKEN ?? "").trim();
  const adminEmail = getAdminEmail(request, body);
  const adminToken = getAdminApiToken(request, body);

  if (!expectedAdminEmail || adminEmail !== expectedAdminEmail) return false;

  if (!expectedAdminToken) return true;

  return adminToken === expectedAdminToken;
}

export function adminRequiredResponse() {
  return Response.json({ error: "Admin access required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
}
