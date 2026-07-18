import Stripe from "stripe";
import { allPaymentProducts } from "./data.ts";
import { normalizePackageConfig, PACKAGE_CONFIG_KEY, stripePriceEnvForConfiguredCreditProduct, type CreditPackageConfig } from "./package-config.ts";
import { supabaseAdmin } from "./supabase.ts";

type BillingMode = "monthly" | "yearly" | "one_time";

type ResolvedStripePackage = {
  productId: string;
  productName: string;
  planType: string;
  billing: BillingMode;
  credits: number;
  priceEnv: string;
  priceId: string;
};

type ActivationInput = {
  eventId: string;
  eventType: string;
  sessionId?: string | null;
  invoiceId?: string | null;
  subscriptionId?: string | null;
  paymentIntentId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  amountTotal?: number | null;
  currency?: string | null;
  metadata?: Stripe.Metadata | null;
  priceIds?: string[];
};

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function normalizeBilling(value: unknown): BillingMode {
  if (value === "yearly") return "yearly";
  if (value === "one_time") return "one_time";
  return "monthly";
}

function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && !value.includes("TODO") && !value.includes("your_") && !value.includes("change_me"));
}

function configuredPriceId(envName: string) {
  return hasEnv(envName) ? clean(process.env[envName]) : "";
}

function legacyPriceEnv(product: (typeof allPaymentProducts)[number], billing: BillingMode) {
  if ("stripePriceEnv" in product) return product.stripePriceEnv;
  if ("monthlyStripePriceEnv" in product && "yearlyStripePriceEnv" in product) return billing === "yearly" ? product.yearlyStripePriceEnv : product.monthlyStripePriceEnv;
  return "";
}

function configuredPriceEnv(product: CreditPackageConfig, billing: BillingMode) {
  return stripePriceEnvForConfiguredCreditProduct(product, product.planType === "topup" ? "one_time" : billing);
}

async function packageConfig() {
  try {
    const { data } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", PACKAGE_CONFIG_KEY)
      .maybeSingle();
    return normalizePackageConfig(data?.value);
  } catch {
    return normalizePackageConfig(null);
  }
}

async function resolvePackage(input: ActivationInput): Promise<ResolvedStripePackage | null> {
  const metadata = input.metadata ?? {};
  const metadataProductId = clean(metadata.productId).toLowerCase();
  const metadataBilling = normalizeBilling(metadata.billing);
  const metadataCredits = Number(metadata.credits ?? 0) || 0;
  const priceIds = new Set((input.priceIds ?? []).map(clean).filter(Boolean));
  const config = await packageConfig();

  for (const product of config.creditPackages) {
    const billingModes: BillingMode[] = product.planType === "topup" ? ["one_time"] : product.planType === "service_subscription" ? ["monthly"] : ["monthly", "yearly"];
    for (const billing of billingModes) {
      const priceEnv = configuredPriceEnv(product, billing);
      const priceId = priceEnv ? configuredPriceId(priceEnv) : "";
      const metadataMatch = metadataProductId && metadataProductId === product.id.toLowerCase() && (!metadata.billing || metadataBilling === billing || product.planType === "topup");
      const priceMatch = priceId && priceIds.has(priceId);
      if (metadataMatch || priceMatch) {
        return {
          productId: product.id,
          productName: product.name,
          planType: product.planType,
          billing: product.planType === "topup" ? "one_time" : billing,
          credits: metadataCredits || product.credits,
          priceEnv,
          priceId
        };
      }
    }
  }

  for (const product of allPaymentProducts) {
    const billingModes: BillingMode[] = product.planType === "topup" || product.planType === "production_one_time" ? ["one_time"] : product.planType === "service_subscription" ? ["monthly"] : ["monthly", "yearly"];
    for (const billing of billingModes) {
      const priceEnv = legacyPriceEnv(product, billing);
      const priceId = priceEnv ? configuredPriceId(priceEnv) : "";
      const metadataMatch = metadataProductId && metadataProductId === product.id.toLowerCase() && (!metadata.billing || metadataBilling === billing || product.planType === "topup");
      const priceMatch = priceId && priceIds.has(priceId);
      if (metadataMatch || priceMatch) {
        return {
          productId: product.id,
          productName: product.name,
          planType: product.planType,
          billing: product.planType === "topup" ? "one_time" : billing,
          credits: metadataCredits || product.credits,
          priceEnv,
          priceId
        };
      }
    }
  }

  if (metadataProductId && metadataCredits > 0) {
    return {
      productId: metadataProductId,
      productName: clean(metadata.productName) || metadataProductId,
      planType: clean(metadata.product) || "credit_purchase",
      billing: metadataBilling,
      credits: metadataCredits,
      priceEnv: clean(metadata.priceEnv),
      priceId: ""
    };
  }

  return null;
}

async function profileByEmail(email: string, customerName?: string | null) {
  const supabase = supabaseAdmin();
  let { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (profileError) throw profileError;
  if (profile) return profile;

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) throw usersError;
  const authUser = usersData.users.find((user) => user.email?.toLowerCase() === email);
  if (!authUser?.email) return null;

  const { data: createdProfile, error: createProfileError } = await supabase
    .from("profiles")
    .upsert({
      id: authUser.id,
      email: authUser.email.toLowerCase(),
      full_name: clean(authUser.user_metadata?.full_name) || clean(customerName) || null,
      role: "user"
    }, { onConflict: "id" })
    .select("id, email")
    .single();

  if (createProfileError) throw createProfileError;
  return createdProfile;
}

export async function activateStripeCredits(input: ActivationInput) {
  const email = clean(input.customerEmail).toLowerCase();
  if (!email) return { activated: false, reason: "missing_customer_email" };

  const resolved = await resolvePackage(input);
  if (!resolved) return { activated: false, reason: "package_not_resolved", customerEmail: email, priceIds: input.priceIds ?? [] };
  if (!resolved.credits || resolved.credits <= 0) return { activated: false, reason: "no_credits_to_add", customerEmail: email, package: resolved };

  const profile = await profileByEmail(email, input.customerName);
  if (!profile) return { activated: false, reason: "clipora_user_not_found", customerEmail: email, package: resolved };

  const supabase = supabaseAdmin();
  const idempotencyKey = `stripe:${input.eventId}:${input.eventType}`;
  const { data: existingEvent, error: existingError } = await supabase
    .from("credit_events")
    .select("id")
    .eq("user_id", profile.id)
    .eq("note", idempotencyKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingEvent) return { activated: false, reason: "already_processed", profile, package: resolved, idempotencyKey };

  const { data: balanceRow, error: balanceReadError } = await supabase
    .from("credit_balances")
    .select("balance, reserved")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (balanceReadError) throw balanceReadError;

  const currentBalance = Number(balanceRow?.balance ?? 0) || 0;
  const currentReserved = Number(balanceRow?.reserved ?? 0) || 0;
  const nextBalance = currentBalance + resolved.credits;

  const { data: balance, error: balanceError } = await supabase
    .from("credit_balances")
    .upsert({
      user_id: profile.id,
      balance: nextBalance,
      reserved: currentReserved,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" })
    .select("balance, reserved, updated_at")
    .single();

  if (balanceError) throw balanceError;

  const eventDetails = [
    idempotencyKey,
    `package=${resolved.productId}`,
    `billing=${resolved.billing}`,
    input.sessionId ? `session=${input.sessionId}` : "",
    input.invoiceId ? `invoice=${input.invoiceId}` : "",
    input.subscriptionId ? `subscription=${input.subscriptionId}` : "",
    input.paymentIntentId ? `payment_intent=${input.paymentIntentId}` : ""
  ].filter(Boolean).join(" | ");

  const { error: eventError } = await supabase
    .from("credit_events")
    .insert({
      user_id: profile.id,
      type: resolved.planType === "subscription" ? "subscription_payment" : "purchase",
      amount: resolved.credits,
      note: eventDetails
    });

  if (eventError) throw eventError;

  return {
    activated: true,
    profile,
    balance,
    package: resolved,
    creditsAdded: resolved.credits,
    idempotencyKey
  };
}
