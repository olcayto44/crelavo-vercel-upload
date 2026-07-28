import { buildSeoActionPlan, type SeoActionPlanItem } from "@/lib/seo-action-plan";

export type SerpItemSummary = {
  title: string;
  url: string;
  domain: string;
  rank: number | null;
  description: string;
};

export type KeywordOpportunity = {
  keyword: string;
  ownRank: number | null;
  competitorRanks: Array<{ domain: string; rank: number }>;
  difficulty: "easy" | "medium" | "hard";
  searchVolume?: number | null;
  contentGap: string;
  action: string;
};

export type SeoCompetitorAnalysisReport = {
  generatedAt: string;
  ownDomain: string;
  competitors: string[];
  keywords: string[];
  locationName: string;
  languageCode: string;
  summary: {
    checkedKeywords: number;
    ownTop10Count: number;
    competitorTop10Wins: number;
    priority: string;
  };
  opportunities: KeywordOpportunity[];
  serpSnapshots: Array<{
    keyword: string;
    ownRank: number | null;
    competitors: Array<{ domain: string; rank: number | null }>;
    topResults: SerpItemSummary[];
  }>;
  recommendedPages: Array<{ title: string; slug: string; reason: string; guardrail: string }>;
  actionPlan: SeoActionPlanItem[];
  automationQueue: Array<{ keyword: string; pageSlug: string; status: SeoActionPlanItem["automationStatus"]; nextStep: string }>;
  internalLinkQueue: Array<{ from: string; to: string; anchor: string; reason: string }>;
  guardrails: string[];
};

function normalizeDomain(value: string) {
  const clean = value.trim().toLowerCase();
  if (!clean) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
    return new URL(withProtocol).hostname.replace(/^www\./, "");
  } catch {
    return clean.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? clean;
  }
}

export function normalizeDomains(values: string[]) {
  return Array.from(new Set(values.map(normalizeDomain).filter(Boolean)));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function getTasks(result: unknown) {
  const record = asRecord(result);
  return Array.isArray(record.tasks) ? record.tasks : [];
}

function getFirstSerpItems(result: unknown) {
  const firstTask = asRecord(getTasks(result)[0]);
  const taskResults = Array.isArray(firstTask.result) ? firstTask.result : [];
  const firstResult = asRecord(taskResults[0]);
  return Array.isArray(firstResult.items) ? firstResult.items : [];
}

function itemDomain(item: Record<string, unknown>) {
  return normalizeDomain(String(item.domain ?? item.url ?? ""));
}

export function summarizeSerpItems(result: unknown): SerpItemSummary[] {
  return getFirstSerpItems(result).map((raw) => {
    const item = asRecord(raw);
    return {
      title: String(item.title ?? "Untitled result"),
      url: String(item.url ?? ""),
      domain: itemDomain(item),
      rank: typeof item.rank_absolute === "number" ? item.rank_absolute : typeof item.rank_group === "number" ? item.rank_group : null,
      description: String(item.description ?? "")
    };
  }).filter((item) => item.url || item.domain).slice(0, 10);
}

function rankForDomain(items: SerpItemSummary[], domain: string) {
  const normalized = normalizeDomain(domain);
  const match = items.find((item) => item.domain === normalized || item.domain.endsWith(`.${normalized}`));
  return match?.rank ?? null;
}

function classifyDifficulty(ownRank: number | null, competitorRanks: Array<{ domain: string; rank: number }>) {
  if (ownRank && ownRank <= 10) return "easy" as const;
  if (competitorRanks.some((item) => item.rank <= 5)) return "hard" as const;
  if (competitorRanks.some((item) => item.rank <= 10)) return "medium" as const;
  return "easy" as const;
}

function actionFor(keyword: string, ownRank: number | null, difficulty: KeywordOpportunity["difficulty"], searchVolume?: number | null) {
  const volumeSignal = typeof searchVolume === "number" ? ` Aylık hacim sinyali: ${searchVolume}.` : "";
  if (ownRank && ownRank <= 10) return `Mevcut görünürlüğü güçlendir: ${keyword} sayfasında title/meta CTR testi, schema ve iç link ekle.${volumeSignal}`;
  if (difficulty === "hard") return `Rakip güçlü: ${keyword} için karşılaştırma + kullanım senaryosu + pricing/credit farkı sayfası hazırla.${volumeSignal}`;
  if (difficulty === "medium") return `Fırsat var: ${keyword} için özgün örnekler, fiyat/credit farkı, FAQ ve internal link içeren landing page oluştur.${volumeSignal}`;
  return `Hızlı kazanım: ${keyword} için otomatik brief’li landing/blog/free-tool sayfası üret, kopya programmatic içerikten kaçın.${volumeSignal}`;
}

function contentGapFor(snapshot: { ownRank: number | null; competitors: Array<{ domain: string; rank: number | null }>; topResults: SerpItemSummary[] }) {
  if (!snapshot.topResults.length) return "SERP boş ya da veri sınırlı; önce manuel SERP kontrolü yap.";
  if (!snapshot.ownRank && snapshot.competitors.some((item) => typeof item.rank === "number" && item.rank <= 5)) return "Crelavo görünmüyor, rakip ilk 5’te; dedicated landing/comparison page gerekiyor.";
  if (!snapshot.ownRank) return "Crelavo top 10’da değil; yeni sayfa + iç link ağı gerekiyor.";
  if (snapshot.ownRank > 5) return "Crelavo top 10’da ama üst sıra değil; CTR, FAQ, schema ve internal link iyileştirmesi gerekiyor.";
  return "Crelavo görünür; sayfayı güncel tut, yeni iç linklerle koru.";
}

function searchVolumeFor(keyword: string, volumeResults?: Record<string, number | null>) {
  return volumeResults?.[keyword.toLowerCase()] ?? null;
}

export function buildSeoCompetitorReport(input: {
  ownDomain: string;
  competitors: string[];
  keywords: string[];
  locationName: string;
  languageCode: string;
  serpResults: Array<{ keyword: string; result: unknown }>;
  volumeResults?: Record<string, number | null>;
}): SeoCompetitorAnalysisReport {
  const ownDomain = normalizeDomain(input.ownDomain);
  const competitors = normalizeDomains(input.competitors).filter((domain) => domain !== ownDomain);
  const snapshots = input.serpResults.map(({ keyword, result }) => {
    const topResults = summarizeSerpItems(result);
    const ownRank = rankForDomain(topResults, ownDomain);
    return {
      keyword,
      ownRank,
      competitors: competitors.map((domain) => ({ domain, rank: rankForDomain(topResults, domain) })),
      topResults
    };
  });

  const opportunities = snapshots.map((snapshot) => {
    const competitorRanks = snapshot.competitors
      .filter((item): item is { domain: string; rank: number } => typeof item.rank === "number")
      .sort((a, b) => a.rank - b.rank);
    const difficulty = classifyDifficulty(snapshot.ownRank, competitorRanks);
    const searchVolume = searchVolumeFor(snapshot.keyword, input.volumeResults);
    return {
      keyword: snapshot.keyword,
      ownRank: snapshot.ownRank,
      competitorRanks,
      difficulty,
      searchVolume,
      contentGap: contentGapFor(snapshot),
      action: actionFor(snapshot.keyword, snapshot.ownRank, difficulty, searchVolume)
    };
  }).sort((a, b) => {
    const volumeA = a.searchVolume ?? 0;
    const volumeB = b.searchVolume ?? 0;
    const score = { easy: 0, medium: 1, hard: 2 };
    return score[a.difficulty] - score[b.difficulty] || volumeB - volumeA;
  });

  const ownTop10Count = snapshots.filter((item) => typeof item.ownRank === "number" && item.ownRank <= 10).length;
  const competitorTop10Wins = snapshots.reduce((total, item) => total + item.competitors.filter((competitor) => typeof competitor.rank === "number" && competitor.rank <= 10).length, 0);
  const actionPlan = buildSeoActionPlan(opportunities);
  const internalLinkQueue = actionPlan.flatMap((item) => item.internalLinkPlan);
  const automationQueue = actionPlan.map((item) => ({
    keyword: item.keyword,
    pageSlug: item.pageSlug,
    status: item.automationStatus,
    nextStep: item.automationStatus === "ready_to_draft"
      ? "Generate page draft from the content brief and add internal links."
      : item.automationStatus === "needs_manual_review"
        ? "Review competitor/legal wording before publishing the page draft."
        : "Monitor rank/CTR and refresh metadata instead of creating a new page."
  }));

  return {
    generatedAt: new Date().toISOString(),
    ownDomain,
    competitors,
    keywords: input.keywords,
    locationName: input.locationName,
    languageCode: input.languageCode,
    summary: {
      checkedKeywords: input.keywords.length,
      ownTop10Count,
      competitorTop10Wins,
      priority: competitorTop10Wins > ownTop10Count ? "Rakip boşluklarını sayfa ve içerik planına çevir" : "Mevcut görünürlüğü CTR ve iç linklerle büyüt"
    },
    opportunities,
    serpSnapshots: snapshots,
    recommendedPages: actionPlan.slice(0, 6).map((item) => ({
      title: item.contentBrief.h1,
      slug: item.pageSlug,
      reason: item.brief,
      guardrail: item.contentBrief.guardrails.join(" ")
    })),
    actionPlan,
    automationQueue,
    internalLinkQueue,
    guardrails: [
      "Rakip adını kullanırken yanıltıcı bağlılık veya resmi karşılaştırma iddiası oluşturma.",
      "Sahte yorum, sahte rating, sahte yerel müşteri veya garanti edilmiş sonuç yazma.",
      "DataForSEO sonucu strateji sinyalidir; canlı sıralama ve Search Console verisiyle tekrar kontrol et.",
      "İnce/kopya programmatic SEO sayfası üretme; her sayfaya özgün örnek, fiyat/credit farkı, kullanım senaryosu ve FAQ ekle."
    ]
  };
}
