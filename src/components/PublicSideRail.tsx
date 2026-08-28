"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiServiceGroups as defaultApiServiceGroups, type ApiServiceGroup } from "@/lib/api-services";

function shouldHideRail(pathname: string | null) {
  if (!pathname) return true;
  return Boolean(
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/ai-mobile-app-builder") ||
    pathname.startsWith("/ai-ecommerce-builder") ||
    pathname.startsWith("/ai-video-agent") ||
    pathname.startsWith("/ai-video-generator") ||
    pathname.startsWith("/productions") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/wp-admin")
  );
}

function shortLabelFromName(name: string) {
  return name
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function PublicSideRail() {
  const pathname = usePathname();
  const [groups, setGroups] = useState<ApiServiceGroup[]>(defaultApiServiceGroups);

  useEffect(() => {
    let alive = true;
    fetch("/api/api-services")
      .then((response) => response.json())
      .then((data) => {
        if (!alive || !Array.isArray(data.apiServiceGroups)) return;
        setGroups(data.apiServiceGroups);
      })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (shouldHideRail(pathname)) return null;

  const railServices = groups.flatMap((group) => group.services).map((service) => ({
    name: service.name,
    href: `/api-documentation#api-${service.slug}`,
    shortLabel: shortLabelFromName(service.name)
  }));

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
