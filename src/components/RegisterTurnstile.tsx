"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}

export function RegisterTurnstile({
  enabled,
  onToken,
}: {
  enabled: boolean;
  onToken: (token: string) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [scriptReady, setScriptReady] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  onTokenRef.current = onToken;

  useEffect(() => {
    if (!enabled || !scriptReady || !siteKey || !box.current || !window.turnstile) return;

    widgetId.current = window.turnstile.render(box.current, {
      sitekey: siteKey,
      theme: "dark",
      appearance: "interaction-only",
      action: "register",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(""),
      "error-callback": () => onTokenRef.current(""),
    });

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
      onTokenRef.current("");
    };
  }, [enabled, scriptReady, siteKey]);

  if (!enabled) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />
      <div ref={box} className="mt-3" />
    </>
  );
}

export async function assertRegisterHuman(token: string) {
  if (!token) {
    throw new Error("Could not verify you are human. Try again.");
  }
  const res = await fetch("/api/turnstile/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error("Could not verify you are human. Try again.");
  }
}
