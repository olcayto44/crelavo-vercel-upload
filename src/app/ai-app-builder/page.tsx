import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { getConfiguredServicePage } from "@/lib/service-pages-loader";

const slug = "ai-app-builder";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getConfiguredServicePage(slug);
  if (!page || page.status === "draft") return {};
  const noindex = page.status === "noindex" || page.includeInSitemap === false;
  return { title: `${page.title} — ${page.keyword} Service`, description: page.summary, alternates: { canonical: `/${slug}` }, openGraph: { title: page.title, description: page.summary, url: `/${slug}`, type: "website" }, robots: noindex ? { index: false, follow: true } : { index: true, follow: true } };
}

export default async function Page() {
  const page = await getConfiguredServicePage(slug);
  if (!page || page.status === "draft") notFound();
  return <ServicePageView page={page} />;
}
