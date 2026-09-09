"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin/operations", label: "Live floor" },
  { href: "/admin/hosts", label: "Hosts" },
  { href: "/admin/skus", label: "SKUs" },
  { href: "/admin/orders", label: "Orders" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="cl-root">
      <header className="cl-header">
        <div className="cl-header-inner">
          <Link href="/admin/operations" className="cl-logo" aria-label="CreLavo operations">
            <span className="cl-logo-mark" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.8v8.4L10.2 6 3 1.8Z" fill="currentColor" />
              </svg>
            </span>
            CreLavo
          </Link>
          <nav className="cl-nav cl-ops-nav" aria-label="Operations">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={path === l.href ? "is-on" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="cl-header-end">
            <span className="cl-pill" style={{ marginLeft: 0 }}>
              Operations
            </span>
          </div>
        </div>
      </header>
      <div className="cl-wrap" style={{ paddingTop: 16 }}>
        <aside className="cl-status cl-status-not_connected" role="status">
          <p className="cl-status-kicker">Admin</p>
          <strong>Keep existing admin functions</strong>
          <p>
            Cream chrome only. Do not replace live credits, payments, API cost,
            net profit, support templates, or the current admin session. Do not
            use floor-data.ts as production data. Do not replace /auth/login.
          </p>
        </aside>
      </div>
      {children}
    </div>
  );
}
