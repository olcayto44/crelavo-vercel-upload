"use client";

import { useEffect, useState } from "react";
import { clearAssistantWorkspaceSession } from "@/lib/assistant-session-client";
import { supabaseBrowser } from "@/lib/supabase";
import { HeaderAuthModal } from "@/components/HeaderAuthModal";

type UserInfo = { email: string; name: string };

function compactDisplayName(name: string, email: string) {
  const clean = (name.trim() || email.split("@")[0] || "User").split(/\s+/).filter(Boolean);
  const display = clean.length > 1 ? `${clean[0]} ${clean[1][0]}.` : clean[0] ?? "User";
  return display.length > 18 ? `${display.slice(0, 17)}...` : display;
}

export function UserInfoPill() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  useEffect(() => {
    const authMode = new URLSearchParams(window.location.search).get("auth");
    if (authMode === "login" || authMode === "register") {
      setMode(authMode);
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        const email = data.user.email ?? "User";
        const name = String(data.user.user_metadata?.full_name ?? email.split("@")[0] ?? "User");
        setUserInfo({ email, name });
      }
      setLoaded(true);
    });
    return () => { active = false; };
  }, []);

  async function signOut() {
    clearAssistantWorkspaceSession();
    await supabaseBrowser().auth.signOut();
    window.location.href = "/";
  }

  if (!loaded) return null;

  if (!userInfo) {
    return (
      <>
        <div className="auth-action-pills">
          <button className="btn secondary auth-mini-btn" type="button" onClick={() => { setMode("login"); setOpen(true); }}>Sign in</button>
          <button className="btn auth-mini-btn" type="button" onClick={() => { setMode("register"); setOpen(true); }}>Create account</button>
        </div>
        <HeaderAuthModal open={open} initialMode={mode} onClose={() => setOpen(false)} onSwitch={setMode} />
      </>
    );
  }

  const displayName = compactDisplayName(userInfo.name, userInfo.email);

  return (
    <>
      <div className="auth-action-pills signed-in-actions">
        <span className="user-info-pill" title={`${userInfo.name} • ${userInfo.email}`}>{displayName}</span>
        <button className="btn secondary auth-mini-btn" type="button" onClick={signOut}>Sign out</button>
      </div>
      <HeaderAuthModal open={open} initialMode={mode} onClose={() => setOpen(false)} onSwitch={setMode} />
    </>
  );
}
