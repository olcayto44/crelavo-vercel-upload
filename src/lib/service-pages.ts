export type ServicePage = {
  slug: string;
  title: string;
  turkishTitle: string;
  badge: string;
  keyword: string;
  summary: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaHref?: string;
  bestFor: string;
  inputs: string[];
  outputs: string[];
  delivery: string[];
  sections: { title: string; text: string }[];
  examples: string[];
  status?: "published" | "draft" | "noindex";
  seoPriority?: "high" | "medium" | "low";
  includeInSitemap?: boolean;
  faqItems?: { question: string; answer: string }[];
  internalLinks?: { label: string; href: string }[];
};

const assistantBase = "/dashboard/assistant-workspace";

const coreServicePages: ServicePage[] = [
  {
    slug: "ai-website-builder",
    title: "AI Website Builder",
    turkishTitle: "Yapay Zeka Web Sitesi Oluşturucu",
    badge: "Website builder",
    keyword: "AI Website Builder",
    summary: "Create AI website builder workflows for landing pages, business websites, SaaS websites, ecommerce pages and launch-ready website delivery packages with source files, README setup notes and dashboard handoff.",
    primaryCtaLabel: "Start AI Website Builder",
    primaryCtaHref: `${assistantBase}?mode=project&category=website&idea=AI%20Website%20Builder`,
    secondaryCtaHref: "/pricing",
    bestFor: "Landing pages, company sites, SaaS websites, portfolio sites and launch pages",
    inputs: ["Business idea or product brief", "Target audience", "Sections or page goals", "Brand notes or references"],
    outputs: ["Website plan", "Source ZIP path", "README / setup guide", "Preview and delivery notes"],
    delivery: ["Preview link", "Final ZIP package", "Source files", "README / setup guide", "Revision path"],
    sections: [
      { title: "AI website builder for landing pages, SaaS sites and business websites", text: "Crelavo routes your website request into a structured production plan with SEO page sections, conversion copy, category links, source package expectations and delivery tracking." },
      { title: "Website production prepared for source handoff", text: "The workflow is designed around final handoff: preview, downloadable files, README/setup notes, SEO metadata, category navigation and revision status instead of only a text response." }
    ],
    examples: ["SaaS landing page", "Agency website", "Product launch page", "Portfolio website"]
  },
  {
    slug: "ai-app-builder",
    title: "AI App Builder",
    turkishTitle: "Yapay Zeka Uygulama Oluşturucu",
    badge: "App builder",
    keyword: "AI App Builder",
    summary: "Plan AI app builder workflows for SaaS MVPs, mobile apps, web apps, dashboards, admin panels and source-ready app delivery packages with modules, screens and delivery tracking.",
    primaryCtaLabel: "Start AI App Builder",
    primaryCtaHref: `${assistantBase}?mode=project&category=app&idea=AI%20App%20Builder`,
    secondaryCtaHref: "/dashboard/productions",
    bestFor: "SaaS MVPs, mobile app concepts, web apps, dashboards and internal tools",
    inputs: ["App idea", "User roles", "Core features", "Platform target"],
    outputs: ["Feature map", "Screen/module plan", "Source package direction", "README and delivery checklist"],
    delivery: ["Preview plan", "Source package", "README/setup", "Dashboard tracking", "Revision path"],
    sections: [
      { title: "Turn an app idea into production structure", text: "Crelavo helps define the app type, modules, screens, quality level and delivery package before full provider/API production." },
      { title: "Useful before final development", text: "The builder is designed to produce a clear implementation package that can become a source ZIP, project brief or admin-tracked delivery." }
    ],
    examples: ["SaaS dashboard", "Mobile booking app", "Admin panel", "Customer portal"]
  },
  {
    slug: "ai-ecommerce-builder",
    title: "AI Ecommerce Builder",
    turkishTitle: "Yapay Zeka E-Ticaret Oluşturucu",
    badge: "Commerce builder",
    keyword: "AI Ecommerce Builder",
    summary: "Create AI ecommerce builder workflows for Shopify stores, Amazon sellers, Trendyol shops, product pages, product descriptions, product ad kits and launch-ready commerce delivery packages.",
    primaryCtaLabel: "Start AI Ecommerce Builder",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=ecommerce&idea=AI%20Ecommerce%20Builder`,
    secondaryCtaHref: "/dashboard/ads",
    bestFor: "Product pages, store landing pages, Shopify/Amazon/Trendyol prep and product ad kits",
    inputs: ["Product link or product idea", "Offer details", "Target platform", "Brand or store notes"],
    outputs: ["Product page plan", "Ad kit", "Descriptions and captions", "Delivery package"],
    delivery: ["Preview", "Final ZIP", "Copy/source files", "Export notes", "Revision path"],
    sections: [
      { title: "Commerce assets in one path", text: "Crelavo can prepare product positioning, page structure, ad angles, captions and delivery files around one e-commerce objective." },
      { title: "Built for store and ad handoff", text: "The page connects commerce planning with dashboard delivery, provider tests and future channel integrations." }
    ],
    examples: ["Product landing page", "Shopify offer page", "Amazon product ad kit", "Trendyol campaign package"]
  },
  {
    slug: "ai-video-generator",
    title: "AI Video Generator",
    turkishTitle: "Yapay Zeka Video Üretici",
    badge: "Video generator",
    keyword: "AI Video Generator",
    summary: "Prepare AI video generator workflows for product videos, short clips, social media ads, TikTok/Reels/Shorts assets, captions, ratios, thumbnail notes and provider-ready delivery workflows.",
    primaryCtaLabel: "Start AI Video Generator",
    primaryCtaHref: `${assistantBase}?mode=media&category=video&idea=AI%20Video%20Generator`,
    secondaryCtaHref: "/dashboard/videos",
    bestFor: "Short videos, product clips, TikTok/Reels/Shorts assets and multi-format video packs",
    inputs: ["Video idea", "Duration goal", "Style direction", "Platform target"],
    outputs: ["Video plan", "Provider-ready job", "Captions/ratio notes", "Preview and final delivery"],
    delivery: ["Preview link", "MP4/final delivery", "Captions", "Thumbnail notes", "Revision path"],
    sections: [
      { title: "Video production with delivery logic", text: "The workflow keeps focus on final usable assets: preview, final render, export notes and dashboard-tracked revisions." },
      { title: "Low-cost testing path", text: "Users can start with a small provider test before committing to larger or higher-cost generation settings." }
    ],
    examples: ["Product ad video", "Explainer clip", "Shorts package", "Launch teaser"]
  },
  {
    slug: "ai-social-media-ai",
    title: "AI Social Media AI",
    turkishTitle: "Yapay Zeka Sosyal Medya Asistanı",
    badge: "Social media",
    keyword: "AI Social Media AI",
    summary: "Build social posts, captions, campaign angles, content calendars, short-video ideas and platform-ready delivery packages.",
    primaryCtaLabel: "Start AI Social Media AI",
    primaryCtaHref: `${assistantBase}?mode=social&category=social&idea=AI%20Social%20Media%20AI`,
    secondaryCtaHref: "/dashboard/growth",
    bestFor: "Social posts, captions, short-video plans, content calendars and launch campaigns",
    inputs: ["Brand or product", "Platform", "Campaign goal", "Tone of voice"],
    outputs: ["Post ideas", "Captions", "Short-video plan", "Export and publishing notes"],
    delivery: ["Content package", "Caption files", "Platform notes", "Revision path", "Dashboard tracking"],
    sections: [
      { title: "From campaign idea to content package", text: "Crelavo turns a rough promotion idea into platform-ready content directions and delivery files." },
      { title: "Connected to growth loops", text: "The social workflow can connect to share-to-earn, referral preparation and organic launch planning." }
    ],
    examples: ["Instagram launch posts", "TikTok short ideas", "LinkedIn campaign", "Caption package"]
  },
  {
    slug: "ai-brand-kit-builder",
    title: "AI Brand Kit Builder",
    turkishTitle: "Yapay Zeka Marka Kiti Oluşturucu",
    badge: "Brand kit",
    keyword: "AI Brand Kit Builder",
    summary: "Prepare brand voice, visual direction, messaging, launch assets and reusable brand delivery notes for creative production.",
    primaryCtaLabel: "Start AI Brand Kit Builder",
    primaryCtaHref: "/dashboard/brand-kit",
    secondaryCtaHref: `${assistantBase}?idea=AI%20Brand%20Kit%20Builder`,
    bestFor: "New brands, product launches, campaign identity, messaging systems and reusable asset kits",
    inputs: ["Brand name", "Audience", "Visual direction", "Product or service"],
    outputs: ["Brand voice", "Visual direction", "Messaging kit", "Reusable asset notes"],
    delivery: ["Brand kit page", "Asset notes", "README-style guide", "Dashboard tracking"],
    sections: [
      { title: "Brand system before production", text: "A clear brand kit helps every later website, app, ad, video and social output stay consistent." },
      { title: "Reusable delivery asset", text: "The workflow is prepared as a reusable package instead of a one-off prompt." }
    ],
    examples: ["Startup brand kit", "Product launch identity", "Campaign style guide", "Founder brand voice"]
  },
  {
    slug: "ai-ads-planner",
    title: "AI Ads Planner",
    turkishTitle: "Yapay Zeka Reklam Planlayıcı",
    badge: "Ads planner",
    keyword: "AI Ads Planner",
    summary: "Plan ad campaigns, creative angles, ROAS notes, ad copy, product ad kits and launch-ready paid media workflows.",
    primaryCtaLabel: "Start AI Ads Planner",
    primaryCtaHref: "/dashboard/ads",
    secondaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=AI%20Ads%20Planner`,
    bestFor: "Meta, TikTok, Google, product campaigns, creative testing and paid media planning",
    inputs: ["Offer", "Audience", "Platform", "Budget or goal"],
    outputs: ["Ad angles", "Creative plan", "Copy variants", "ROAS planning notes"],
    delivery: ["Campaign plan", "Ad copy package", "Creative notes", "Dashboard status"],
    sections: [
      { title: "Ad planning before spend", text: "Use the planner to shape creative angles and campaign structure before connecting live ad APIs." },
      { title: "Works with product and video flows", text: "The ads planner can connect naturally to product ad kits, video generation and commerce delivery packages." }
    ],
    examples: ["Product ad campaign", "TikTok creative plan", "Meta ad angles", "ROAS test plan"]
  },
  {
    slug: "ai-dubbing-voice",
    title: "AI Dubbing & Voice",
    turkishTitle: "Yapay Zeka Dublaj ve Seslendirme",
    badge: "Voice and dubbing",
    keyword: "AI Dubbing & Voice",
    summary: "Prepare voiceover, dubbing, localization, audio delivery notes and future provider-ready voice production workflows.",
    primaryCtaLabel: "Start AI Dubbing & Voice",
    primaryCtaHref: "/dashboard/dubbing",
    secondaryCtaHref: `${assistantBase}?mode=media&category=audio&idea=AI%20Dubbing%20%26%20Voice`,
    bestFor: "Voiceover, dubbing, localization, narration planning and audio package handoff",
    inputs: ["Script", "Language", "Voice direction", "Video or audio goal"],
    outputs: ["Voice plan", "Localization notes", "Audio delivery path", "Provider-ready brief"],
    delivery: ["Audio notes", "Subtitle/localization plan", "Dashboard delivery", "Revision path"],
    sections: [
      { title: "Voice workflow preparation", text: "The page frames dubbing and voice projects as deliverable production packages with script, language and handoff requirements." },
      { title: "Ready for provider connection", text: "Final live audio generation depends on provider/API setup, but the workflow and delivery expectations can be prepared now." }
    ],
    examples: ["Product voiceover", "Multilingual dubbing", "Narration plan", "Localization package"]
  },
  {
    slug: "growth-intelligence-agent",
    title: "AI Growth Intelligence Agent",
    turkishTitle: "Yapay Zeka Rakip İstihbarat Ajanı",
    badge: "Growth intelligence",
    keyword: "AI Growth Intelligence Agent",
    summary: "Monitor public competitor pages, pricing changes, public ad signals, landing pages and review trends, then turn them into weekly executive intelligence reports and Crelavo campaign actions.",
    primaryCtaLabel: "Start Growth Intelligence",
    primaryCtaHref: "/growth-intelligence",
    secondaryCtaHref: "/dashboard/growth-intelligence",
    bestFor: "Agencies, ecommerce teams, SaaS companies, local businesses and growth operators tracking competitors",
    inputs: ["Company website", "Competitor URLs", "Public ad library links", "Pricing or product pages", "Target market and report language"],
    outputs: ["Competitor monitoring brief", "Weekly CEO PDF report", "Opportunity alerts", "Recommended campaign actions", "Crelavo response production ideas"],
    delivery: ["Dashboard monitoring brief", "PDF report delivery", "Email/Slack alert planning", "Admin review", "Campaign response CTA"],
    sections: [
      { title: "Public competitor monitoring as a service", text: "The Growth Intelligence Agent watches public competitor and market signals instead of generating a single media file. It is designed for recurring monitoring, PDF reports and strategic action planning." },
      { title: "From insights to Crelavo production", text: "A price change, new public ad angle or review trend can become an ad video, landing page, social campaign, email sequence or product response brief inside Crelavo." }
    ],
    examples: ["Competitor price monitoring", "Public ad signal tracking", "Weekly CEO strategy PDF", "Ecommerce competitor report"],
    internalLinks: [
      { label: "Growth Intelligence plans", href: "/growth-intelligence" },
      { label: "Dashboard monitoring setup", href: "/dashboard/growth-intelligence" },
      { label: "AI Live Sales Agent", href: "/live-sales-credits" },
      { label: "Drone credit packs", href: "/drone-credits" }
    ]
  },
  {
    slug: "ai-bulk-content-builder",
    title: "AI Bulk Content Builder",
    turkishTitle: "Yapay Zeka Toplu İçerik Oluşturucu",
    badge: "Bulk content",
    keyword: "AI Bulk Content Builder",
    summary: "Plan batch content, CSV-driven production, multi-item exports, product content sets and bulk delivery packages.",
    primaryCtaLabel: "Start AI Bulk Content Builder",
    primaryCtaHref: "/dashboard/bulk",
    secondaryCtaHref: `${assistantBase}?idea=AI%20Bulk%20Content%20Builder`,
    bestFor: "Batch product content, social batches, CSV/list-based generation and multi-file delivery packages",
    inputs: ["CSV or item list", "Content type", "Output format", "Delivery goal"],
    outputs: ["Batch plan", "Multi-item content structure", "Export notes", "Delivery tracking"],
    delivery: ["Batch output plan", "ZIP/export package", "CSV notes", "Revision path"],
    sections: [
      { title: "Scale content production", text: "Bulk content workflows help prepare many assets from structured inputs instead of building one item at a time." },
      { title: "Post-launch automation ready", text: "The feature is positioned for growth after core launch while still giving users a visible planning path now." }
    ],
    examples: ["100 product descriptions", "Caption batch", "CSV content plan", "Multi-asset export package"]
  }
];

const strategicSeoPages: ServicePage[] = [
  {
    slug: "brand-memory",
    title: "Brand Memory & Brand Voice Hub",
    turkishTitle: "Marka Hafızası ve Marka Sesi Merkezi",
    badge: "Brand memory",
    keyword: "Brand Memory & Brand Voice Hub",
    summary: "Save brand voice, logo notes, colors, audience rules and reusable campaign preferences once, then apply them across Crelavo videos, websites, ecommerce campaigns and ad production workflows.",
    primaryCtaLabel: "Start Brand Memory setup",
    primaryCtaHref: "/dashboard/brand-kit",
    secondaryCtaHref: "/pricing",
    bestFor: "Ecommerce brands, agencies, creators and teams that need consistent output across many productions",
    inputs: ["Logo or brand references", "Brand colors", "Tone of voice", "Target audience", "Preferred CTAs", "Words or claims to avoid"],
    outputs: ["Reusable brand voice profile", "Visual direction notes", "Campaign language rules", "Production-ready brand kit", "Assistant workflow memory"],
    delivery: ["Brand kit dashboard", "Reusable production rules", "Campaign prompt context", "Website/video/ad consistency notes", "Revision path"],
    sections: [
      { title: "Keep every Crelavo production on brand", text: "Brand Memory turns repeated instructions into a reusable production layer. A user should not need to upload the same logo, explain the same tone or rewrite the same audience rules every time they start a video, website, social post or ecommerce campaign." },
      { title: "Built for retention and agency workflows", text: "A saved brand kit makes Crelavo harder to replace because the workspace becomes the user's brand production memory. Agencies can use it to manage multiple client voices while keeping each output consistent." }
    ],
    examples: ["Agency client brand memory", "Ecommerce brand voice", "Startup visual identity", "Reusable ad production rules"],
    seoPriority: "high",
    internalLinks: [
      { label: "AI Brand Kit Builder", href: "/ai-brand-kit-builder" },
      { label: "Brand kit dashboard", href: "/dashboard/brand-kit" },
      { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" },
      { label: "Pricing", href: "/pricing" }
    ],
    faqItems: [
      { question: "What does Brand Memory save?", answer: "It can save brand voice, color direction, logo notes, audience rules, preferred CTAs, content style and production constraints so future Crelavo workflows can reuse the same identity." },
      { question: "Is this useful for agencies?", answer: "Yes. Agencies can use Brand Memory as a repeatable client workspace so videos, websites, ads and campaign assets follow each client's tone and visual rules." }
    ]
  },
  {
    slug: "ai-hook-generator",
    title: "AI Hook & UGC Generator",
    turkishTitle: "Yapay Zeka Hook ve UGC Üretici",
    badge: "Ad hooks",
    keyword: "AI Hook & UGC Generator",
    summary: "Generate multiple first-three-second hooks, UGC angles, captions, CTAs and short-form ad variations for one product so teams can test more creatives without starting from zero.",
    primaryCtaLabel: "Generate hook variations",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=AI%20Hook%20and%20UGC%20Generator`,
    secondaryCtaHref: "/free-tools/ad-performance-score-checker",
    bestFor: "Product ads, TikTok/Reels hooks, UGC scripts, A/B testing and ecommerce creative refreshes",
    inputs: ["Product link or description", "Audience", "Offer", "Pain point", "Platform", "Brand voice"],
    outputs: ["5 hook ideas", "UGC script angles", "Caption variants", "CTA options", "Preview-ready video opening briefs"],
    delivery: ["Hook script pack", "UGC angle list", "Ad variation brief", "Low-credit preview path", "Final render upgrade path"],
    sections: [
      { title: "Turn one product into multiple ad tests", text: "The first three seconds often decide whether a short-form ad survives. This workflow creates several opening angles for the same product so users can test curiosity, problem-solution, proof, objection and offer-led hooks." },
      { title: "Designed to increase package value", text: "Hook generation can start as a low-credit script workflow and upgrade into multiple final video variations. That makes it useful for conversion while keeping expensive renders credit-gated." }
    ],
    examples: ["5 TikTok hooks for a skincare product", "UGC opening lines for a gadget", "A/B ad captions", "Problem-solution Reels scripts"],
    seoPriority: "high",
    internalLinks: [
      { label: "Ad Performance Score Checker", href: "/free-tools/ad-performance-score-checker" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" },
      { label: "Pricing", href: "/pricing" }
    ],
    faqItems: [
      { question: "Does this create final videos immediately?", answer: "The first phase can create hooks, scripts and ad variation briefs. Final video renders should stay credit-gated because they use more expensive provider resources." },
      { question: "Can one product get multiple ad versions?", answer: "Yes. The workflow is built to turn one product into several hook and UGC angles for A/B testing." }
    ]
  },
  {
    slug: "ai-marketplace-localization",
    title: "AI Marketplace Localization Studio",
    turkishTitle: "Yapay Zeka Pazaryeri Yerelleştirme Stüdyosu",
    badge: "Marketplace localization",
    keyword: "AI Marketplace Localization Studio",
    summary: "Turn Trendyol, Shopify or Amazon product information into localized marketplace titles, bullet points, product descriptions, ad scripts and campaign language for target markets like the US, UK or Germany.",
    primaryCtaLabel: "Start marketplace localization",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=localization&idea=AI%20Marketplace%20Localization%20Studio`,
    secondaryCtaHref: "/pricing",
    bestFor: "Sellers expanding from local marketplaces into Amazon US/UK, Etsy, Shopify or international ecommerce channels",
    inputs: ["Product link or listing", "Source market", "Target country", "Product benefits", "Brand notes", "Marketplace goal"],
    outputs: ["Localized title", "Marketplace bullet points", "Product description", "SEO keywords", "Ad script", "Social caption set"],
    delivery: ["Localization copy pack", "Marketplace listing brief", "Campaign language notes", "Video script upgrade path", "Dashboard delivery"],
    sections: [
      { title: "From local listing to global sales language", text: "A direct translation is rarely enough for global ecommerce. This service reframes the product for the target country's buying habits, marketplace search language and ad positioning." },
      { title: "Low-cost first phase, premium media later", text: "The MVP can begin with listing copy, bullet points, SEO terms and ad scripts. Dubbing, visual text replacement, lip-sync or localized final videos should be added later as premium credit-gated upgrades." }
    ],
    examples: ["Trendyol to Amazon US listing", "Turkish product to German marketplace copy", "Shopify product localization", "Etsy listing expansion pack"],
    seoPriority: "high",
    internalLinks: [
      { label: "Trendyol Product Video", href: "/trendyol-product-video" },
      { label: "Amazon Product Ad Video", href: "/amazon-product-ad-video" },
      { label: "AI Dubbing & Voice", href: "/ai-dubbing-voice" },
      { label: "Pricing", href: "/pricing" }
    ],
    faqItems: [
      { question: "Is this only translation?", answer: "No. The goal is market adaptation: title structure, bullet points, SEO terms, cultural positioning, ad angles and campaign language for the selected country." },
      { question: "Can it localize videos too?", answer: "Video localization can be offered as a premium phase. The first practical phase should focus on copy, listing and script localization to keep cost controlled." }
    ]
  },
  {
    slug: "competitor-ad-analyzer",
    title: "Competitor Ad Analyzer",
    turkishTitle: "Rakip Reklam Analiz Aracı",
    badge: "Competitor analysis",
    keyword: "Competitor Ad Analyzer",
    summary: "Analyze public competitor ad structure, hooks, pacing, offer language and positioning, then create an original Crelavo campaign brief for the user's own product without copying the competitor creative.",
    primaryCtaLabel: "Analyze competitor ad",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=analysis&idea=Competitor%20Ad%20Analyzer`,
    secondaryCtaHref: "/growth-intelligence",
    bestFor: "Ecommerce sellers, agencies and growth teams that want to learn from public competitor ads and create original alternatives",
    inputs: ["Competitor ad link or notes", "Own product", "Target audience", "Platform", "Offer", "Brand constraints"],
    outputs: ["Hook breakdown", "Creative structure analysis", "Positioning notes", "Weakness/opportunity list", "Original campaign brief"],
    delivery: ["Competitor insight report", "Original ad script", "Shot/creative direction", "Campaign response plan", "Premium video upgrade path"],
    sections: [
      { title: "Analyze structure, do not clone", text: "This service should never copy a competitor ad, logo, exact script or protected creative. It analyzes public structure such as hook type, pacing, offer framing and CTA logic, then creates an original campaign for the user's own product." },
      { title: "Connect competitor insight to production", text: "Once the pattern is understood, Crelavo can turn the insight into a new product video brief, landing page angle, caption set or ecommerce campaign package." }
    ],
    examples: ["TikTok competitor ad breakdown", "Facebook Ads Library creative analysis", "UGC structure report", "Original product ad response brief"],
    seoPriority: "high",
    internalLinks: [
      { label: "Growth Intelligence Agent", href: "/growth-intelligence-agent" },
      { label: "AI Hook & UGC Generator", href: "/ai-hook-generator" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Pricing", href: "/pricing" }
    ],
    faqItems: [
      { question: "Does Crelavo copy competitor ads?", answer: "No. The service is positioned around structural analysis and original campaign creation. It should not reproduce competitor logos, exact scripts or protected creative." },
      { question: "Can this become a final video?", answer: "Yes, after the analysis phase the user can upgrade into a product video or campaign production workflow using their own product and brand assets." }
    ]
  },
  {
    slug: "shopify-product-link-to-ad-video",
    title: "Shopify Product Link to Ad Video",
    turkishTitle: "Shopify Ürün Linkinden Reklam Videosu",
    badge: "Shopify video ads",
    keyword: "Shopify Product Link to Ad Video",
    summary: "Turn a Shopify product URL into a managed AI product ad video workflow for Shopify product video ads, TikTok/Reels creatives, offer extraction, script angles, visual direction, preview planning and dashboard delivery.",
    primaryCtaLabel: "Start Shopify product video",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=Shopify%20product%20link%20to%20ad%20video`,
    secondaryCtaHref: "/pricing",
    bestFor: "Shopify stores, DTC brands, dropshipping tests, product launches and paid social ad creatives",
    inputs: ["Shopify product URL", "Product benefits", "Target market", "Brand notes", "Ad platform goal"],
    outputs: ["Product ad script", "Video angle brief", "Creative direction", "Preview plan", "Campaign-ready delivery notes"],
    delivery: ["10-second watermarked preview", "Final video package", "Caption/script notes", "Thumbnail direction", "Revision path"],
    sections: [
      { title: "Shopify product video generator for product link to ad video workflows", text: "Crelavo helps convert a Shopify product page into a structured ad video brief with product benefits, hooks, objections, CTA direction, category links and delivery expectations." },
      { title: "Built for Shopify TikTok ads, Reels, Shorts and Meta product creative", text: "The workflow is designed for TikTok, Reels, Shorts and Meta ad tests where teams need fast Shopify product angles, preview visibility, long-tail ecommerce keywords and clear credit usage." }
    ],
    examples: ["Shopify skincare product video", "Shopify gadget ad", "Dropshipping product test", "DTC launch creative"],
    seoPriority: "high",
    faqItems: [
      { question: "Can Crelavo create a product ad from only a Shopify link?", answer: "Yes. You can start with a Shopify product URL, then add brand notes, audience and ad platform goals so Crelavo can prepare a structured product video workflow." },
      { question: "Does the preview include a final downloadable video?", answer: "The paid preview includes one 10-second watermarked video. Downloads are closed during preview and open only after the selected subscription starts." }
    ],
    internalLinks: [
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Shopify product link guide", href: "/blog/shopify-product-link-to-ai-video-guide" },
      { label: "Shopify AI product video app", href: "/shopify-ai-product-video-app" },
      { label: "Chrome extension funnel", href: "/chrome-extension" },
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "Product ad video service", href: "/products/product-ad-video" },
      { label: "Pricing and preview fees", href: "/pricing" },
      { label: "AI Ecommerce Builder", href: "/ai-ecommerce-builder" }
    ]
  },
  {
    slug: "amazon-product-ad-video",
    title: "Amazon Product Ad Video",
    turkishTitle: "Amazon Ürün Reklam Videosu",
    badge: "Amazon product video",
    keyword: "Amazon Product Ad Video",
    summary: "Create Amazon product ad video briefs for marketplace sellers with benefit-led scripts, comparison angles, Amazon listing signals, social retargeting visuals and preview-ready AI video delivery workflows.",
    primaryCtaLabel: "Start Amazon product ad",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=Amazon%20product%20ad%20video`,
    secondaryCtaHref: "/pricing",
    bestFor: "Amazon sellers, marketplace brands, product launch teams and ecommerce agencies",
    inputs: ["Amazon product link", "Listing benefits", "Customer pain points", "Competitor notes", "Target audience"],
    outputs: ["Marketplace video script", "Product benefit angle", "Comparison concept", "Short-form ad direction", "Delivery checklist"],
    delivery: ["Preview video", "Final MP4 delivery", "Script and caption notes", "Revision path", "Dashboard tracking"],
    sections: [
      { title: "Amazon product ad video maker for marketplace listings", text: "Amazon product ads need fast clarity: what the product solves, why it is different and why the buyer should trust it. Crelavo structures the brief around those conversion points, category intent and marketplace SEO phrases." },
      { title: "Use Amazon listing signals for short-form product videos", text: "A product link, benefits, reviews, objections and comparison notes can become a focused short-form video workflow for Amazon marketplace traffic, product launches and social retargeting." }
    ],
    examples: ["Amazon supplement ad", "Amazon kitchen gadget video", "Amazon comparison clip", "Marketplace product launch"],
    seoPriority: "high",
    faqItems: [
      { question: "Can Crelavo turn an Amazon listing into a product video brief?", answer: "Yes. Crelavo can use an Amazon listing, product benefits, buyer objections and review-style signals to prepare a marketplace video script, creative direction and delivery checklist." },
      { question: "Is this only for Amazon ads?", answer: "No. The Amazon product ad workflow can support listing videos, social retargeting, TikTok/Reels/Shorts creative, comparison angles and marketplace launch assets." },
      { question: "Does Crelavo make unsupported product claims?", answer: "No. The workflow should stay aligned with the listing, supplied product facts and safe claim language so the final ad direction does not invent unsupported promises." }
    ],
    internalLinks: [
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Amazon product page guide", href: "/blog/amazon-product-page-to-ai-ad-video-guide" },
      { label: "Product page to video workflow", href: "/blog/ecommerce-product-page-to-video-workflow" },
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "Product video alternatives", href: "/alternatives/product-video-generator-alternative" },
      { label: "Product ad video service", href: "/products/product-ad-video" },
      { label: "AI Video Generator", href: "/ai-video-generator" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    slug: "trendyol-product-video",
    title: "Trendyol Product Video",
    turkishTitle: "Trendyol Ürün Videosu",
    badge: "Trendyol commerce video",
    keyword: "Trendyol Product Video",
    summary: "Prepare Trendyol product video workflows for Turkish ecommerce sellers with Trendyol product links, localized selling angles, marketplace SEO terms, short-form video direction and preview delivery.",
    primaryCtaLabel: "Start Trendyol product video",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=Trendyol%20product%20video`,
    secondaryCtaHref: "/pricing",
    bestFor: "Turkish ecommerce sellers, marketplace shops, product launch tests and social commerce campaigns",
    inputs: ["Trendyol product link", "Turkish market notes", "Product benefits", "Target buyer", "Campaign goal"],
    outputs: ["Localized product video brief", "Turkish selling hooks", "Short-form script", "Creative direction", "Delivery plan"],
    delivery: ["Watermarked preview", "Final MP4 package", "Caption notes", "Thumbnail direction", "Revision path"],
    sections: [
      { title: "Trendyol product video service for Turkish ecommerce sellers", text: "Crelavo frames Trendyol product videos around Turkish buyer expectations, marketplace benefits, fast hooks, category intent and short-form conversion goals." },
      { title: "Trendyol product link to campaign video workflow", text: "A Trendyol URL can become a structured request with offer summary, product value points, marketplace keywords, video direction and delivery tracking inside the dashboard." }
    ],
    examples: ["Trendyol fashion product video", "Turkish beauty product ad", "Marketplace gadget video", "Local ecommerce campaign"],
    seoPriority: "high",
    faqItems: [
      { question: "Can Crelavo prepare product video ideas from a Trendyol product page?", answer: "Yes. Crelavo can use a Trendyol product page, product benefits, buyer context and campaign goal to prepare localized hooks, short-form script direction and product video delivery notes." },
      { question: "Is the Trendyol video workflow only for Turkey?", answer: "It is optimized for Turkish ecommerce and Trendyol-style marketplace selling, but the same structure can also support broader marketplace product video campaigns." },
      { question: "Can this become a TikTok or Reels ad?", answer: "Yes. The Trendyol product video workflow can be adapted into vertical TikTok, Reels, Shorts, Meta ad or product page preview formats depending on the selected production package." }
    ],
    internalLinks: [
      { label: "AI Ecommerce Builder", href: "/ai-ecommerce-builder" },
      { label: "Trendyol product video guide", href: "/blog/trendyol-product-video-campaign-guide" },
      { label: "AI ecommerce campaign checklist", href: "/blog/shopify-amazon-trendyol-ai-campaign-checklist" },
      { label: "Campaign category", href: "/categories/campaign" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Product ad video service", href: "/products/product-ad-video" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    slug: "ai-product-video-generator",
    title: "AI Product Video Generator",
    turkishTitle: "Yapay Zeka Ürün Videosu Oluşturucu",
    badge: "Product video generator",
    keyword: "AI Product Video Generator",
    summary: "Generate AI product video workflows for ecommerce brands, Shopify stores, Amazon sellers and Trendyol shops with product links, scripts, short-form ad angles, preview videos and final delivery planning.",
    primaryCtaLabel: "Start product video workflow",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=video&idea=AI%20product%20video%20generator`,
    secondaryCtaHref: "/pricing",
    bestFor: "Ecommerce brands, Shopify stores, Amazon sellers, marketplace shops, agencies and product launch teams",
    inputs: ["Product URL", "Product images", "Audience", "Offer", "Preferred platform"],
    outputs: ["Product video brief", "Ad script", "Creative direction", "Preview plan", "Final delivery notes"],
    delivery: ["10-second watermarked preview", "Final MP4", "Captions", "Thumbnail direction", "Revision path"],
    sections: [
      { title: "AI product video generator for ecommerce, Shopify, Amazon and Trendyol", text: "Crelavo turns product links and product notes into a clear video production workflow so teams know what will be previewed, delivered, revised and connected to the right ecommerce category." },
      { title: "Product video workflows for ads, marketplace listings and organic social", text: "Use the workflow for paid ads, organic social, product launches, marketplace listings, landing page video assets and short-form videos for TikTok, Reels and YouTube Shorts." }
    ],
    examples: ["Skincare product video", "Gadget product ad", "Fashion product clip", "SaaS feature promo"],
    seoPriority: "high",
    internalLinks: [
      { label: "Shopify product link to ad video", href: "/shopify-product-link-to-ad-video" },
      { label: "Amazon product ad video", href: "/amazon-product-ad-video" },
      { label: "Trendyol product video", href: "/trendyol-product-video" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    slug: "tiktok-shop-ai-live-sales-agent",
    title: "TikTok Shop AI Live Sales Agent",
    turkishTitle: "TikTok Shop Yapay Zeka Canlı Satış Ajanı",
    badge: "Live commerce agent",
    keyword: "TikTok Shop AI Live Sales Agent",
    summary: "Plan AI live sales agent workflows for TikTok Shop and live commerce with product scripts, safe claims, CTA planning, fair-use hours and human fallback rules.",
    primaryCtaLabel: "Start live sales plan",
    primaryCtaHref: "/live-sales-credits",
    secondaryCtaHref: "/pricing",
    bestFor: "Live commerce sellers, TikTok Shop operators, ecommerce brands and agencies testing AI presenter workflows",
    inputs: ["Product catalog", "Allowed claims", "Target audience", "Live selling language", "CTA rules"],
    outputs: ["Live sales script", "Presenter behavior brief", "Safe claims policy", "CTA plan", "Fair-use service setup"],
    delivery: ["Service plan", "Preview direction", "Dashboard tracking", "Human fallback policy", "Support path"],
    sections: [
      { title: "AI live sales with safety controls", text: "Crelavo positions live sales agents as managed service workflows with human fallback, product-claim safety and clear fair-use hours instead of unrestricted autonomous selling." },
      { title: "Built for ecommerce conversion", text: "The workflow helps define live selling scripts, product benefits, safe claims, audience questions, CTA timing and support escalation before provider activation." }
    ],
    examples: ["TikTok Shop live host", "Product Q&A presenter", "Live commerce launch", "Multilingual sales assistant"],
    seoPriority: "high",
    internalLinks: [
      { label: "Live sales plans", href: "/live-sales-credits" },
      { label: "Terms of Service", href: "/terms" },
      { label: "AI Avatar Video", href: "/products/avatar" },
      { label: "Pricing", href: "/pricing" }
    ]
  },
  {
    slug: "ai-ecommerce-campaign-generator",
    title: "AI Ecommerce Campaign Generator",
    turkishTitle: "Yapay Zeka E-Ticaret Kampanya Oluşturucu",
    badge: "Ecommerce campaign generator",
    keyword: "AI Ecommerce Campaign Generator",
    summary: "Turn ecommerce product links into campaign briefs, ad angles, product videos, captions, landing page copy and AI + human QA delivery workflows.",
    primaryCtaLabel: "Start ecommerce campaign",
    primaryCtaHref: `${assistantBase}?mode=commerce&category=campaign&idea=AI%20ecommerce%20campaign%20generator`,
    secondaryCtaHref: "/pricing",
    bestFor: "Ecommerce teams, DTC brands, marketplace sellers, agencies and dropshipping testers",
    inputs: ["Product link", "Offer", "Audience", "Platform", "Brand notes"],
    outputs: ["Campaign brief", "Ad angles", "Product video direction", "Caption set", "Landing page copy"],
    delivery: ["Campaign package", "Preview assets", "Final files", "README/export notes", "Revision path"],
    sections: [
      { title: "One product link, many campaign assets", text: "Crelavo connects product-link analysis with video, copy, visuals and landing page direction so teams can launch with a complete creative package." },
      { title: "Useful for ads and organic launches", text: "The workflow supports paid social testing, marketplace traffic, organic short-form videos, product pages and campaign refreshes." }
    ],
    examples: ["Shopify campaign package", "Amazon product launch", "Trendyol campaign", "Dropshipping test creative"],
    seoPriority: "high",
    internalLinks: [
      { label: "Shopify product link to ad video", href: "/shopify-product-link-to-ad-video" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "AI Ecommerce Builder", href: "/ai-ecommerce-builder" },
      { label: "Pricing", href: "/pricing" }
    ]
  }
];

const nicheTargets = [
  { slug: "small-business", label: "Small Business", tr: "Küçük İşletmeler" },
  { slug: "startups", label: "Startups", tr: "Girişimler" },
  { slug: "agencies", label: "Agencies", tr: "Ajanslar" },
  { slug: "creators", label: "Creators", tr: "İçerik Üreticileri" },
  { slug: "ecommerce", label: "Ecommerce", tr: "E-Ticaret" },
  { slug: "local-business", label: "Local Business", tr: "Yerel İşletmeler" },
  { slug: "dropshipping", label: "Dropshipping", tr: "Dropshipping" }
];

const nicheBaseSlugs = ["ai-website-builder", "ai-ecommerce-builder", "ai-video-generator", "growth-intelligence-agent"];

function nicheSummary(base: ServicePage, target: { label: string }) {
  return `${base.title} for ${target.label} helps teams plan a focused production workflow with SEO content, delivery requirements, source or media handoff, dashboard tracking and admin-managed redirects.`;
}

function buildNichePage(base: ServicePage, target: { slug: string; label: string; tr: string }): ServicePage {
  const keyword = `${base.title} for ${target.label}`;
  return {
    ...base,
    slug: `${base.slug}-for-${target.slug}`,
    title: keyword,
    turkishTitle: `${base.turkishTitle} — ${target.tr} İçin`,
    badge: `${base.badge} niche`,
    keyword,
    summary: nicheSummary(base, target),
    primaryCtaLabel: `Start ${keyword}`,
    primaryCtaHref: `${base.primaryCtaHref}&niche=${encodeURIComponent(target.label)}`,
    bestFor: `${target.label} teams, agencies, operators and businesses that need ${base.title.toLowerCase()} delivery packages`,
    inputs: [...base.inputs, `${target.label} business context`],
    outputs: [...base.outputs, `${target.label} launch assets`],
    delivery: base.delivery,
    sections: [
      { title: `Why ${target.label} teams use ${base.title}`, text: `${keyword} gives ${target.label.toLowerCase()} users a clearer starting point than a generic AI prompt. The page frames the use case, expected inputs, delivery formats and route into the right Crelavo production workflow.` },
      { title: `${keyword} delivery workflow`, text: `Crelavo can prepare a structured request around ${target.label.toLowerCase()} goals, then route users toward preview, final package, source/media files, README or export notes and revision tracking depending on the selected package.` }
    ],
    examples: [`${target.label} landing page`, `${target.label} campaign package`, `${target.label} content assets`, `${target.label} delivery workflow`]
  };
}

const programmaticNichePages = coreServicePages
  .filter((page) => nicheBaseSlugs.includes(page.slug))
  .flatMap((page) => nicheTargets.map((target) => buildNichePage(page, target)));

export const servicePages: ServicePage[] = [...coreServicePages, ...strategicSeoPages, ...programmaticNichePages];

export const servicePageMap = new Map(servicePages.map((page) => [page.slug, page]));
