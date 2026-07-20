import { packages, topUpPackages } from "@/lib/data";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export function PricingStructuredData() {
  const offers = [...packages, ...topUpPackages].map((item) => ({
    "@type": "Offer",
    name: `${item.name} — ${item.billing}`,
    description: item.description,
    price: item.priceUsd,
    priceCurrency: "USD",
    availability: "https://schema.org/OnlineOnly",
    url: `${siteUrl}/pricing`,
    category: item.planType === "subscription" ? "Subscription" : "Credit top-up",
    eligibleQuantity: { "@type": "QuantitativeValue", value: item.credits, unitText: "credits" },
    itemOffered: {
      "@type": "SoftwareApplication",
      name: `Crelavo ${item.name}`,
      applicationCategory: ["BusinessApplication", "MultimediaApplication"],
      operatingSystem: "Web",
      provider: { "@id": `${siteUrl}/#organization` }
    },
    priceSpecification: {
      "@type": "PriceSpecification",
      price: item.priceUsd,
      priceCurrency: "USD",
      valueAddedTaxIncluded: false,
      billingDuration: item.planType === "subscription" ? "P1M" : undefined
    }
  }));

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/pricing#webpage`,
        url: `${siteUrl}/pricing`,
        name: "Crelavo pricing and credit packages",
        description: "Compare Crelavo credit packages, subscriptions, production estimates and delivery-ready AI + human QA production paths.",
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
        inLanguage: "en-US"
      },
      {
        "@type": "OfferCatalog",
        "@id": `${siteUrl}/pricing#offer-catalog`,
        name: "Crelavo pricing and AI production credit packages",
        url: `${siteUrl}/pricing`,
        itemListElement: offers
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
