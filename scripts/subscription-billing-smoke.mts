import { readFileSync } from "node:fs";
import { allCreditProducts, packages, topUpPackages } from "../src/lib/data.ts";
import { billingTermsText, LEGAL_ACCEPTANCE_VERSION, legalAcceptanceSnapshot } from "../src/lib/legal.ts";
import { lemonVariantEnvForProduct } from "../src/lib/payment-provider.ts";
import { whopPlanIds } from "../src/lib/whop.ts";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

assert(packages.length >= 4, "subscription packages missing");
assert(topUpPackages.length >= 3, "top-up packages missing");
assert(packages.every((plan) => plan.planType === "subscription"), "all main packages must be subscriptions");
assert(topUpPackages.every((plan) => plan.planType === "topup"), "all top-up packages must be one-time top-ups");
assert(packages.some((plan) => plan.name === "Pro" && plan.renderQueue === "Priority render queue"), "Pro should include priority render queue");
assert(packages.some((plan) => plan.name === "Business" && plan.renderQueue === "Fastest render queue"), "Business should include fastest render queue");
assert(packages.some((plan) => plan.name === "Team" && plan.renderQueue === "Dedicated production priority"), "Team should include dedicated production priority");
assert(allCreditProducts.length >= packages.length + topUpPackages.length, "all credit products should include subscriptions and top-ups");

for (const plan of packages) {
  assert(lemonVariantEnvForProduct(plan.id, "monthly").includes("_MONTHLY"), `${plan.name} monthly Lemon variant env missing`);
  assert(lemonVariantEnvForProduct(plan.id, "yearly").includes("_YEARLY"), `${plan.name} yearly Lemon variant env missing`);
}
for (const plan of topUpPackages) {
  assert(lemonVariantEnvForProduct(plan.id, "one_time").includes("TOPUP"), `${plan.name} top-up Lemon variant env missing`);
}

assert(LEGAL_ACCEPTANCE_VERSION.includes("preview-setup-fee"), "legal version should include preview setup fee update");
assert(packages.some((plan) => plan.name === "Pro" && plan.setupFeeUsd === 0), "Pro should use the approved free preview configuration");
assert(packages.some((plan) => plan.name === "Business" && plan.setupFeeUsd === 10), "Business should include $10 preview setup fee");
assert(packages.some((plan) => plan.name === "Ultra" && plan.setupFeeUsd === 15), "Ultra should include $15 preview setup fee");
assert(packages.some((plan) => plan.name === "Team" && plan.setupFeeUsd === 20), "Team should include $20 preview setup fee");
assert(billingTermsText.includes("paid 24-hour preview"), "billing terms should mention paid 24-hour preview");
assert(billingTermsText.includes("10-second watermarked preview video"), "billing terms should mention 10-second preview");
assert(billingTermsText.includes("renew automatically"), "billing terms should mention auto renewal");
assert(billingTermsText.includes("One-time top-up credit packages are not subscriptions"), "billing terms should mention one-time top-ups");
const snapshot = legalAcceptanceSnapshot({ productionType: "video", packageId: "pro", title: "Test" });
assert("billingTermsText" in snapshot, "legal snapshot should store billing terms");

const checkoutRoute = readFileSync("src/app/api/payments/checkout/route.ts", "utf8");
for (const term of ["provider: \"polar\"", "POLAR_PRO_CHECKOUT_URL", "POLAR_ACCESS_TOKEN", "POLAR_PRO_PRODUCT_ID", "externalCustomerId: authUser.id", "pro_24h_free_trial", "CHECKOUT_TEMPORARILY_UNAVAILABLE", "manualActivation"]) {
  assert(checkoutRoute.includes(term), `checkout route missing Polar migration term: ${term}`);
}
for (const term of ["createLemonSqueezyCheckout", "provider: \"lemon_squeezy\"", "credit_subscription", "credit_topup", "lemonVariantEnvForProduct", "manualActivation"]) {
  assert(checkoutRoute.includes(term), `checkout route missing parked Lemon fallback term: ${term}`);
}

const polarWebhookRoute = readFileSync("src/app/api/webhooks/polar/route.ts", "utf8");
for (const term of ["Webhooks", "POLAR_WEBHOOK_SECRET", "payment_provider_events", "subscription.active", "subscription.canceled", "subscription.revoked", "order.paid", "order.refunded", "active_canceling", "crelavo_user_not_found", "clearSubscriptionCreditBuckets"]) {
  assert(polarWebhookRoute.includes(term), `Polar webhook missing required lifecycle term: ${term}`);
}
const whopWebhookRoute = readFileSync("src/app/api/webhooks/whop/route.ts", "utf8");
for (const term of ["payment.succeeded", "membership.deactivated", "WHOP_WEBHOOK_SECRET", "preview_setup_payment_no_full_credits", "subscription_renewal_credits", "subscription_create", "trialing", "amountMatchesUsd(amount, setupFeeUsd)", "amountMatchesUsd(amount, expectedRenewalUsd)"]) {
  assert(whopWebhookRoute.includes(term), `Whop webhook missing preview/subscription guard term: ${term}`);
}

const whopReconcileRoute = readFileSync("src/app/api/whop/reconcile-payment/route.ts", "utf8");
for (const term of ["retrieveWhopPayment", "preview_setup_payment_no_full_credits", "subscription_renewal_credits", "subscription_create", "trialing", "amountMatchesUsd(amount, setupFeeUsd)", "amountMatchesUsd(amount, expectedRenewalUsd)", "applyCreditPurchaseToBuckets", "current_subscription_credits", "rolled_over_credits", "rollover_cap", "source=checkout_complete_fallback"]) {
  assert(whopReconcileRoute.includes(term), `Whop reconcile route missing preview/subscription guard term: ${term}`);
}

for (const plan of packages) {
  assert(whopPlanIds[plan.id]?.monthly?.startsWith("plan_"), `${plan.name} monthly Whop plan ID missing`);
  assert(whopPlanIds[plan.id]?.yearly?.startsWith("plan_"), `${plan.name} yearly Whop plan ID missing`);
}

const deliveryRoute = readFileSync("src/app/api/productions/[id]/delivery/route.ts", "utf8");
for (const term of ["previewAccessForDelivery", "previewOnly", "downloadAccess === \"closed\"", "Downloads are closed during the 24-hour preview", "readme", "source", "zip"]) {
  assert(deliveryRoute.includes(term), `delivery route missing preview download gate term: ${term}`);
}

const revisionRoute = readFileSync("src/app/api/productions/revision/route.ts", "utf8");
for (const term of ["providerSpendGuard", "preview_only_downloads_closed", "downloadAccess === \"closed\""]) {
  assert(revisionRoute.includes(term), `revision route missing preview provider-spend guard term: ${term}`);
}

const paymentPage = readFileSync("src/app/dashboard/payment/page.tsx", "utf8");
for (const term of ["redirect", "/pricing"]) {
  assert(paymentPage.includes(term), `payment page should route to active pricing: ${term}`);
}

const whopCheckoutPage = readFileSync("src/app/checkout/whop/page.tsx", "utf8");
for (const term of ["redirect", "/checkout/unavailable"]) {
  assert(whopCheckoutPage.includes(term), `Legacy Whop checkout should redirect safely: ${term}`);
}

const creditsPage = readFileSync("src/app/dashboard/credits/page.tsx", "utf8");
assert(creditsPage.includes("/pro-trial"), "credits page should route through the authenticated Pro trial flow");
assert(creditsPage.includes("/checkout/unavailable"), "credits page should disable packages not yet mapped to Polar");

const proTrialPage = readFileSync("src/app/pro-trial/page.tsx", "utf8");
for (const term of ["PaymentCheckoutButton", "pro_24h_free_trial", "billing=\"monthly\""]) {
  assert(proTrialPage.includes(term), `Pro trial page missing authenticated checkout term: ${term}`);
}

const envExample = readFileSync(".env.example", "utf8");
for (const term of ["PAYMENT_PROVIDER=polar", "POLAR_PRO_CHECKOUT_URL", "POLAR_PRO_PRODUCT_ID", "POLAR_ACCESS_TOKEN", "POLAR_WEBHOOK_SECRET", "WHOP_API_KEY", "WHOP_WEBHOOK_SECRET", "LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET", "LEMON_VARIANT_PRO_MONTHLY", "LEMON_VARIANT_PRO_YEARLY", "LEMON_VARIANT_TOPUP_STARTER_ONE_TIME", "LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME", "LEMON_VARIANT_TOPUP_BUSINESS_ONE_TIME"]) {
  assert(envExample.includes(term), `.env.example missing ${term}`);
}

console.log("subscription-billing-smoke ok");
