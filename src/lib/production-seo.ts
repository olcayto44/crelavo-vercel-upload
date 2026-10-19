import type { Metadata } from "next";
import { productionOfferTerms, productionPagePath, type ProductionSeoPage } from "./production-seo-pages";

export function productionSiteUrl() {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.crelavo.com").origin;
    return origin === "https://crelavo.com" ? "https://www.crelavo.com" : origin;
  } catch { return "https://www.crelavo.com"; }
}

export function productionMetadata(page: ProductionSeoPage): Metadata {
  const url = productionSiteUrl() + productionPagePath(page);
  return {
    title: { absolute: page.title }, description: page.description,
    alternates: { canonical: url }, robots: { index: true, follow: true },
    openGraph: { title: page.title, description: page.description, url,
      type: page.section === "blog" ? "article" : "website", locale: "en_US", siteName: "Crelavo",
      images: [{ url: productionSiteUrl() + "/showcase/ai-production-studio.webp", alt: "Crelavo AI production studio" }] },
    twitter: { card: "summary_large_image", title: page.title, description: page.description,
      images: [productionSiteUrl() + "/showcase/ai-production-studio.webp"] }
  };
}

export function productionStructuredData(page: ProductionSeoPage) {
  const site = productionSiteUrl();
  const url = site + productionPagePath(page);
  const applicationId = site + "/#production-software";
  const sectionName = page.section === "blog" ? "Guides" : page.section === "tools" ? "Tools" : "Alternatives";
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "SoftwareApplication", "@id": applicationId, name: "Crelavo", url: site,
        operatingSystem: "Web", applicationCategory: "BusinessApplication",
        description: "Enterprise-grade AI video generator for e-commerce, AI movies, episodic AI series, AI music videos, and specialized talking avatars that automates URL-to-video creative workflows.",
        offers: { "@type": "Offer", price: "9.99", priceCurrency: "USD", url: site + "/pricing", description: productionOfferTerms,
          priceSpecification: { "@type": "UnitPriceSpecification", price: "9.99", priceCurrency: "USD", unitText: "month" } }
      },
      { "@type": "BreadcrumbList", "@id": url + "#breadcrumbs", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site },
        { "@type": "ListItem", position: 2, name: sectionName, item: site + "/" + page.section },
        { "@type": "ListItem", position: 3, name: page.label, item: url }
      ] },
      { "@type": "WebPage", "@id": url + "#webpage", url, name: page.title, description: page.description,
        inLanguage: "en", about: { "@id": applicationId }, breadcrumb: { "@id": url + "#breadcrumbs" } },
      ...(page.section === "blog" ? [{ "@type": "Article", "@id": url + "#article", headline: page.h1,
        description: page.description, mainEntityOfPage: { "@id": url + "#webpage" },
        author: { "@type": "Organization", name: "Crelavo", url: site }, publisher: { "@type": "Organization", name: "Crelavo", url: site },
        image: site + "/showcase/ai-production-studio.webp", inLanguage: "en" }] : []),
      { "@type": "FAQPage", "@id": url + "#faq", mainEntity: page.faq.map(item => ({
        "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer }
      })) }
    ]
  };
}

// Escape the HTML parser boundary, not just JSON string boundaries.
export function serializeProductionJsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
