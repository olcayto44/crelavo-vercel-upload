"use client";

import { useEffect } from "react";
import { requireVerifiedBrowserUser } from "@/lib/auth-guards";

declare global {
  interface Window {
    __clUserId?: string;
    __clAccessToken?: string;
    __clAuthError?: string;
  }
}

export function AssistantWorkspaceAuthBridge() {
  useEffect(() => {
    let active = true;
    requireVerifiedBrowserUser().then((auth) => {
      if (!active) return;
      if (!auth.ok) {
        window.__clAuthError = auth.message;
        window.dispatchEvent(new CustomEvent("cl-auth-ready"));
        return;
      }
      window.__clUserId = auth.user.id;
      window.__clAccessToken = auth.accessToken;
      window.__clAuthError = "";
      window.dispatchEvent(new CustomEvent("cl-auth-ready"));
    }).catch(() => {
      if (!active) return;
      window.__clAuthError = "Your session could not be verified.";
      window.dispatchEvent(new CustomEvent("cl-auth-ready"));
    });
    return () => { active = false; };
  }, []);

  return null;
}
