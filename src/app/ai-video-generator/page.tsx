import type { Metadata } from "next";
import {categoryDetailMeta} from "@/lib/category-detail-meta";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { localizedLanguageAlternates } from "@/lib/localized-europe-pages";
import { getConfiguredServicePage } from "@/lib/service-pages-loader";

const slug = "ai-video-generator";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getConfiguredServicePage(slug);
  if (!page || page.status === "draft") return {};
  const noindex = page.status === "noindex" || page.includeInSitemap === false;
  return categoryDetailMeta("video",!noindex,{"en-US":"/ai-video-generator",...localizedLanguageAlternates(),"x-default":"/ai-video-generator"});
}

export default async function Page() {
  const page = await getConfiguredServicePage(slug);
  if (!page || page.status === "draft") notFound();
  return <ServicePageView page={page} />;
}
