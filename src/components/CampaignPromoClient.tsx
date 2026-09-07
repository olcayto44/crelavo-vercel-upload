"use client";

import Link from "next/link";

type CampaignPromoProps = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  priceBadge?: string;
  kicker?: string;
  bonusPrimary?: string;
  bonusSecondary?: string;
};

export function CampaignPromoClient({
  eyebrow = "24-HOUR FREE TRIAL",
  title = "Try Crelavo Pro free",
  body = "Start Crelavo Pro for $0 today. You get 24 hours free. If you keep it, you pay $9.99 every 30 days. Cancel in Whop before the trial ends and you pay nothing.",
  cta = "Start free 24-hour trial",
  href = "https://whop.com/checkout/plan_ujLQgM3kEg0dg",
  priceBadge = "$0 TODAY",
  kicker = "PRO · THEN $9.99/MONTH",
  bonusPrimary = "1 trial production",
  bonusSecondary = "2,500 credits/month after trial"
}: CampaignPromoProps) {
  return (
    <aside className="campaign-promo-card" aria-label="Crelavo Pro 24-hour free trial">
      <div className="campaign-promo-orb one" aria-hidden="true" />
      <div className="campaign-promo-orb two" aria-hidden="true" />
      <div className="campaign-promo-topline">
        <span className="campaign-promo-pulse">{eyebrow}</span>
        <span className="campaign-promo-price">{priceBadge}</span>
      </div>
      <div className="campaign-promo-main">
        <span className="campaign-promo-kicker">{kicker}</span>
        <h3>{title}</h3>
        <div className="campaign-promo-bonus-row" aria-label="Trial details">
          <span>{bonusPrimary}</span>
          <span>{bonusSecondary}</span>
        </div>
        <p>{body}</p>
        <small>Card required. No charge until the 24-hour trial ends.</small>
      </div>
      <Link className="btn campaign-promo-cta" href={href}>{cta}</Link>
      <Link className="campaign-promo-secondary-link" href="https://whop.com/checkout/plan_fiabRYr6uWY43">
        Or save with annual: $0 today, then $99 / year
      </Link>
    </aside>
  );
}
