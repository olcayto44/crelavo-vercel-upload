import { AFTER_SIGNIN_PATH, JOIN_PATH, PRO_PATH } from "./authConfig";

const BLOCKED = new Set(["/", "/pricing", JOIN_PATH, "/ai-video-generator", "/dashboard/credits", "/dashboard/billing"]);

export function safeReturnTo(returnTo?: string | null): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return null;
  const path = returnTo.split("?")[0];
  if (BLOCKED.has(path)) return null;
  return returnTo;
}

export function postAuthPath(opts: { isNew: boolean; returnTo?: string | null }) {
  if (opts.isNew) return "/dashboard/create";
  return safeReturnTo(opts.returnTo) ?? AFTER_SIGNIN_PATH;
}

export const SIGNUP_DESTINATION = "/dashboard/create";
export { BLOCKED };
