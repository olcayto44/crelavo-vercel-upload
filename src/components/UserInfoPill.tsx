"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";

type UserInfo = {
  email: string;
  name: string;
};

function compactDisplayName(name: string, email: string) {
  const clean = name.trim() || email.split("@")[0] || "User";
  const parts = clean.split(/\s+/).filter(Boolean);
  const display = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0];
  return display.length > 18 ? `${display.slice(0, 17)}...` : display;
}

export function UserInfoPill() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

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
    await supabaseBrowser().auth.signOut();
    window.location.href = "/";
  }

  if (!loaded) return null;

  if (!userInfo) {
    return (
      <div className="auth-action-pills">
        <Link className="btn secondary auth-mini-btn" href="/auth/login">Sign in</Link>
        <Link className="btn auth-mini-btn" href="/auth/register">Create account</Link>
      </div>
    );
  }

  const displayName = compactDisplayName(userInfo.name, userInfo.email);

  return (
    <div className="auth-action-pills signed-in-actions">
      <span className="user-info-pill" title={`${userInfo.name} • ${userInfo.email}`}>{displayName}</span>
      <button className="btn secondary auth-mini-btn" type="button" onClick={signOut}>Sign out</button>
    </div>
  );
}
