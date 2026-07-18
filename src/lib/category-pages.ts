import { productionTypes } from "@/lib/production";
import type { ServicePage } from "@/lib/service-pages";

export type CategoryPage = ServicePage;

function titleCase(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(" ");
}

function ctaHref(typeId: string) {
  if (typeId === "campaign") return "/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Product%20link%20campaign";
  if (["video", "talking_video", "animation", "anime_short_film", "animal_video", "nature_video", "planet_space_video", "cinematic_video", "video_clipping", "stickman_animation", "music_video", "video_tools"].includes(typeId)) return "/dashboard/videos";
  if (["website", "saas", "mobile_app", "admin_project"].includes(typeId)) return "/dashboard/create";
  if (["avatar", "visual_clone", "brand_kit", "image"].includes(typeId)) return "/dashboard/brand-kit";
  if (["lip_sync", "voice_clone", "ai-dubbing-voice", "localization"].includes(typeId)) return "/dashboard/dubbing";
  if (typeId === "live_sales_agent") return "/live-sales-credits";
  if (typeId === "ai_agent") return "/dashboard/growth";
  return "/dashboard/assistant-workspace";
}

function buildCategoryPage(type: typeof productionTypes[number]): CategoryPage {
  const readable = titleCase(type.id);
  const primaryCtaHref = ctaHref(type.id);
  return {
    slug: type.id,
    title: `${type.label} Category`,
    turkishTitle: `${type.label} Kategorisi`,
    badge: "Programmatic SEO category",
    keyword: `${type.label} category`,
    summary: `${type.description} This SEO category page helps users find the right Crelavo production path, examples, delivery expectations and next action for ${type.label.toLowerCase()} requests.`,
    primaryCtaLabel: `Start ${type.label}`,
    primaryCtaHref,
    secondaryCtaHref: "/categories",
    bestFor: `${type.label} requests, related production briefs, delivery planning and category-based discovery`,
    inputs: ["Project brief", "Target audience", "Platform or channel", "Delivery goal"],
    outputs: ["Production brief", "Creative direction", "Delivery checklist", "Dashboard handoff"],
    delivery: ["Preview or plan", "Final delivery package", "Revision path", "Admin tracking"],
    sections: [
      {
        title: `${type.label} category overview`,
        text: `This page explains the ${type.label.toLowerCase()} category and helps search visitors understand what Crelavo can prepare before they start a request.`
      },
      {
        title: `How the ${type.label.toLowerCase()} workflow starts`,
        text: `Users can start with a short brief, product link, content idea or production goal. Crelavo then routes the request toward the correct workspace, dashboard or pricing path.`
      },
      {
        title: `${readable} SEO intent`,
        text: `The page is designed for long-tail category searches and can be edited from admin with custom copy, FAQs, internal links and redirect targets.`
      }
    ],
    examples: [`${type.label} starter`, `${type.label} delivery package`, `${type.label} launch workflow`],
    status: "published",
    seoPriority: type.id === "campaign" || type.id === "video" || type.id === "website" || type.id === "saas" || type.id === "mobile_app" ? "high" : "medium",
    includeInSitemap: true,
    faqItems: [
      {
        question: `What is the ${type.label} category for?`,
        answer: `${type.label} is for users who need ${type.description.toLowerCase()}`
      },
      {
        question: `Can I start ${type.label} from this page?`,
        answer: `Yes. The main CTA sends users to the best Crelavo workspace or dashboard path for this category.`
      }
    ],
    internalLinks: [
      { label: "Categories home", href: "/categories" },
      { label: "Tools catalog", href: "/tools" },
      { label: "Assistant workspace", href: primaryCtaHref }
    ]
  };
}

export const defaultCategoryPages: CategoryPage[] = productionTypes.map(buildCategoryPage);

export function categoryPageBySlug(slug: string) {
  return defaultCategoryPages.find((page) => page.slug === slug) ?? null;
}
