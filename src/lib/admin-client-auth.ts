export const ADMIN_API_TOKEN_STORAGE_KEY = "clipora_admin_api_token";

let temporaryAdminToken="";
export function getStoredAdminApiToken() {
  if (typeof window === "undefined") return "";
  try{window.localStorage.removeItem(ADMIN_API_TOKEN_STORAGE_KEY)}catch{}
  return temporaryAdminToken;
}

export function rememberAdminApiToken(token: string) {
  if (typeof window === "undefined") return;
  temporaryAdminToken=token.trim();
  try{window.localStorage.removeItem(ADMIN_API_TOKEN_STORAGE_KEY)}catch{}
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
  return "Owner session is preferred. Optional API token is kept only in memory until page reload.";
}
