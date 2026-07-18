import type { MetadataRoute } from "next";
import { footerInfoPages } from "@/lib/footer-info-pages";
import { alternativePages } from "@/lib/alternative-pages";
import { ecommerceIntegrationGuides } from "@/lib/ecommerce-integration-guides";
import { freeTools } from "@/lib/free-tools";
import { getConfiguredServicePages } from "@/lib/service-pages-loader";

const privateRoutePrefixes = ["/admin", "/api", "/auth", "/dashboard", "/wp-admin"];

const publicRoutes = [
  { path: "", priority: 1, changeFrequency: "weekly" as const },
  { path: "/categories", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/alternatives", priority: 0.88, changeFrequency: "weekly" as const },
  { path: "/tools", priority: 0.88, changeFrequency: "weekly" as const },
  { path: "/free-tools", priority: 0.86, changeFrequency: "weekly" as const },
  { path: "/pricing", priority: 0.9, changeFrequency: "monthly" as const },
  { path: "/live-sales-credits", priority: 0.84, changeFrequency: "monthly" as const },
  { path: "/growth-intelligence", priority: 0.84, changeFrequency: "monthly" as const },
  { path: "/drone-credits", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/chrome-extension", priority: 0.82, changeFrequency: "monthly" as const },
  { path: "/shopify-ai-product-video-app", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/woocommerce-ai-product-video-plugin", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/affiliate", priority: 0.78, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.72, changeFrequency: "monthly" as const },
  { path: "/styles", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/terms-of-service", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/privacy-policy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/refund-policy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/refund", priority: 0.45, changeFrequency: "yearly" as const },
  { path: "/cookie-policy", priority: 0.45, changeFrequency: "yearly" as const }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");
  const now = new Date();

  if (publicRoutes.some((route) => privateRoutePrefixes.some((prefix) => route.path.startsWith(prefix)))) {
    throw new Error("Sitemap can only include public marketing routes.");
  }

  const infoRoutes = footerInfoPages.map((page) => ({
    path: `/products/${page.slug}`,
    priority: 0.74,
    changeFrequency: "monthly" as const
  }));

  const configuredServicePages = await getConfiguredServicePages();
  const serviceRoutes = configuredServicePages
    .filter((page) => (page.status ?? "published") === "published" && page.includeInSitemap !== false)
    .map((page) => ({
      path: `/${page.slug}`,
      priority: page.seoPriority === "high" ? 0.88 : page.seoPriority === "low" ? 0.64 : 0.76,
      changeFrequency: page.seoPriority === "high" ? "weekly" as const : "monthly" as const
    }));

  const freeToolRoutes = freeTools.map((tool) => ({
    path: `/free-tools/${tool.slug}`,
    priority: 0.7,
    changeFrequency: "monthly" as const
  }));

  const alternativeRoutes = alternativePages.map((page) => ({
    path: `/alternatives/${page.slug}`,
    priority: 0.76,
    changeFrequency: "monthly" as const
  }));

  const blogGuideRoutes = ecommerceIntegrationGuides.map((guide) => ({
    path: `/blog/${guide.slug}`,
    priority: 0.78,
    changeFrequency: "monthly" as const
  }));

  return [...publicRoutes, ...serviceRoutes, ...alternativeRoutes, ...blogGuideRoutes, ...freeToolRoutes, ...infoRoutes]
    .filter((route) => !privateRoutePrefixes.some((prefix) => route.path.startsWith(prefix)))
    .map((route) => ({
      url: `${baseUrl}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority
    }));
}
