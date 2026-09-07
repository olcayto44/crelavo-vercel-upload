const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export function PricingStructuredData() {
  const offers = [
    {
      "@type": "Offer",
      name: "Crelavo Pro monthly",
      description: "24-hour free trial, then $9.99 every 30 days unless cancelled in Whop.",
      price: 9.99,
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
      url: "https://whop.com/checkout/plan_ujLQgM3kEg0dg",
      category: "Subscription",
      priceSpecification: { "@type": "PriceSpecification", price: 9.99, priceCurrency: "USD", billingDuration: "P30D" }
    },
    {
      "@type": "Offer",
      name: "Crelavo Pro annual",
      description: "24-hour free trial, then $99 per year unless cancelled in Whop.",
      price: 99,
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
      url: "https://whop.com/checkout/plan_fiabRYr6uWY43",
      category: "Subscription",
      priceSpecification: { "@type": "PriceSpecification", price: 99, priceCurrency: "USD", billingDuration: "P1Y" }
    }
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/pricing#webpage`,
        url: `${siteUrl}/pricing`,
        name: "Crelavo Pro pricing",
        description: "24-hour Pro trial for $0, then $9.99/month or $99/year unless cancelled in Whop.",
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        inLanguage: "en-US"
      },
      {
        "@type": "OfferCatalog",
        "@id": `${siteUrl}/pricing#offer-catalog`,
        name: "Crelavo Pro plans",
        url: `${siteUrl}/pricing`,
        lowPrice: 9.99,
        highPrice: 99,
        offerCount: 2,
        priceCurrency: "USD",
        itemListElement: offers
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
