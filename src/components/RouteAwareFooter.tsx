"use client";

import { usePathname } from "next/navigation";
import { DashboardFooter } from "@/components/DashboardFooter";
import { LocalizedSiteFooter } from "@/components/LocalizedSiteFooter";

const EMBEDDED_DASHBOARD_FOOTER_PATHS = new Set([
  "/dashboard/settings",
  "/dashboard/contact",
  "/dashboard/productions",
  "/dashboard/live-sales-agent",
  "/dashboard/brand-kit",
]);

export function RouteAwareFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = Boolean(pathname?.startsWith("/dashboard"));
  const hasEmbeddedDashboardFooter = Boolean(pathname && EMBEDDED_DASHBOARD_FOOTER_PATHS.has(pathname));
  const hideFooter = Boolean(
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/dashboard/assistant-workspace") ||
    pathname?.startsWith("/dashboard/studio-v2") ||
    pathname === "/dashboard/studio" || pathname?.startsWith("/dashboard/studio/") ||
    pathname?.startsWith("/dashboard/website-builder") ||
    pathname?.startsWith("/dashboard/studio-video-editor") ||
    pathname?.startsWith("/dashboard/studio-elements") ||
    pathname?.startsWith("/dashboard/studio-image-editor") ||
    pathname?.startsWith("/ai-mobile-app-builder") ||
    pathname?.startsWith("/ai-ecommerce-builder") ||
    pathname?.startsWith("/ai-video-agent") ||
    pathname?.startsWith("/ai-video-generator")
  );

  if (hideFooter || hasEmbeddedDashboardFooter) return null;
  if (isDashboard) return <DashboardFooter />;
  if (pathname?.startsWith("/tr/")) return <LocalizedSiteFooter locale="tr" />;
  if (pathname?.startsWith("/fr/")) return <LocalizedSiteFooter locale="fr" />;
  if (pathname?.startsWith("/de/")) return <LocalizedSiteFooter locale="de" />;
  return <>{children}</>;
}
