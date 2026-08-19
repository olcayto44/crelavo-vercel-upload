"use client";

import { usePathname } from "next/navigation";
import { PreviewSupportBox } from "@/components/PreviewSupportBox";

export function PreviewSupportBoxRouteGate() {
  const pathname = usePathname();
  const isShowcaseRoute = Boolean(pathname && pathname.startsWith("/showcase"));
  if (isShowcaseRoute) return null;
  return <PreviewSupportBox />;
}
