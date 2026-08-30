"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CampaignPromoClient } from "@/components/CampaignPromoClient";
import type { AdSlotConfig } from "@/lib/ad-config";
import type { GeoOfferCopy } from "@/lib/geo-offers";

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
  expiredLabel?: string;
  expiredBody?: string;
};

function parseSplashPromo(code: string, geoOffer?: GeoOfferCopy) {
  try {
    const value = JSON.parse(code) as SplashPromoPayload;
    return {
      eyebrow: geoOffer?.eyebrow || String(value.eyebrow || "LIMITED TIME ONLY: VIP AGENCY BUNDLE"),
      title: geoOffer?.title || String(value.title || "Scale your e-commerce video production to the moon"),
      body: geoOffer?.body || String(value.body || "Normally $1,560/yr, now $1,300/yr. Get 2 months FREE + 30,000 BONUS credits instantly added: 174,000 total annual credits for 300+ AI ad concepts, premium Shopify/Amazon video variations, bulk social campaigns or client-ready deliveries. Start with a secure $20 Whop 24-hour preview and cancel in Whop before the main plan starts if it is not the right fit."),
      cta: geoOffer?.cta || String(value.cta || "START 24-HOUR TEAM PREVIEW FOR $20"),
      href: geoOffer?.href || String(value.href || "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000"),
      endsAt: value.endsAt ? String(value.endsAt) : undefined,
      durationDays: Number(value.durationDays ?? 7),
      storageKey: String(value.storageKey || "crelavo-team-annual-174000-countdown"),
      countdownLabel: String(value.countdownLabel || "VIP deal ends in"),
      priceBadge: String(value.priceBadge || "$1,300/yr"),
      kicker: geoOffer?.kicker || String(value.kicker || "Normally $1,560/yr → now $1,300/yr + 30,000 BONUS credits"),
      bonusPrimary: geoOffer?.bonusPrimary || String(value.bonusPrimary || "174,000 annual credits"),
      bonusSecondary: geoOffer?.bonusSecondary || String(value.bonusSecondary || "$20 secure Whop preview"),
      expiredLabel: String(value.expiredLabel || "Preview available"),
      expiredBody: String(value.expiredBody || "Secure Whop preview is still open while this campaign is active."),
      geoSegment: geoOffer?.bannerSegmentLabel || "Global default",
      safeOfferNote: geoOffer?.safeOfferNote
    };
  } catch {
    return null;
  }
}

export function SplashAdClient({ slot, geoOffer }: { slot: AdSlotConfig; geoOffer?: GeoOfferCopy }) {
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

  // The splash slot owns its campaign copy. Geo offers may personalize other placements,
  // but must not replace the selected splash campaign with a different campaign.
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
