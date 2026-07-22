"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00 gün 00 sa 00 dk";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${String(days).padStart(2, "0")} gün ${String(hours).padStart(2, "0")} sa ${String(minutes).padStart(2, "0")} dk`;
}

function initialEndTime(input: { endsAt?: string; durationDays?: number; storageKey: string }) {
  const fixedEndTime = input.endsAt ? new Date(input.endsAt).getTime() : NaN;
  if (Number.isFinite(fixedEndTime)) return fixedEndTime;

  const days = Math.min(Math.max(Math.floor(input.durationDays ?? 7) || 7, 1), 31);
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

export function CampaignPromoClient({ eyebrow, title, body, cta, href, endsAt, durationDays = 7, storageKey = "crelavo-business-12000-countdown", countdownLabel = "Kalan süre" }: CampaignPromoProps) {
  const resolvedStorageKey = `${storageKey}-${href}`;
  const [endTime] = useState(() => initialEndTime({ endsAt, durationDays, storageKey: resolvedStorageKey }));
  const [remaining, setRemaining] = useState(() => formatRemaining(endTime - Date.now()));

  useEffect(() => {
    const updateRemaining = () => setRemaining(formatRemaining(endTime - Date.now()));
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
        <span className="campaign-promo-price">$79</span>
      </div>
      <div className="campaign-promo-main">
        <span className="campaign-promo-kicker">Fırsatı kaçırma — süre başladı</span>
        <h3>{title}</h3>
        <div className="campaign-promo-bonus-row" aria-label="Campaign bonus details">
          <span>+3.000 bonus</span>
          <span>Normalde 9.000</span>
        </div>
        <p>{body}</p>
      </div>
      <div className="campaign-promo-countdown"><span>{countdownLabel}</span><strong>{remaining}</strong></div>
      <Link className="btn campaign-promo-cta" href={href}>{cta}</Link>
    </aside>
  );
}
