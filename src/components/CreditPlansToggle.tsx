"use client";

import Link from "next/link";
import { useState } from "react";
import { CreditCard } from "lucide-react";
import { whopPreviewNotice } from "@/lib/whop-preview-policy";

type CreditPlan = {
  name: string;
  billing: string;
  price: string;
  priceUsd?: number;
  credits: number;
  yearlyCredits?: number;
  description: string;
  estimatedOutput?: string;
  yearlyEstimatedOutput?: string;
  yearlyDealLabel?: string;
  videoSpec?: string;
  mediaIncluded?: string;
  modelAccess?: string[];
  automationAccess?: string[];
  concurrentTasks?: number;
  relaxMode?: string;
  teamFeatures?: string[];
  usage?: string[];
  id?: string;
  planType?: string;
  setupFeeUsd?: number;
};

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US")}`;
}

function planPrice(plan: CreditPlan, billingMode: "monthly" | "yearly") {
  if (!plan.priceUsd) return plan.price;
  const suffix = plan.name === "Team" ? "/seat" : "";
  return billingMode === "monthly" ? `$${plan.priceUsd}${suffix}/mo` : `${formatUsd(plan.priceUsd * 10)}${suffix}/yr`;
}

function planCredits(plan: CreditPlan, billingMode: "monthly" | "yearly") {
  return billingMode === "monthly" ? plan.credits : plan.yearlyCredits ?? plan.credits * 12;
}

export function CreditPlansToggle({ plans, ctaLabel = "Choose package" }: { plans: CreditPlan[]; ctaLabel?: string }) {
  const [billingMode, setBillingMode] = useState<"monthly" | "yearly">("monthly");
  const isTopUpList = plans.every((plan) => plan.planType === "topup");

  return (
    <section className="credit-plan-section">
      <div className="credit-plan-head">
        <div>
          <span className="badge"><CreditCard size={14} /> {isTopUpList ? "One-time credit purchases" : "Recurring credit subscriptions"}</span>
          <h2>{isTopUpList ? "Buy extra credits whenever you need them" : "Choose a monthly or yearly credit subscription"}</h2>
          <p className="section-lead">{isTopUpList ? "Extra credit packages are one-time purchases, do not renew automatically, and can be bought repeatedly." : "Start with a paid 24-hour preview. Monthly renews every subscription cycle; yearly gives 12 months of access for the price of 10 months."}</p>
        </div>
        {!isTopUpList ? (
          <div>
            <div className="billing-toggle" aria-label="Billing period selection">
              <button className={billingMode === "monthly" ? "active" : ""} type="button" onClick={() => setBillingMode("monthly")}>Monthly</button>
              <button className={billingMode === "yearly" ? "active" : ""} type="button" onClick={() => setBillingMode("yearly")}>Yearly</button>
              <span className={`billing-toggle-thumb ${billingMode}`} />
            </div>
            <small style={{ color: "var(--accent)", display: "block", marginTop: 8, textAlign: "right" }}>Save 20% — 2 months free on yearly plans</small>
          </div>
        ) : null}
      </div>

      <div className="grid credit-plan-grid" style={{ marginTop: 14 }}>
        {plans.map((plan) => {
          const effectiveBilling = plan.planType === "topup" ? "one_time" : billingMode;
          const credits = plan.planType === "topup" ? plan.credits : planCredits(plan, billingMode);
          const price = plan.planType === "topup" ? plan.price : planPrice(plan, billingMode);
          const productId = plan.id ?? plan.name;
          const isRecommended = plan.priceUsd === 79 || plan.name.toLowerCase() === "business";
          const normalizedPlanName = plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const planTone = plan.planType === "topup" ? `topup-${normalizedPlanName}` : isRecommended ? "recommended" : normalizedPlanName;
          const previewNotice = whopPreviewNotice(plan, effectiveBilling);
          const yearlyDealLabel = billingMode === "yearly" && plan.yearlyDealLabel ? plan.yearlyDealLabel : "";
          const estimatedOutput = billingMode === "yearly" && plan.yearlyEstimatedOutput ? plan.yearlyEstimatedOutput : plan.estimatedOutput;
          return (
            <Link className={`card clickable-credit-card credit-sale-card credit-plan-tone-${planTone}${isRecommended ? " recommended-credit-plan" : ""}`} href={`/dashboard/payment?package=${encodeURIComponent(productId)}&billing=${effectiveBilling}`} key={plan.name}>
              <span className="badge">{isRecommended ? "Recommended credit plan" : plan.planType === "topup" ? "One-time credit purchase" : billingMode === "monthly" ? "24-hour preview + monthly" : "24-hour preview + yearly - 2 months free"}</span>
              <h3>{plan.name}</h3>
              <strong>{price}</strong>
              <p className="plan-credit-line"><b>{credits.toLocaleString()} credits</b> are added to the account.</p>
              {previewNotice ? <p className="plan-savings-line">{previewNotice}</p> : null}
              {yearlyDealLabel ? <p className="plan-savings-line flash-deal-line">{yearlyDealLabel}</p> : null}
              {plan.planType !== "topup" && billingMode === "yearly" && plan.priceUsd ? <p className="plan-savings-line">Normally {formatUsd(plan.priceUsd * 12)}/yr, now {formatUsd(plan.priceUsd * 10)}/yr. 2 months free.</p> : null}
              <div className="plan-value-stack compact">
                {estimatedOutput ? <div><span>Estimated output</span><b>{estimatedOutput}</b></div> : null}
                {plan.videoSpec ? <div><span>Video quality/duration</span><b>{plan.videoSpec}</b></div> : null}
                {plan.mediaIncluded ? <div><span>Material + audio</span><b>{plan.mediaIncluded}</b></div> : null}
                {typeof plan.concurrentTasks === "number" ? <div><span>Concurrent task</span><b>{plan.concurrentTasks} simultaneous jobs</b></div> : null}
              </div>
              <p>{plan.description}</p>
              <div className="plan-feature-groups">
                {plan.modelAccess?.length ? <div><b>Model access</b>{plan.modelAccess.map((item) => <small key={item}>{item}</small>)}</div> : null}
                {plan.automationAccess?.length ? <div><b>Automation</b>{plan.automationAccess.map((item) => <small key={item}>{item}</small>)}</div> : null}
                {plan.relaxMode ? <div><b>Relax mode</b><small>{plan.relaxMode}</small></div> : null}
                {plan.teamFeatures?.length ? <div><b>Team / workspace</b>{plan.teamFeatures.map((item) => <small key={item}>{item}</small>)}</div> : null}
              </div>
              <div className="workspace-action-note" style={{ marginTop: 12 }}>
                <small>Secure checkout processed by the active payment provider.</small>
                <small>Dashboard access and credit activation after payment confirmation.</small>
                <small>Cancel anytime from your billing profile.</small>
              </div>
              <span className="btn">{ctaLabel}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
