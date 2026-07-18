import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLoginPanel";
import { adminMenu, adminMenuGroups } from "@/lib/admin";

export function AdminShell({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  return (
    <main className="container section">
      <div className="nav" style={{ paddingTop: 0 }}>
        <Link className="logo" href="/"><span className="logo-mark">▶</span><span>Crelavo Admin</span></Link>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="btn secondary" href="/">Home</Link>
          <Link className="btn secondary" href="/dashboard">User dashboard</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div className="admin-shell">
        <aside className="admin-sidebar-card">
          <span className="badge">Admin sidebar</span>
          <h3>Management options</h3>
          <nav>
            {adminMenuGroups.map((group) => (
              <div className="admin-menu-group" key={group}>
                <strong>{group}</strong>
                {adminMenu.filter((item) => item.group === group).map((item) => (
                  <Link key={item.href} href={item.href}>{item.label}</Link>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="admin-main-stack">
          <section className="production-hero-card admin-overview-hero">
            <span className="badge">Admin panel</span>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </section>
          {children}
        </div>
      </div>
    </main>
  );
}
