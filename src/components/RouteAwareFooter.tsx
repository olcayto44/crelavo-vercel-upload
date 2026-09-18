"use client";

import { usePathname } from "next/navigation";
import { DashboardFooter } from "@/components/DashboardFooter";
import { LocalizedSiteFooter } from "@/components/LocalizedSiteFooter";

export function RouteAwareFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = Boolean(pathname?.startsWith("/dashboard"));
  const hideFooter = Boolean(
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/dashboard/assistant-workspace") ||
    pathname?.startsWith("/ai-mobile-app-builder") ||
    pathname?.startsWith("/ai-ecommerce-builder") ||
    pathname?.startsWith("/ai-video-agent") ||
    pathname?.startsWith("/ai-video-generator")
  );

  if (hideFooter) return null;
  if (isDashboard) return <DashboardFooter />;
  if (pathname?.startsWith("/tr/")) return <LocalizedSiteFooter locale="tr" />;
  if (pathname?.startsWith("/fr/")) return <LocalizedSiteFooter locale="fr" />;
  if (pathname?.startsWith("/de/")) return <LocalizedSiteFooter locale="de" />;
  return <>{children}</>;
}
