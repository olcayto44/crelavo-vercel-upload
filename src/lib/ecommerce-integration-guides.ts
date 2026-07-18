export type EcommerceIntegrationGuide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  summary: string;
  platform: string;
  primaryKeyword: string;
  keywords: string[];
  sections: { title: string; body: string; bullets: string[] }[];
  faq: { question: string; answer: string }[];
  ctaHref: string;
  ctaLabel: string;
  relatedLinks: { label: string; href: string; note: string }[];
};

export const ecommerceIntegrationGuides: EcommerceIntegrationGuide[] = [
  {
    slug: "shopify-product-link-to-ai-video-guide",
    title: "Shopify Product Link to AI Video Guide",
    metaTitle: "Shopify Product Link to AI Video Guide | Crelavo",
    metaDescription: "Learn how Shopify product links can become AI product videos, TikTok ad hooks, Reels creatives, captions, landing copy and ecommerce campaign assets with Crelavo.",
    h1: "Shopify product link to AI video guide for ecommerce campaigns",
    summary: "A Shopify product page already contains the offer, images, benefits and buying context. Crelavo turns that product link into a campaign workflow for AI product videos, TikTok hooks, Reels ads, landing copy and delivery notes.",
    platform: "Shopify",
    primaryKeyword: "Shopify product video",
    keywords: ["Shopify product video", "Shopify product link", "Shopify ad video", "Shopify TikTok ad", "product link to video", "AI ecommerce campaign", "Shopify video ads"],
    sections: [
      { title: "Why Shopify product links are useful for AI video", body: "The product URL gives the campaign a real starting point: title, offer, benefits, product visuals, category language and buyer objections. That is more useful than asking an AI video tool to start from a blank prompt.", bullets: ["Product page to video", "Shopify ad brief", "TikTok and Reels hooks"] },
      { title: "Manual workflow now, app path later", body: "Crelavo can support manual Shopify product link workflows now. Later, a Shopify app or Chrome extension can pass product context into the assistant workspace with less copying.", bullets: ["Manual product URL input", "Chrome extension funnel", "Shopify app roadmap"] },
      { title: "Best internal next steps", body: "Visitors should move from the guide into the Shopify product video page, campaign category, AI product video generator and pricing pages.", bullets: ["Shopify product link to ad video", "Campaign category", "AI product video generator"] }
    ],
    faq: [
      { question: "Can Crelavo create a video from only a Shopify link?", answer: "A Shopify link can start the workflow. Adding audience, platform goal, brand notes and offer details makes the video brief stronger." },
      { question: "Is this already a Shopify App Store app?", answer: "The public workflow is ready as an SEO and product path. The deeper app-store installation path is planned for a later technical phase." }
    ],
    ctaHref: "/shopify-product-link-to-ad-video",
    ctaLabel: "Open Shopify product video workflow",
    relatedLinks: [
      { label: "Shopify product link to ad video", href: "/shopify-product-link-to-ad-video", note: "Main product URL to ad video page" },
      { label: "Shopify AI product video app", href: "/shopify-ai-product-video-app", note: "Future app-store roadmap page" },
      { label: "Chrome extension funnel", href: "/chrome-extension", note: "Fastest acquisition path before app install" }
    ]
  },
  {
    slug: "amazon-product-page-to-ai-ad-video-guide",
    title: "Amazon Product Page to AI Ad Video Guide",
    metaTitle: "Amazon Product Page to AI Ad Video Guide | Crelavo",
    metaDescription: "Turn Amazon product pages into AI ad video briefs, benefit-led scripts, marketplace comparison angles, hooks, captions and ecommerce campaign assets with Crelavo.",
    h1: "Amazon product page to AI ad video guide for marketplace sellers",
    summary: "Amazon sellers can use listing benefits, review themes, objections and category positioning as the base for AI ad videos, short-form social clips and marketplace campaign assets.",
    platform: "Amazon",
    primaryKeyword: "Amazon product ad video",
    keywords: ["Amazon product ad video", "Amazon product video", "Amazon listing video", "marketplace product video", "AI product ad", "Amazon product page", "ecommerce video ads"],
    sections: [
      { title: "Use Amazon listing signals for video briefs", body: "The product title, bullets, buyer questions, review patterns and competitor positioning can guide the hook, proof points, objections and CTA direction for an ad video.", bullets: ["Listing benefits", "Review-based objections", "Marketplace video hook"] },
      { title: "Social retargeting from Amazon product context", body: "A marketplace product page can become TikTok, Reels, Shorts and Meta creative angles that send users back into a product or campaign funnel.", bullets: ["Short-form product ad", "Amazon retargeting video", "Product benefit script"] },
      { title: "Where to link next", body: "The guide links into Amazon product ad video, AI product video generator, campaign category, alternatives and pricing pages.", bullets: ["Amazon product ad video", "AI product video generator", "Campaign category"] }
    ],
    faq: [
      { question: "Does Crelavo need Amazon API access now?", answer: "No. The initial workflow can start from a product link and seller-provided context. API automation can come later." },
      { question: "Can this help off-Amazon ads?", answer: "Yes. Amazon listing context can become social ads, retargeting clips, campaign hooks and product benefit scripts." }
    ],
    ctaHref: "/amazon-product-ad-video",
    ctaLabel: "Open Amazon product ad video workflow",
    relatedLinks: [
      { label: "Amazon product ad video", href: "/amazon-product-ad-video", note: "Marketplace product video workflow" },
      { label: "AI product video generator", href: "/ai-product-video-generator", note: "Product video category page" },
      { label: "Product video alternatives", href: "/alternatives/product-video-generator-alternative", note: "Comparison SEO path" }
    ]
  },
  {
    slug: "trendyol-product-video-campaign-guide",
    title: "Trendyol Product Video Campaign Guide",
    metaTitle: "Trendyol Product Video Campaign Guide | Crelavo",
    metaDescription: "Plan Trendyol product videos, Turkish ecommerce ads, product hooks, marketplace campaign assets and AI product video workflows with Crelavo.",
    h1: "Trendyol product video campaign guide for Turkish ecommerce sellers",
    summary: "Trendyol sellers need localized product hooks, fast benefit clarity and marketplace-friendly creative. Crelavo turns product links and Turkish market notes into product video and campaign workflows.",
    platform: "Trendyol",
    primaryKeyword: "Trendyol product video",
    keywords: ["Trendyol product video", "Trendyol ürün videosu", "Trendyol reklam videosu", "Turkish ecommerce video", "marketplace video ads", "AI product video", "ürün linkinden video"],
    sections: [
      { title: "Turkish ecommerce video intent", body: "Trendyol product content should be clear, local and benefit-led. Buyers need to understand the use case, price/value perception and product proof quickly.", bullets: ["Trendyol ürün videosu", "Turkish product hooks", "Marketplace ad creative"] },
      { title: "Product link to campaign workflow", body: "A Trendyol URL can start a request with product benefits, buyer persona, campaign angle, short-form direction, captions and delivery notes.", bullets: ["Product URL input", "Short-form ad script", "Campaign delivery path"] },
      { title: "Internal links for Turkish marketplace SEO", body: "This guide routes users into the Trendyol product video page, campaign category, AI ecommerce builder and pricing pages.", bullets: ["Trendyol video workflow", "AI ecommerce campaign", "Pricing and credits"] }
    ],
    faq: [
      { question: "Can Crelavo support Turkish selling angles?", answer: "Yes. The workflow can include Turkish buyer context, local marketplace wording and product benefit framing." },
      { question: "Is this only for Trendyol?", answer: "No. The same campaign logic can also support Shopify, Amazon and other marketplace product pages." }
    ],
    ctaHref: "/trendyol-product-video",
    ctaLabel: "Open Trendyol product video workflow",
    relatedLinks: [
      { label: "Trendyol product video", href: "/trendyol-product-video", note: "Main Turkish marketplace video page" },
      { label: "AI ecommerce builder", href: "/ai-ecommerce-builder", note: "Ecommerce production category" },
      { label: "Campaign category", href: "/categories/campaign", note: "Product-link campaign hub" }
    ]
  },
  {
    slug: "ecommerce-product-page-to-video-workflow",
    title: "Ecommerce Product Page to Video Workflow",
    metaTitle: "Ecommerce Product Page to Video Workflow | Crelavo",
    metaDescription: "Use ecommerce product pages to create AI product videos, product ad scripts, UGC hooks, captions, landing copy and campaign assets with Crelavo.",
    h1: "Ecommerce product page to video workflow for AI campaign production",
    summary: "A product page can become a complete creative brief: product ad video, UGC hooks, captions, landing copy, social CTA and delivery checklist. Crelavo connects that workflow across Shopify, Amazon, Trendyol and other ecommerce stores.",
    platform: "Ecommerce",
    primaryKeyword: "product page to video",
    keywords: ["product page to video", "ecommerce product video", "product URL to video", "AI product ad video", "UGC product video", "ecommerce campaign assets", "product link campaign"],
    sections: [
      { title: "Why product pages make better video briefs", body: "A product page has the raw material a campaign needs: value proposition, product images, price/value perception, features, benefits, audience fit and objections.", bullets: ["Product URL to campaign", "Product video script", "Ad hook generation"] },
      { title: "What Crelavo can prepare", body: "Crelavo can turn ecommerce context into video direction, hooks, captions, landing page notes, social ad variants and delivery expectations.", bullets: ["Short-form video brief", "Caption and CTA set", "Landing page messaging"] },
      { title: "Best linked paths", body: "This guide connects broad ecommerce search intent to exact Crelavo product pages and category pages.", bullets: ["AI product video generator", "Campaign category", "Chrome extension funnel"] }
    ],
    faq: [
      { question: "Which product pages can start the workflow?", answer: "Shopify, Amazon, Trendyol, WooCommerce or any ecommerce product URL can be used as the starting context." },
      { question: "Does the product page replace the creative brief?", answer: "No. It gives a strong base, but audience, platform, offer and brand notes still improve the final direction." }
    ],
    ctaHref: "/categories/campaign",
    ctaLabel: "Open ecommerce campaign category",
    relatedLinks: [
      { label: "AI product video generator", href: "/ai-product-video-generator", note: "Broad product video workflow" },
      { label: "Chrome extension funnel", href: "/chrome-extension", note: "Product-page traffic capture path" },
      { label: "WooCommerce plugin roadmap", href: "/woocommerce-ai-product-video-plugin", note: "Future plugin path" }
    ]
  },
  {
    slug: "shopify-amazon-trendyol-ai-campaign-checklist",
    title: "Shopify Amazon Trendyol AI Campaign Checklist",
    metaTitle: "Shopify, Amazon and Trendyol AI Campaign Checklist | Crelavo",
    metaDescription: "A practical AI ecommerce campaign checklist for Shopify, Amazon and Trendyol sellers planning product videos, ad hooks, captions, landing copy and creative delivery.",
    h1: "Shopify, Amazon and Trendyol AI campaign checklist",
    summary: "This checklist helps ecommerce sellers prepare the product link, buyer context, campaign goal, platform, proof points, CTA and delivery requirements before starting a Crelavo AI campaign workflow.",
    platform: "Multi-platform ecommerce",
    primaryKeyword: "AI ecommerce campaign",
    keywords: ["AI ecommerce campaign", "Shopify campaign checklist", "Amazon ad checklist", "Trendyol campaign", "product video checklist", "ecommerce ad hooks", "campaign asset checklist"],
    sections: [
      { title: "Before you start the campaign", body: "Prepare the product URL, main benefit, target buyer, offer, platform and any brand constraints. These details help Crelavo generate more focused video and campaign directions.", bullets: ["Product URL", "Target buyer", "Campaign goal"] },
      { title: "Creative assets to request", body: "A strong ecommerce campaign should include hooks, short-form video direction, captions, ad copy, landing page notes and internal links to the right product workflow.", bullets: ["Video hook", "Caption set", "Landing page copy"] },
      { title: "Platform-specific paths", body: "Use Shopify, Amazon and Trendyol pages when the user has a specific marketplace. Use the broader campaign category when the store or marketplace is mixed.", bullets: ["Shopify product video", "Amazon product ad", "Trendyol product video"] }
    ],
    faq: [
      { question: "Should I start with a product URL or a campaign idea?", answer: "Start with both if possible. A product URL gives concrete context; a campaign idea gives the creative direction." },
      { question: "Can one checklist support several platforms?", answer: "Yes. The same campaign basics apply, then Crelavo can route the request to Shopify, Amazon, Trendyol or broader ecommerce paths." }
    ],
    ctaHref: "/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=AI%20ecommerce%20campaign%20checklist",
    ctaLabel: "Start campaign checklist request",
    relatedLinks: [
      { label: "Shopify product video", href: "/shopify-product-link-to-ad-video", note: "Shopify-specific path" },
      { label: "Amazon product ad video", href: "/amazon-product-ad-video", note: "Amazon-specific path" },
      { label: "Trendyol product video", href: "/trendyol-product-video", note: "Trendyol-specific path" }
    ]
  }
];

export function getEcommerceIntegrationGuide(slug: string) {
  return ecommerceIntegrationGuides.find((guide) => guide.slug === slug);
}

export const ecommerceIntegrationKeywords = [
  "Shopify product video",
  "Amazon product ad video",
  "Trendyol product video",
  "product page to video",
  "AI ecommerce campaign",
  "product link to video",
  "WooCommerce video plugin",
  "Shopify video app"
];
