import { AFTER_SIGNIN_PATH, JOIN_PATH, PRO_PATH } from "./authConfig";
import {isStudioConversationPath} from "../studio-public-path";

const BLOCKED = new Set(["/", "/pricing", JOIN_PATH, "/ai-video-generator", "/dashboard/credits", "/dashboard/billing"]);

export function safeReturnTo(returnTo?: string | null): string | null {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return null;
  const path = returnTo.split("?")[0];
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
  if (opts.isNew) return "/dashboard/assistant-workspace";
  return safe ?? AFTER_SIGNIN_PATH;
}

export const SIGNUP_DESTINATION = "/dashboard/assistant-workspace";
export { BLOCKED };
