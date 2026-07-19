"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { AdSlotConfig } from "@/lib/ad-config";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function SplashAdClient({ slot }: { slot: AdSlotConfig }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (slot.status !== "active" || !slot.code.trim()) return;

    if (window.matchMedia("(max-width: 768px)").matches) return;

    const storageKey = `clipora-splash-${todayKey()}`;
    const timer = window.setTimeout(() => {
      try {
        const currentCount = Number(window.localStorage.getItem(storageKey) ?? "0");
        if (currentCount >= 3) return;
        window.localStorage.setItem(storageKey, String(currentCount + 1));
      } catch {
        // If storage is blocked, still show the active splash slot instead of hiding it.
      }
      setVisible(true);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [slot]);

  useEffect(() => {
    if (!visible) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  if (!mounted || !visible) return null;

  const popup = (
    <aside className="splash-ad-backdrop" aria-label={slot.name} role="dialog" aria-modal="true">
      <div className="splash-ad-modal">
        <button className="splash-ad-close" type="button" onClick={() => setVisible(false)} aria-label="Close ad">x</button>
        <span className="ad-slot-label">Ad · {slot.size} · Daily limit 3 views</span>
        <div className="ad-slot-code" dangerouslySetInnerHTML={{ __html: slot.code }} />
      </div>
    </aside>
  );

  return createPortal(popup, document.body);
}
