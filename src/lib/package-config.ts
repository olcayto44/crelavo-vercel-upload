import { dronePurchasePackages, packages, specialPurchaseProducts, topUpPackages } from "./data.ts";
import { productionPackages, type ProductionPackage } from "./production.ts";

export type CreditPackageConfig = {
  id: string;
  name: string;
  billing: string;
  price: string;
  priceUsd: number;
  setupFeeUsd?: number;
  credits: number;
  planType: "subscription" | "topup" | string;
  serviceCategory?: string;
  description: string;
  renderQueue?: string;
  monthlyStripePriceEnv?: string;
  yearlyStripePriceEnv?: string;
  stripePriceEnv?: string;
  monthlyPaymentLinkUrl?: string;
  yearlyPaymentLinkUrl?: string;
  paymentLinkUrl?: string;
  usage?: string[];
};

export type PackageConfig = {
  creditPackages: CreditPackageConfig[];
  productionPackages: ProductionPackage[];
  updatedAt?: string;
};

export const PACKAGE_CONFIG_KEY = "package_config";

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

function normalizeCreditPackage(item: unknown): CreditPackageConfig | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const name = String(record.name ?? "").trim();
  if (!id || !name) return null;
  const planType = String(record.planType ?? "subscription");
  const isTopup = planType === "topup";
  return {
    id,
    name,
    billing: String(record.billing ?? (isTopup ? "One-time top-up" : "Monthly")),
    price: String(record.price ?? "$0"),
    priceUsd: Math.max(0, Number(record.priceUsd ?? 0) || 0),
    setupFeeUsd: Math.max(0, Number(record.setupFeeUsd ?? 0) || 0),
    credits: Math.max(0, Math.round(Number(record.credits ?? 0) || 0)),
    planType,
    serviceCategory: record.serviceCategory ? String(record.serviceCategory) : undefined,
    description: String(record.description ?? ""),
    renderQueue: String(record.renderQueue ?? (isTopup ? "Standard render queue" : "Priority render queue")),
    monthlyStripePriceEnv: record.monthlyStripePriceEnv ? String(record.monthlyStripePriceEnv) : undefined,
    yearlyStripePriceEnv: record.yearlyStripePriceEnv ? String(record.yearlyStripePriceEnv) : undefined,
    stripePriceEnv: record.stripePriceEnv ? String(record.stripePriceEnv) : undefined,
    monthlyPaymentLinkUrl: record.monthlyPaymentLinkUrl ? String(record.monthlyPaymentLinkUrl) : undefined,
    yearlyPaymentLinkUrl: record.yearlyPaymentLinkUrl ? String(record.yearlyPaymentLinkUrl) : undefined,
    paymentLinkUrl: record.paymentLinkUrl ? String(record.paymentLinkUrl) : undefined,
    usage: asStringArray(record.usage)
  };
}

function normalizeProductionPackage(item: unknown): ProductionPackage | null {
  if (!item || typeof item !== "object") return null;
  const record = item as Record<string, unknown>;
  const id = String(record.id ?? "").trim();
  const productionType = String(record.productionType ?? "").trim();
  const name = String(record.name ?? "").trim();
  if (!id || !productionType || !name) return null;
  return {
    id,
    productionType: productionType as ProductionPackage["productionType"],
    name,
    credits: Math.max(0, Math.round(Number(record.credits ?? 0) || 0)),
    description: String(record.description ?? ""),
    deliverables: asStringArray(record.deliverables)
  };
}

export function defaultPackageConfig(): PackageConfig {
  return {
    creditPackages: [...packages, ...topUpPackages, ...dronePurchasePackages, ...specialPurchaseProducts].map((item) => normalizeCreditPackage(item)).filter(Boolean) as CreditPackageConfig[],
    productionPackages: productionPackages.map((item) => normalizeProductionPackage(item)).filter(Boolean) as ProductionPackage[]
  };
}

export function normalizePackageConfig(value: unknown): PackageConfig {
  const defaults = defaultPackageConfig();
  if (!value || typeof value !== "object") return defaults;
  const record = value as Record<string, unknown>;
  const creditPackages = Array.isArray(record.creditPackages) ? record.creditPackages.map(normalizeCreditPackage).filter(Boolean) as CreditPackageConfig[] : defaults.creditPackages;
  const configuredProductionPackages = Array.isArray(record.productionPackages) ? record.productionPackages.map(normalizeProductionPackage).filter(Boolean) as ProductionPackage[] : defaults.productionPackages;
  return {
    creditPackages: creditPackages.length ? creditPackages : defaults.creditPackages,
    productionPackages: configuredProductionPackages.length ? configuredProductionPackages : defaults.productionPackages,
    updatedAt: record.updatedAt ? String(record.updatedAt) : undefined
  };
}

export function findConfiguredCreditProduct(config: PackageConfig, productIdOrName: string) {
  const normalized = productIdOrName.trim().toLowerCase();
  return config.creditPackages.find((item) => item.id.toLowerCase() === normalized || item.name.toLowerCase() === normalized);
}

export function stripePriceEnvForConfiguredCreditProduct(product: CreditPackageConfig, billing: "monthly" | "yearly" | "one_time") {
  if (product.planType === "topup" || product.planType === "production_one_time") return product.stripePriceEnv ?? "";
  return billing === "yearly" ? product.yearlyStripePriceEnv ?? "" : product.monthlyStripePriceEnv ?? "";
}

export function paymentLinkForConfiguredCreditProduct(product: CreditPackageConfig, billing: "monthly" | "yearly" | "one_time") {
  if (product.planType === "topup" || product.planType === "production_one_time") return product.paymentLinkUrl ?? "";
  return billing === "yearly" ? product.yearlyPaymentLinkUrl ?? "" : product.monthlyPaymentLinkUrl ?? "";
}

export function findConfiguredProductionPackage(config: PackageConfig, packageId: string) {
  return config.productionPackages.find((item) => item.id === packageId);
}
