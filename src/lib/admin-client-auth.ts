export const ADMIN_API_TOKEN_STORAGE_KEY = "clipora_admin_api_token";

export function getStoredAdminApiToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(ADMIN_API_TOKEN_STORAGE_KEY) ?? "";
}

export function rememberAdminApiToken(token: string) {
  if (typeof window === "undefined") return;
  const clean = token.trim();
  if (clean) window.localStorage.setItem(ADMIN_API_TOKEN_STORAGE_KEY, clean);
  else window.localStorage.removeItem(ADMIN_API_TOKEN_STORAGE_KEY);
}

export function adminApiHeaders(adminEmail: string, adminToken: string, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(extraHeaders);
  const cleanEmail = adminEmail.trim();
  const cleanToken = adminToken.trim();
  if (cleanEmail) headers.set("x-admin-email", cleanEmail);
  if (cleanToken) headers.set("x-admin-api-token", cleanToken);
  return headers;
}

export function adminApiBody<T extends Record<string, unknown>>(body: T, adminEmail: string, adminToken: string) {
  return {
    ...body,
    admin_email: adminEmail.trim(),
    admin_token: adminToken.trim()
  };
}

export function adminApiTokenHelpText() {
  return "Required in production when ADMIN_API_TOKEN is configured. Stored only in this browser.";
}
