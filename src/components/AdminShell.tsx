"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminLogoutButton } from "@/components/AdminLoginPanel";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";
import { AdminSidebarAlert } from "@/components/AdminSidebarAlert";
import { adminMenu, adminMenuGroups } from "@/lib/admin";
import styles from "./AdminShell.module.css";

function isActiveAdminHref(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}
const groupLabels: Record<string, string> = { Operations: "Operasyon", Finance: "Finans", Content: "İçerik", System: "Sistem" };
const menuLabels: Record<string, string> = {
  "/admin": "Genel bakış", "/admin/live": "Canlı ziyaretçiler", "/admin/users": "Üyeler / aboneler",
  "/admin/inbox": "Gelen kutusu", "/admin/productions": "Üretimler", "/admin/credits": "Krediler",
  "/admin/finance": "Finans", "/admin/email": "E-posta gönderimi", "/admin/growth": "Lead / destek",
  "/admin/hero": "Ana sayfa videoları", "/admin/showcase-videos": "Vitrin videoları", "/admin/site-content": "Site içeriği",
  "/admin/partners": "İş ortakları", "/admin/seo": "SEO / Google", "/admin/providers": "Sağlayıcı durumu",
  "/admin/production-qa": "Üretim kontrolü / QA", "/admin/security-fraud": "Güvenlik", "/admin/monitoring": "İzleme"
};
export function AdminShell({ children, title, description }: { children: React.ReactNode; title: string; description?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuQuery, setMenuQuery] = useState("");
  const [mobileNavigation, setMobileNavigation] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const term = menuQuery.trim().toLocaleLowerCase("tr-TR");
  const filteredMenu = adminMenu.filter(item => !term || (item.label + " " + (menuLabels[item.href] || "") + " " + item.group + " " + (groupLabels[item.group] || "")).toLocaleLowerCase("tr-TR").includes(term));
  return <main className={"container section admin-shell-layout " + styles.layout}>
    <div className="nav admin-topbar" style={{ paddingTop: 0 }}>
      <Link className="logo" href="/admin"><span className="logo-mark" aria-hidden="true">▶</span><span>Crelavo Admin</span></Link>
      <div><button className="btn secondary" type="button" onClick={() => router.back()}>Geri</button><Link className="btn secondary" href="/admin">Genel bakış</Link><Link className="btn secondary" href="/">Canlı site</Link><AdminLogoutButton /></div>
    </div>
    <div className="admin-shell">
      <aside className={"admin-sidebar-card " + (!mobileNavigation ? styles.sidebarCollapsed : "")}>
        <div className={styles.sidebarHeading}><span>Yönetim</span><button type="button" className={styles.mobileToggle} aria-controls="admin-navigation" aria-expanded={mobileNavigation} onClick={() => setMobileNavigation(value => !value)}>{mobileNavigation ? "Menüyü kapat" : "Menüyü aç"}</button></div>
        <AdminSidebarAlert />
        <label className={styles.navSearch}><span>Menüde ara</span><input type="search" maxLength={100} value={menuQuery} onChange={event => setMenuQuery(event.target.value)} placeholder="Üyeler, finance, SEO…" /></label>
        <nav id="admin-navigation" aria-label="Admin bölümleri">
          {adminMenuGroups.map(group => {
            const items = filteredMenu.filter(item => item.group === group);
            if (!items.length) return null;
            return <details className="admin-menu-group" key={group + pathname + Boolean(term)} open={Boolean(term) || items.some(item => isActiveAdminHref(pathname, item.href))}>
              <summary>{groupLabels[group] || group}<span className={styles.groupCount}>{items.length}</span></summary>
              {items.map(item => <Link className={isActiveAdminHref(pathname, item.href) ? "active" : undefined} aria-current={isActiveAdminHref(pathname, item.href) ? "page" : undefined} key={item.href} href={item.href} onClick={() => setMobileNavigation(false)}>{menuLabels[item.href] || item.label}</Link>)}
            </details>;
          })}
          {filteredMenu.length === 0 && <p className={styles.noMenuResults}>Eşleşen bölüm yok.</p>}
        </nav>
      </aside>
      <div className="admin-main-stack">
        <header className={styles.pageHeader}>
          <div className={styles.pageTitle}><span className={styles.eyebrow}>Yönetim paneli</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
          <details className={styles.notifications} onToggle={event => setNotificationsOpen(event.currentTarget.open)} onKeyDown={event => { if (event.key === "Escape") event.currentTarget.open = false; }}>
            <summary>Bildirimler ve özet</summary>
            {notificationsOpen && <div className={styles.notificationPanel}><AdminNotificationBell /></div>}
          </details>
        </header>
        {children}
      </div>
    </div>
  </main>;
}
