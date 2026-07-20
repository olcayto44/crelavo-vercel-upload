import { getConfiguredFaqItems } from "@/lib/faq-config";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export async function FaqStructuredData() {
  const faqs = await getConfiguredFaqItems();
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${siteUrl}/#faq`,
    url: `${siteUrl}/#faq`,
    name: "Crelavo frequently asked questions",
    description: "Answers about Crelavo production, credits, delivery, AI tools and AI + human quality assurance workflows.",
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
