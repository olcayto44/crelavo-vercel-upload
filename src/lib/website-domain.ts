export type WebsitePageKind = "home" | "about" | "services" | "contact" | "custom";

export type WebsiteBrief = {
  projectId?: string;
  businessName: string;
  businessDescription: string;
  audience: string;
  siteType: "landing" | "business" | "ecommerce" | "saas" | "custom";
  pages: Array<{ slug: string; title: string; kind: WebsitePageKind }>;
  features: string[];
  locale: string;
};

export type WebsiteManifest = {
  version: 1;
  projectId: string;
  entryPage: string;
  pages: WebsiteBrief["pages"];
  features: string[];
  generatedAt: string;
};

export type WebsitePlan = {
  version: 1;
  projectId: string;
  brief: WebsiteBrief;
  manifest: WebsiteManifest;
  status: "draft" | "preview" | "approved";
};

function clean(value: unknown, fallback = "") {
  return String(value ?? fallback).trim();
}

export function createWebsiteBrief(input: Partial<WebsiteBrief>): WebsiteBrief {
  const pages = Array.isArray(input.pages) && input.pages.length
    ? input.pages.map((page) => ({
        slug: clean(page.slug, "home").replace(/^\/+|\/+$/g, "") || "home",
        title: clean(page.title, "Home"),
        kind: page.kind ?? "custom"
      }))
    : [{ slug: "home", title: "Home", kind: "home" as const }];

  return {
    projectId: clean(input.projectId) || undefined,
    businessName: clean(input.businessName),
    businessDescription: clean(input.businessDescription),
    audience: clean(input.audience),
    siteType: input.siteType ?? "custom",
    pages,
    features: Array.from(new Set((input.features ?? []).map((feature) => clean(feature)).filter(Boolean))),
    locale: clean(input.locale, "en")
  };
}

export function createWebsitePlan(briefInput: Partial<WebsiteBrief>, projectId: string, now = new Date().toISOString()): WebsitePlan {
  const brief = createWebsiteBrief({ ...briefInput, projectId });
  const manifest: WebsiteManifest = {
    version: 1,
    projectId,
    entryPage: brief.pages[0]?.slug ?? "home",
    pages: brief.pages,
    features: brief.features,
    generatedAt: now
  };
  return { version: 1, projectId, brief, manifest, status: "draft" };
}
