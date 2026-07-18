import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const envPath = join(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  throw new Error(".env.local is missing. Create it before manual/provider/payment E2E testing.");
}

const content = readFileSync(envPath, "utf8");
const env: Record<string, string> = {};
const seenKeys = new Set<string>();
const duplicateKeys = new Set<string>();
const malformedAssignments: string[] = [];
for (const rawLine of content.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith("#")) continue;
  const index = line.indexOf("=");
  if (index <= 0) continue;
  const key = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim().replace(/^[\'\"]|[\'\"]$/g, "");
  if (seenKeys.has(key)) duplicateKeys.add(key);
  seenKeys.add(key);
  if (new RegExp(`[A-Z0-9_]+\\s*=`).test(value)) malformedAssignments.push(key);
  env[key] = value;
}


function has(key: string) {
  return Boolean(env[key] && !env[key].includes("your_") && !env[key].includes("TODO") && !env[key].includes("change_me"));
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "ADMIN_EMAIL",
  "OPENAI_API_KEY",
  "RESEND_API_KEY"
];

const provider = (env.VIDEO_PROVIDER || env.GENERATION_PROVIDER || "runway").toLowerCase();
const providerRequired: Record<string, string[][]> = {
  replicate: [["REPLICATE_API_TOKEN"]],
  runway: [["RUNWAY_API_KEY"]],
  kling: [["KLING_API_KEY"]],
  fal: [["FAL_KEY", "FAL_API_KEY"]]
};

const missing = required.filter((key) => !has(key));
const providerMissing = (providerRequired[provider] ?? [])
  .filter((aliases) => !aliases.some((key) => has(key)))
  .map((aliases) => aliases.join(" or "));

if (missing.length > 0 || providerMissing.length > 0 || duplicateKeys.size > 0 || malformedAssignments.length > 0) {
  throw new Error([
    "Environment readiness failed.",
    missing.length ? `Missing required keys: ${missing.join(", ")}` : "Required app keys: ok",
    providerMissing.length ? `Missing provider keys for ${provider}: ${providerMissing.join(", ")}` : `Provider keys for ${provider}: ok`,
    duplicateKeys.size ? `Duplicate env keys: ${Array.from(duplicateKeys).join(", ")}` : "Duplicate env keys: ok",
    malformedAssignments.length ? `Malformed env assignment values: ${malformedAssignments.join(", ")}` : "Malformed env assignment values: ok"
  ].join("\n"));
}

const finalPhaseWarnings = [
  "SUPPORT_EMAIL",
  "SUPPORT_FROM_EMAIL",
  "LEMON_SQUEEZY_API_KEY",
  "LEMON_SQUEEZY_STORE_ID",
  "LEMON_SQUEEZY_WEBHOOK_SECRET",
  "ELEVENLABS_API_KEY",
  "SHOTSTACK_API_KEY"
].filter((key) => !has(key));

if (finalPhaseWarnings.length > 0) {
  console.warn(`env-readiness-smoke final-phase warnings: ${finalPhaseWarnings.join(", ")}`);
}

const optionalWarnings = [
  "RUNWAY_API_KEY",
  "KLING_API_KEY",
  "REPLICATE_MODEL",
  "FAL_VIDEO_MODEL",
  "R2_PUBLIC_URL",
  "INNGEST_EVENT_KEY",
  "INNGEST_SIGNING_KEY"
].filter((key) => !has(key));

if (optionalWarnings.length > 0) {
  console.warn(`env-readiness-smoke optional warnings: ${optionalWarnings.join(", ")}`);
}

console.log(`env-readiness-smoke ok (${provider})`);
