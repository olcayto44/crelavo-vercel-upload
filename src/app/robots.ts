import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

  const privateDisallow = ["/admin", "/api", "/wp-admin"];
  // Dashboard/auth pages carry X-Robots-Tag: noindex from next.config.
  // Do not block them in robots.txt; Google must be allowed to crawl them once to see noindex and drop old parameter URLs from the index.

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privateDisallow
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privateDisallow
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privateDisallow
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privateDisallow
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privateDisallow
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
