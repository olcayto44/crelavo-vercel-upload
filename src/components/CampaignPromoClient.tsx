"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type CampaignPromoProps = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  endsAt: string;
};

function formatRemaining(ms: number) {
  if (ms <= 0) return "00d 00h 00m";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${String(days).padStart(2, "0")}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m`;
}

export function CampaignPromoClient({ eyebrow, title, body, cta, href, endsAt }: CampaignPromoProps) {
  const endTime = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [remaining, setRemaining] = useState(() => formatRemaining(endTime - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(formatRemaining(endTime - Date.now())), 30000);
    return () => window.clearInterval(timer);
  }, [endTime]);

  return (
    <aside className="campaign-promo-card" aria-label="Launch offer promotion">
      <span className="campaign-promo-pulse">{eyebrow}</span>
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="campaign-promo-countdown"><span>Ends in</span><strong>{remaining}</strong></div>
      <Link className="btn" href={href}>{cta}</Link>
    </aside>
  );
}
