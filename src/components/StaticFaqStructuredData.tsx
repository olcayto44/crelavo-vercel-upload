const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export type StaticFaqItem = {
  question: string;
  answer: string;
};

export function StaticFaqStructuredData({
  pagePath,
  pageTitle,
  items
}: {
  pagePath: string;
  pageTitle: string;
  items: StaticFaqItem[];
}) {
  const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  const pageUrl = `${siteUrl}${normalizedPath}`;
  const safeItems = items.filter((item) => item.question.trim() && item.answer.trim());

  if (!safeItems.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: `${pageUrl}#faq`,
    name: `${pageTitle} frequently asked questions`,
    isPartOf: { "@id": `${pageUrl}#webpage` },
    inLanguage: "en-US",
    mainEntity: safeItems.map((item, index) => ({
      "@type": "Question",
      "@id": `${pageUrl}#faq-${index + 1}`,
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
