import type { Metadata } from "next";
import {categoryDetailMeta} from "@/lib/category-detail-meta";
import {categoryForPublicPath} from "@/lib/category-public-routes";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { InnerMobileNav } from "@/components/InnerMobileNav";
import { servicePages } from "@/lib/service-pages";
import { getConfiguredServicePage } from "@/lib/service-pages-loader";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return servicePages.map((page) => ({ serviceSlug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ serviceSlug: string }> }): Promise<Metadata> {
  const { serviceSlug } = await params;
  const page = await getConfiguredServicePage(serviceSlug);
  if (!page || page.status === "draft") return {};
  const noindex = page.status === "noindex" || page.includeInSitemap === false;
  const categoryId=categoryForPublicPath("/"+page.slug);if(categoryId)return categoryDetailMeta(categoryId,!noindex);
  return {
    title: `${page.title} | Crelavo`,
    description: page.summary,
    alternates: {
      canonical: `/${page.slug}`,
      languages: {
        "en-US": `/${page.slug}`,
        "x-default": `/${page.slug}`
      }
    },
    openGraph: { title: page.title, description: page.summary, url: `/${page.slug}`, type: "website" },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function DynamicServicePage({ params }: { params: Promise<{ serviceSlug: string }> }) {
  const { serviceSlug } = await params;
  const page = await getConfiguredServicePage(serviceSlug);
  if (!page || page.status === "draft") notFound();
  return <><InnerMobileNav /><ServicePageView page={page} /></>;
}
