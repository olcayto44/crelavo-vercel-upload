export const whopPreviewPolicy = {
  hours: 24,
  previewVideoSeconds: 10,
  downloadAccess: "closed",
  downloadAccessLabel: "Downloads closed during preview",
  watermarkRequired: true,
  setupFeeRefundable: false,
  cancellationRule: "If the customer cancels within 24 hours, the main subscription will not start, but the setup fee remains non-refundable.",
  activationRule: "If the customer does not cancel within 24 hours, Whop automatically charges the selected monthly or yearly plan.",
  renewalRule: "After the main plan starts, monthly plans renew every subscription cycle until cancelled; yearly plans renew yearly until cancelled.",
  yearlyBenefit: "Yearly plans charge 10 months for 12 months of access, shown as 2 months free."
} as const;

type PreviewProductLike = {
  planType?: string;
  setupFeeUsd?: number;
  priceUsd?: number;
};

export function hasWhopPreview(product: PreviewProductLike | null | undefined) {
  return product?.planType === "subscription" || product?.planType === "service_subscription";
}

export function whopPreviewSetupFee(product: PreviewProductLike | null | undefined) {
  return hasWhopPreview(product) ? Number(product?.setupFeeUsd ?? 0) : 0;
}

export function whopMainChargeUsd(product: PreviewProductLike | null | undefined, billing: string) {
  if (!hasWhopPreview(product) || typeof product?.priceUsd !== "number") return 0;
  return billing === "yearly" ? product.priceUsd * 10 : product.priceUsd;
}

export function whopPreviewSummary(product: PreviewProductLike | null | undefined, billing: string) {
  const setupFeeUsd = whopPreviewSetupFee(product);
  const mainChargeUsd = whopMainChargeUsd(product, billing);
  const interval = billing === "yearly" ? "yearly" : "monthly";
  return {
    enabled: hasWhopPreview(product),
    setupFeeUsd,
    mainChargeUsd,
    previewHours: whopPreviewPolicy.hours,
    previewVideoSeconds: whopPreviewPolicy.previewVideoSeconds,
    downloadAccess: whopPreviewPolicy.downloadAccess,
    watermarkRequired: whopPreviewPolicy.watermarkRequired,
    setupFeeRefundable: whopPreviewPolicy.setupFeeRefundable,
    billingInterval: interval,
    cancellationRule: whopPreviewPolicy.cancellationRule,
    activationRule: whopPreviewPolicy.activationRule,
    renewalRule: whopPreviewPolicy.renewalRule
  };
}

export function whopPreviewNotice(product: PreviewProductLike | null | undefined, billing: string) {
  const summary = whopPreviewSummary(product, billing);
  if (!summary.enabled) return "";
  const setup = summary.setupFeeUsd ? `$${summary.setupFeeUsd.toLocaleString("en-US")}` : "the setup fee";
  const main = summary.mainChargeUsd ? `$${summary.mainChargeUsd.toLocaleString("en-US")}` : "the selected plan amount";
  return `${setup} is charged today as a non-refundable 24-hour preview/setup fee. Downloads stay closed during preview. If not cancelled within 24 hours, Whop automatically charges ${main} for the selected ${summary.billingInterval} plan and renews it until cancelled.`;
}
