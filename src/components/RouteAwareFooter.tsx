"use client";

import { usePathname } from "next/navigation";

export function RouteAwareFooter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideFooter = Boolean(
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/dashboard/assistant-workspace")
  );

  if (hideFooter) return null;
  return <>{children}</>;
}
