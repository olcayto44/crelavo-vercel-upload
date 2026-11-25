"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pageLanguage } from "@/lib/page-language";

export function DocumentLanguage() {
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = pageLanguage(pathname || "/");
  }, [pathname]);
  return null;
}
