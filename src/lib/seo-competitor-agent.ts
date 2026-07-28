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
  recommendedPages: Array<{ title: string; reason: string; guardrail: string }>;
  actionPlan: SeoActionPlanItem[];
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

function actionFor(keyword: string, ownRank: number | null, difficulty: KeywordOpportunity["difficulty"]) {
  if (ownRank && ownRank <= 10) return `Mevcut görünürlüğü güçlendir: ${keyword} sayfasında title/meta CTR testi ve iç link ekle.`;
  if (difficulty === "hard") return `Rakip güçlü: ${keyword} için doğrudan satış sayfası yerine karşılaştırma + kullanım senaryosu sayfası hazırla.`;
  if (difficulty === "medium") return `Fırsat var: ${keyword} için özgün örnekler, fiyat/credit farkı ve FAQ içeren landing page oluştur.`;
  return `Hızlı kazanım: ${keyword} için ince ama kopya olmayan kısa SEO sayfası veya blog/free-tool CTA üret.`;
}

export function buildSeoCompetitorReport(input: {
  ownDomain: string;
  competitors: string[];
  keywords: string[];
  locationName: string;
  languageCode: string;
  serpResults: Array<{ keyword: string; result: unknown }>;
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
    return {
      keyword: snapshot.keyword,
      ownRank: snapshot.ownRank,
      competitorRanks,
      difficulty,
      action: actionFor(snapshot.keyword, snapshot.ownRank, difficulty)
    };
  }).sort((a, b) => {
    const score = { easy: 0, medium: 1, hard: 2 };
    return score[a.difficulty] - score[b.difficulty];
  });

  const ownTop10Count = snapshots.filter((item) => typeof item.ownRank === "number" && item.ownRank <= 10).length;
  const competitorTop10Wins = snapshots.reduce((total, item) => total + item.competitors.filter((competitor) => typeof competitor.rank === "number" && competitor.rank <= 10).length, 0);

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
    recommendedPages: opportunities.slice(0, 5).map((item) => ({
      title: `${item.keyword} landing/comparison page`,
      reason: item.action,
      guardrail: "Sahte kullanıcı, sahte ROAS, sahte yerel kanıt veya rakip marka kötüleme kullanma. Gerçek ürün farklarını ve Crelavo kredi/preview mantığını anlat."
    })),
    actionPlan: buildSeoActionPlan(opportunities),
    guardrails: [
      "Rakip adını kullanırken yanıltıcı bağlılık veya resmi karşılaştırma iddiası oluşturma.",
      "Sahte yorum, sahte rating, sahte yerel müşteri veya garanti edilmiş sonuç yazma.",
      "DataForSEO sonucu strateji sinyalidir; canlı sıralama ve Search Console verisiyle tekrar kontrol et.",
      "İnce/kopya programmatic SEO sayfası üretme; her sayfaya özgün örnek, fiyat/credit farkı, kullanım senaryosu ve FAQ ekle."
    ]
  };
}
