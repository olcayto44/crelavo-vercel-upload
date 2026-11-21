"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
export function StudioRouteChrome({children}:{children:ReactNode}) {
  const pathname=usePathname();
  // Exclude site chrome from the render tree, not with an overlay or CSS hiding.
  if(pathname === "/dashboard/studio-v2" || pathname?.startsWith("/dashboard/studio-v2/"))return null;
  return <>{children}</>;
}
