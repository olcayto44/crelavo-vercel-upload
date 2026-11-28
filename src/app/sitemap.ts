import {modelLocales,modelPath,modelAlternates} from "@/lib/ai-models";
import {isRetiredCategoryPath} from "@/lib/retired-categories";
import {localizedCategoryArt,localizedWebsiteConcepts} from "@/lib/category-localized-art";
import { studioSurfaces } from "@/lib/studio-surfaces";
import {publicVideoMetadata} from "@/lib/video-public-metadata";
import { getPublishedBlogPosts } from "@/lib/blog-posts-loader";
export const dynamic = "force-dynamic";
import type { MetadataRoute } from "next";
import { productionPagePath, productionSeoPages } from "@/lib/production-seo-pages";
import { footerInfoPages } from "@/lib/footer-info-pages";
import { alternativePages } from "@/lib/alternative-pages";
import { ecommerceIntegrationGuides } from "@/lib/ecommerce-integration-guides";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
import { freeTools } from "@/lib/free-tools";
import { localizedEuropePages } from "@/lib/localized-europe-pages";
import { getConfiguredServicePages } from "@/lib/service-pages-loader";
import { getConfiguredShowcaseVideos } from "@/lib/showcase-video-config";

import {categoryPublicPaths} from "@/lib/category-public-routes";
import {globalCategoryProfiles,globalCategoryLocales,globalCategoryPath,categoryLanguagePaths} from "@/lib/category-global-content";
import {turkishCategoryProfiles,turkishCategoryPath} from "@/lib/category-tr-content";
import {publicOrigin} from "@/lib/category-detail-meta";
const privateRoutePrefixes = ["/admin", "/api", "/auth", "/dashboard", "/wp-admin"];

function canonicalSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "");
  return configured.replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");
}

const publicRoutes = [
  ...modelLocales.flatMap(locale=>[modelPath(locale),modelPath(locale,"magi-2")].map(path=>({path,priority:0.85,changeFrequency:"weekly" as const}))),
  ...studioSurfaces.map(surface => ({ path: surface.path, priority: 0.85, changeFrequency: "monthly" as const })),
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/categories", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/alternatives", priority: 0.88, changeFrequency: "weekly" as const },
  { path: "/tools", priority: 0.88, changeFrequency: "weekly" as const },
  { path: "/free-tools", priority: 0.86, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/live-sales-credits", priority: 0.84, changeFrequency: "monthly" as const },
  { path: "/growth-intelligence", priority: 0.84, changeFrequency: "monthly" as const },
  { path: "/drone-credits", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/chrome-extension", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/ai-ugc-creator-program", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/ai-tool-launch-distribution-plan", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/ai-social-media-launch-plan", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/pinterest-youtube-visual-distribution-plan", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/shopify-ai-product-video-app", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/woocommerce-ai-product-video-plugin", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/affiliate", priority: 0.78, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.72, changeFrequency: "monthly" as const },
  { path: "/styles", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/terms-of-service", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy-policy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/refund-policy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/refund", priority: 0.45, changeFrequency: "yearly" as const },
  { path: "/cookie-policy", priority: 0.45, changeFrequency: "yearly" as const }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = publicOrigin;
  const now = new Date();

  if (publicRoutes.some((route) => privateRoutePrefixes.some((prefix) => route.path.startsWith(prefix)))) {
    throw new Error("Sitemap can only include public marketing routes.");
  }

  const infoRoutes = footerInfoPages.map((page) => ({
    path: `/products/${page.slug}`,
    priority: 0.74,
    changeFrequency: "monthly" as const
  }));

  const configuredServicePages = await getConfiguredServicePages();
  // Apply editorial visibility to all route sources, not just serviceRoutes.
  const excludedServicePaths = new Set(configuredServicePages
    .filter(page => (page.status ?? "published") !== "published" || page.includeInSitemap === false)
    .map(page => `/${page.slug}`));
  const serviceRoutes = configuredServicePages
    .filter((page) => (page.status ?? "published") === "published" && page.includeInSitemap !== false)
    .map((page) => ({
      path: `/${page.slug}`,
      priority: page.seoPriority === "high" ? 0.88 : page.seoPriority === "low" ? 0.64 : 0.76,
      changeFrequency: page.seoPriority === "high" ? "weekly" as const : "monthly" as const
    }));

  const freeToolRoutes = freeTools.map((tool) => ({
    path: `/free-tools/${tool.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const
  }));

  const alternativeRoutes = alternativePages.map((page) => ({
    path: `/alternatives/${page.slug}`,
    priority: 0.76,
    changeFrequency: "monthly" as const
  }));

  const blogGuideRoutes = ecommerceIntegrationGuides.map((guide) => ({
    path: `/blog/${guide.slug}`,
    priority: 0.78,
    changeFrequency: "monthly" as const
  }));

  const phaseOneFeatureRoutes = phaseOneFeaturePages.map((page) => ({
    path: `/${page.slug}`,
    priority: 0.8,
    changeFrequency: "monthly" as const
  }));

  const localizedEuropeRoutes = localizedEuropePages.map((page) => ({
    path: page.path,
    priority: 0.78,
    changeFrequency: "monthly" as const
  }));

  const configuredShowcaseVideos = await getConfiguredShowcaseVideos();
  const videoEntries=new Map(configuredShowcaseVideos.filter(v=>v.publishStatus==="published").map(v=>["/showcase/videos/"+v.id,publicVideoMetadata(v,baseUrl)]));
  const showcaseVideoRoutes = configuredShowcaseVideos
    .filter((video) => video.publishStatus === "published")
    .map((video) => ({
      path: `/showcase/videos/${video.id}`,
      priority: 0.82,
      changeFrequency: "weekly" as const,
      lastModified: new Date(video.uploadDate || now)
    }));

  const productionRoutes = productionSeoPages.map(page => ({ path: productionPagePath(page), priority: 0.8, changeFrequency: "monthly" as const }));

  const managedBlogRoutes = (await getPublishedBlogPosts()).map(post => ({ path: "/blog/" + post.slug, priority: 0.78, changeFrequency: "monthly" as const, lastModified: post.updatedAt || post.publishedAt! }));
  const configuredPaths = new Set(configuredServicePages.map(page=>`/${page.slug}`));
  const infoPaths = new Set(infoRoutes.map(route=>route.path));
  const categoryRoutes=Object.values(categoryPublicPaths).filter(path=>!path.startsWith("/products/")?(!configuredPaths.has(path)||!excludedServicePaths.has(path)):infoPaths.has(path)).map(path=>({path,priority:0.85,changeFrequency:"monthly" as const}));
  const trCategoryRoutes=Object.keys(turkishCategoryProfiles).filter(id=>categoryRoutes.some(route=>route.path===categoryPublicPaths[id])).map(id=>({path:turkishCategoryPath(id)!,priority:0.78,changeFrequency:"monthly" as const}));
  const globalRoutes=Object.keys(globalCategoryProfiles).filter(id=>categoryRoutes.some(route=>route.path===categoryPublicPaths[id])).flatMap(id=>globalCategoryLocales.map(locale=>({path:globalCategoryPath(id,locale)!,priority:0.78,changeFrequency:"monthly" as const}))); 
  const routes = [...categoryRoutes, ...trCategoryRoutes, ...globalRoutes, ...managedBlogRoutes, ...productionRoutes, ...publicRoutes, ...localizedEuropeRoutes, ...serviceRoutes, ...phaseOneFeatureRoutes, ...showcaseVideoRoutes, ...alternativeRoutes, ...blogGuideRoutes, ...freeToolRoutes, ...infoRoutes] as Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly"; lastModified?: string | Date }>;

  const eligible = routes.filter((route, index, all) => !isRetiredCategoryPath(route.path) && !excludedServicePaths.has(route.path) && !privateRoutePrefixes.some((prefix) => route.path.startsWith(prefix)) && all.findIndex(item => item.path === route.path) === index);
  const eligiblePaths = new Set(eligible.map(route => route.path));
  const languageAlternates = new Map<string, Record<string, string>>();
  // Publish only existing first-party artwork on eligible canonical category pages.
  const categoryImages = new Map<string,string[]>();
  const imageLocales = {"en-US":"en","tr-TR":"tr","de-DE":"de","fr-FR":"fr","zh-Hans":"zh"} as const;
  for (const id of Object.keys(categoryPublicPaths)) {
    const paths = categoryLanguagePaths(id);
    for (const [tag, locale] of Object.entries(imageLocales)) {
      const path = paths[tag];
      if (!path || !eligiblePaths.has(path)) continue;
      const hero = localizedCategoryArt(id,locale);
      const gallery = id==="website" ? localizedWebsiteConcepts(locale) : [];
      const images = [...new Set([...(hero?[hero.src]:[]),...gallery.map(x=>x.src)])];
      if (images.length) categoryImages.set(path,images.map(src=>baseUrl+src));
    }
  }
  for (const id of Object.keys(categoryPublicPaths)) {
    const paths = categoryLanguagePaths(id);
    if (!Object.values(paths).every(path => eligiblePaths.has(path))) continue;
    const languages = Object.fromEntries(Object.entries(paths).map(([tag, path]) => [tag, baseUrl + path]));
    for (const path of Object.values(paths)) languageAlternates.set(path, languages);
  }
  for(const id of [undefined,"magi-2"]){const paths=modelAlternates(id);if(Object.values(paths).every(path=>eligiblePaths.has(path))){const languages=Object.fromEntries(Object.entries(paths).map(([tag,path])=>[tag,baseUrl+path]));for(const path of Object.values(paths))languageAlternates.set(path,languages)}}
  return eligible.map((route) => ({
      url: `${baseUrl}${route.path}`,
      ...(route.lastModified?{lastModified:route.lastModified}:{}),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      ...(categoryImages.has(route.path)?{images:categoryImages.get(route.path)!}:{}),
      ...(languageAlternates.has(route.path) ? {alternates: {languages: languageAlternates.get(route.path)!}} : {}),
      ...(videoEntries.get(route.path)?{videos:[{title:videoEntries.get(route.path)!.name,description:videoEntries.get(route.path)!.description,thumbnail_loc:videoEntries.get(route.path)!.thumbnailUrl,content_loc:videoEntries.get(route.path)!.contentUrl,publication_date:videoEntries.get(route.path)!.uploadDate}]}:{})
    }));
}
