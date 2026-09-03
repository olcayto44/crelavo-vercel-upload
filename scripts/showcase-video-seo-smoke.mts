import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const config = readFileSync(join(root, "src", "lib", "showcase-video-config.ts"), "utf8");
const page = readFileSync(join(root, "src", "app", "showcase", "videos", "[id]", "page.tsx"), "utf8");
const detail = readFileSync(join(root, "src", "components", "ShowcaseVideoDetail.tsx"), "utf8");
const sitemap = readFileSync(join(root, "src", "app", "sitemap.ts"), "utf8");
const api = readFileSync(join(root, "src", "app", "api", "admin", "showcase-videos", "route.ts"), "utf8");
for (const term of ["getConfiguredShowcaseVideos", "publishStatus", "normalizeConfiguredShowcaseVideos", "showcase_videos"]) if (!config.includes(term) && !api.includes(term)) throw new Error(`Config term missing: ${term}`);
for (const term of ["VideoObject", "thumbnailUrl", "contentUrl", "uploadDate", "canonical"]) if (!detail.includes(term) && !page.includes(term)) throw new Error(`SEO term missing: ${term}`);
if (!sitemap.includes("getConfiguredShowcaseVideos") || !sitemap.includes("publishStatus")) throw new Error("Sitemap is not connected to published configured showcase videos");
console.log("showcase-video-seo-smoke ok");
