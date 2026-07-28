import { ADMIN_SESSION_COOKIE, getAdminSessionPayload, getCookieValue, verifyAdminSessionToken } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase";

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

export type AdminPermission = "users" | "credits" | "productions" | "support" | "finance" | "content" | "providers" | "growth" | "owner";

export const adminPermissions: AdminPermission[] = ["users", "credits", "productions", "support", "finance", "content", "providers", "growth", "owner"];

function normalizePermissions(value: unknown): AdminPermission[] {
  const raw = Array.isArray(value) ? value : [];
  return raw.map((item) => String(item)).filter((item): item is AdminPermission => adminPermissions.includes(item as AdminPermission));
}

export async function getAdminRequestContext(request: Request, body?: Record<string, unknown>) {
  const sessionToken = getCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  const sessionPayload = getAdminSessionPayload(sessionToken);
  const expectedAdminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const expectedAdminToken = String(process.env.ADMIN_API_TOKEN ?? "").trim();
  const requestEmail = getAdminEmail(request, body);
  const requestToken = getAdminApiToken(request, body);
  const email = sessionPayload?.email ?? requestEmail;

  if (expectedAdminEmail && email === expectedAdminEmail && (!expectedAdminToken || requestToken === expectedAdminToken || Boolean(sessionPayload))) {
    return { ok: true as const, email, source: sessionPayload ? "env-session" : "env-token", permissions: adminPermissions };
  }

  if (!email || !email.includes("@")) return { ok: false as const };

  try {
    const { data: usersData, error: usersError } = await supabaseAdmin().auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw usersError;
    const user = usersData.users.find((item) => item.email?.toLowerCase() === email);
    if (!user?.id || !user.email) return { ok: false as const };

    const { data: profile, error: profileError } = await supabaseAdmin()
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (String(profile?.role ?? "").toLowerCase() !== "admin") return { ok: false as const };

    const permissions = normalizePermissions(user.user_metadata?.admin_permissions);
    return { ok: true as const, email: user.email.toLowerCase(), source: sessionPayload ? "supabase-session" : "supabase-token", permissions };
  } catch {
    return { ok: false as const };
  }
}

export function hasAdminPermission(permissions: AdminPermission[], required: AdminPermission | AdminPermission[]) {
  if (permissions.includes("owner")) return true;
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.some((permission) => permissions.includes(permission));
}

export async function requireAdminPermission(request: Request, required: AdminPermission | AdminPermission[], body?: Record<string, unknown>) {
  const context = await getAdminRequestContext(request, body);
  if (!context.ok) return { ok: false as const, response: adminRequiredResponse() };
  if (!hasAdminPermission(context.permissions, required)) {
    return { ok: false as const, response: adminPermissionRequiredResponse(required) };
  }
  return { ok: true as const, context };
}

export function adminRequiredResponse() {
  return Response.json({ error: "Admin access required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
}

export function adminPermissionRequiredResponse(required: AdminPermission | AdminPermission[]) {
  const permissions = Array.isArray(required) ? required : [required];
  return Response.json({ error: `Admin permission required: ${permissions.join(" or ")}.` }, { status: 403, headers: { "Cache-Control": "no-store" } });
}
