import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { defaultCategoryPages } from "@/lib/category-pages";
import { getConfiguredCategoryPage } from "@/lib/category-pages-loader";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return defaultCategoryPages
    .filter((page) => page.slug !== "campaign")
    .map((page) => ({ categorySlug: page.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ categorySlug: string }> }): Promise<Metadata> {
  const { categorySlug } = await params;
  const page = await getConfiguredCategoryPage(categorySlug);
  if (!page || page.status === "draft") return {};
  const noindex = page.status === "noindex" || page.includeInSitemap === false;
  return {
    title: `${page.title} for Crelavo category search | Crelavo`,
    description: `${page.summary} Explore ${page.keyword} keywords, examples, FAQs and managed AI production delivery paths.`,
    alternates: { canonical: `/categories/${page.slug}` },
    openGraph: { title: page.title, description: page.summary, url: `/categories/${page.slug}`, type: "website" },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true }
  };
}

export default async function CategorySeoPage({ params }: { params: Promise<{ categorySlug: string }> }) {
  const { categorySlug } = await params;
  const page = await getConfiguredCategoryPage(categorySlug);
  if (!page || page.status === "draft") notFound();
  return <ServicePageView page={page} />;
}
