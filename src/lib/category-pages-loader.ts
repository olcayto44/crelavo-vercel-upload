import { defaultCategoryPages, type CategoryPage } from "@/lib/category-pages";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "category_pages";

type CategoryPagesPayload = Partial<CategoryPage>[] | { pages?: Partial<CategoryPage>[] } | null | undefined;

function stringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function sectionsArray(value: unknown, fallback: CategoryPage["sections"]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ title: String((item as { title?: unknown })?.title ?? "").trim(), text: String((item as { text?: unknown })?.text ?? "").trim() }))
    .filter((item) => item.title && item.text);
  return cleaned.length ? cleaned : fallback;
}

function faqArray(value: unknown, fallback: CategoryPage["faqItems"] = []) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ question: String((item as { question?: unknown })?.question ?? "").trim(), answer: String((item as { answer?: unknown })?.answer ?? "").trim() }))
    .filter((item) => item.question && item.answer);
  return cleaned.length ? cleaned : fallback;
}

function linkArray(value: unknown, fallback: CategoryPage["internalLinks"] = []) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ label: String((item as { label?: unknown })?.label ?? "").trim(), href: String((item as { href?: unknown })?.href ?? "").trim() }))
    .filter((item) => item.label && item.href);
  return cleaned.length ? cleaned : fallback;
}

function normalizeStatus(value: unknown, fallback: CategoryPage["status"] = "published") {
  return value === "draft" || value === "noindex" || value === "published" ? value : fallback;
}

function normalizePriority(value: unknown, fallback: CategoryPage["seoPriority"] = "medium") {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function normalizePage(input: Partial<CategoryPage> | undefined, fallback: CategoryPage): CategoryPage {
  const page = input ?? {};
  return {
    ...fallback,
    slug: String(page.slug ?? fallback.slug).trim() || fallback.slug,
    title: String(page.title ?? fallback.title).trim() || fallback.title,
    turkishTitle: String(page.turkishTitle ?? fallback.turkishTitle).trim() || fallback.turkishTitle,
    badge: String(page.badge ?? fallback.badge).trim() || fallback.badge,
    keyword: String(page.keyword ?? fallback.keyword).trim() || fallback.keyword,
    summary: String(page.summary ?? fallback.summary).trim() || fallback.summary,
    primaryCtaLabel: String(page.primaryCtaLabel ?? fallback.primaryCtaLabel).trim() || fallback.primaryCtaLabel,
    primaryCtaHref: String(page.primaryCtaHref ?? fallback.primaryCtaHref).trim() || fallback.primaryCtaHref,
    secondaryCtaHref: String(page.secondaryCtaHref ?? fallback.secondaryCtaHref ?? "").trim() || fallback.secondaryCtaHref,
    bestFor: String(page.bestFor ?? fallback.bestFor).trim() || fallback.bestFor,
    inputs: stringArray(page.inputs, fallback.inputs),
    outputs: stringArray(page.outputs, fallback.outputs),
    delivery: stringArray(page.delivery, fallback.delivery),
    sections: sectionsArray(page.sections, fallback.sections),
    examples: stringArray(page.examples, fallback.examples),
    status: normalizeStatus(page.status, fallback.status ?? "published"),
    seoPriority: normalizePriority(page.seoPriority, fallback.seoPriority ?? "medium"),
    includeInSitemap: typeof page.includeInSitemap === "boolean" ? page.includeInSitemap : fallback.includeInSitemap ?? true,
    faqItems: faqArray(page.faqItems, fallback.faqItems ?? []),
    internalLinks: linkArray(page.internalLinks, fallback.internalLinks ?? [])
  };
}

export function normalizeCategoryPagesConfig(payload: CategoryPagesPayload): CategoryPage[] {
  const incoming = Array.isArray(payload) ? payload : Array.isArray(payload?.pages) ? payload.pages : [];
  const incomingBySlug = new Map(incoming.map((page) => [String(page.slug ?? "").trim(), page]));
  const defaults = defaultCategoryPages.map((page) => normalizePage(incomingBySlug.get(page.slug), page));
  const defaultSlugs = new Set(defaults.map((page) => page.slug));
  const customPages = incoming
    .filter((page) => page.slug && !defaultSlugs.has(String(page.slug).trim()))
    .map((page) => normalizePage(page, {
      slug: String(page.slug),
      title: "Custom SEO Category Page",
      turkishTitle: "Özel SEO Kategori Sayfası",
      badge: "Custom category",
      keyword: "SEO Category",
      summary: "Custom editable SEO category page managed from the admin panel.",
      primaryCtaLabel: "Start request",
      primaryCtaHref: "/dashboard/assistant-workspace",
      secondaryCtaHref: "/categories",
      bestFor: "Custom production categories",
      inputs: ["Project brief"],
      outputs: ["Delivery package"],
      delivery: ["Preview", "Final ZIP", "README", "Revision path"],
      sections: [{ title: "Custom category workflow", text: "Use this page to describe a custom public SEO category and route users into the right production flow." }],
      examples: ["Custom category package"],
      status: "draft",
      seoPriority: "low",
      includeInSitemap: false,
      faqItems: [],
      internalLinks: []
    }));
  return [...defaults, ...customPages];
}

export async function getConfiguredCategoryPages(): Promise<CategoryPage[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    return normalizeCategoryPagesConfig(data?.value as CategoryPagesPayload);
  } catch {
    return defaultCategoryPages;
  }
}

export async function getConfiguredCategoryPage(slug: string): Promise<CategoryPage | null> {
  const pages = await getConfiguredCategoryPages();
  return pages.find((page) => page.slug === slug) ?? null;
}

export { CONFIG_KEY as CATEGORY_PAGES_CONFIG_KEY };
