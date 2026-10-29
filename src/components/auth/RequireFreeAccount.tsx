"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
export function RequireFreeAccount({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth(); const pathname = usePathname();
  useEffect(() => { if (loading || user || pathname === "/join") return; const returnTo = `${pathname}${window.location.search}`; openAuth("register", { next: returnTo }); }, [loading, user, pathname, openAuth]);
  if (loading || !user) return <div className="crelavo-auth-gate">Create a free Crelavo account to continue. No card required.</div>;
  return <>{children}</>;
}
