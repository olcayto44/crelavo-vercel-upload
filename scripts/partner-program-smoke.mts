import { readFileSync } from "node:fs";
import { calculatePartnerCommission, commissionEligibilityStatus, commissionRateForPurchase, partnerApiVisibilityRoadmap, partnerCommissionDefaults, partnerCreatorAssetPack, partnerProgramPolicy, partnerWhopOptimizationPlan } from "../src/lib/partner-program.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

assert(partnerProgramPolicy.attributionWindowDays === 30, "Attribution window must be 30 days");
assert(partnerProgramPolicy.payoutHoldDays === 30, "Payout hold must be 30 days");
assert(partnerProgramPolicy.minimumPayoutUsd === 50, "Minimum payout must be $50");
assert(partnerProgramPolicy.recurring === "Disabled at launch", "Recurring must be disabled at launch");
assert(partnerCommissionDefaults.payoutProvider.includes("Whop"), "Partner payout/provider note must align with Whop active mode");
assert(partnerCommissionDefaults.payoutSchedule.includes("30 days"), "Payout schedule must explain 30-day hold");
assert(partnerCommissionDefaults.cancellationPolicy.includes("Refunded") && partnerCommissionDefaults.cancellationPolicy.includes("cancelled"), "Cancellation policy must void refunded/cancelled sales");
assert(partnerWhopOptimizationPlan.length >= 5, "Whop optimization plan must be visible");
assert(partnerWhopOptimizationPlan.some((item) => item.title.includes("Manual commission ledger")), "Manual ledger must be part of Whop optimization plan");
assert(partnerWhopOptimizationPlan.some((item) => item.guardrail.includes("Duplicate Whop payment references")), "Duplicate Whop payment guardrail must be present");
assert(partnerCreatorAssetPack.length >= 4, "Creator asset pack must be prepared");
assert(partnerCreatorAssetPack.some((item) => item.asset === "Safe disclosure line"), "Partner disclosure copy must be present");
assert(partnerApiVisibilityRoadmap.some((item) => item.includes("Lemon") && item.includes("Whop checkout")), "API roadmap must keep Lemon last and Whop safe");

assert(commissionRateForPurchase("credit", "Creator Top-up") === 15, "Credit/top-up commission must be 15%");
assert(commissionRateForPurchase("production", "Ultra monthly") === 25, "Standard production commission must be 25%");
assert(commissionRateForPurchase("growth intelligence", "Growth Intelligence Agent monthly") === 30, "Growth Intelligence commission must be 30%");
assert(commissionRateForPurchase("custom", "Managed enterprise build") === 15, "Custom/heavy delivery commission must be 15%");

const credit = calculatePartnerCommission(25, "credit", "Creator Top-up", "paid");
assert(credit.percent === 15 && credit.commissionUsd === 3.75 && credit.eligibility === "pending_30_day_hold", "Credit commission calculation mismatch");
const production = calculatePartnerCommission(199, "production", "Ultra monthly", "paid");
assert(production.percent === 25 && production.commissionUsd === 49.75, "Production commission calculation mismatch");
const growth = calculatePartnerCommission(499, "growth intelligence", "Growth Intelligence Agent monthly", "paid");
assert(growth.percent === 30 && growth.commissionUsd === 149.7, "Growth Intelligence commission calculation mismatch");

for (const status of ["refunded", "cancelled", "chargeback", "unpaid", "fraud_review", "abuse_flagged"]) {
  assert(commissionEligibilityStatus(status) === "void_no_commission", `${status} must void commission`);
  const result = calculatePartnerCommission(199, "production", "Ultra monthly", status);
  assert(result.percent === 0 && result.commissionUsd === 0 && result.eligibility === "void_no_commission", `${status} commission must be zero`);
}

const affiliatePage = read("src/app/affiliate/page.tsx");
const adminPartnersPage = read("src/app/admin/partners/page.tsx");
const homePage = read("src/app/page.tsx");
const pkg = read("package.json");

assert(affiliatePage.includes("30-day payout hold"), "Affiliate page must show 30-day payout hold");
assert(affiliatePage.includes("Whop launch path") && affiliatePage.includes("manual ledger"), "Affiliate page must show Whop launch path and manual ledger");
assert(affiliatePage.includes("Creator asset pack"), "Affiliate page must show creator asset pack");
assert(affiliatePage.includes("Refunded, cancelled, chargebacked") || affiliatePage.includes("refunded, cancelled, chargebacked"), "Affiliate page must explain refund/cancel no commission rule");
assert(affiliatePage.includes("15%") && affiliatePage.includes("25%") && affiliatePage.includes("30%"), "Affiliate page must show commission percentages");
assert(adminPartnersPage.includes("Whop affiliate optimization"), "Admin partners page must show Whop affiliate optimization");
assert(adminPartnersPage.includes("Creator asset pack + API visibility"), "Admin partners page must show API visibility for partner work");
assert(adminPartnersPage.includes("Launch commission policy"), "Admin partners page must show detailed launch policy");
assert(adminPartnersPage.includes("30-day attribution") || adminPartnersPage.includes("30-day payout hold"), "Admin partners page must show 30-day attribution/hold");
assert(adminPartnersPage.includes("calculatePartnerCommission"), "Admin partners page must use commission calculation examples");
assert(homePage.includes("Draft commission") || homePage.includes("affiliate"), "Home page must keep affiliate section visible");
assert(pkg.includes("smoke:partner-program"), "package.json must include partner program smoke script");

console.log("partner-program-smoke ok");
