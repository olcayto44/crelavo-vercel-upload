import { footerInfoPages } from "@/lib/footer-info-pages";
import { freeTools } from "@/lib/free-tools";
import { servicePages } from "@/lib/service-pages";

export type GoogleIndexingUrl = {
  order: number;
  url: string;
  path: string;
  status: "ready_for_manual_submit" | "already_submitted" | "waiting";
  note: string;
};

const baseUrl = "https://www.crelavo.com";
const sitemapBaseUrl = "https://crelavo.com";

const alreadySubmittedPaths = [
  "/",
  "/categories",
  "/tools",
  "/free-tools",
  "/pricing",
  "/blog",
  "/ai-video-generator",
  "/ai-website-builder",
  "/ai-app-builder",
  "/ai-ecommerce-builder",
  "/free-tools/tiktok-hook-generator"
];

const priorityContinuationPaths = [
  "/free-tools/landing-page-copy-generator",
  "/free-tools/ad-copy-generator",
  "/growth-intelligence",
  "/live-sales-credits",
  "/affiliate",
  "/contact",
  "/terms-of-service",
  "/privacy-policy",
  "/refund-policy"
];

const publicMarketingPaths = [
  "/",
  "/categories",
  "/tools",
  "/free-tools",
  "/pricing",
  "/live-sales-credits",
  "/growth-intelligence",
  "/drone-credits",
  "/blog",
  "/affiliate",
  "/contact",
  "/styles",
  "/terms",
  "/terms-of-service",
  "/privacy",
  "/privacy-policy",
  "/refund-policy",
  "/refund",
  "/cookie-policy"
];

const servicePagePaths = servicePages
  .filter((page) => (page.status ?? "published") === "published" && page.includeInSitemap !== false)
  .map((page) => `/${page.slug}`);

const freeToolPaths = freeTools.map((tool) => `/free-tools/${tool.slug}`);
const productInfoPaths = footerInfoPages.map((page) => `/products/${page.slug}`);

function uniquePaths(paths: string[]) {
  return [...new Set(paths.map((path) => path === "" ? "/" : path))];
}

function toCanonicalUrl(path: string) {
  return `${baseUrl}${path === "/" ? "" : path}`;
}

function toSitemapUrl(path: string) {
  return `${sitemapBaseUrl}${path === "/" ? "" : path}`;
}

function makeUrl(order: number, path: string, note: string): GoogleIndexingUrl {
  const status = alreadySubmittedPaths.includes(path) ? "already_submitted" : "ready_for_manual_submit";
  return { order, url: toCanonicalUrl(path), path, status, note };
}

export const googleIndexingSubmittedUrls: GoogleIndexingUrl[] = alreadySubmittedPaths.map((path, index) => makeUrl(index + 1, path, "User already submitted this URL in Search Console."));

export const googleIndexingContinuationUrls: GoogleIndexingUrl[] = priorityContinuationPaths.map((path, index) => makeUrl(index + 12, path, index === 0 ? "Continue here after Search Console quota/waiting period." : "Submit manually in Search Console URL inspection."));

export const googleIndexingAllSitemapUrls: GoogleIndexingUrl[] = uniquePaths([
  ...publicMarketingPaths,
  ...servicePagePaths,
  ...freeToolPaths,
  ...productInfoPaths
]).map((path, index) => makeUrl(index + 1, path, alreadySubmittedPaths.includes(path) ? "Already submitted in Search Console." : "Present in sitemap and ready for manual Search Console URL inspection if not indexed."));

export const googleIndexingSitemapUrls = googleIndexingAllSitemapUrls.map((item) => toSitemapUrl(item.path));

export const googleIndexingGuardrails = [
  "Search Console submission is manual; do not pretend automated submission happened.",
  "Start priority continuation from URL 12 because user already submitted 1-11.",
  "Use the full sitemap list below as the no-missing-pages master checklist.",
  "All continuation URLs must return 200 and index, follow before manual submission.",
  "Do not touch Lemon; active payment path stays Whop."
];

export const searchEngineSubmitTargets = [
  {
    engine: "Google Search Console",
    action: "Continue manual URL inspection from the 12-20 list, then sweep the full sitemap master list.",
    status: "active"
  },
  {
    engine: "Bing Webmaster Tools",
    action: "Submit the sitemap and key public pages after Google is stable.",
    status: "ready"
  },
  {
    engine: "Yandex Webmaster",
    action: "Submit the sitemap and core public pages once the public URLs are clean and stable.",
    status: "ready"
  }
];

export const indexingChecklist = [
  "Homepage, pricing, categories and key landing pages return 200",
  "Sitemap contains all public URLs that should be indexed",
  "Noindex and canonical rules do not block public pages",
  "Google Search Console continuation starts from URL 12",
  "Bing and Yandex are submitted after Google stabilization",
  "Lemon remains postponed; Whop stays the active payment path"
];
