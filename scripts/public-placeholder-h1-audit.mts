import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const appDir = join(root, "src", "app");
const publicRouteBlocklist = ["admin", "dashboard", "api"];
const riskyTerms = ["lorem", "approved customer logo", "approved brand story", "TODO", "awaiting real", "fake proof", "secretly using", "winner ad", "guaranteed winner", "fake local", "unverified ROAS", "unverified CAC"];
const allowedPlaceholderContexts = ["placeholder=", "placeholder:", "customer-preview-placeholder", "final-video-placeholder", "delivery ZIP placeholders", "No Fake Proof Guard", "riskli söylemleri engellemek"];

function walk(dir: string, files: string[] = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (/\.(tsx|ts)$/.test(entry)) files.push(full);
  }
  return files;
}

function isPublicRoute(file: string) {
  const rel = relative(appDir, file).replace(/\\/g, "/");
  const first = rel.split("/")[0];
  return !publicRouteBlocklist.includes(first) && !rel.startsWith("api/");
}

const publicFiles = walk(appDir).filter(isPublicRoute);
const violations: string[] = [];

for (const file of publicFiles) {
  const rel = relative(root, file).replace(/\\/g, "/");
  const source = readFileSync(file, "utf8");
  const h1Count = (source.match(/<h1\b/g) ?? []).length;
  if (h1Count > 1) violations.push(`${rel}: multiple literal <h1> tags (${h1Count})`);
  for (const term of riskyTerms) {
    const index = source.toLowerCase().indexOf(term.toLowerCase());
    if (index === -1) continue;
    const context = source.slice(Math.max(0, index - 80), index + term.length + 80);
    if (allowedPlaceholderContexts.some((allowed) => context.includes(allowed))) continue;
    violations.push(`${rel}: risky public term "${term}"`);
  }
}

if (violations.length) {
  throw new Error(`public-placeholder-h1-audit failed:\n${violations.join("\n")}`);
}

console.log(`public-placeholder-h1-audit ok (${publicFiles.length} public route files scanned)`);
