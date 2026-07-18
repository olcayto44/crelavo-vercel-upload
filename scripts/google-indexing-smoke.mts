import { readFileSync } from "node:fs";
import { join } from "node:path";

const indexing = readFileSync(join(process.cwd(), "src", "lib", "google-indexing.ts"), "utf8");
const adminSeo = readFileSync(join(process.cwd(), "src", "app", "admin", "seo", "page.tsx"), "utf8");
const sitemap = readFileSync(join(process.cwd(), "src", "app", "sitemap.ts"), "utf8");
const robots = readFileSync(join(process.cwd(), "src", "app", "robots.ts"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");

for (const term of [
  "googleIndexingSubmittedUrls",
  "googleIndexingContinuationUrls",
  "googleIndexingGuardrails",
  "googleIndexingAllSitemapUrls",
  "googleIndexingSitemapUrls",
  "ready_for_manual_submit",
  "already_submitted",
  "/free-tools/landing-page-copy-generator",
  "/free-tools/ad-copy-generator",
  "/growth-intelligence",
  "/live-sales-credits",
  "/affiliate",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/refund-policy"
]) {
  if (!indexing.includes(term)) throw new Error(`Google indexing lib missing term: ${term}`);
}

for (const term of [
  "Google indexing continuation",
  "Search Console devam listesi 12. URL’den başlıyor",
  "Full sitemap master list",
  "Tüm gönderilebilir public sitemap URL’leri",
  "googleIndexingAllSitemapUrls",
  "Already submitted",
  "Ready next",
  "URL 12",
  "googleIndexingContinuationUrls",
  "googleIndexingGuardrails",
  "Search Console URL submission manuel yapılır"
]) {
  if (!adminSeo.includes(term)) throw new Error(`Admin SEO page missing term: ${term}`);
}

for (const route of [
  "/free-tools/landing-page-copy-generator",
  "/free-tools/ad-copy-generator",
  "/growth-intelligence",
  "/live-sales-credits",
  "/affiliate",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/refund-policy"
]) {
  if (!sitemap.includes(route) && !indexing.includes(route)) throw new Error(`Indexing continuation route missing: ${route}`);
}

if (!robots.includes('allow: "/"')) throw new Error("robots allow rule missing");
if (!robots.includes("sitemap")) throw new Error("robots sitemap declaration missing");
if (!packageJson.includes("smoke:google-indexing")) throw new Error("package.json missing smoke:google-indexing script");

console.log("google-indexing-smoke ok");
