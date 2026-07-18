import { readFileSync } from "node:fs";
import { join } from "node:path";

const organicLib = readFileSync(join(process.cwd(), "src", "lib", "organic-directory.ts"), "utf8");
const adminGrowthPage = readFileSync(join(process.cwd(), "src", "app", "admin", "growth", "page.tsx"), "utf8");
const blogPage = readFileSync(join(process.cwd(), "src", "app", "blog", "page.tsx"), "utf8");
const homePage = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf8");
const sampleGallery = readFileSync(join(process.cwd(), "src", "components", "SampleVideoGallery.tsx"), "utf8");
const sampleDetail = readFileSync(join(process.cwd(), "src", "app", "samples", "[id]", "page.tsx"), "utf8");
const showcaseDetail = readFileSync(join(process.cwd(), "src", "app", "showcase", "[id]", "page.tsx"), "utf8");
const categoryBrowser = readFileSync(join(process.cwd(), "src", "components", "CategoryGroupBrowser.tsx"), "utf8");

for (const term of [
  "There’s An AI For That",
  "Futurepedia",
  "Toolify.ai",
  "OpenTools",
  "TopAI.tools",
  "AlternativeTo",
  "SaaSHub",
  "BetaList",
  "Product Hunt",
  "No Lemon application",
  "wait_until_final_whop_tests",
  "AI production studio",
  "AI video generator",
  "AI website builder",
  "AI app builder",
  "AI ecommerce campaign generator",
  "Growth Intelligence"
]) {
  if (!organicLib.includes(term)) throw new Error(`Organic directory library missing term: ${term}`);
}

for (const term of [
  "aiDirectorySubmissionKit",
  "aiDirectorySubmissionTargets",
  "organicKeywordCoverage",
  "No Lemon application",
  "Where to submit first",
  "Categories and keywords"
]) {
  if (!adminGrowthPage.includes(term)) throw new Error(`Admin growth page missing organic directory term: ${term}`);
}

for (const term of [
  "organicKeywordCoverage",
  "motion graphics",
  "stickman animation",
  "anime short film",
  "short drama",
  "cinematic video",
  "drone satellite video",
  "AI image generation",
  "visual style clone",
  "free AI tools",
  "Growth Intelligence"
]) {
  if (!blogPage.includes(term)) throw new Error(`Blog page missing expanded keyword term: ${term}`);
}

for (const term of ["15-30%", "30-day attribution", "Whop + manual ledger", "refunded/cancelled sales"]) {
  if (!homePage.includes(term)) throw new Error(`Homepage affiliate summary missing updated term: ${term}`);
}

for (const term of ["fallbackSampleVideoUrls", "samplePreviewUrl", "sample-card-video", "filter((item) => item.category"]) {
  if (!sampleGallery.includes(term)) throw new Error(`Sample gallery missing restored video preview term: ${term}`);
}

for (const term of ["fallbackSampleDetailVideoUrl", "sampleVideoUrl", "sample-detail-player-video"]) {
  if (!sampleDetail.includes(term)) throw new Error(`Sample detail missing restored video player term: ${term}`);
}

for (const term of ["fallbackShowcaseVideoUrl", "showcaseVideoUrl", "showcase-detail-video"]) {
  if (!showcaseDetail.includes(term)) throw new Error(`Showcase detail missing restored video player term: ${term}`);
}

for (const term of ["categoryPreviewVideos", "categoryPreviewVideo", "video preview", "sample-card-video"]) {
  if (!categoryBrowser.includes(term)) throw new Error(`Category browser missing restored category video preview term: ${term}`);
}

console.log("organic-directory-smoke ok");
