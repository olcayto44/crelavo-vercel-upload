import type { ServicePage } from "@/lib/service-pages";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com";

export function ServicePageStructuredData({ page }: { page: ServicePage }) {
  const pageUrl = `${siteUrl}/${page.slug}`;
  const graph: object[] = [
    {
      "@type": "BreadcrumbList",
      "@id": `${pageUrl}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
        { "@type": "ListItem", position: 2, name: page.title, item: pageUrl }
      ]
    },
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.summary,
      breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      keywords: [page.keyword, page.bestFor, ...(page.internalLinks ?? []).map((link) => link.label)].filter(Boolean),
      inLanguage: "en-US",
      isPartOf: { "@id": `${siteUrl}/#website` }
    },
    {
      "@type": "Service",
      "@id": `${pageUrl}#service`,
      name: page.title,
      serviceType: page.keyword,
      description: page.summary,
      provider: { "@id": `${siteUrl}/#organization` },
      areaServed: "Worldwide",
      audience: { "@type": "Audience", audienceType: page.bestFor },
      offers: {
        "@type": "Offer",
        url: pageUrl,
        availability: "https://schema.org/OnlineOnly",
        priceCurrency: "USD"
      }
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${pageUrl}#software`,
      name: page.title,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: pageUrl,
      description: page.summary,
      featureList: [...page.outputs, ...page.delivery].slice(0, 12),
      offers: {
        "@type": "Offer",
        url: `${siteUrl}/pricing`,
        priceCurrency: "USD",
        availability: "https://schema.org/OnlineOnly"
      }
    }
  ];

  if (page.faqItems?.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: page.faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    });
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": graph
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
