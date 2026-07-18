import { readFileSync } from "node:fs";
import { join } from "node:path";
import { apiCostGuardConfig, enforceRouteBudget } from "../src/lib/api-cost-guard.ts";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

const config = apiCostGuardConfig();
assert(config.singleProductionCreditLimit >= 1000, "single production credit limit must be configured");
assert(config.dailyProductionCreditLimit >= config.singleProductionCreditLimit, "daily production credit limit must cover at least one safe production");

const request = new Request("https://www.crelavo.com/api/test", { headers: { "x-forwarded-for": "198.51.100.10" } });
const first = enforceRouteBudget(request, { route: "smoke-cost", userId: "user-1", ipLimit: 1, userLimit: 1, windowMs: 60_000 });
assert(first.ok, "first route budget request should pass");
const second = enforceRouteBudget(request, { route: "smoke-cost", userId: "user-1", ipLimit: 1, userLimit: 1, windowMs: 60_000 });
assert(!second.ok, "second route budget request should be blocked");

const costGuard = read("src/lib/api-cost-guard.ts");
const productionsApi = read("src/app/api/productions/route.ts");
const automationStart = read("src/app/api/automation/start/route.ts");
const automationStatus = read("src/app/api/automation/status/route.ts");
const assistantChat = read("src/app/api/assistant-chat/route.ts");
const assistantPlan = read("src/app/api/assistant/plan/route.ts");
const assistantOrchestrate = read("src/app/api/assistant/orchestrate/route.ts");
const assistantWorkspace = read("src/components/AssistantWorkspace.tsx");
const productionWorkspace = read("src/components/ProductionWorkspace.tsx");
const productionsTable = read("src/components/ProductionsTable.tsx");
const adminProductionsTable = read("src/components/AdminProductionsTable.tsx");

for (const term of ["MAX_SINGLE_PRODUCTION_CREDITS", "DAILY_PRODUCTION_CREDIT_LIMIT", "DAILY_PRODUCTION_COUNT_LIMIT", "enforceDailyProductionBudget", "budgetBlockResponse"]) {
  assert(costGuard.includes(term), `api-cost-guard missing ${term}`);
}

for (const term of ["enforceDailyProductionBudget", "enforceRouteBudget", "costGuard", "production:create"]) {
  assert(productionsApi.includes(term), `productions route missing ${term}`);
}

for (const source of [assistantChat, assistantPlan, assistantOrchestrate]) {
  assert(source.includes("enforceRouteBudget"), "assistant AI endpoints must enforce route budgets");
  assert(source.includes("requireVerifiedRequestUser"), "assistant AI endpoints must verify the bearer user before costly work");
}

for (const source of [automationStart, automationStatus]) {
  assert(source.includes("requireVerifiedRequestUser"), "automation endpoints must verify owner bearer tokens");
  assert(source.includes("isAdminRequest"), "automation endpoints must allow token-aware admin access");
  assert(source.includes("enforceRouteBudget"), "automation endpoints must be rate limited");
  assert(source.includes("user_id"), "automation endpoints must select/check production ownership");
}

for (const source of [assistantWorkspace, productionWorkspace, productionsTable]) {
  assert(source.includes("authHeaders"), "customer automation calls must send bearer auth headers");
  assert(source.includes("user_id"), "customer automation calls must include user_id for ownership checks");
}

assert(adminProductionsTable.includes("adminApiHeaders"), "admin automation calls must carry admin auth headers");
assert(adminProductionsTable.includes("adminApiBody({ production_id"), "admin automation calls must carry admin body token/email");

console.log("api-cost-abuse-smoke ok");
