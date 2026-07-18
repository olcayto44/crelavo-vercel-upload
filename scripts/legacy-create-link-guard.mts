import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const srcDir = join(root, "src");
const allowedFiles = new Set([
  "src/app/dashboard/create/page.tsx"
]);
const checkedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const forbiddenPatterns = [
  "/dashboard/create?",
  "href=\"/dashboard/create\"",
  "href='/dashboard/create'",
  "`/dashboard/create`",
  "'/dashboard/create'",
  "\"/dashboard/create\""
];

function extension(path: string) {
  const index = path.lastIndexOf(".");
  return index >= 0 ? path.slice(index) : "";
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) return walk(fullPath);
    return [fullPath];
  });
}

const offenders: string[] = [];
for (const file of walk(srcDir)) {
  if (!checkedExtensions.has(extension(file))) continue;
  const rel = relative(root, file).replaceAll("\\", "/");
  if (allowedFiles.has(rel)) continue;
  const content = readFileSync(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (content.includes(pattern)) offenders.push(`${rel}: ${pattern}`);
  }
}

if (offenders.length > 0) {
  throw new Error(`Legacy /dashboard/create link detected:\n${offenders.join("\n")}`);
}

console.log("legacy-create-link-guard ok");
