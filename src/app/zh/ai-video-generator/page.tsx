import {localizedCategoryArt} from "@/lib/category-localized-art";
import {LocalizedVideoCategoryPage} from "@/components/LocalizedVideoCategoryPage";
import type { Metadata } from "next";
import { getLocalizedEuropePage, localizedLanguageAlternates } from "@/lib/localized-europe-pages";
import { productionSiteUrl } from "@/lib/production-seo";

const page = getLocalizedEuropePage("zh", "ai-video-generator")!;
const siteUrl = productionSiteUrl();
const url = siteUrl + page.path;
const art=localizedCategoryArt("video","zh");

export const metadata: Metadata = {
  title: { absolute: page.title }, description: page.description, keywords: page.keywords,
  alternates: { canonical: url, languages: { "en-US": "/ai-video-generator", ...localizedLanguageAlternates(), "x-default": "/ai-video-generator" } },
  openGraph: { title: page.title, description: page.description, url, type: "website", locale: "zh_CN", siteName: "Crelavo",
    ...(art?{images:[{url:"https://www.crelavo.com"+art.src,alt:art.alt}]}:{}) },
  twitter: { card: art?"summary_large_image":"summary", title: page.title, description: page.description, ...(art?{images:["https://www.crelavo.com"+art.src]}:{}) },
  robots: { index: true, follow: true }
};

export default function ChineseVideoGeneratorPage(){return <LocalizedVideoCategoryPage page={page}/>;}
