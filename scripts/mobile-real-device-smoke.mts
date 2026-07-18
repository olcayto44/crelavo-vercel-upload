import { readFileSync } from "node:fs";

type MobilePageSpec = {
  name: string;
  path: string;
  mustContain: string[];
};

type ApiGuardSpec = {
  name: string;
  path: string;
  expectedStatuses: number[];
};

type Result = {
  name: string;
  status: number;
  durationMs: number;
  ok: boolean;
  error?: string;
};

const baseUrl = (process.env.MOBILE_SMOKE_BASE_URL ?? "https://www.crelavo.com").replace(/\/$/, "");
const timeoutMs = Number(process.env.MOBILE_SMOKE_TIMEOUT_MS ?? 12_000);
const mobileUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1 CrelavoMobileSmoke/1.0";
const androidUserAgent = "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 CrelavoMobileSmoke/1.0";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index]);
}

async function fetchWithTimeout(path: string, userAgent: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        "user-agent": userAgent,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: controller.signal,
      redirect: "manual"
    });
    const body = await response.text().catch(() => "");
    return { response, body, durationMs: Math.round(performance.now() - started) };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkMobilePage(spec: MobilePageSpec, userAgent: string): Promise<Result> {
  const started = performance.now();
  try {
    const { response, body, durationMs } = await fetchWithTimeout(spec.path, userAgent);
    const missing = spec.mustContain.filter((text) => !body.includes(text));
    const hasViewport = body.includes('name="viewport"') && body.includes("width=device-width");
    const ok = response.status >= 200 && response.status < 400 && hasViewport && missing.length === 0;
    return {
      name: spec.name,
      status: response.status,
      durationMs,
      ok,
      error: ok ? undefined : `missing=${missing.join("|") || "none"} viewport=${hasViewport}`
    };
  } catch (error) {
    return {
      name: spec.name,
      status: 0,
      durationMs: Math.round(performance.now() - started),
      ok: false,
      error: error instanceof Error ? error.message : "request failed"
    };
  }
}

async function checkApiGuard(spec: ApiGuardSpec): Promise<Result> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${spec.path}`, {
      headers: { "user-agent": mobileUserAgent, "accept": "application/json" },
      signal: controller.signal,
      redirect: "manual"
    });
    const durationMs = Math.round(performance.now() - started);
    return {
      name: spec.name,
      status: response.status,
      durationMs,
      ok: spec.expectedStatuses.includes(response.status),
      error: spec.expectedStatuses.includes(response.status) ? undefined : `expected ${spec.expectedStatuses.join("/")}`
    };
  } catch (error) {
    return {
      name: spec.name,
      status: 0,
      durationMs: Math.round(performance.now() - started),
      ok: false,
      error: error instanceof Error ? error.message : "request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

function checkResponsiveSource() {
  const css = readFileSync("src/app/globals.css", "utf8");
  const assistant = readFileSync("src/components/AssistantWorkspace.tsx", "utf8");
  const productionWorkspace = readFileSync("src/components/ProductionWorkspace.tsx", "utf8");
  const productionTable = readFileSync("src/components/ProductionsTable.tsx", "utf8");
  const adminProductionTable = readFileSync("src/components/AdminProductionsTable.tsx", "utf8");

  const checks = [
    { name: "global viewport overflow guard", pass: css.includes("overflow-x: hidden") },
    { name: "chat bubble word wrapping", pass: css.includes("overflow-wrap: anywhere") && css.includes("word-break: break-word") },
    { name: "mobile max-width 640 breakpoint", pass: css.includes("@media (max-width: 640px)") },
    { name: "mobile max-width 720 breakpoint", pass: css.includes("@media (max-width: 720px)") },
    { name: "admin table horizontal wrapper", pass: css.includes("admin-table-wrap") && css.includes("overflow-x: auto") },
    { name: "campaign promo mobile compaction", pass: css.includes(".campaign-promo-card") && css.includes("min-height: auto") && css.includes(".campaign-promo-countdown strong") && css.includes("white-space: normal") },
    { name: "mobile header hard guard", pass: css.includes(".site-main-nav.nav") && css.includes("grid-template-columns: minmax(0, 1fr) !important") && css.includes("overflow: hidden !important") },
    { name: "mobile hero hard guard", pass: css.includes(".home-platform-hero") && css.includes("font-size: clamp(34px, 11vw, 52px) !important") && css.includes("overflow-wrap: anywhere !important") },
    { name: "assistant uses mobile app flow", pass: assistant.includes("mobile_app") && assistant.includes("Mobile app") },
    { name: "production workspace mobile previews", pass: productionWorkspace.includes("Desktop and mobile screen previews") },
    { name: "user productions table exists", pass: productionTable.includes("Productions") || productionTable.includes("production") },
    { name: "admin production table quality/mobile metadata", pass: adminProductionTable.includes("Production quality") && adminProductionTable.includes("productionQuality") }
  ];

  const failed = checks.filter((item) => !item.pass);
  console.log("\nresponsive source checks");
  for (const check of checks) console.log(`${check.pass ? "ok" : "fail"} ${check.name}`);
  assert(failed.length === 0, `Responsive source checks failed: ${failed.map((item) => item.name).join(", ")}`);
}

const pages: MobilePageSpec[] = [
  { name: "home", path: "/", mustContain: ["Crelavo", "AI production"] },
  { name: "pricing", path: "/pricing", mustContain: ["Pricing", "credits"] },
  { name: "dashboard", path: "/dashboard", mustContain: ["Dashboard", "Crelavo"] },
  { name: "assistant workspace", path: "/dashboard/assistant-workspace", mustContain: ["Assistant", "Crelavo"] },
  { name: "productions", path: "/dashboard/productions", mustContain: ["Productions", "Crelavo"] },
  { name: "whop checkout", path: "/checkout/whop", mustContain: ["Crelavo checkout", "pricing"] },
  { name: "admin api guard page", path: "/admin/api-guard", mustContain: ["API Guard", "Crelavo Admin"] },
  { name: "admin production qa page", path: "/admin/production-qa", mustContain: ["Production Quality QA", "Crelavo Admin"] }
];

const guards: ApiGuardSpec[] = [
  { name: "admin api guard api", path: "/api/admin/api-guard", expectedStatuses: [403] },
  { name: "admin production qa api", path: "/api/admin/production-qa", expectedStatuses: [403] },
  { name: "productions api unauth", path: "/api/productions", expectedStatuses: [401, 405] },
  { name: "providers readiness", path: "/api/providers/readiness", expectedStatuses: [200, 503] }
];

console.log(`mobile-real-device-smoke target=${baseUrl}`);
console.log("viewport profile=iPhone Safari + Android Chrome user-agents, safe non-payment/non-AI checks");

checkResponsiveSource();

const iosResults = await Promise.all(pages.map((page) => checkMobilePage({ ...page, name: `ios ${page.name}` }, mobileUserAgent)));
const androidResults = await Promise.all(pages.map((page) => checkMobilePage({ ...page, name: `android ${page.name}` }, androidUserAgent)));
const guardResults = await Promise.all(guards.map((guard) => checkApiGuard(guard)));
const results = [...iosResults, ...androidResults, ...guardResults];

console.log("\nlive mobile route checks");
for (const result of results) {
  console.log(`${result.ok ? "ok" : "fail"} ${result.name} status=${result.status} duration=${result.durationMs}ms${result.error ? ` ${result.error}` : ""}`);
}

const failed = results.filter((result) => !result.ok);
const durations = results.map((result) => result.durationMs);
console.log(`\nmobile summary requests=${results.length} p50=${percentile(durations, 50)}ms p95=${percentile(durations, 95)}ms max=${Math.max(...durations, 0)}ms`);

assert(failed.length === 0, `Mobile checks failed: ${failed.map((item) => `${item.name}:${item.status}:${item.error ?? ""}`).join(" | ")}`);
assert(percentile(durations, 95) <= 2500, "Mobile live p95 exceeded 2500ms");

console.log("\nmobile-real-device-smoke ok");
console.log("Not: Bu otomatik kontrol gerçek iPhone/Android user-agent ve canlı sayfa cevaplarını ölçer; fiziksel cihazda son manuel göz kontrolü için destekleyici kanıttır.");
