import type { KeywordOpportunity } from "@/lib/seo-competitor-agent";

export type SeoInternalLinkRecommendation = {
  from: string;
  to: string;
  anchor: string;
  reason: string;
};

export type SeoContentBrief = {
  h1: string;
  titleTag: string;
  metaDescription: string;
  intent: "commercial" | "comparison" | "informational" | "tool";
  sections: string[];
  faqs: string[];
  cta: string;
  guardrails: string[];
};

export type SeoActionPlanItem = {
  keyword: string;
  cluster: string;
  pageType: "landing" | "comparison" | "blog" | "free_tool";
  pageSlug: string;
  internalLinks: string[];
  internalLinkPlan: SeoInternalLinkRecommendation[];
  brief: string;
  contentBrief: SeoContentBrief;
  searchVolume: number | null;
  estimatedImpact: "high" | "medium" | "low";
  automationStatus: "ready_to_draft" | "needs_manual_review" | "monitor_only";
  priority: "now" | "next" | "later";
};

function slugify(keyword: string) {
  const slug = keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "seo-opportunity";
}

function clusterFor(keyword: string) {
  const text = keyword.toLowerCase();
  if (/(shopify|woocommerce|ecommerce|product|store|amazon|etsy)/.test(text)) return "Ecommerce product video";
  if (/(website|site|saas|app|admin|dashboard)/.test(text)) return "Website / SaaS production";
  if (/(video|ad|reklam|tiktok|shorts|reels|ugc|youtube|instagram)/.test(text)) return "AI video ads";
  if (/(seo|competitor|rakip|keyword|growth)/.test(text)) return "Growth intelligence";
  if (/(voice|dubbing|avatar|talking|heygen)/.test(text)) return "Avatar / voice production";
  return "General AI production";
}

function pageTypeFor(item: KeywordOpportunity): SeoActionPlanItem["pageType"] {
  if (/alternative|vs|compare|comparison/i.test(item.keyword) || item.difficulty === "hard") return "comparison";
  if (/generator|checker|tool|calculator|planner/i.test(item.keyword)) return "free_tool";
  if (item.difficulty === "easy") return "blog";
  return "landing";
}

function intentFor(pageType: SeoActionPlanItem["pageType"]): SeoContentBrief["intent"] {
  if (pageType === "comparison") return "comparison";
  if (pageType === "free_tool") return "tool";
  if (pageType === "blog") return "informational";
  return "commercial";
}

function basePathFor(pageType: SeoActionPlanItem["pageType"], slug: string) {
  if (pageType === "comparison") return `/alternatives/${slug}`;
  if (pageType === "free_tool") return `/free-tools/${slug}`;
  if (pageType === "blog") return `/blog/${slug}`;
  return `/${slug}`;
}

function estimatedImpact(item: KeywordOpportunity) {
  const volume = item.searchVolume ?? 0;
  if (item.ownRank && item.ownRank <= 10) return "medium" as const;
  if (volume >= 1000 || item.competitorRanks.some((rank) => rank.rank <= 3)) return "high" as const;
  if (volume >= 100 || item.competitorRanks.some((rank) => rank.rank <= 10)) return "medium" as const;
  return "low" as const;
}

function titleCaseKeyword(keyword: string) {
  return keyword.split(/\s+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function buildContentBrief(item: KeywordOpportunity, pageType: SeoActionPlanItem["pageType"], cluster: string): SeoContentBrief {
  const keywordTitle = titleCaseKeyword(item.keyword);
  const intent = intentFor(pageType);
  const h1 = pageType === "comparison"
    ? `${keywordTitle}: honest Crelavo comparison`
    : pageType === "free_tool"
      ? `${keywordTitle} free tool`
      : `${keywordTitle} for Crelavo customers`;

  return {
    h1,
    titleTag: `${keywordTitle} | Export-ready AI production with Crelavo`,
    metaDescription: `${keywordTitle} için Crelavo’nun export-ready, managed setup ve approval-gated üretim akışını karşılaştır; sahte otomatik yayın iddiası olmadan doğru sayfa planı.`,
    intent,
    sections: [
      `${keywordTitle} problemi ve arama niyeti`,
      `Crelavo bunu ${cluster} akışında nasıl çözer`,
      "Export-ready teslimat ve managed setup farkı",
      "Kredi, preview ve approval-gated automation açıklaması",
      pageType === "comparison" ? "Rakip karşılaştırması: bağlılık iddiası olmadan farklar" : "Uygulama örnekleri ve kullanım senaryoları",
      "SSS ve sonraki adım"
    ],
    faqs: [
      `${keywordTitle} Crelavo’da tam otomatik yayın yapar mı?`,
      "Export-ready teslimat ile live publish arasındaki fark nedir?",
      "Bu akış e-ticaret / sosyal medya üretiminde nasıl kullanılır?",
      "Final approval neden gereklidir?"
    ],
    cta: "Start with an export-ready production pack, then enable managed/approval-gated automation when provider permissions are ready.",
    guardrails: [
      "Sahte sonuç, sahte yorum, sahte ROAS veya sahte müşteri kanıtı yazma.",
      "Rakip markayla resmi bağlılık veya garanti edilmiş üstünlük iddiası kurma.",
      "Live auto-publish hazır değilse export-ready / managed setup / approval-gated automation çizgisini koru."
    ]
  };
}

function buildInternalLinkPlan(pagePath: string, keyword: string, pageType: SeoActionPlanItem["pageType"]): SeoInternalLinkRecommendation[] {
  const anchors = [
    { from: "/ai-video-generator", anchor: "AI video generator", reason: "Core product traffic from video intent." },
    { from: "/ai-ecommerce-builder", anchor: "AI ecommerce builder", reason: "Store/product video intent support." },
    { from: "/pricing", anchor: "Crelavo pricing and credits", reason: "Commercial evaluation and conversion support." },
    { from: "/api-documentation", anchor: "Crelavo API documentation", reason: "API/automation search intent support." }
  ];
  const selected = pageType === "comparison" ? anchors : anchors.slice(0, 3);
  return selected.map((item) => ({ ...item, to: pagePath, anchor: `${item.anchor} for ${keyword}` }));
}

function automationStatus(item: KeywordOpportunity, pageType: SeoActionPlanItem["pageType"]): SeoActionPlanItem["automationStatus"] {
  if (item.difficulty === "hard" || pageType === "comparison") return "needs_manual_review";
  if (item.ownRank && item.ownRank <= 10) return "monitor_only";
  return "ready_to_draft";
}

export function buildSeoActionPlan(opportunities: KeywordOpportunity[]): SeoActionPlanItem[] {
  return opportunities.slice(0, 12).map((item, index) => {
    const cluster = clusterFor(item.keyword);
    const pageType = pageTypeFor(item);
    const slug = slugify(item.keyword);
    const pageSlug = basePathFor(pageType, slug);
    const contentBrief = buildContentBrief(item, pageType, cluster);
    const internalLinkPlan = buildInternalLinkPlan(pageSlug, item.keyword, pageType);
    return {
      keyword: item.keyword,
      cluster,
      pageType,
      pageSlug,
      internalLinks: internalLinkPlan.map((link) => `${link.from} → ${link.to}`),
      internalLinkPlan,
      brief: `${item.keyword} için ${pageType} sayfası otomatik hazır: H1/title/meta, bölüm planı, FAQ, CTA, iç linkler ve guardrail’ler üretildi. ${item.action}`,
      contentBrief,
      searchVolume: item.searchVolume ?? null,
      estimatedImpact: estimatedImpact(item),
      automationStatus: automationStatus(item, pageType),
      priority: index < 4 ? "now" : index < 8 ? "next" : "later"
    };
  });
}
