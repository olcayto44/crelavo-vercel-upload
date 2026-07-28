export type ApiService = {
  slug: string;
  name: string;
  summary: string;
  useCase: string;
  image: string;
  alt: string;
  readiness?: "ready" | "configured" | "permission_limited" | "pending" | "manual_e2e_required";
  safeTest?: string;
};

export type ApiServiceGroup = {
  title: string;
  description: string;
  services: ApiService[];
};

export const apiServiceGroups: ApiServiceGroup[] = [
  {
    title: "Core AI and generation",
    description: "Assistant brain, image, video and premium creative generation providers.",
    services: [
      {
        slug: "openai",
        name: "OpenAI",
        summary: "Assistant reasoning, planning and production brief generation.",
        useCase: "Beyin, brief, routing, copy, analysis, planning and workflow orchestration.",
        image: "/blog/managed-delivery-workflow.svg",
        alt: "Crelavo OpenAI assistant reasoning and production planning illustration",
        readiness: "ready",
        safeTest: "Safe readiness: API key presence and low-cost assistant route check."
      },
      {
        slug: "fal-ai",
        name: "Fal.ai",
        summary: "Fast and flexible multi-model creative routing.",
        useCase: "Draft video, quick tests, image generation and fallback creative workflows.",
        image: "/showcase/production-dashboard.png",
        alt: "Crelavo Fal.ai fast AI video and image production dashboard illustration",
        readiness: "ready",
        safeTest: "Safe readiness: key/balance present; paid generation only from production job."
      },
      {
        slug: "kling",
        name: "Kling",
        summary: "Premium video generation and motion quality.",
        useCase: "Standard to Ultra video, product motion, image-to-video and cinematic clips.",
        image: "/showcase/ai-production-studio.webp",
        alt: "Crelavo Kling premium video generation and cinematic motion illustration",
        readiness: "ready",
        safeTest: "Safe readiness: key/balance present; live production E2E still validates job routing."
      },
      {
        slug: "runway",
        name: "Runway",
        summary: "Premium fallback for cinematic video production.",
        useCase: "Creative fallback, image-to-video and high-end motion tasks.",
        image: "/blog/website-app-production.svg",
        alt: "Crelavo Runway cinematic AI video fallback illustration"
      },
      {
        slug: "stability-ai",
        name: "Stability AI",
        summary: "Image generation and editing provider.",
        useCase: "Thumbnails, product visuals, brand visuals, image edits and concept art.",
        image: "/blog/brand-content-seo.svg",
        alt: "Crelavo Stability AI image generation and editing illustration"
      }
    ]
  },
  {
    title: "Voice, avatar and talking video",
    description: "Voice-over, clone, avatar and lip-sync tools.",
    services: [
      {
        slug: "elevenlabs",
        name: "ElevenLabs",
        summary: "Premium voice-over and voice cloning.",
        useCase: "Narration, dubbing, premium voice, voice clone and multilingual delivery.",
        image: "/blog/ai-video-avatar-voice.svg",
        alt: "Crelavo ElevenLabs premium voice clone and narration illustration"
      },
      {
        slug: "heygen",
        name: "HeyGen",
        summary: "Talking avatars and sales presenters.",
        useCase: "Digital twins, sales avatar videos, spokesperson clips and avatar demos.",
        image: "/blog/ai-video-avatar-voice.svg",
        alt: "Crelavo HeyGen talking avatar and sales presenter illustration"
      }
    ]
  },
  {
    title: "Commerce, growth and data",
    description: "Marketplace, SEO, maps and growth tooling for ecommerce teams.",
    services: [
      {
        slug: "shopify",
        name: "Shopify",
        summary: "Store and product data for ecommerce workflows.",
        useCase: "Product import, storefront context, product video flows and ecommerce kit delivery.",
        image: "/blog/ecommerce-product-campaigns.svg",
        alt: "Crelavo Shopify ecommerce product campaign illustration",
        readiness: "manual_e2e_required",
        safeTest: "Safe readiness: connected account and product list first; product mutation waits for approval-gated E2E."
      },
      {
        slug: "apify",
        name: "Apify",
        summary: "Scraping and structured research automation.",
        useCase: "Public data extraction, competitive research and content collection where allowed.",
        image: "/blog/managed-delivery-workflow.svg",
        alt: "Crelavo Apify scraping and research automation illustration"
      },
      {
        slug: "dataforseo",
        name: "DataForSEO",
        summary: "SERP and keyword intelligence.",
        useCase: "Keyword research, competitor analysis, SERP tracking and SEO audits.",
        image: "/blog/brand-content-seo.svg",
        alt: "Crelavo DataForSEO keyword research and SEO intelligence illustration",
        readiness: "ready",
        safeTest: "Safe readiness: SERP endpoint checked through admin competitor agent."
      },
      {
        slug: "google-maps",
        name: "Google Maps",
        summary: "Location and local discovery context.",
        useCase: "Local SEO, map context, regional pages and location-based campaigns.",
        image: "/blog/website-app-production.svg",
        alt: "Crelavo Google Maps local SEO and location discovery illustration"
      },
      {
        slug: "meta",
        name: "Meta",
        summary: "Social and ads ecosystem connection.",
        useCase: "Meta catalog, Pixel, Graph, ad reporting and social growth signals.",
        image: "/blog/brand-content-seo.svg",
        alt: "Crelavo Meta ads and social growth integration illustration"
      }
    ]
  }
];

export const defaultApiServiceGroups = apiServiceGroups;

export const apiServiceLinks = apiServiceGroups.flatMap((group) =>
  group.services.map((service) => ({
    group: group.title,
    name: service.name,
    href: `/api-documentation#api-${service.slug}`,
    summary: service.summary
  }))
);
