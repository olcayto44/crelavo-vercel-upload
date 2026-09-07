"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CampaignPromoClient } from "@/components/CampaignPromoClient";
import type { AdSlotConfig } from "@/lib/ad-config";

export function SplashAdClient({ slot }: { slot: AdSlotConfig }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (slot.status !== "active" || !slot.code.trim()) return;

    let triggered = false;
    const showSplash = () => {
      if (triggered) return;
      triggered = true;
      setVisible(true);
    };

    const handleScroll = () => {
      if (window.scrollY >= 180) showSplash();
    };

    const timer = window.setTimeout(showSplash, 15000);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
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
    <aside className="splash-ad-backdrop" aria-label="Crelavo Pro 24-hour free trial" role="dialog" aria-modal="true">
      <div className="splash-ad-modal">
        <button className="splash-ad-close" type="button" onClick={() => setVisible(false)} aria-label="Close ad">×</button>
        <CampaignPromoClient />
      </div>
    </aside>
  );

  return createPortal(popup, document.body);
}
