"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { campaignDeadlineGuardrail, campaignModeForRemaining, safeCampaignDurationDays, sessionDeadlineStorageKey } from "@/lib/campaign-deadline";

type CampaignPromoProps = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
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
  geoSegment?: string;
  safeOfferNote?: string;
};

function formatRemaining(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalMinutes = Math.floor(safeMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

function initialEndTime(input: { endsAt?: string; durationDays?: number; storageKey: string }) {
  const fixedEndTime = input.endsAt ? new Date(input.endsAt).getTime() : NaN;
  if (Number.isFinite(fixedEndTime)) return fixedEndTime;

  const days = safeCampaignDurationDays(input.durationDays);
  const durationMs = days * 24 * 60 * 60 * 1000;
  if (typeof window === "undefined") return Date.now() + durationMs;

  try {
    const stored = Number(window.localStorage.getItem(input.storageKey) ?? "0");
    if (Number.isFinite(stored) && stored > Date.now()) return stored;
    const nextEndTime = Date.now() + durationMs;
    window.localStorage.setItem(input.storageKey, String(nextEndTime));
    return nextEndTime;
  } catch {
    return Date.now() + durationMs;
  }
}

export function CampaignPromoClient({ eyebrow, title, body, cta, href, endsAt, durationDays = 7, storageKey = "crelavo-business-12000-countdown", countdownLabel = "Offer ends in", priceBadge = "$79", kicker = "Don’t miss it — the timer is running", bonusPrimary = "+3,000 bonus", bonusSecondary = "Usually 9,000", expiredLabel = "Preview available", expiredBody = "Secure Whop preview is still open while this campaign is active.", geoSegment = "Global default", safeOfferNote = campaignDeadlineGuardrail }: CampaignPromoProps) {
  const resolvedStorageKey = sessionDeadlineStorageKey({ storageKey, href, segment: geoSegment, campaign: countdownLabel });
  const [endTime] = useState(() => initialEndTime({ endsAt, durationDays, storageKey: resolvedStorageKey }));
  const [now, setNow] = useState(() => Date.now());
  const remainingMs = endTime - now;
  const countdownExpired = remainingMs <= 0;
  const campaignMode = campaignModeForRemaining(remainingMs);
  const remaining = formatRemaining(remainingMs);

  useEffect(() => {
    const updateRemaining = () => setNow(Date.now());
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 30000);
    return () => window.clearInterval(timer);
  }, [endTime]);

  return (
    <aside className="campaign-promo-card" aria-label="Launch offer promotion">
      <div className="campaign-promo-orb one" aria-hidden="true" />
      <div className="campaign-promo-orb two" aria-hidden="true" />
      <div className="campaign-promo-topline">
        <span className="campaign-promo-pulse">{eyebrow}</span>
        <span className="campaign-promo-price">{priceBadge}</span>
      </div>
      <small className="campaign-promo-geo-note">{geoSegment} · {safeOfferNote}</small>
      <div className="campaign-promo-main">
        <span className="campaign-promo-kicker">{kicker}</span>
        <h3>{title}</h3>
        <div className="campaign-promo-bonus-row" aria-label="Campaign bonus details">
          <span>{bonusPrimary}</span>
          <span>{bonusSecondary}</span>
        </div>
        <p>{countdownExpired ? expiredBody : body}</p>
      </div>
      <div className="campaign-promo-countdown" data-campaign-mode={campaignMode}><span>{countdownExpired ? expiredLabel : countdownLabel}</span><strong>{countdownExpired ? "Still open" : remaining}</strong></div>
      <Link className="btn campaign-promo-cta" href={href}>{cta}</Link>
    </aside>
  );
}
