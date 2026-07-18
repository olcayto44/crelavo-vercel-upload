import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoginPanel } from "@/components/AdminLoginPanel";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/admin-session";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "";
  const authenticated = verifyAdminSessionToken(sessionToken);

  if (!authenticated) return <AdminLoginPanel />;

  return children;
}
