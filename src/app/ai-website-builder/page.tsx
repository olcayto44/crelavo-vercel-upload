import type { Metadata } from "next";
import {categoryDetailMeta} from "@/lib/category-detail-meta";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { getConfiguredServicePage } from "@/lib/service-pages-loader";
const slug = "ai-website-builder";
export async function generateMetadata(): Promise<Metadata> {
 const page = await getConfiguredServicePage(slug);
 if (!page || page.status === "draft") return categoryDetailMeta("website",page.status!=="noindex"&&page.includeInSitemap!==false);
}
export default async function Page() {
 const page = await getConfiguredServicePage(slug);
 if (!page || page.status === "draft") notFound();
 return <ServicePageView page={page} />;
}
