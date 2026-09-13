import type { MetadataRoute } from "next";

const privateDisallow = ["/admin", "/api", "/dashboard"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: [...privateDisallow, "/wp-admin"] },
      { userAgent: "GPTBot", allow: "/", disallow: privateDisallow },
      { userAgent: "ChatGPT-User", allow: "/", disallow: privateDisallow },
      { userAgent: "ClaudeBot", allow: "/", disallow: privateDisallow },
      { userAgent: "Anthropic-AI", allow: "/", disallow: privateDisallow },
      { userAgent: "PerplexityBot", allow: "/", disallow: privateDisallow },
      { userAgent: "Google-Extended", allow: "/", disallow: privateDisallow },
      { userAgent: "Applebot-Extended", allow: "/", disallow: privateDisallow },
      { userAgent: "CCBot", allow: "/", disallow: privateDisallow }
    ],
    host: "https://www.crelavo.com",
    sitemap: "https://www.crelavo.com/sitemap.xml"
  };
}
