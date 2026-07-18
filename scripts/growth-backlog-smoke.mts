import { readFileSync } from "node:fs";
import { join } from "node:path";

const growthLib = readFileSync(join(process.cwd(), "src", "lib", "growth.ts"), "utf8");
const retentionGrowthLib = readFileSync(join(process.cwd(), "src", "lib", "retention-growth.ts"), "utf8");
const adminPage = readFileSync(join(process.cwd(), "src", "app", "admin", "growth", "page.tsx"), "utf8");
const dashboardPage = readFileSync(join(process.cwd(), "src", "app", "dashboard", "growth", "page.tsx"), "utf8");
const dashboardHomePage = readFileSync(join(process.cwd(), "src", "app", "dashboard", "page.tsx"), "utf8");
const growthControlPanel = readFileSync(join(process.cwd(), "src", "components", "GrowthIntelligenceControlPanel.tsx"), "utf8");
const adminGrowthRequests = readFileSync(join(process.cwd(), "src", "components", "AdminGrowthIntelligenceRequests.tsx"), "utf8");
const growthRequestsRoute = readFileSync(join(process.cwd(), "src", "app", "api", "growth-intelligence", "requests", "route.ts"), "utf8");
const growthRequestsMigration = readFileSync(join(process.cwd(), "supabase", "migration_growth_intelligence_requests.sql"), "utf8");
const productionEmail = readFileSync(join(process.cwd(), "src", "lib", "production-email.ts"), "utf8");
const admin = readFileSync(join(process.cwd(), "src", "lib", "admin.ts"), "utf8");
const dashboardShell = readFileSync(join(process.cwd(), "src", "components", "DashboardShell.tsx"), "utf8");
const phase2 = readFileSync(join(process.cwd(), "docs", "phase-2-backlog.md"), "utf8");

const requiredTerms = [
  "preview-watermark",
  "share-to-earn",
  "referral-affiliate",
  "team-workspace",
  "analytics-dashboard",
  "organic-launch-assets",
  "future-categories",
  "rewardCreditRules",
  "watermarkPolicy",
  "Free-plan watermark",
  "Share-to-earn credits",
  "Referral / affiliate MVP"
];

for (const term of requiredTerms) {
  if (!growthLib.includes(term) && !phase2.includes(term)) throw new Error(`Growth backlog missing term: ${term}`);
}

for (const term of ["/admin/growth", "Growth Backlog", "Phase-2 Operations"]) {
  if (!admin.includes(term)) throw new Error(`Admin menu missing growth term: ${term}`);
}

for (const term of ["Growth backlog", "rewardCreditRules", "watermarkPolicy", "Whop stays active", "API-dışı 2. Grup", "Retention lifecycle", "Activation funnel", "Admin retention checklist", "AdminGrowthIntelligenceRequests", "Report requests and dashboard PDF/file delivery"]) {
  if (!adminPage.includes(term)) throw new Error(`Admin growth page missing term: ${term}`);
}

for (const term of ["retentionGrowthSummary", "lifecycleNudges", "activationFunnelSteps", "growthRewardReadiness", "dashboardNextBestActions", "retentionAdminChecklist", "No Lemon", "API/provider automation is explicitly later"]) {
  if (!retentionGrowthLib.includes(term)) throw new Error(`Retention growth lib missing term: ${term}`);
}

for (const term of ["/api/growth-intelligence/requests", "dashboard PDF/file", "report_file_url"]) {
  if (!growthControlPanel.includes(term) && !adminGrowthRequests.includes(term) && !growthRequestsRoute.includes(term)) throw new Error(`Growth Intelligence request flow missing term: ${term}`);
}

for (const term of ["growth_intelligence_requests", "entitlement_status", "report_file_url", "report_file_name"]) {
  if (!growthRequestsMigration.includes(term)) throw new Error(`Growth Intelligence migration missing term: ${term}`);
}

for (const term of ["sendGrowthIntelligenceReportReadyEmail", "Your Growth Intelligence report is ready", "reportEmailResult"]) {
  if (!productionEmail.includes(term) && !growthRequestsRoute.includes(term)) throw new Error(`Growth Intelligence email delivery missing term: ${term}`);
}

for (const term of ["/dashboard/growth", "Growth Rewards"]) {
  if (!dashboardShell.includes(term)) throw new Error(`Dashboard shell missing growth term: ${term}`);
}

for (const term of ["Earn, return and continue building with Crelavo", "Next best actions", "Lifecycle nudges", "Share-to-earn readiness", "Referral MVP", "watermarkPolicy", "API automation comes later"]) {
  if (!dashboardPage.includes(term)) throw new Error(`Dashboard growth page missing term: ${term}`);
}

for (const term of ["dashboardNextBestActions", "Keep building from where users usually drop off"]) {
  if (!dashboardHomePage.includes(term)) throw new Error(`Dashboard home missing retention action term: ${term}`);
}

for (const term of ["Finish your first production", "Open Growth Rewards", "/dashboard/assistant-workspace", "/dashboard/growth"]) {
  if (!retentionGrowthLib.includes(term)) throw new Error(`Retention next-best-action data missing term: ${term}`);
}

console.log("growth-backlog-smoke ok");
