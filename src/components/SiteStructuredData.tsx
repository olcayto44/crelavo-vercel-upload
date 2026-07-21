const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

const coreProductionPaths = [
  { name: "AI Product Video Generator", url: `${siteUrl}/ai-product-video-generator`, description: "Product links, briefs and ad ideas into campaign-ready product video workflows." },
  { name: "AI Ad Performance Score Checker", url: `${siteUrl}/ai-ad-performance-score-checker`, description: "Score hooks, CTA clarity and creative weaknesses before spending production credits." },
  { name: "AI Virtual Model Studio", url: `${siteUrl}/ai-virtual-model-studio`, description: "Create model-style ecommerce visuals for fashion, jewelry, beauty and catalog campaigns." },
  { name: "AI Cultural Localization", url: `${siteUrl}/ai-cultural-localization`, description: "Adapt hooks, scripts, CTA and buyer psychology for country-specific markets." },
  { name: "AI Website Builder", url: `${siteUrl}/ai-website-builder`, description: "Plan and deliver landing pages, websites and source handoff packages." },
  { name: "Pricing and Credits", url: `${siteUrl}/pricing`, description: "Review credit packages, production estimates and delivery-ready pricing paths." }
];

export function SiteStructuredData() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Crelavo",
        url: siteUrl,
        description: "AI production studio for websites, apps, e-commerce product campaigns, ad videos, avatars, visuals, voice and AI + human QA delivery.",
        slogan: "From idea to production. From product link to campaign.",
        foundingDate: "2026",
        areaServed: "Worldwide",
        knowsAbout: [
          "AI video generation",
          "AI website production",
          "AI app production",
          "Ecommerce campaign production",
          "Product video ads",
          "AI ad scoring",
          "Cultural localization",
          "Virtual model visuals",
          "Voice-over production",
          "Human quality assurance"
        ],
        sameAs: []
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Crelavo",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en-US",
        about: { "@id": `${siteUrl}/#app` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/categories?query={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#homepage`,
        url: siteUrl,
        name: "Crelavo AI Production Studio",
        description: "Create videos, websites, ads and campaign assets from one AI workspace with AI speed and human quality assurance.",
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        primaryImageOfPage: `${siteUrl}/og-image.png`,
        inLanguage: "en-US",
        mainEntity: { "@id": `${siteUrl}/#app` },
        potentialAction: [
          { "@type": "CreateAction", target: `${siteUrl}/dashboard/create`, name: "Start Crelavo production" },
          { "@type": "AssessAction", target: `${siteUrl}/free-tools/ad-performance-score-checker`, name: "Score an ad for free" },
          { "@type": "ViewAction", target: `${siteUrl}/pricing`, name: "View Crelavo pricing and credits" }
        ]
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#app`,
        name: "Crelavo",
        alternateName: "Crelavo AI Production Studio",
        applicationCategory: ["BusinessApplication", "MultimediaApplication", "DesignApplication"],
        operatingSystem: "Web",
        browserRequirements: "Requires a modern web browser",
        url: siteUrl,
        provider: { "@id": `${siteUrl}/#organization` },
        audience: [
          { "@type": "Audience", audienceType: "Ecommerce teams" },
          { "@type": "Audience", audienceType: "Creators" },
          { "@type": "Audience", audienceType: "Agencies" },
          { "@type": "Audience", audienceType: "Business owners" }
        ],
        featureList: [
          "AI product video generation",
          "AI website builder workflows",
          "AI app production workflows",
          "AI ecommerce campaign planning",
          "AI ad performance scoring",
          "AI virtual model visuals",
          "AI cultural localization",
          "AI voice-over and dubbing",
          "AI brand kit production",
          "Source ZIP, README and revision tracking",
          "Dashboard delivery packages",
          "AI + human quality assurance"
        ],
        description: "AI + human QA production platform for websites, apps, e-commerce product links, Shopify, Amazon and Trendyol campaigns, video ads, avatars, visuals, voice-over content and delivery-ready source packages.",
        offers: {
          "@type": "AggregateOffer",
          url: `${siteUrl}/pricing`,
          priceCurrency: "USD",
          availability: "https://schema.org/OnlineOnly",
          lowPrice: 10,
          offerCount: 6
        }
      },
      {
        "@type": "Service",
        "@id": `${siteUrl}/#production-service`,
        name: "AI + Human QA creative production service",
        serviceType: "AI production studio",
        provider: { "@id": `${siteUrl}/#organization` },
        areaServed: "Worldwide",
        audience: { "@type": "Audience", audienceType: "Ecommerce teams, creators, agencies and businesses" },
        description: "Crelavo turns product links, campaign ideas and business briefs into videos, websites, apps, visual assets, voice-over content and delivery-ready production packages.",
        offers: { "@type": "Offer", url: `${siteUrl}/pricing`, priceCurrency: "USD", availability: "https://schema.org/OnlineOnly" }
      },
      {
        "@type": "ItemList",
        "@id": `${siteUrl}/#core-production-paths`,
        name: "Core Crelavo production paths",
        itemListElement: coreProductionPaths.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: item.url,
          name: item.name,
          description: item.description
        }))
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
