import { freeTools } from "@/lib/free-tools";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";

export function FreeToolsHubStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${siteUrl}/free-tools#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "Free AI Tools", item: `${siteUrl}/free-tools` }
        ]
      },
      {
        "@type": "CollectionPage",
        "@id": `${siteUrl}/free-tools#collection`,
        url: `${siteUrl}/free-tools`,
        name: "Free AI Tools — Crelavo",
        description: "Free AI tools for ad reference analysis, hooks, prompts, product descriptions, captions, hashtags, landing page copy, ad copy and brand slogans.",
        breadcrumb: { "@id": `${siteUrl}/free-tools#breadcrumb` },
        inLanguage: "en-US",
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: freeTools.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${siteUrl}/free-tools/${tool.slug}`,
            name: tool.title,
            description: tool.description
          }))
        }
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
