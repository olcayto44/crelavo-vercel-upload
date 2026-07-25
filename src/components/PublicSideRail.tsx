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

const railServices = apiServiceGroups.flatMap((group) => group.services).map((service) => ({
  name: service.name,
  href: `/api-documentation#api-${service.slug}`,
  shortLabel: service.name
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}));

export function PublicSideRail() {
  const pathname = usePathname();
  if (shouldHideRail(pathname)) return null;

  return (
    <nav className="public-side-rail" aria-label="Crelavo API services menu">
      {railServices.map((service) => {
        const active = pathname === service.href || pathname?.startsWith(service.href);
        return (
          <Link className={`public-side-rail-link ${active ? "active" : ""}`} href={service.href} key={service.href} aria-label={service.name}>
            <span className="public-side-rail-icon">{service.shortLabel || service.name.slice(0, 2).toUpperCase()}</span>
            <span>{service.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
