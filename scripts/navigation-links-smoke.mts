import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import http from "node:http";

const port = Number(process.env.NAV_SMOKE_PORT ?? 3017);
const base = { hostname: "localhost", port };
let ownedServer: ChildProcessWithoutNullStreams | null = null;

const seeds = [
  "/",
  "/admin",
  "/admin/backup",
  "/admin/launch-readiness",
  "/admin/final-api-checklist",
  "/admin/manual-e2e-checklist",
  "/admin/payments",
  "/dashboard/payment",
  "/free-tools",
  "/dashboard/assistant-workspace",
  "/categories",
  "/pricing",
  "/tools",
  "/blog",
  "/contact"
];

type FetchResult = {
  status: number;
  body: string;
};

function fetchPath(path: string): Promise<FetchResult> {
  return new Promise((resolve) => {
    const req = http.request({ ...base, path, method: "GET" }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", (error) => resolve({ status: 0, body: String(error) }));
    req.end();
  });
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady() {
  const result = await fetchPath("/");
  return result.status >= 200 && result.status < 500;
}

async function ensureServer() {
  if (await isServerReady()) {
    console.log(`navigation smoke using existing server on port ${port}`);
    return;
  }

  console.log(`navigation smoke starting next server on port ${port}`);
  ownedServer = spawn(
    process.platform === "win32" ? "cmd" : "npx",
    process.platform === "win32" ? ["/c", "npx", "next", "start", "-p", String(port)] : ["next", "start", "-p", String(port)],
    { cwd: process.cwd(), stdio: "pipe", env: process.env }
  );

  ownedServer.stdout.on("data", (chunk) => process.stdout.write(String(chunk)));
  ownedServer.stderr.on("data", (chunk) => process.stderr.write(String(chunk)));

  for (let attempt = 1; attempt <= 40; attempt += 1) {
    if (await isServerReady()) {
      console.log(`navigation smoke server ready on port ${port}`);
      return;
    }
    await sleep(500);
  }

  throw new Error(`Navigation smoke server did not become ready on port ${port}. Run npm run build first, then retry.`);
}

async function cleanupServer() {
  if (!ownedServer) return;
  console.log(`navigation smoke stopping owned server on port ${port}`);
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(ownedServer.pid), "/T", "/F"]);
  } else {
    ownedServer.kill("SIGTERM");
  }
  ownedServer = null;
}

function cleanHref(input: string) {
  try {
    let href = input.replace(/&amp;/g, "&").trim();
    if (!href) return null;
    if (href.startsWith("#")) return null;
    if (href.startsWith("mailto:")) return null;
    if (href.startsWith("tel:")) return null;
    if (href.startsWith("javascript:")) return null;
    if (href.startsWith("http")) {
      const url = new URL(href);
      if (url.hostname !== "localhost" && !url.hostname.includes("clipora")) return null;
      href = `${url.pathname}${url.search}`;
    }
    if (!href.startsWith("/")) return null;
    return href.split("#")[0];
  } catch {
    return null;
  }
}

try {
  await ensureServer();

  const found = new Map<string, Set<string>>();

  for (const seed of seeds) {
    const result = await fetchPath(seed);
    console.log(`SEED ${result.status} ${seed}`);
    const hrefRegex = /href=["']([^"']+)["']/g;
    let match: RegExpExecArray | null;
    while ((match = hrefRegex.exec(result.body))) {
      const href = cleanHref(match[1]);
      if (!href) continue;
      if (href.startsWith("/_next") || href.startsWith("/api")) continue;
      if (!found.has(href)) found.set(href, new Set());
      found.get(href)?.add(seed);
    }
  }

  const targets = [...found.keys()].sort();
  const bad: { target: string; status: number; from: string[] }[] = [];

  for (const target of targets) {
    const result = await fetchPath(target);
    const ok = result.status >= 200 && result.status < 400;
    const from = [...(found.get(target) ?? [])];
    if (!ok) bad.push({ target, status: result.status, from });
    console.log(`${ok ? "OK" : "BAD"} ${result.status} ${target} <- ${from.join(",")}`);
  }

  console.log(`TOTAL_TARGETS=${targets.length}`);
  console.log(`BAD_COUNT=${bad.length}`);

  if (bad.length) {
    console.log(JSON.stringify(bad, null, 2));
    process.exitCode = 1;
  } else {
    console.log("navigation-links-smoke ok");
  }
} finally {
  await cleanupServer();
}
