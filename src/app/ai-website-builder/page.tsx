import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicePageView } from "@/components/ServicePageView";
import { getConfiguredServicePage } from "@/lib/service-pages-loader";
const slug = "ai-website-builder";
export async function generateMetadata(): Promise<Metadata> {
 const page = await getConfiguredServicePage(slug);
 if (!page || page.status === "draft") return {};
 return {title: page.title + " | Crelavo", description: page.summary, alternates: {canonical: "https://www.crelavo.com/" + slug}, openGraph: {title: page.title, description: page.summary, url: "https://www.crelavo.com/" + slug, type: "website"}, robots: {index: page.status !== "noindex" && page.includeInSitemap !== false, follow: true}};
}
export default async function Page() {
 const page = await getConfiguredServicePage(slug);
 if (!page || page.status === "draft") notFound();
 return <ServicePageView page={page} />;
}
