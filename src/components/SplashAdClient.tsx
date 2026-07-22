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
  priceBadge?: string;
  kicker?: string;
  bonusPrimary?: string;
  bonusSecondary?: string;
};

function parseSplashPromo(code: string) {
  try {
    const value = JSON.parse(code) as SplashPromoPayload;
    return {
      eyebrow: String(value.eyebrow || "LIMITED TIME ONLY: VIP AGENCY BUNDLE"),
      title: String(value.title || "Scale your e-commerce video production to the moon"),
      body: String(value.body || "Stop wasting thousands on video editors or slow rendering tools. Generate around 300 AI product video drafts and variations for Shopify & Amazon, run 12 simultaneous tasks, and manage your whole team in one workspace."),
      cta: String(value.cta || "START 24-HOUR TEAM PREVIEW FOR $20"),
      href: String(value.href || "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000"),
      endsAt: value.endsAt ? String(value.endsAt) : undefined,
      durationDays: Number(value.durationDays ?? 7),
      storageKey: String(value.storageKey || "crelavo-team-annual-174000-countdown"),
      countdownLabel: String(value.countdownLabel || "VIP deal ends in"),
      priceBadge: String(value.priceBadge || "$1,300/yr"),
      kicker: String(value.kicker || "Pay less, get 30,000 BONUS credits"),
      bonusPrimary: String(value.bonusPrimary || "174,000 credits today"),
      bonusSecondary: String(value.bonusSecondary || "Regular: 144,000")
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
