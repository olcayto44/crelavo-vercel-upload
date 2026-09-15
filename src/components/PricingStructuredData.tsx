const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export function PricingStructuredData() {
  const offers = [
    {
      "@type": "Offer",
      name: "Crelavo Pro monthly",
      description: "24-hour free trial, then $9.99 every 30 days unless cancelled in the customer portal.",
      price: 9.99,
      priceCurrency: "USD",
      availability: "https://schema.org/OnlineOnly",
      url: "/pricing#clp",
      category: "Subscription",
      priceSpecification: { "@type": "PriceSpecification", price: 9.99, priceCurrency: "USD", billingDuration: "P30D" }
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
        description: "24-hour Pro trial for $0, then $9.99/month unless cancelled in the customer portal.",
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
        highPrice: 9.99,
        offerCount: 1,
        priceCurrency: "USD",
        itemListElement: offers
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
