const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export function SiteStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Crelavo",
        url: siteUrl,
        description: "AI production studio for websites, apps, e-commerce product campaigns, ad videos, avatars, visuals, voice and managed creative delivery.",
        slogan: "From idea to production. From product link to campaign.",
        sameAs: []
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Crelavo",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/categories?query={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#app`,
        name: "Crelavo",
        applicationCategory: ["BusinessApplication", "MultimediaApplication"],
        operatingSystem: "Web",
        url: siteUrl,
        featureList: [
          "AI Website Builder",
          "AI App Builder",
          "AI Ecommerce Builder",
          "AI Video Generator",
          "AI Social Media AI",
          "AI Brand Kit Builder",
          "AI Ads Planner",
          "AI Dubbing and Voice",
          "Download-ready delivery packages",
          "Source ZIP, README and revision tracking"
        ],
        description: "Managed AI production platform for websites, apps, e-commerce product links, Shopify, Amazon and Trendyol campaigns, video ads, avatars, visuals, voice-over content and delivery-ready source packages.",
        offers: {
          "@type": "Offer",
          url: `${siteUrl}/pricing`,
          priceCurrency: "USD",
          availability: "https://schema.org/OnlineOnly",
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: 10,
            priceCurrency: "USD"
          }
        }
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
