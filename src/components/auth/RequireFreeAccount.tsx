"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {isStudioConversationPath} from "@/lib/studio-public-path";
export function RequireFreeAccount({ children, allowStudioPreview = false }: { children: React.ReactNode; allowStudioPreview?: boolean }) {
  const { user, loading, openAuth } = useAuth(); const pathname = usePathname(); const router = useRouter();
  const isAssistantWorkspace = pathname === "/dashboard/assistant-workspace";
  const isDashboardOverview = pathname === "/dashboard" || pathname === "/dashboard/";
  // Read-only Studio shell is inspectable on feature preview deployments only.
  // Real conversation, uploads and cloud project access still require a session.
  const previewStudioShell = allowStudioPreview && ["/dashboard/studio-v2", "/dashboard/studio", "/dashboard/studio-elements", "/dashboard/studio-video-editor", "/dashboard/studio-image-editor", ...(isStudioConversationPath(pathname)?[pathname]:[])].includes(pathname);
  // These editor routes need account authentication, not a Pro checkout.
  const isStudioEditor = isStudioConversationPath(pathname)||["/dashboard/studio-v2", "/dashboard/studio-elements", "/dashboard/studio-video-editor", "/dashboard/studio-image-editor"].includes(pathname);
  const signInOnly = pathname.startsWith("/dashboard") || isAssistantWorkspace || isStudioEditor;
  useEffect(() => {
    if (loading || user || pathname === "/join" || previewStudioShell) return;
    const returnTo = `${pathname}${window.location.search}`;
    if (signInOnly) { openAuth("login", { next: returnTo }); return; }
    router.replace(`/join?returnTo=${encodeURIComponent(returnTo)}`);
  }, [loading, user, pathname, router, openAuth, signInOnly, previewStudioShell]);
  if (previewStudioShell) return <>{children}</>;
  if (loading || !user) return <div className="crelavo-auth-gate">{signInOnly ? <>Sign in to continue to {isDashboardOverview ? "your dashboard" : isStudioEditor ? "Crelavo Studio or its editors" : "your account"}. Signing in does not start a paid production or checkout. {!loading ? <button type="button" onClick={() => openAuth("login", { next: `${pathname}${window.location.search}` })}>Sign in</button> : null}</> : <>Create a free Crelavo account to continue. No card required.</>}</div>;
  return <>{children}</>;
}
