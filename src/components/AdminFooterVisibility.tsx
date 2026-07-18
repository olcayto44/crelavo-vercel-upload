"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function AdminFooterVisibility() {
  const pathname = usePathname();

  useEffect(() => {
    const isAdmin = Boolean(pathname?.startsWith("/admin"));
    const isAuth = Boolean(pathname?.startsWith("/auth"));
    document.body.classList.toggle("admin-route", isAdmin);
    document.body.classList.toggle("auth-route", isAuth);
    return () => {
      document.body.classList.remove("admin-route");
      document.body.classList.remove("auth-route");
    };
  }, [pathname]);

  return null;
}
