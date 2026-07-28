"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLoginPanel";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { adminDailyFocus, adminMenu, adminMenuGroups } from "@/lib/admin";

function isActiveAdminHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <main className="container section admin-shell-layout">
      <div className="nav" style={{ paddingTop: 0 }}>
        <Link className="logo" href="/admin"><span className="logo-mark">▶</span><span>Crelavo Yönetimi</span></Link>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={() => router.back()}>Geri</button>
          <Link className="btn secondary" href="/admin">Admin ana ekran</Link>
          <Link className="btn secondary" href="/">Canlı site</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="admin-shell">
        <aside className="admin-sidebar-card">
          <span className="badge">Günlük takip</span>
          <h3>En sık bakılacaklar</h3>
          <nav className="admin-menu-group">
            {adminDailyFocus.slice(0, 7).map((item) => (
              <Link className={isActiveAdminHref(pathname, item.href) ? "active" : undefined} key={item.href} href={item.href}>{item.priority} · {item.label}</Link>
            ))}
          </nav>
          <span className="badge" style={{ marginTop: 16 }}>Tüm menü</span>
          <h3>Diğer yönetim alanları</h3>
          <nav>
            {adminMenuGroups.map((group) => (
              <div className="admin-menu-group" key={group}>
                <strong>{group}</strong>
                {adminMenu.filter((item) => item.group === group).map((item) => (
                  <Link className={isActiveAdminHref(pathname, item.href) ? "active" : undefined} key={item.href} href={item.href}>{item.label}</Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="admin-main-stack">
          <section className="production-hero-card admin-overview-hero">
            <div className="admin-hero-with-notifications">
              <div>
                <span className="badge">Admin panel</span>
                <h2>{title}</h2>
                {description ? <p>{description}</p> : null}
              </div>
              <AdminNotificationBell />
            </div>
          </section>
          {children}
        </div>
      </div>
    </main>
  );
}
