"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PRO_MONTHLY_CHECKOUT } from "../../lib/ids";

const WORK = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/credits", label: "Credits" },
  { href: "/dashboard/assistant-workspace", label: "Live Control" },
  { href: "/affiliate", label: "Partners" },
  { href: "/dashboard/billing", label: "Billing" },
];

const TOOLS = [
  { href: "/tools", label: "Templates" },
  { href: "/api-documentation", label: "API Access" },
];

const ACCOUNT = [
  { href: "/dashboard", label: "Profile" },
  { href: "/contact", label: "Settings" },
  { href: "/auth/login", label: "Log Out" },
];

export default function DashShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div className="cl-root">
      <div className="cl-dash">
        <aside className="cl-dash-side">
          <Link href="/" className="cl-logo" aria-label="CreLavo home">
            <span className="cl-logo-mark" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.8v8.4L10.2 6 3 1.8Z" fill="currentColor" />
              </svg>
            </span>
            CreLavo
          </Link>
          <a className="cl-btn cl-dash-create" href={PRO_MONTHLY_CHECKOUT}>
            Create
          </a>
          <p className="cl-dash-group">Work</p>
          <nav className="cl-dash-nav" aria-label="Work">
            {WORK.map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className={path === l.href ? "is-on" : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="cl-dash-group">Tools</p>
          <nav className="cl-dash-nav" aria-label="Tools">
            {TOOLS.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="cl-dash-group">Account</p>
          <nav className="cl-dash-nav" aria-label="Account">
            {ACCOUNT.map((l) => (
              <Link key={l.label} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="cl-dash-main">{children}</div>
      </div>
    </div>
  );
}
