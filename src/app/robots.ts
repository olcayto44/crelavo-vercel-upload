import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/dashboard", "/auth", "/wp-admin"]
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  };
}
