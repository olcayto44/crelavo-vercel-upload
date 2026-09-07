import { publicProFaqs } from "@/lib/public-pro-faq";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export async function FaqStructuredData() {
  const faqs = publicProFaqs;
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    url: `${siteUrl}/#faq`,
    name: "Crelavo frequently asked questions",
    description: "Answers about the Crelavo Pro 24-hour trial, billing, cancellation and production access.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#app` },
    inLanguage: "en-US",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      "@id": `${siteUrl}/#faq-${item.id}`,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
