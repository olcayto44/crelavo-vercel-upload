import { AFTER_SIGNIN_PATH, JOIN_PATH, PRO_PATH } from "./authConfig";
import {isStudioConversationPath} from "../studio-public-path";

const BLOCKED = new Set(["/", "/pricing", JOIN_PATH, "/ai-video-generator", "/auth/login", "/auth/register"]);

export function safeReturnTo(returnTo?: string | null): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(returnTo)) return null;
  try { const target = new URL(returnTo, "https://www.crelavo.com"); if (target.origin !== "https://www.crelavo.com") return null; } catch { return null; }
  const path = returnTo.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (BLOCKED.has(path)) return null;
  return returnTo;
}

const STUDIO_AUTH_RETURN_PATHS = new Set([
  "/dashboard/studio-v2",
  "/dashboard/studio-elements",
  "/dashboard/studio-video-editor",
  "/dashboard/studio-image-editor"
]);

export function postAuthPath(opts: { isNew: boolean; returnTo?: string | null }) {
  const safe = safeReturnTo(opts.returnTo);
  // A Studio login or new-account flow must return to the selected Studio
  // preview, including its category and language. Never send it to the
  // legacy assistant workspace simply because a first-time login is new.
  if (safe && STUDIO_AUTH_RETURN_PATHS.has(safe.split("?")[0].split("#")[0])) return safe;
  if (safe && isStudioConversationPath(safe.split("?")[0].split("#")[0])) return safe;
  if (safe && safe.startsWith("/dashboard/")) return safe;
  if (opts.isNew) return "/dashboard/studio";
  return safe ?? AFTER_SIGNIN_PATH;
}

export const SIGNUP_DESTINATION = "/dashboard/studio";
export { BLOCKED };
