import { servicePages, type ServicePage } from "@/lib/service-pages";
import { supabaseAdmin } from "@/lib/supabase";

const CONFIG_KEY = "service_pages";

type ServicePagesPayload = Partial<ServicePage>[] | { pages?: Partial<ServicePage>[] } | null | undefined;

function stringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item ?? "").trim()).filter(Boolean);
  return cleaned.length ? cleaned : fallback;
}

function sectionsArray(value: unknown, fallback: ServicePage["sections"]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ title: String((item as { title?: unknown })?.title ?? "").trim(), text: String((item as { text?: unknown })?.text ?? "").trim() }))
    .filter((item) => item.title && item.text);
  return cleaned.length ? cleaned : fallback;
}

function faqArray(value: unknown, fallback: ServicePage["faqItems"] = []) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ question: String((item as { question?: unknown })?.question ?? "").trim(), answer: String((item as { answer?: unknown })?.answer ?? "").trim() }))
    .filter((item) => item.question && item.answer);
  return cleaned.length ? cleaned : fallback;
}

function linkArray(value: unknown, fallback: ServicePage["internalLinks"] = []) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => ({ label: String((item as { label?: unknown })?.label ?? "").trim(), href: String((item as { href?: unknown })?.href ?? "").trim() }))
    .filter((item) => item.label && item.href);
  return cleaned.length ? cleaned : fallback;
}

function normalizeStatus(value: unknown, fallback: ServicePage["status"] = "published") {
  return value === "draft" || value === "noindex" || value === "published" ? value : fallback;
}

function normalizePriority(value: unknown, fallback: ServicePage["seoPriority"] = "medium") {
  return value === "high" || value === "medium" || value === "low" ? value : fallback;
}

function defaultFaq(page: ServicePage) {
  return [
    { question: `What can I create with ${page.title}?`, answer: `${page.title} helps you prepare ${page.outputs.slice(0, 3).join(", ").toLowerCase()} and route the request into a delivery-focused Crelavo workflow.` },
    { question: `What do I need before starting ${page.title}?`, answer: `You can start with ${page.inputs.slice(0, 3).join(", ").toLowerCase()}. Crelavo then helps organize the production brief, delivery expectations and next step.` }
  ];
}

function defaultLinks(page: ServicePage) {
  return [
    { label: "Assistant Workspace", href: page.primaryCtaHref },
    { label: "Pricing and delivery options", href: page.secondaryCtaHref || "/pricing" }
  ];
}

function normalizePage(input: Partial<ServicePage> | undefined, fallback: ServicePage): ServicePage {
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
    faqItems: faqArray(page.faqItems, fallback.faqItems?.length ? fallback.faqItems : defaultFaq(fallback)),
    internalLinks: linkArray(page.internalLinks, fallback.internalLinks?.length ? fallback.internalLinks : defaultLinks(fallback))
  };
}

export function normalizeServicePagesConfig(payload: ServicePagesPayload): ServicePage[] {
  const incoming = Array.isArray(payload) ? payload : Array.isArray(payload?.pages) ? payload.pages : [];
  const incomingBySlug = new Map(incoming.map((page) => [String(page.slug ?? "").trim(), page]));
  const defaults = servicePages.map((page) => normalizePage(incomingBySlug.get(page.slug), page));
  const defaultSlugs = new Set(defaults.map((page) => page.slug));
  const customPages = incoming
    .filter((page) => page.slug && !defaultSlugs.has(String(page.slug).trim()))
    .map((page) => normalizePage(page, {
      slug: String(page.slug),
      title: "Custom AI Service Page",
      turkishTitle: "Özel Yapay Zeka Hizmet Sayfası",
      badge: "Custom service",
      keyword: "AI Service",
      summary: "Custom editable AI service page managed from the admin panel.",
      primaryCtaLabel: "Start request",
      primaryCtaHref: "/dashboard/assistant-workspace",
      secondaryCtaHref: "/pricing",
      bestFor: "Custom production requests",
      inputs: ["Project brief"],
      outputs: ["Delivery package"],
      delivery: ["Preview", "Final ZIP", "README", "Revision path"],
      sections: [{ title: "Custom service workflow", text: "Use this page to describe a custom public AI service and route users into the right production flow." }],
      examples: ["Custom service package"],
      status: "draft",
      seoPriority: "low",
      includeInSitemap: false,
      faqItems: [],
      internalLinks: []
    }));
  return [...defaults, ...customPages];
}

export async function getConfiguredServicePages(): Promise<ServicePage[]> {
  try {
    const { data, error } = await supabaseAdmin()
      .from("platform_configs")
      .select("value")
      .eq("key", CONFIG_KEY)
      .maybeSingle();
    if (error) throw error;
    return normalizeServicePagesConfig(data?.value as ServicePagesPayload);
  } catch {
    return servicePages;
  }
}

export async function getConfiguredServicePage(slug: string): Promise<ServicePage | null> {
  const pages = await getConfiguredServicePages();
  return pages.find((page) => page.slug === slug) ?? null;
}

export { CONFIG_KEY as SERVICE_PAGES_CONFIG_KEY };
