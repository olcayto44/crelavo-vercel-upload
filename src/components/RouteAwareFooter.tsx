"use client";

import { usePathname } from "next/navigation";
import { LocalizedSiteFooter } from "@/components/LocalizedSiteFooter";

export function RouteAwareFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = Boolean(
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/dashboard/assistant-workspace")
  );

  if (hideFooter) return null;
  if (pathname?.startsWith("/tr/")) return <LocalizedSiteFooter locale="tr" />;
  if (pathname?.startsWith("/fr/")) return <LocalizedSiteFooter locale="fr" />;
  if (pathname?.startsWith("/de/")) return <LocalizedSiteFooter locale="de" />;
  return <>{children}</>;
}
