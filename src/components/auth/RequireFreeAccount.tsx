"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
export function RequireFreeAccount({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth(); const pathname = usePathname(); const router = useRouter();
  useEffect(() => { if (loading || user || pathname === "/join") return; const returnTo = `${pathname}${window.location.search}`; router.replace(`/join?returnTo=${encodeURIComponent(returnTo)}`); }, [loading, user, pathname, router]);
  if (loading || !user) return <div className="crelavo-auth-gate">Create a free Crelavo account to continue. No card required.</div>;
  return <>{children}</>;
}
