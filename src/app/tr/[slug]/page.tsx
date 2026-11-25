import type { Metadata } from "next";
import {localizedCategoryArt} from "@/lib/category-localized-art";
import { notFound } from "next/navigation";
import { getLocalizedEuropePage, localizedEuropePages, localizedLanguageAlternates } from "@/lib/localized-europe-pages";

import {categoryLanguagePaths} from "@/lib/category-global-content";
import {turkishCategoryProfiles,turkishCategoryId,turkishCategoryPath} from "@/lib/category-tr-content";
import {categoryPublicPaths} from "@/lib/category-public-routes";
import {publicOrigin} from "@/lib/category-detail-meta";
import {getConfiguredServicePage} from "@/lib/service-pages-loader";
import {TurkishCategoryPage} from "@/components/TurkishCategoryPage";
import {LocalizedVideoCategoryPage} from "@/components/LocalizedVideoCategoryPage";
export const dynamic="force-dynamic";
async function categoryVisibility(id:string){const path=categoryPublicPaths[id];const config=path.startsWith("/products/")?null:await getConfiguredServicePage(path.slice(1));return {draft:config?.status==="draft",index:config?.status!=="noindex"&&config?.includeInSitemap!==false};}
type LocalizedPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...localizedEuropePages.filter(page=>page.locale==="tr").map(page=>({slug:page.slug})),...Object.values(turkishCategoryProfiles).map(page=>({slug:page.slug}))];
}

export async function generateMetadata({ params }: LocalizedPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryId=turkishCategoryId(slug);
  if(categoryId){const p=turkishCategoryProfiles[categoryId],visibility=await categoryVisibility(categoryId),canonical=publicOrigin+turkishCategoryPath(categoryId)!;if(visibility.draft)return {};const art=localizedCategoryArt(categoryId,"tr");return {title:{absolute:p.title+" | Crelavo"},description:p.description,keywords:[],alternates:{canonical,...(visibility.index?{languages:Object.fromEntries(Object.entries(categoryLanguagePaths(categoryId)).map(([tag,path])=>[tag,publicOrigin+path]))}:{})},openGraph:{title:p.title+" | Crelavo",description:p.description,url:canonical,type:"website",locale:"tr_TR",...(art?{images:[{url:publicOrigin+art.src,alt:art.alt}]}:{})},twitter:{card:art?"summary_large_image":"summary",title:p.title,description:p.description,...(art?{images:[publicOrigin+art.src]}:{})},robots:{index:visibility.index,follow:true}};}
  const locale = "tr";
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
  const categoryId=turkishCategoryId(slug);
  if(categoryId){if((await categoryVisibility(categoryId)).draft)notFound();return <TurkishCategoryPage id={categoryId}/>;}
  const locale = "tr";
  const page = getLocalizedEuropePage(locale, slug);
  if (!page) notFound();

  return <LocalizedVideoCategoryPage page={page}/>;
}
