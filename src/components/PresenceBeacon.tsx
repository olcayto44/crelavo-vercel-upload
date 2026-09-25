"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";

function guestId() {
  const key = "crelavo_presence_guest";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    window.localStorage.setItem(key, next);
    return next;
  } catch {
    return "guest";
  }
}

export function PresenceBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    let active = true;
    const send = async () => {
      if (!active) return;
      const { data } = await supabaseBrowser().auth.getSession();
      const token = data.session?.access_token;
      await fetch("/api/presence", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ path: pathname || "/", guestId: guestId(), device: window.innerWidth < 768 ? "mobile" : "desktop" }),
        keepalive: true,
      }).catch(() => undefined);
    };
    void send();
    const timer = window.setInterval(() => void send(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [pathname]);
  return null;
}
