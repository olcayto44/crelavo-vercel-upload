import type { FreeTool } from "@/lib/free-tools";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";

export function FreeToolStructuredData({ tool }: { tool: FreeTool }) {
  const pageUrl = `${siteUrl}/free-tools/${tool.slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Free AI Tools", item: `${siteUrl}/free-tools` },
          { "@type": "ListItem", position: 3, name: tool.title, item: pageUrl }
        ]
      },
      {
        "@type": "WebApplication",
        "@id": `${pageUrl}#webapp`,
        name: tool.title,
        url: pageUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        browserRequirements: "Modern web browser",
        description: tool.description,
        keywords: [tool.keyword, tool.category, "free AI tool", "Crelavo"],
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: 0,
          priceCurrency: "USD",
          availability: "https://schema.org/OnlineOnly"
        },
        potentialAction: {
          "@type": "CreateAction",
          target: pageUrl,
          name: `Generate ${tool.keyword}`
        }
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${tool.title} — Free AI Tool`,
        description: tool.description,
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-US",
        isPartOf: { "@id": `${siteUrl}/#website` }
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
