import { packages, topUpPackages } from "@/lib/data";

export type BillingMode = "monthly" | "yearly" | "one_time";

export type CreditBucketRow = {
  balance?: number | null;
  reserved?: number | null;
  current_subscription_credits?: number | null;
  rolled_over_credits?: number | null;
  topup_credits?: number | null;
  bonus_credits?: number | null;
  rollover_cap?: number | null;
  subscription_status?: string | null;
  billing_cycle_ends_at?: string | null;
  active_subscription_package?: string | null;
  active_subscription_billing?: string | null;
};

type RolloverProduct = {
  id: string;
  name: string;
  credits: number;
  yearlyCredits?: number;
  planType?: string;
};

const ROLLOVER_MULTIPLIER = 3;
const TOPUP_VALIDITY_DAYS = 365;

function positive(value: unknown) {
  return Math.max(0, Number(value ?? 0) || 0);
}

function isoAfterDays(days: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function isoAfterMonths(months: number, now = new Date()) {
  const date = new Date(now);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

export function creditsForBilling(product: RolloverProduct, billing: BillingMode) {
  if (product.planType !== "subscription") return product.credits;
  if (billing === "yearly" && typeof product.yearlyCredits === "number") return product.yearlyCredits;
  return billing === "yearly" ? product.credits * 12 : product.credits;
}

export function rolloverCapForProduct(product: RolloverProduct, billing: BillingMode) {
  if (product.planType !== "subscription") return 0;
  if (billing === "yearly") return creditsForBilling(product, billing);
  return product.credits * ROLLOVER_MULTIPLIER;
}

export function rolloverPolicyText(product: RolloverProduct, billing: BillingMode) {
  if (product.planType === "topup") return `Top-up credits remain available for ${TOPUP_VALIDITY_DAYS} days from purchase and are not removed when a subscription is cancelled.`;
  if (product.planType !== "subscription") return "No production credit rollover applies to this service plan.";
  if (billing === "yearly") return `${creditsForBilling(product, billing).toLocaleString()} annual credits stay available during the active 12-month subscription period.`;
  return `Unused monthly credits roll over while the subscription remains active, up to ${rolloverCapForProduct(product, billing).toLocaleString()} total rollover-protected subscription credits.`;
}

export function creditRolloverSummaryRows() {
  return packages.map((plan) => ({
    packageId: plan.id,
    packageName: plan.name,
    monthlyCredits: plan.credits,
    monthlyCap: rolloverCapForProduct(plan, "monthly"),
    yearlyCredits: creditsForBilling(plan, "yearly"),
    monthlyText: rolloverPolicyText(plan, "monthly"),
    yearlyText: rolloverPolicyText(plan, "yearly")
  }));
}

export function topupRolloverSummaryRows() {
  return topUpPackages.map((plan) => ({
    packageId: plan.id,
    packageName: plan.name,
    credits: plan.credits,
    validityDays: TOPUP_VALIDITY_DAYS,
    text: rolloverPolicyText(plan, "one_time")
  }));
}

export function applyCreditPurchaseToBuckets(input: {
  row?: CreditBucketRow | null;
  product: RolloverProduct;
  billing: BillingMode;
  credits: number;
  now?: Date;
}) {
  const row = input.row ?? {};
  const now = input.now ?? new Date();
  const currentBalance = positive(row.balance);
  const currentReserved = positive(row.reserved);
  const currentSubscription = positive(row.current_subscription_credits);
  const rolledOver = positive(row.rolled_over_credits);
  const topup = positive(row.topup_credits);
  const bonus = positive(row.bonus_credits);
  const credits = positive(input.credits);

  if (input.product.planType === "topup") {
    return {
      balance: currentBalance + credits,
      reserved: currentReserved,
      current_subscription_credits: currentSubscription,
      rolled_over_credits: rolledOver,
      topup_credits: topup + credits,
      bonus_credits: bonus,
      rollover_cap: positive(row.rollover_cap),
      topup_expires_at: isoAfterDays(TOPUP_VALIDITY_DAYS, now),
      updated_at: now.toISOString()
    };
  }

  if (input.product.planType !== "subscription") {
    return {
      balance: currentBalance + credits,
      reserved: currentReserved,
      current_subscription_credits: currentSubscription,
      rolled_over_credits: rolledOver,
      topup_credits: topup,
      bonus_credits: bonus,
      rollover_cap: positive(row.rollover_cap),
      updated_at: now.toISOString()
    };
  }

  const cap = rolloverCapForProduct(input.product, input.billing);

  if (input.billing === "yearly") {
    const nextBalance = credits + topup + bonus;
    return {
      balance: nextBalance,
      reserved: currentReserved,
      current_subscription_credits: credits,
      rolled_over_credits: 0,
      topup_credits: topup,
      bonus_credits: bonus,
      rollover_cap: cap,
      subscription_status: "active",
      billing_cycle_ends_at: isoAfterMonths(12, now),
      active_subscription_package: input.product.id,
      active_subscription_billing: input.billing,
      last_rollover_at: now.toISOString(),
      updated_at: now.toISOString()
    };
  }

  const usableCurrentSubscription = Math.min(currentSubscription || Math.max(0, currentBalance - rolledOver - topup - bonus), Math.max(0, currentBalance - currentReserved));
  const nextRolledOver = Math.min(cap, rolledOver + usableCurrentSubscription);
  const nextCurrentSubscription = credits;
  const nextBalance = nextRolledOver + nextCurrentSubscription + topup + bonus;

  return {
    balance: nextBalance,
    reserved: currentReserved,
    current_subscription_credits: nextCurrentSubscription,
    rolled_over_credits: nextRolledOver,
    topup_credits: topup,
    bonus_credits: bonus,
    rollover_cap: cap,
    subscription_status: "active",
    billing_cycle_ends_at: isoAfterMonths(1, now),
    active_subscription_package: input.product.id,
    active_subscription_billing: input.billing,
    last_rollover_at: now.toISOString(),
    updated_at: now.toISOString()
  };
}

export function clearSubscriptionCreditBuckets(input: { row?: CreditBucketRow | null; now?: Date }) {
  const row = input.row ?? {};
  const now = input.now ?? new Date();
  const topup = positive(row.topup_credits);
  const bonus = positive(row.bonus_credits);
  return {
    balance: topup + bonus,
    reserved: Math.min(positive(row.reserved), topup + bonus),
    current_subscription_credits: 0,
    rolled_over_credits: 0,
    topup_credits: topup,
    bonus_credits: bonus,
    subscription_status: "cancelled",
    billing_cycle_ends_at: row.billing_cycle_ends_at ?? null,
    updated_at: now.toISOString()
  };
}

export function spendCreditBuckets(input: { row?: CreditBucketRow | null; amount: number; now?: Date }) {
  const row = input.row ?? {};
  const now = input.now ?? new Date();
  let remaining = positive(input.amount);
  let rolledOver = positive(row.rolled_over_credits);
  let currentSubscription = positive(row.current_subscription_credits);
  let bonus = positive(row.bonus_credits);
  let topup = positive(row.topup_credits);

  const spendFrom = (value: number) => {
    const spend = Math.min(value, remaining);
    remaining -= spend;
    return value - spend;
  };

  rolledOver = spendFrom(rolledOver);
  currentSubscription = spendFrom(currentSubscription);
  bonus = spendFrom(bonus);
  topup = spendFrom(topup);

  const nextBalance = Math.max(0, positive(row.balance) - positive(input.amount));

  return {
    balance: nextBalance,
    reserved: positive(row.reserved),
    current_subscription_credits: currentSubscription,
    rolled_over_credits: rolledOver,
    topup_credits: topup,
    bonus_credits: bonus,
    updated_at: now.toISOString()
  };
}
