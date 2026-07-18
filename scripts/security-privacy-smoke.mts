import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

function listFiles(dir: string): string[] {
  const absolute = join(process.cwd(), dir);
  return readdirSync(absolute).flatMap((name) => {
    const child = join(dir, name);
    const childAbsolute = join(process.cwd(), child);
    return statSync(childAbsolute).isDirectory() ? listFiles(child) : [child];
  });
}

const robots = read("src/app/robots.ts");
const sitemap = read("src/app/sitemap.ts");
const adminLayout = read("src/app/admin/layout.tsx");
const dashboardLayout = read("src/app/dashboard/layout.tsx");
const authLayout = read("src/app/auth/layout.tsx");
const envExample = read(".env.example");
const stripeReadiness = read("src/app/api/admin/stripe-readiness/route.ts");
const packagesApi = read("src/app/api/admin/packages/route.ts");
const adConfig = read("src/lib/ad-config.ts");
const adminAdsPage = read("src/app/admin/ads/page.tsx");
const adminGuard = read("src/lib/admin-guard.ts");
const adminClientAuth = read("src/lib/admin-client-auth.ts");
const adminCredentialFields = read("src/components/AdminCredentialFields.tsx");
const adminApiTokenBanner = read("src/components/AdminApiTokenBanner.tsx");
const adminShell = read("src/components/AdminShell.tsx");
const sampleCommentsApi = read("src/app/api/samples/[id]/comments/route.ts");
const requestsApi = read("src/app/api/requests/route.ts");
const productionsApi = read("src/app/api/productions/route.ts");
const adminApiFiles = listFiles("src/app/api/admin").filter((file) => file.endsWith("route.ts"));

for (const term of ["/admin", "/api", "/dashboard", "/auth"]) {
  assert(robots.includes(term), `robots.ts must disallow private route: ${term}`);
}

for (const term of ["/admin", "/api", "/auth", "/dashboard", "/wp-admin", "Sitemap can only include public marketing routes"]) {
  assert(sitemap.includes(term), `sitemap.ts must guard private route: ${term}`);
}

for (const [name, source] of [["admin", adminLayout], ["dashboard", dashboardLayout], ["auth", authLayout]] as const) {
  assert(source.includes("index: false"), `${name} layout must set noindex`);
  assert(source.includes("follow: false"), `${name} layout must set nofollow`);
  assert(source.includes("noimageindex: true"), `${name} layout must set noimageindex`);
}

for (const source of [stripeReadiness, packagesApi]) {
  assert(source.includes("adminRequiredResponse"), "admin APIs must return the shared admin rejection response");
  assert(source.includes("isAdminRequest"), "admin APIs must use the token-aware shared admin guard");
}

assert(adConfig.includes("rejectSuspiciousText"), "ad-config must run suspicious text checks before public ad rendering");
assert(adConfig.includes("status: \"passive\""), "unsafe ad slots must be forced passive");
assert(adConfig.includes("code: \"\""), "unsafe ad slot HTML must be stripped");
assert(adminAdsPage.includes("hacklink patterns are blocked server-side"), "admin ads page must disclose server-side hacklink/script blocking");

assert(envExample.includes("ADMIN_API_TOKEN="), ".env.example must include ADMIN_API_TOKEN placeholder");
assert(adminGuard.includes("ADMIN_API_TOKEN"), "admin guard must check ADMIN_API_TOKEN");
assert(adminGuard.includes("x-admin-api-token"), "admin guard must support x-admin-api-token header");
assert(adminGuard.includes("if (!expectedAdminToken) return true"), "admin guard must allow pre-launch email-only mode when ADMIN_API_TOKEN is intentionally unset");
assert(adminClientAuth.includes("ADMIN_API_TOKEN_STORAGE_KEY"), "admin client auth must persist the admin token in browser storage");
assert(adminClientAuth.includes("x-admin-api-token"), "admin client auth must send x-admin-api-token header");
assert(adminCredentialFields.includes("type=\"password\""), "admin token field must be password-style input");
assert(adminApiTokenBanner.includes("getStoredAdminApiToken"), "admin token banner helper must read the saved admin token when used");
assert(adminCredentialFields.includes("rememberAdminApiToken"), "admin credential fields must persist the admin token when used");
assert(requestsApi.includes("isAdminRequest"), "requests API admin listing must use token-aware admin guard");
assert(productionsApi.includes("isAdminRequest"), "productions API admin listing/manual delivery must use token-aware admin guard");
for (const file of adminApiFiles) {
  const source = read(file);
  assert(source.includes("isAdminRequest"), `${file} must use the shared admin request guard`);
  assert(!/expectedAdminEmail|adminEmail !== expectedAdminEmail|function isAdmin|adminAllowed/.test(source), `${file} must not use email-only admin guard`);
}
assert(sampleCommentsApi.includes("rejectPublicCommentText"), "sample comments API must reject public links/hacklink text");
assert(sampleCommentsApi.includes("isAdminRequest"), "sample comment admin replies must use token-aware admin guard");

const forbiddenSecretPatterns = [
  /sk_live_[A-Za-z0-9_\-]+/,
  /sk_test_[A-Za-z0-9_\-]{12,}/,
  /whsec_[A-Za-z0-9_\-]+/,
  /rk_live_[A-Za-z0-9_\-]+/,
  /ghp_[A-Za-z0-9_\-]+/,
  /xoxb-[A-Za-z0-9_\-]+/
];

for (const pattern of forbiddenSecretPatterns) {
  assert(!pattern.test(envExample), `.env.example must not contain real secret-looking value: ${pattern}`);
}

for (const term of ["STRIPE_SECRET_KEY=", "RESEND_API_KEY=", "OPENAI_API_KEY=", "REPLICATE_API_TOKEN=", "SUPABASE_SERVICE_ROLE_KEY="]) {
  assert(envExample.includes(term), `.env.example missing required placeholder: ${term}`);
}

console.log("security-privacy-smoke ok");
