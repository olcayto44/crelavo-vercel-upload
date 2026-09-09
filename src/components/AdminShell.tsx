"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLoginPanel";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { adminMenu, adminMenuGroups } from "@/lib/admin";

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
        <Link className="logo" href="/admin"><span className="logo-mark">▶</span><span>Crelavo Admin</span></Link>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn secondary" type="button" onClick={() => router.back()}>Back</button>
          <Link className="btn secondary" href="/admin">Admin home</Link>
          <Link className="btn secondary" href="/">Live site</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="admin-shell">
        <aside className="admin-sidebar-card">
           <span className="badge">Admin navigation</span>
           <p className="admin-sidebar-intro">Open a section only when you need its detailed controls.</p>
           <nav>
             {adminMenuGroups.map((group) => (
               <details className="admin-menu-group" key={group} open={group === "Panel"}>
                 <summary>{group}</summary>
                 {adminMenu.filter((item) => item.group === group).map((item) => (
                   <Link className={isActiveAdminHref(pathname, item.href) ? "active" : undefined} key={item.href} href={item.href}>{item.label}</Link>
                 ))}
               </details>
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
