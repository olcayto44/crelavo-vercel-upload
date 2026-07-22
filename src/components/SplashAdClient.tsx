"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CampaignPromoClient } from "@/components/CampaignPromoClient";
import type { AdSlotConfig } from "@/lib/ad-config";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

type SplashPromoPayload = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
  href?: string;
  endsAt?: string;
  durationDays?: number;
  storageKey?: string;
  countdownLabel?: string;
};

function parseSplashPromo(code: string) {
  try {
    const value = JSON.parse(code) as SplashPromoPayload;
    return {
      eyebrow: String(value.eyebrow || "Limited-time launch offer"),
      title: String(value.title || "12,000 credits are live"),
      body: String(value.body || "Start your 24-hour preview for just $10. The Business plan now gives 12,000 credits instead of the usual 9,000."),
      cta: String(value.cta || "Start preview for $10"),
      href: String(value.href || "/dashboard/payment?package=business&billing=monthly&campaign=business-12000"),
      endsAt: value.endsAt ? String(value.endsAt) : undefined,
      durationDays: Number(value.durationDays ?? 7),
      storageKey: String(value.storageKey || "crelavo-business-12000-countdown"),
      countdownLabel: String(value.countdownLabel || "Offer ends in")
    };
  } catch {
    return null;
  }
}

export function SplashAdClient({ slot }: { slot: AdSlotConfig }) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (slot.status !== "active" || !slot.code.trim()) return;

    const storageKey = `crelavo-splash-${todayKey()}`;
    let triggered = false;

    const showSplash = () => {
      if (triggered) return;
      triggered = true;
      try {
        const currentCount = Number(window.localStorage.getItem(storageKey) ?? "0");
        if (currentCount >= 3) return;
        window.localStorage.setItem(storageKey, String(currentCount + 1));
      } catch {
        // If storage is blocked, still show the active splash slot instead of hiding it.
      }
      setVisible(true);
    };

    const handleScroll = () => {
      if (window.scrollY >= 180) showSplash();
    };

    const timer = window.setTimeout(showSplash, 12000);
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

  const promo = parseSplashPromo(slot.code);
  const popup = (
    <aside className="splash-ad-backdrop" aria-label={slot.name} role="dialog" aria-modal="true">
      <div className="splash-ad-modal">
        <button className="splash-ad-close" type="button" onClick={() => setVisible(false)} aria-label="Close ad">×</button>
        <span className="ad-slot-label">Launch campaign · Daily limit 3 views</span>
        {promo ? <CampaignPromoClient {...promo} /> : <div className="ad-slot-code" dangerouslySetInnerHTML={{ __html: slot.code }} />}
      </div>
    </aside>
  );

  return createPortal(popup, document.body);
}
