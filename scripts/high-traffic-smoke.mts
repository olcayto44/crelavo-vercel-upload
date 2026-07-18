type CheckKind = "public" | "guard" | "scenario";

type RequestSpec = {
  name: string;
  method?: "GET" | "POST";
  path: string;
  kind: CheckKind;
  expectedStatuses?: number[];
  body?: unknown;
};

type RequestResult = {
  name: string;
  kind: CheckKind;
  status: number;
  ok: boolean;
  expected: boolean;
  durationMs: number;
  error?: string;
};

const baseUrl = (process.env.HIGH_TRAFFIC_BASE_URL ?? "https://www.crelavo.com").replace(/\/$/, "");
const totalPublicRequests = Number(process.env.HIGH_TRAFFIC_TOTAL ?? 120);
const publicConcurrency = Number(process.env.HIGH_TRAFFIC_CONCURRENCY ?? 30);
const scenarioUsers = Number(process.env.HIGH_TRAFFIC_USERS ?? 50);
const scenarioConcurrency = Number(process.env.HIGH_TRAFFIC_USER_CONCURRENCY ?? 25);
const timeoutMs = Number(process.env.HIGH_TRAFFIC_TIMEOUT_MS ?? 12_000);

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index]);
}

function statusExpected(status: number, spec: RequestSpec) {
  if (spec.expectedStatuses?.length) return spec.expectedStatuses.includes(status);
  if (spec.kind === "public" || spec.kind === "scenario") return status >= 200 && status < 400;
  return [401, 403, 405, 429].includes(status);
}

async function timedFetch(spec: RequestSpec): Promise<RequestResult> {
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${spec.path}`, {
      method: spec.method ?? "GET",
      headers: spec.body ? { "content-type": "application/json" } : undefined,
      body: spec.body ? JSON.stringify(spec.body) : undefined,
      signal: controller.signal,
      redirect: "manual"
    });
    const durationMs = Math.round(performance.now() - started);
    const expected = statusExpected(response.status, spec);
    return {
      name: spec.name,
      kind: spec.kind,
      status: response.status,
      ok: response.status < 500,
      expected,
      durationMs
    };
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    return {
      name: spec.name,
      kind: spec.kind,
      status: 0,
      ok: false,
      expected: false,
      durationMs,
      error: error instanceof Error ? error.message : "request failed"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runPool<T>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<RequestResult | RequestResult[]>) {
  const results: RequestResult[] = [];
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const index = cursor++;
      const result = await worker(items[index], index);
      if (Array.isArray(result)) results.push(...result);
      else results.push(result);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => next()));
  return results;
}

function summarize(label: string, results: RequestResult[]) {
  const durations = results.map((item) => item.durationMs);
  const fiveXx = results.filter((item) => item.status >= 500 || item.status === 0);
  const unexpected = results.filter((item) => !item.expected);
  const slow = results.filter((item) => item.durationMs > 6000);
  const byStatus = new Map<number, number>();
  for (const result of results) byStatus.set(result.status, (byStatus.get(result.status) ?? 0) + 1);
  const statusSummary = Array.from(byStatus.entries()).sort((a, b) => a[0] - b[0]).map(([status, count]) => `${status}:${count}`).join(", ");

  console.log(`\n${label}`);
  console.log(`requests=${results.length} statuses=${statusSummary}`);
  console.log(`p50=${percentile(durations, 50)}ms p95=${percentile(durations, 95)}ms max=${Math.max(...durations, 0)}ms`);
  if (unexpected.length) console.log(`unexpected=${unexpected.slice(0, 8).map((item) => `${item.name}:${item.status}${item.error ? `:${item.error}` : ""}`).join(" | ")}`);

  return { fiveXx, unexpected, slow };
}

const publicSpecs: RequestSpec[] = [
  { name: "home", path: "/", kind: "public" },
  { name: "pricing", path: "/pricing", kind: "public" },
  { name: "tools", path: "/tools", kind: "public" },
  { name: "categories", path: "/categories", kind: "public" },
  { name: "dashboard", path: "/dashboard", kind: "public" },
  { name: "assistant-workspace", path: "/dashboard/assistant-workspace", kind: "public" },
  { name: "admin-api-guard-page", path: "/admin/api-guard", kind: "public" },
  { name: "admin-production-qa-page", path: "/admin/production-qa", kind: "public" }
];

const guardSpecs: RequestSpec[] = [
  { name: "admin-api-guard", path: "/api/admin/api-guard", kind: "guard", expectedStatuses: [403] },
  { name: "admin-production-qa", path: "/api/admin/production-qa", kind: "guard", expectedStatuses: [403] },
  { name: "productions-without-auth", path: "/api/productions", kind: "guard", expectedStatuses: [401, 405] },
  { name: "automation-start-without-auth", path: "/api/automation/start", kind: "guard", expectedStatuses: [401, 403, 405] },
  { name: "automation-status-without-auth", path: "/api/automation/status", kind: "guard", expectedStatuses: [401, 403, 405] },
  { name: "provider-readiness", path: "/api/providers/readiness", kind: "guard", expectedStatuses: [200, 503] }
];

const scenarioFlow: RequestSpec[] = [
  { name: "scenario-home", path: "/", kind: "scenario" },
  { name: "scenario-pricing", path: "/pricing", kind: "scenario" },
  { name: "scenario-workspace", path: "/dashboard/assistant-workspace", kind: "scenario" },
  { name: "scenario-productions-guard", path: "/api/productions", kind: "guard", expectedStatuses: [401, 405] },
  { name: "scenario-admin-qa-guard", path: "/api/admin/production-qa", kind: "guard", expectedStatuses: [403] }
];

const publicItems = Array.from({ length: totalPublicRequests }, (_, index) => publicSpecs[index % publicSpecs.length]);
const guardItems = Array.from({ length: Math.ceil(totalPublicRequests / 2) }, (_, index) => guardSpecs[index % guardSpecs.length]);
const scenarioItems = Array.from({ length: scenarioUsers }, (_, index) => index + 1);

console.log(`high-traffic-smoke target=${baseUrl}`);
console.log(`safe public burst: total=${publicItems.length} concurrency=${publicConcurrency}`);
console.log(`guard burst: total=${guardItems.length} concurrency=${publicConcurrency}`);
console.log(`production-like users: users=${scenarioUsers} concurrency=${scenarioConcurrency} flowSteps=${scenarioFlow.length}`);

const publicResults = await runPool(publicItems, publicConcurrency, (spec) => timedFetch(spec));
const guardResults = await runPool(guardItems, publicConcurrency, (spec) => timedFetch(spec));
const scenarioResults = await runPool(scenarioItems, scenarioConcurrency, async (userNo) => {
  const results: RequestResult[] = [];
  for (const step of scenarioFlow) {
    results.push(await timedFetch({ ...step, name: `${step.name}-u${userNo}` }));
  }
  return results;
});

const publicSummary = summarize("public burst", publicResults);
const guardSummary = summarize("guard burst", guardResults);
const scenarioSummary = summarize("production-like scenario", scenarioResults);
const allResults = [...publicResults, ...guardResults, ...scenarioResults];
const allSummary = summarize("overall", allResults);

assert(publicSummary.fiveXx.length === 0, "Public burst produced 5xx/timeout errors");
assert(guardSummary.fiveXx.length === 0, "Guard burst produced 5xx/timeout errors");
assert(scenarioSummary.fiveXx.length === 0, "Production-like scenario produced 5xx/timeout errors");
assert(publicSummary.unexpected.length === 0, "Public endpoints returned unexpected statuses");
assert(guardSummary.unexpected.length === 0, "Guard endpoints returned unexpected statuses");
assert(scenarioSummary.unexpected.length === 0, "Production-like scenario returned unexpected statuses");
assert(allSummary.slow.length / Math.max(allResults.length, 1) <= 0.05, "More than 5% of requests exceeded 6000ms");

console.log("\nhigh-traffic-smoke ok");
console.log("Not: Bu test gerçek ödeme veya gerçek AI üretimi başlatmaz; 50 eşzamanlı production-like kullanıcı davranışına yakın güvenli sinyal üretir.");
