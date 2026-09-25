import { AFTER_SIGNIN_PATH, JOIN_PATH, PRO_PATH } from "./authConfig";

const forbidden = ["/", JOIN_PATH, PRO_PATH, "/ai-video-generator", "/dashboard/credits", "/dashboard/billing"];

export function safeReturnPath(candidate?: string | null): string {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return AFTER_SIGNIN_PATH;
  const path = candidate.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  if (forbidden.some((item) => path === item || (item !== "/" && path.startsWith(`${item}/`)))) return AFTER_SIGNIN_PATH;
  return candidate;
}

export const SIGNUP_DESTINATION = "/dashboard/create";
