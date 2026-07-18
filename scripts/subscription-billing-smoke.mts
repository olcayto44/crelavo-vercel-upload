import { readFileSync } from "node:fs";
import { allCreditProducts, packages, topUpPackages } from "../src/lib/data.ts";
import { billingTermsText, LEGAL_ACCEPTANCE_VERSION, legalAcceptanceSnapshot } from "../src/lib/legal.ts";
import { lemonVariantEnvForProduct } from "../src/lib/payment-provider.ts";

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
assert(packages.some((plan) => plan.name === "Pro" && plan.setupFeeUsd === 5), "Pro should include $5 preview setup fee");
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
for (const term of ["createLemonSqueezyCheckout", "provider: \"lemon_squeezy\"", "credit_subscription", "credit_topup", "lemonVariantEnvForProduct", "manualActivation"]) {
  assert(checkoutRoute.includes(term), `checkout route missing term: ${term}`);
}

const webhookRoute = readFileSync("src/app/api/lemon-squeezy/webhook/route.ts", "utf8");
for (const term of ["order_created", "subscription_created", "subscription_payment_success", "subscription_payment_failed", "subscription_cancelled"]) {
  assert(webhookRoute.includes(term), `webhook missing subscription term: ${term}`);
}

const paymentPage = readFileSync("src/app/dashboard/payment/page.tsx", "utf8");
for (const term of ["Start recurring credit subscription", "Buy one-time top-up credits", "billingTermsText", "PaymentCheckoutButton", "does not renew automatically", "Lemon Squeezy"]) {
  assert(paymentPage.includes(term), `payment page missing term: ${term}`);
}

const creditsPage = readFileSync("src/app/dashboard/credits/page.tsx", "utf8");
assert(creditsPage.includes("topUpPackages"), "credits page should render top-up packages");

const envExample = readFileSync(".env.example", "utf8");
for (const term of ["PAYMENT_PROVIDER=lemon_squeezy", "LEMON_SQUEEZY_API_KEY", "LEMON_SQUEEZY_STORE_ID", "LEMON_SQUEEZY_WEBHOOK_SECRET", "LEMON_VARIANT_PRO_MONTHLY", "LEMON_VARIANT_PRO_YEARLY", "LEMON_VARIANT_TOPUP_STARTER_ONE_TIME", "LEMON_VARIANT_TOPUP_CREATOR_ONE_TIME", "LEMON_VARIANT_TOPUP_BUSINESS_ONE_TIME"]) {
  assert(envExample.includes(term), `.env.example missing ${term}`);
}

console.log("subscription-billing-smoke ok");
