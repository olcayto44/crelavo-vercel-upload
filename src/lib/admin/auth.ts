import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

/** Server-page guard. Customer Supabase cookies are intentionally not accepted here. */
export async function requireAdmin() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value ?? "";
  if (!verifyAdminSessionToken(token)) redirect("/admin");
  return true;
}
