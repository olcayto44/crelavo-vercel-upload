import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLoginPanel } from "@/components/AdminLoginPanel";
import { ADMIN_SESSION_COOKIE, getAdminSessionPayload, getExpectedAdminEmail } from "@/lib/admin-session";

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
  const session = getAdminSessionPayload(sessionToken);
  if (!session) return <AdminLoginPanel />;
  if(!getExpectedAdminEmail() || session.email!==getExpectedAdminEmail())return <main className="container section"><h1>Yönetim paneli erişimi</h1><p>Bu sürümde finansal ve müşteri verileri içeren panel yalnızca site sahibi hesabına açıktır. Departman bazlı sayfa izinleri doğrulanana kadar diğer yönetici hesapları kapalıdır.</p><a href="/">Siteye dön</a></main>;

  return children;
}
