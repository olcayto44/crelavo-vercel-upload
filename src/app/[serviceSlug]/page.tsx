import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
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
  return {
    title: `${page.title} for ${page.bestFor} | Crelavo`,
    description: `${page.summary} Explore ${page.keyword} keywords, categories, pricing, examples and managed AI production delivery paths.`,
    alternates: { canonical: `/${page.slug}` },
    openGraph: { title: page.title, description: page.summary, url: `/${page.slug}`, type: "website" },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function DynamicServicePage({ params }: { params: Promise<{ serviceSlug: string }> }) {
  const { serviceSlug } = await params;
  const page = await getConfiguredServicePage(serviceSlug);
  if (!page || page.status === "draft") notFound();
  return <ServicePageView page={page} />;
}
