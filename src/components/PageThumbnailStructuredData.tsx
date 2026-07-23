const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

export const defaultSearchThumbnail = {
  path: "/showcase/ai-production-studio.webp",
  width: 1792,
  height: 1024,
  alt: "Crelavo AI production studio dashboard preview"
};

type PageThumbnailStructuredDataProps = {
  pagePath: string;
  pageTitle: string;
  pageDescription: string;
  imagePath?: string;
  imageAlt?: string;
  pageType?: "WebPage" | "CollectionPage";
};

function absoluteUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function PageThumbnailStructuredData({
  pagePath,
  pageTitle,
  pageDescription,
  imagePath = defaultSearchThumbnail.path,
  imageAlt = defaultSearchThumbnail.alt,
  pageType = "WebPage"
}: PageThumbnailStructuredDataProps) {
  const pageUrl = absoluteUrl(pagePath);
  const imageUrl = absoluteUrl(imagePath);
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ImageObject",
        "@id": `${pageUrl}#primary-image`,
        url: imageUrl,
        contentUrl: imageUrl,
        width: defaultSearchThumbnail.width,
        height: defaultSearchThumbnail.height,
        name: imageAlt,
        caption: imageAlt,
        representativeOfPage: true
      },
      {
        "@type": pageType,
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: pageTitle,
        description: pageDescription,
        isPartOf: { "@id": `${siteUrl}/#website` },
        primaryImageOfPage: { "@id": `${pageUrl}#primary-image` },
        image: { "@id": `${pageUrl}#primary-image` },
        thumbnailUrl: imageUrl,
        inLanguage: "en-US"
      }
    ]
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
