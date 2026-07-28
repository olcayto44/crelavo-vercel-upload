import type { KeywordOpportunity } from "@/lib/seo-competitor-agent";

export type SeoActionPlanItem = {
  keyword: string;
  cluster: string;
  pageType: "landing" | "comparison" | "blog" | "free_tool";
  internalLinks: string[];
  brief: string;
  priority: "now" | "next" | "later";
};

function clusterFor(keyword: string) {
  const text = keyword.toLowerCase();
  if (/(shopify|woocommerce|ecommerce|product)/.test(text)) return "Ecommerce product video";
  if (/(website|site|saas|app|admin)/.test(text)) return "Website / SaaS production";
  if (/(video|ad|reklam|tiktok|shorts|reels)/.test(text)) return "AI video ads";
  if (/(seo|competitor|rakip|keyword)/.test(text)) return "Growth intelligence";
  return "General AI production";
}

function pageTypeFor(item: KeywordOpportunity): SeoActionPlanItem["pageType"] {
  if (item.difficulty === "hard") return "comparison";
  if (/generator|checker|tool/i.test(item.keyword)) return "free_tool";
  if (item.difficulty === "easy") return "blog";
  return "landing";
}

export function buildSeoActionPlan(opportunities: KeywordOpportunity[]): SeoActionPlanItem[] {
  return opportunities.slice(0, 10).map((item, index) => {
    const cluster = clusterFor(item.keyword);
    const pageType = pageTypeFor(item);
    return {
      keyword: item.keyword,
      cluster,
      pageType,
      internalLinks: ["/ai-video-generator", "/ai-ecommerce-builder", "/api-documentation", "/pricing"].slice(0, pageType === "comparison" ? 4 : 3),
      brief: `${item.keyword} için ${pageType} sayfası: özgün örnek, kredi/fiyat farkı, export-ready veya managed delivery açıklaması, FAQ ve gerçek guardrail ekle. ${item.action}`,
      priority: index < 3 ? "now" : index < 7 ? "next" : "later"
    };
  });
}
