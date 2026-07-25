"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiServiceGroups } from "@/lib/api-services";

function shouldHideRail(pathname: string | null) {
  if (!pathname) return true;
  return Boolean(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/productions") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/wp-admin")
  );
}

export function PublicSideRail() {
  const pathname = usePathname();
  if (shouldHideRail(pathname)) return null;

  const onDocsPage = pathname?.startsWith("/api-documentation");

  return (
    <aside className="public-side-rail" aria-label="Crelavo API services menu">
      <div className="tool-side-menu-head">
        <span className="badge">API services</span>
        <strong>Crelavo integrations</strong>
        <p>Open the active provider map, quality levels and usage notes for each service.</p>
      </div>

      <nav className="tool-side-menu-groups">
        {apiServiceGroups.map((group) => (
          <details key={group.title} open>
            <summary>{group.title}</summary>
            <div>
              {group.services.map((service) => {
                const href = `/api-documentation#api-${service.slug}`;
                const active = onDocsPage || pathname === href;
                return (
                  <Link className={active ? "active" : ""} href={href} key={`${group.title}-${service.slug}`}>
                    {service.name}
                  </Link>
                );
              })}
            </div>
          </details>
        ))}
      </nav>

      <Link className="btn" href="/api-documentation">Open API docs</Link>
      <Link className="btn secondary" href="/dashboard/assistant-workspace">Start production</Link>
    </aside>
  );
}
