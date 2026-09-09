"use client";

import Link from "next/link";
import { PRO_MONTHLY_CHECKOUT } from "../../lib/ids";

const LINKS = [
  { href: "/categories", label: "Categories" },
  { href: "/showcase/videos", label: "Showcase" },
  { href: "/tools", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/affiliate", label: "Affiliate" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  return (
    <header className="cl-header">
      <div className="cl-header-inner">
        <Link href="/" className="cl-logo" aria-label="CreLavo home">
          <span className="cl-logo-mark" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 1.8v8.4L10.2 6 3 1.8Z" fill="currentColor" />
            </svg>
          </span>
          CreLavo
        </Link>
        <nav className="cl-nav" aria-label="Primary">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="cl-header-end">
          <Link href="/auth/login" className="cl-signin">
            Sign in
          </Link>
          <a className="cl-btn" href={PRO_MONTHLY_CHECKOUT}>
            Start 24-hour trial
          </a>
        </div>
      </div>
    </header>
  );
}
