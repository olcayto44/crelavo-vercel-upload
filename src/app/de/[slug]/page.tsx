import {localizedCategoryArt} from "@/lib/category-localized-art";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocalizedEuropePage, localizedEuropePages, localizedLanguageAlternates } from "@/lib/localized-europe-pages";

import {globalCategoryId,globalCategoryProfiles} from "@/lib/category-global-content";
import {globalCategoryMeta,localizedCategoryVisibility} from "@/lib/category-global-meta";
import {GlobalCategoryPage} from "@/components/GlobalCategoryPage";
import {LocalizedVideoCategoryPage} from "@/components/LocalizedVideoCategoryPage";
export const dynamic="force-dynamic";
type LocalizedPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...localizedEuropePages.filter(page=>page.locale==="de").map(page=>({slug:page.slug})),...Object.values(globalCategoryProfiles).map(p=>({slug:p.de.slug}))];
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const id=globalCategoryId("de",slug);if(id)return globalCategoryMeta(id,"de");
  const locale = "de";
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) return { title: "Localized Crelavo page" };
  const art=localizedCategoryArt("video",locale);

  return {
    title: {absolute:page.title},
    description: page.description,
    keywords: page.keywords,
    alternates: {
      canonical: page.path,
      languages: {
        "en-US": "/ai-video-generator",
        ...localizedLanguageAlternates(),
        "x-default": "/ai-video-generator"
      }
    },
    openGraph: {
      title: page.title,
      description: page.description,
      url: page.path,
      type: "website",
      ...(art?{images:[{url:"https://www.crelavo.com"+art.src,alt:art.alt}]}:{})
    },
    twitter:{card:art?"summary_large_image":"summary",title:page.title,description:page.description,...(art?{images:["https://www.crelavo.com"+art.src]}:{})},
    robots: { index: true, follow: true }
  };
}

export default async function LocalizedEuropePage({ params }: LocalizedPageProps) {
  const { slug } = await params;
  const id=globalCategoryId("de",slug);if(id){if((await localizedCategoryVisibility(id)).draft)notFound();return <GlobalCategoryPage id={id} locale="de"/>;}
  const locale = "de";
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) notFound();

  return <LocalizedVideoCategoryPage page={page}/>;
}
