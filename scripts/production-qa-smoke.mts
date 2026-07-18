import { readFileSync } from "node:fs";
import { qaProduction, summarizeProductionQa } from "../src/lib/production-qa.ts";
import { qualityProfileForProduction } from "../src/lib/production-quality.ts";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(path, "utf8");
}

const quality = qualityProfileForProduction("drama", "drama_viral_short");
const passing = qaProduction({
  id: "prod-pass",
  title: "Drama ready",
  production_type: "drama",
  package_id: "drama_viral_short",
  status: "ready",
  preview_url: "https://example.com/preview.mp4",
  legal_acceptance_snapshot: { accepted: true, version: "v1" },
  request_metadata: {
    productionQuality: quality,
    deliveryPackage: { standard: "media_final", requiredItems: ["Preview", "Final delivery link"], fileFormats: ["MP4"], adminChecklist: ["Attach final"], costCredits: 0 },
    deliveryRequirements: { formats: ["final_mp4"], requested: true },
    outputPlan: { totalReservedCredits: 7800, outputCount: 1 },
    deliveryTargets: { publishTargets: ["TikTok"] }
  },
  input_json: {}
});
assert(passing.grade === "pass", `passing production should pass, got ${passing.grade}`);
assert(passing.score >= 90, "passing production score should be high");

const failing = qaProduction({
  id: "prod-fail",
  title: "Ready missing delivery",
  production_type: "campaign",
  package_id: "campaign_product_ad_video",
  status: "ready",
  request_metadata: {},
  input_json: {}
});
assert(failing.grade === "fail", "failing production should fail");
assert(failing.issues.some((issue) => issue.code === "legal_acceptance_missing"), "legal acceptance issue missing");
assert(failing.issues.some((issue) => issue.code === "ready_without_delivery"), "ready delivery issue missing");

const summary = summarizeProductionQa([passing, failing]);
assert(summary.total === 2, "QA summary total mismatch");
assert(summary.pass === 1 && summary.fail === 1, "QA summary grades mismatch");

const route = read("src/app/api/admin/production-qa/route.ts");
const page = read("src/app/admin/production-qa/page.tsx");
const panel = read("src/components/AdminProductionQaPanel.tsx");
const adminMenu = read("src/lib/admin.ts");
const pkg = read("package.json");

assert(route.includes("isAdminRequest(request)"), "Production QA API must require admin auth");
assert(route.includes("qaProduction"), "Production QA API must run qaProduction");
assert(page.includes("AdminProductionQaPanel"), "Production QA page must render panel");
assert(panel.includes("/api/admin/production-qa"), "Production QA panel must fetch report");
assert(panel.includes("Production kalite QA raporu"), "Production QA panel title missing");
assert(adminMenu.includes("Production Quality QA") && adminMenu.includes("/admin/production-qa"), "Admin menu must include production QA");
assert(pkg.includes("smoke:production-qa"), "package.json must include production QA smoke");

console.log("production-qa-smoke ok");
