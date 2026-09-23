"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
export function RequireFreeAccount({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth(); const pathname = usePathname();
  useEffect(() => { if (!loading && !user) openAuth("register", { next: `${pathname}${window.location.search}` }); }, [loading, user, pathname, openAuth]);
  if (loading || !user) return <div className="crelavo-auth-gate">Create a free Crelavo account to start production. Pro is optional after that.</div>;
  return <>{children}</>;
}
