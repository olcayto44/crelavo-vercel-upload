"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
export function RequireFreeAccount({ children }: { children: React.ReactNode }) {
  const { user, loading, openAuth } = useAuth(); const pathname = usePathname(); const router = useRouter();
  const isAssistantWorkspace = pathname === "/dashboard/assistant-workspace";
  useEffect(() => {
    if (loading || user || pathname === "/join") return;
    const returnTo = `${pathname}${window.location.search}`;
    if (isAssistantWorkspace) { openAuth("login", { next: returnTo }); return; }
    router.replace(`/join?returnTo=${encodeURIComponent(returnTo)}`);
  }, [loading, user, pathname, router, openAuth, isAssistantWorkspace]);
  if (loading || !user) return <div className="crelavo-auth-gate">{isAssistantWorkspace ? <>Sign in to continue to the assistant. Opening the conversation does not start a paid production. {!loading ? <button type="button" onClick={() => openAuth("login", { next: `${pathname}${window.location.search}` })}>Sign in</button> : null}</> : <>Create a free Crelavo account to continue. No card required.</>}</div>;
  return <>{children}</>;
}
