import { categoryShowcaseItems, featureShowcaseItems } from "@/lib/showcase-items";

export type PublicNavLink = {
  label: string;
  href: string;
  order: number;
  active: boolean;
};

export type BlogKeywordLink = {
  label: string;
  href: string;
};

export type BlogTopic = {
  id: string;
  kicker: string;
  title: string;
  summary: string;
  body: string[];
  image: string;
  imageAlt: string;
  mediaKind?: "image" | "video" | "video-slot";
  videoUrl?: string;
  videoPoster?: string;
  ctaLabel: string;
  ctaHref: string;
  linkedKeywords: BlogKeywordLink[];
  order: number;
  active: boolean;
};

export type FooterHelpPanel = {
  id: string;
  title: string;
  description: string;
  items: { title: string; body: string }[];
  order: number;
  active: boolean;
};

export type SocialLink = {
  label: string;
  href: string;
  order: number;
  active: boolean;
};

export type ShowcaseSlideConfig = {
  id: string;
  section: "launcher" | "features" | "categories";
  title: string;
  kicker: string;
  description: string;
  href: string;
  tone: "cyan" | "purple" | "green" | "amber" | "pink" | "blue";
  imageUrl: string;
  order: number;
  active: boolean;
};

export type SiteContentConfig = {
  navLinks: PublicNavLink[];
  blogTopics: BlogTopic[];
  footerHelpPanels: FooterHelpPanel[];
  socialLinks: SocialLink[];
  showcaseSlides: ShowcaseSlideConfig[];
};

export const defaultPublicNavLinks: PublicNavLink[] = [
  { label: "Home", href: "/", order: 1, active: true },
  { label: "Categories", href: "/categories", order: 2, active: true },
  { label: "Tools", href: "/tools", order: 3, active: true },
  { label: "Credits", href: "/pricing", order: 4, active: true },
  { label: "Live Sales Plans", href: "/live-sales-credits", order: 5, active: true },
  { label: "Drone Plans", href: "/drone-credits", order: 6, active: true },
  { label: "Assistant", href: "/dashboard/assistant-workspace", order: 7, active: true },
  { label: "Growth Intelligence", href: "/growth-intelligence", order: 8, active: true },
  { label: "Affiliate", href: "/affiliate", order: 9, active: true },
  { label: "Productions", href: "/dashboard/productions", order: 10, active: true },
  { label: "Dashboard", href: "/dashboard", order: 11, active: true },
  { label: "Contact", href: "/contact", order: 12, active: true },
  { label: "Blog / Content", href: "/blog", order: 13, active: true }
];

export const defaultBlogTopics: BlogTopic[] = [
  {
    id: "ai-production-studio",
    kicker: "AI production studio",
    title: "Crelavo as a full AI production studio",
    summary: "Crelavo brings AI website production, AI app production, AI video production, visual generation, brand systems and delivery workflows into one managed production studio.",
    body: [
      "Crelavo is built as an AI production studio for teams that need more than a single prompt result. A modern business may need a website, mobile app screens, SaaS dashboards, marketplace listing assets, AI videos, music videos, animations, avatar videos, lip-sync clips, voice cloning, visual cloning, brand kits and visual packages in the same campaign cycle. Instead of forcing teams to move between disconnected tools, Crelavo organizes those needs as production requests with credits, categories, status and delivery.",
      "This matters because real production work is rarely one file. A founder may start with AI website production, then need AI app production for mobile application screens, followed by AI video ads for launch. An e-commerce seller may start with marketplace listing assets and continue with product ad video, AI image generation, product visuals, social captions and a product link to ad video workflow. A creator may need text to video, image to video, script to video, music video production, long video clips and cinematic scenes. Crelavo is designed to keep these connected.",
      "The platform uses a production-first structure. The user describes the goal, chooses or enters a production path, reserves credits and follows the output from request to dashboard delivery. This allows Crelavo to support AI marketing campaigns, AI video ads, AI avatar video, AI voice-over, AI image generation, brand kit production and AI + human QA delivery without presenting the site as only a generator.",
      "For agencies and global teams, the advantage is consistency. A brand launch can use the same creative direction across web pages, app screens, SaaS panels, visual packs, advertising video, avatar video, voice-over and brand kit production. A campaign can move from idea to content, from content to media, and from media to delivery with less manual coordination.",
      "Crelavo also gives search engines a clearer picture of the platform. The site is not only about artificial intelligence video. It covers AI production studio workflows, AI website production, AI application production, advertisement video production, AI video advertising, AI avatar video, AI voice-over, AI image creation, marketplace campaign assets and managed production delivery for digital businesses.",
      "The result is a wider production surface: business websites, e-commerce pages, mobile app interfaces, SaaS dashboards, marketplace product listings, AI videos, music videos, animations, cinematic scenes, lip-sync content, voice cloning, visual cloning, brand kits and visual asset packs can all be described as part of one Crelavo workflow."
    ],
    image: "/blog/ai-production-studio.svg",
    imageAlt: "Crelavo AI production studio dashboard illustration",
    ctaLabel: "Start production",
    ctaHref: "/dashboard/assistant-workspace",
    linkedKeywords: [
      { label: "AI production studio", href: "/showcase/omni-assistant" },
      { label: "AI + human QA delivery", href: "/dashboard/productions" },
      { label: "production categories", href: "/categories" }
    ],
    order: 1,
    active: true
  },
  {
    id: "ecommerce-product-campaigns",
    kicker: "E-commerce campaign production",
    title: "Marketplace listing assets and product links become campaign packages",
    summary: "Shopify product link ads, Amazon product campaigns, Trendyol product videos and marketplace listing assets can become structured ad videos, visuals, captions and delivery packages.",
    body: [
      "E-commerce campaign production needs more than one image or one short caption. A seller may need marketplace listing assets, product ad video, AI video ads, AI image generation, product visuals, store banners, social hooks and launch copy from the same product page. Crelavo is built around this product-link-first workflow, where a Shopify URL, Amazon listing, Trendyol product page or direct e-commerce product link becomes the starting point for a campaign.",
      "A product link to ad video workflow can read the product context, shape the campaign angle and turn the listing into short-form video ideas, advertising video scripts, marketplace copy, product image concepts and social creative directions. This is valuable for store owners because marketplace pages often contain the proof points, benefits, images and price signals needed for a campaign, but those signals still need to become clear production assets.",
      "Crelavo can position a product campaign across multiple output types. One request may produce a product ad video, AI video advertising concept, product visuals, caption sets, marketplace listing support, image packs and a delivery package for the dashboard. Another request may focus on Shopify product link ads, Amazon product campaigns or Trendyol product videos with different hook styles and platform formatting.",
      "For SEO and user clarity, this page describes the practical production intent directly: e-commerce campaign production, AI e-commerce campaign generator, marketplace listing assets, product link to ad video, product advertising video, product visual packages and AI + human QA delivery. These phrases match how sellers search when they want a product page converted into marketing assets rather than a blank prompt box.",
      "The workflow can also connect e-commerce assets to broader brand needs. A product ad campaign may require a landing page, product comparison visual, AI voice-over, avatar explainer, short animation or brand kit update. Crelavo keeps those next steps close to the original product request so the campaign does not become a scattered collection of files.",
      "This makes the Blog / Content section useful for both visitors and search engines. It explains that Crelavo supports Shopify, Amazon and Trendyol product campaigns while also covering AI videos, AI image creation, advertising video production and marketplace-ready visual packages."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "E-commerce product campaign workflow with Shopify Amazon and Trendyol links",
    ctaLabel: "Create product ad",
    ctaHref: "/dashboard/assistant-workspace?idea=Product%20link%20to%20ad%20video&category=campaign&mode=commerce",
    linkedKeywords: [
      { label: "product link to ad video", href: "/products/product-ad-video" },
      { label: "marketplace listing assets", href: "/showcase/marketing-commerce" },
      { label: "Shopify product campaign", href: "/dashboard/assistant-workspace?idea=Shopify%20product%20link%20ad&category=campaign&mode=commerce" }
    ],
    order: 2,
    active: true
  },
  {
    id: "website-app-production",
    kicker: "AI website and app production",
    title: "AI website production, mobile app screens and SaaS dashboards",
    summary: "Crelavo covers AI website production, AI app production, mobile application screens, SaaS panels, admin dashboards and digital product delivery alongside campaign media.",
    body: [
      "Crelavo is not limited to AI video generation. The platform also supports AI website production for landing pages, business websites, e-commerce pages, product pages and campaign microsites. A user can begin with a website brief, product launch, service description or marketplace idea and turn it into a structured production request that leads toward pages, content, visuals and delivery notes.",
      "AI app production is another important part of the platform. Mobile application screens, onboarding flows, feature pages, account areas, checkout screens and app presentation assets can be planned as production outputs. This helps founders and teams move from rough idea to visible interface direction before committing to full development.",
      "SaaS dashboards and SaaS panels are also part of the production surface. A SaaS product may need dashboard screens, analytics panels, admin views, billing areas, user management screens, settings pages and marketing content. Crelavo can describe these as AI production requests rather than isolated design tasks, which makes the workflow easier to organize.",
      "The connection between digital products and campaign media is important. A website can need AI video ads. A SaaS dashboard can need an explainer animation. A mobile app can need an avatar video, voice-over demo, product walkthrough or cinematic launch scene. A marketplace listing can need a landing page and product visual package. Crelavo keeps these outputs under the same production studio logic.",
      "From an SEO perspective, the Blog / Content hub now covers the exact language users search for: AI website production, AI application production, mobile app screens, SaaS dashboards, SaaS panels, admin dashboards, e-commerce pages, product launch pages and AI + human QA delivery. These terms are placed in explanatory content instead of keyword stuffing, so the article remains useful to real readers.",
      "Crelavo can therefore serve teams that need web, app, SaaS, media and campaign assets together. It is a production environment for digital products and growth content, not only a page builder, not only a video tool and not only an image generator."
    ],
    image: "/blog/website-app-production.svg",
    imageAlt: "AI website production and AI app production screens",
    ctaLabel: "Open categories",
    ctaHref: "/categories",
    linkedKeywords: [
      { label: "AI website production", href: "/products/website" },
      { label: "mobile app screens", href: "/products/mobile-app" },
      { label: "SaaS dashboards", href: "/products/saas" }
    ],
    order: 3,
    active: true
  },
  {
    id: "ai-video-avatar-voice",
    kicker: "AI video, avatar and voice-over",
    title: "AI videos, music videos, animations, avatar videos and voice workflows",
    summary: "AI video production inside Crelavo includes text to video, image to video, script to video, music video, long video clips, cinematic scenes, lip-sync, voice cloning and AI voice-over workflows.",
    body: [
      "AI video is one of the largest production categories inside Crelavo, but the platform treats it as a family of workflows rather than one generic feature. A user may need text to video, image to video, script to video, product advertising video, AI video ads, cinematic scenes, music video production, animation, long video clips, avatar video or lip-sync output. Each of those tasks has a different creative intent and delivery expectation.",
      "Text to video is useful when the user begins with a prompt, product description, campaign angle or short scene idea. Image to video is useful when a product image, brand visual, character frame or campaign artwork already exists and needs motion. Script to video is useful when the user has a story, ad script, explainer script, product narration or scene outline that should become structured visual production.",
      "Music video and long video clip workflows serve another audience. Artists, editors and creators may need music video concepts, lyric video directions, visualizers, performance scenes, teaser cuts, social edits or long video clipping for short-form distribution. Crelavo can describe these outputs with the same managed production logic used for campaigns and product launches.",
      "Avatar video, lip-sync and AI voice-over create another layer. A brand may need an AI avatar video for product explanation, a speaking presenter, dubbing, multilingual voice-over, voice cloning or lip-sync content for global localization. These outputs are not only technical effects; they are campaign assets that need tone, script, voice, format and delivery planning.",
      "Animation and cinematic scenes help the platform cover both business and entertainment use cases. Short animations can explain a product, service or concept. Cinematic scenes can support trailers, premium ads, dramatic product reveals, story-based videos and brand films. Crelavo can organize these as production requests with clear expectations instead of vague video prompts.",
      "For SEO coverage, this article now includes AI videos, AI video advertising, AI video ads, artificial intelligence video, text to video, image to video, script to video, music video, long video clips, cinematic scenes, lip-sync, AI avatar video, AI voice-over and voice cloning in natural context. This makes the Blog / Content page broader, more detailed and better aligned with the platform's real category coverage."
    ],
    image: "/blog/ai-video-avatar-voice.svg",
    imageAlt: "AI video avatar voice-over and localization production pipeline",
    ctaLabel: "Open video tools",
    ctaHref: "/dashboard/assistant-workspace?idea=AI%20video%20avatar%20voice-over",
    linkedKeywords: [
      { label: "text to video", href: "/products/text-to-video" },
      { label: "AI avatar video", href: "/products/avatar" },
      { label: "voice cloning", href: "/products/voice-clone" }
    ],
    order: 4,
    active: true
  },
  {
    id: "brand-content-seo",
    kicker: "Brand kit, visual cloning and SEO content",
    title: "Brand kit production, visual packages, AI image generation and SEO content",
    summary: "Crelavo supports brand kit production, visual packages, AI image generation, visual cloning, campaign copy and SEO-ready content that helps the public site and customer campaigns feel complete.",
    body: [
      "Brand and visual production are central to Crelavo because campaigns need identity, not only output volume. Brand kit production can include logo direction, color systems, typography notes, visual rules, social templates, document styling and launch assets. When these are connected to AI website production, AI app production and AI marketing campaigns, the brand looks more consistent across every touchpoint.",
      "AI image generation and visual packages support product launches, marketplace listings, social ads, website hero sections, pitch decks, app store visuals and campaign pages. A visual package can include product images, lifestyle scenes, ad creatives, banner assets, social variations and supporting graphics. These outputs give e-commerce campaigns and digital products the visual coverage they need to look complete.",
      "Visual cloning and style cloning are useful when a team has an existing look that should guide new assets. Crelavo can frame this as a production need: preserve a visual direction, create new variations, support the brand kit and keep outputs aligned across campaign pages, AI videos, avatar videos, marketplace listing assets and documents.",
      "SEO content matters because the platform itself needs to explain what it does clearly, and customer campaigns often need the same clarity. A product page may need keyword-rich descriptions. A landing page may need conversion copy. A marketplace listing may need structured benefit text. A blog hub may need articles that include AI production studio, AI website production, AI app production, AI video ads, AI avatar video, AI voice-over and brand kit production without sounding artificial.",
      "The Blog / Content page is now designed to look fuller and more authoritative. It includes longer explanations, richer category coverage, visual topic cards and specific production vocabulary. This helps visitors understand the platform while giving search engines stronger content around Crelavo, AI production, brand assets, AI image creation, visual cloning and AI + human QA delivery.",
      "In practical terms, Crelavo can connect brand kit production, visual packages, AI image generation, visual cloning, e-commerce campaign production, product advertising video, AI voice-over and website content inside one delivery path. That is what makes the platform feel like a studio rather than a collection of disconnected tools."
    ],
    image: "/blog/brand-content-seo.svg",
    imageAlt: "Brand kit production and SEO content assets",
    ctaLabel: "Build brand assets",
    ctaHref: "/dashboard/assistant-workspace?idea=Brand%20kit%20production%20and%20SEO%20content",
    linkedKeywords: [
      { label: "brand kit production", href: "/products/brand-kit" },
      { label: "AI image generation", href: "/products/image" },
      { label: "visual cloning", href: "/products/visual-clone" }
    ],
    order: 5,
    active: true
  },
  {
    id: "ai-live-sales-agent-commerce",
    kicker: "AI live commerce",
    title: "AI Live Sales Agents for fair-use live commerce",
    summary: "Autonomous AI live-stream brand agents can plan avatar hosts, live chat replies, product selling scripts, multilingual responses, fair-use live hours and pay-as-you-go live commerce workflows.",
    body: [
      "AI Live Sales Agent is the premium live commerce direction inside Crelavo. Instead of producing only a static video, a brand can plan an AI live-stream sales host that presents products, answers live chat questions, handles objections, pushes discount CTAs and prepares a managed live shopping workflow with fair-use hours.",
      "The category is designed for Shopify brands, Amazon sellers, TikTok Shop sellers, influencer agencies and creators that want a live sales presence without staffing a human host all day. A product link, brand name, product category, target market, language, target platform, avatar persona, voice direction and sales tone can become a structured live agent brief instead of scattered notes.",
      "Pricing is positioned differently from normal production credits. Starter is $249 per month with 10 fair-use live hours, Pro is $799 per month with 40 fair-use live hours for up to 3 platforms, and Agency is $2499 per month with 120 fair-use live hours for white-label autonomous brand agent planning. These service plans do not include credit balance; extra provider/API hours are quoted with pay-as-you-go cost analysis.",
      "The first practical phase focuses on the pieces businesses need before real low-latency streaming starts: sales script, product FAQ, objection handling, multilingual chat reply prompts, avatar/voice direction, OBS or provider readiness notes, CTA/discount playbook, human fallback policy and AI disclosure/compliance review.",
      "Crelavo also stores the operational intake for admin review. A Live Agent Brief can show brand/product context, market/platform, host persona, interaction goal, offer or coupon, provider readiness, human fallback rules and compliance notes. This helps the team decide whether the request is ready for avatar providers, voice/TTS tools, product catalog logic, live chat automation or a later custom streaming stack.",
      "For SEO, this article explains autonomous AI live-stream brand agents, AI live commerce agents, AI avatar sales agents, fair-use live product selling, live chat reply automation, TikTok Shop AI host, Shopify live shopping agent and multilingual live sales workflows in natural context.",
      "The long-term opportunity is a managed SaaS layer where Crelavo can connect product catalogs, avatar providers, voice/TTS, LLM chat logic, OBS or streaming APIs and admin review into one live sales agent workflow. The current category makes the offer visible today while final provider/API integration remains a controlled launch phase."
    ],
    image: "/blog/ai-production-studio.svg",
    imageAlt: "AI live sales agent avatar host for live commerce",
    ctaLabel: "Plan live sales agent",
    ctaHref: "/dashboard/assistant-workspace?idea=AI%20live%20sales%20agent%20for%20fair-use%20product%20selling&category=live_sales_agent&mode=media",
    linkedKeywords: [
      { label: "AI live sales agent", href: "/showcase/ai-live-sales-agent" },
      { label: "TikTok Shop AI host", href: "/dashboard/assistant-workspace?idea=TikTok%20Shop%20AI%20live%20sales%20agent&category=live_sales_agent&mode=media" },
      { label: "live commerce service plans", href: "/products/live-sales-agent" },
      { label: "Growth Intelligence", href: "/growth-intelligence" }
    ],
    order: 6,
    active: true
  },
  {
    id: "drone-satellite-video-seo",
    kicker: "Drone and satellite video",
    title: "Drone / Satellite Video for map, route and location promos",
    summary: "Drone / Satellite Video supports map/location prompts, route planning, marked satellite area notes, voice-over, subtitles and music for real estate, travel and city promos.",
    body: [
      "Drone / Satellite Video gives Crelavo a dedicated path for location-based video requests. Users can describe a property, city route, travel location, event area or map idea, then add location/address/coordinates, route/path and marked map or satellite area notes before production starts.",
      "This matters because location videos need more than a generic prompt. A real estate promo may need a satellite-view intro, coastline markers, building highlights and a drone-style flyover sequence. A travel or city promo may need route rhythm, landmark labels, voice-over, subtitles and background music direction.",
      "The category supports two core packages: Drone Location Video for direct location/route briefs, and Satellite + Drone Story Pack for richer map-to-flyover stories. Both packages make the location notes visible in project details so admins and future providers can see exactly what needs to be represented.",
      "The intake is intentionally simple for launch. Customers can enter an address, GPS coordinates, route/path notes and marked map or satellite area instructions. That means a future provider, editor or map automation layer can read the same brief and understand the intended route, landmark emphasis and visual sequence.",
      "For SEO coverage, the page naturally covers AI drone video, satellite video generator, map to video, route flyover video, real estate drone-style video, travel location video, aerial promo video and city flyover concepts without presenting the feature as a live physical drone service.",
      "The current implementation is API-light and safe for launch: users enter location and route details as text. Later, Mapbox, Google Maps or satellite preview integrations can be added without changing the production category, admin page or payload structure.",
      "This makes Drone / Satellite Video useful immediately for managed creative planning while leaving room for future provider and map API automation."
    ],
    image: "/blog/ai-production-studio.svg",
    imageAlt: "Drone satellite video planning with map route and marked area",
    ctaLabel: "Plan drone video",
    ctaHref: "/dashboard/assistant-workspace?idea=Drone%20style%20aerial%20location%20video&category=drone_video&mode=media",
    linkedKeywords: [
      { label: "Drone / Satellite Video", href: "/showcase/drone-aerial-video" },
      { label: "route flyover video", href: "/dashboard/assistant-workspace?idea=Route%20flyover%20video&category=drone_video&mode=media" },
      { label: "map to video", href: "/products/drone-video" },
      { label: "Growth Intelligence", href: "/growth-intelligence" }
    ],
    order: 7,
    active: true
  },
  {
    id: "growth-intelligence-agent-seo",
    kicker: "Growth intelligence",
    title: "AI Growth Intelligence Agent for competitor monitoring",
    summary: "Crelavo can expand beyond production tools with a monthly AI Growth Intelligence Agent that monitors public competitor pages, pricing signals, public ad angles and review trends, then delivers weekly strategy reports.",
    body: [
      "AI Growth Intelligence Agent is a service workflow for companies that want competitor monitoring without manually checking dozens of pages every week. A customer can enter their own website, competitor URLs, public ad library links, pricing pages and target market notes, then let the system prepare recurring monitoring and reporting.",
      "The workflow should focus on public sources only: public competitor pages, public ad libraries, landing page changes, visible offer updates, public reviews and complaint trends. This keeps the product safer and more professional than language around spying, hidden access or bypassing private systems.",
      "The business value is not raw data. The valuable output is a weekly CEO-style intelligence PDF that explains what changed, why it matters and what action the customer should take. A price change can become a bundle offer suggestion. A competitor ad angle can become a new video script. A review trend can become a trust-building campaign.",
      "This service naturally connects to Crelavo's production engine. After reading the intelligence report, a user can create a response ad video, landing page, social campaign, email sequence, product comparison asset or live sales brief. That makes Growth Intelligence a demand generator for the rest of the platform.",
      "Pricing works better as a monthly service plan than as normal credits because monitoring, scraping, LLM analysis, PDF reporting and alerts are recurring operations. Starter can track one competitor, Growth can track several competitors daily, and Enterprise can add frequent checks plus Slack or email alerts.",
      "For SEO, the page covers AI competitor monitoring, market intelligence agent, public ad intelligence, competitor price tracking, weekly CEO intelligence report, ecommerce competitor monitoring, SaaS competitor analysis and agency growth intelligence workflows in natural context."
    ],
    image: "/blog/managed-delivery-workflow.svg",
    imageAlt: "AI growth intelligence dashboard with competitor monitoring and weekly PDF report",
    ctaLabel: "View Growth Intelligence",
    ctaHref: "/growth-intelligence",
    linkedKeywords: [
      { label: "AI Growth Intelligence Agent", href: "/growth-intelligence" },
      { label: "competitor monitoring dashboard", href: "/dashboard/growth-intelligence" },
      { label: "Growth Intelligence service page", href: "/growth-intelligence-agent" },
      { label: "AI live sales plans", href: "/live-sales-credits" },
      { label: "Drone credit packs", href: "/drone-credits" }
    ],
    order: 8,
    active: true
  },
  {
    id: "shopify-product-link-video-guide",
    kicker: "Shopify product video SEO",
    title: "How to Convert Your Shopify Product Links into Viral TikTok Ads in 60 Seconds",
    summary: "A practical guide for Shopify sellers who want to paste a product URL into Crelavo and turn it into short-form TikTok ad scripts, hooks, preview clips and campaign assets.",
    body: [
      "A Shopify product page already contains the raw material for a strong TikTok ad: product name, benefits, images, pricing, offer language, reviews and objections. The missing step is turning that information into a short-form video angle that can work in the first few seconds of a TikTok, Reels or Shorts feed.",
      "The simplest workflow is to copy the Shopify product link, open Crelavo's Shopify Product Link to Ad Video page, paste the URL and add the target audience or offer. Crelavo can then organize the product context into hooks, product benefits, target buyer notes, visual direction, CTA timing and preview delivery expectations.",
      "A good Shopify TikTok ad usually needs a strong first three seconds, one clear product promise, a visual demonstration, a trust signal and a simple call to action. Crelavo can prepare the brief, script angle, preview plan and final delivery notes so the seller understands what will be created before spending larger credits.",
      "This is useful for Shopify founders, DTC brands and dropshipping teams because it removes the blank prompt problem. The product page becomes the source, Crelavo becomes the ad production workflow and the seller can move from product link to campaign-ready creative direction much faster.",
      "For SEO and buyer intent, this article connects Shopify product video, Shopify product link to ad video, AI product video generator, ecommerce campaign production and short-form TikTok ad creative in one practical explanation. It also links directly to the landing page where users can start the workflow."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Shopify product link turning into AI product ad video workflow",
    mediaKind: "video-slot",
    ctaLabel: "Open Shopify video workflow",
    ctaHref: "/shopify-product-link-to-ad-video",
    linkedKeywords: [
      { label: "Shopify Product Link to Ad Video", href: "/shopify-product-link-to-ad-video" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" }
    ],
    order: 9,
    active: true
  },
  {
    id: "amazon-product-ad-video-guide",
    kicker: "Amazon product video SEO",
    title: "5 Cost-Effective Ways to Create High-Converting Video Ads for Amazon Products",
    summary: "A guide for Amazon sellers and dropshipping teams that need budget-friendly product ad scripts, comparison angles, short-form marketplace videos and conversion-focused storytelling.",
    body: [
      "Amazon sellers often have strong product information but weak creative packaging. A listing may explain features, ratings and specifications, yet it still needs a video that quickly shows the problem, product value and buying reason.",
      "The first cost-effective tactic is to start from the product listing instead of commissioning a full agency brief. Listing benefits, images, reviews, objections and comparison points can become the raw material for a product ad video script.",
      "The second tactic is to create several hook options before rendering final videos. A problem-solution hook, a comparison hook, a proof-led hook, an unboxing-style hook and an offer-led hook can all be tested as scripts before credits are spent on expensive final output.",
      "The third tactic is to use AI-assisted briefs for visual direction, caption notes and CTA timing. Crelavo's Amazon Product Ad Video workflow can structure those inputs into a product video brief with script angles, visual direction, caption notes and delivery expectations.",
      "The fourth tactic is to reuse one product story across multiple formats: TikTok, Reels, Shorts, marketplace retargeting and landing page video. The fifth tactic is to upgrade only the winning concept into final render, keeping preview and script testing lower cost.",
      "This article strengthens the site's coverage for Amazon product ad video, marketplace product video, AI product video generator and ecommerce campaign production while pointing visitors to the dedicated Amazon landing page."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Amazon marketplace product video and ad script workflow",
    mediaKind: "video-slot",
    ctaLabel: "Open Amazon video workflow",
    ctaHref: "/amazon-product-ad-video",
    linkedKeywords: [
      { label: "Amazon Product Ad Video", href: "/amazon-product-ad-video" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Product ad video", href: "/products/product-ad-video" }
    ],
    order: 10,
    active: true
  },
  {
    id: "trendyol-product-video-guide",
    kicker: "Trendyol product video SEO",
    title: "Trendyol product video guide for Turkish ecommerce",
    summary: "A localized guide for Turkish marketplace sellers who want Trendyol product videos, short-form ad angles and product-link campaign assets.",
    body: [
      "Trendyol sellers need product videos that feel clear, local and fast. A generic video prompt is usually not enough because the creative needs to reflect Turkish buyer expectations, marketplace trust signals, product benefits and social commerce behavior.",
      "Crelavo's Trendyol Product Video workflow starts with the product link and turns it into localized hooks, product value points, short-form script direction, thumbnail ideas and delivery planning. This helps sellers create campaign assets from the product page instead of writing every brief from scratch.",
      "A strong Trendyol product video can focus on one main benefit, a fast demonstration, price/value perception, use-case clarity and a simple call to action. For beauty, fashion, home, gadget or lifestyle categories, the best angle often depends on how quickly the buyer understands the product's everyday benefit.",
      "This blog topic supports SEO for Trendyol product video, Turkish ecommerce product video, marketplace video ads and AI ecommerce campaign generator, while linking directly to the dedicated Trendyol landing page."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Trendyol product video workflow for Turkish ecommerce sellers",
    mediaKind: "video-slot",
    ctaLabel: "Open Trendyol video workflow",
    ctaHref: "/trendyol-product-video",
    linkedKeywords: [
      { label: "Trendyol Product Video", href: "/trendyol-product-video" },
      { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" }
    ],
    order: 11,
    active: true
  },
  {
    id: "ai-product-video-generator-guide",
    kicker: "AI product video generator SEO",
    title: "Best AI product video generator workflow for ecommerce brands",
    summary: "A buyer-focused explanation of how ecommerce brands can use AI product video workflows for previews, scripts, final MP4 delivery and campaign testing.",
    body: [
      "The best AI product video generator is not only a tool that creates motion. Ecommerce teams need a workflow that starts from a product URL, understands the offer, creates a usable script angle, prepares a preview and connects the final video to campaign delivery.",
      "Crelavo frames AI product video generation as a managed production path. The user provides a product link, images, audience, offer and preferred platform. The system can then prepare product video briefs, ad scripts, creative direction, preview planning and final delivery notes.",
      "This matters because ecommerce video testing is iterative. A product may need one benefit-led ad, one problem-solution ad, one UGC-style concept, one premium visual angle and one short retargeting clip. Those variations need structure, not random prompts.",
      "This content strengthens Crelavo's SEO coverage for AI product video generator, ecommerce product video, product URL to video, short-form product ads and managed product video delivery."
    ],
    image: "/blog/ai-video-avatar-voice.svg",
    imageAlt: "AI product video generator workflow for ecommerce brands",
    ctaLabel: "Open AI product video generator",
    ctaHref: "/ai-product-video-generator",
    linkedKeywords: [
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Shopify Product Link to Ad Video", href: "/shopify-product-link-to-ad-video" },
      { label: "Amazon Product Ad Video", href: "/amazon-product-ad-video" }
    ],
    order: 12,
    active: true
  },
  {
    id: "tiktok-shop-live-sales-agent-guide",
    kicker: "TikTok Shop live sales SEO",
    title: "How AI Live Sales Agents Are Revolutionizing E-Commerce Live Commerce in 2026",
    summary: "A safety-first guide to AI live sales agents, TikTok Shop hosts, product scripts, safe claims, fair-use live hours and human fallback rules for modern live commerce.",
    body: [
      "AI live sales agents are attractive for ecommerce because live commerce needs constant product explanation, objection handling and CTA timing. But this category must be handled carefully: product claims, identity use, customer data, disclosures and human fallback rules need to be clear before automation expands.",
      "In 2026, the strongest use case is not a random chatbot on a stream. The useful version is a managed live commerce assistant that can present products, repeat approved selling points, answer frequent questions, route complex issues to a human and keep the offer visible during long selling windows.",
      "Crelavo positions TikTok Shop AI Live Sales Agent as a managed service workflow rather than unrestricted autonomous selling. A user can define product catalog, allowed claims, target audience, selling language, CTA rules and fallback instructions before provider activation.",
      "The workflow can prepare a live sales script, presenter behavior brief, safe claims policy, product FAQ, objection responses and service plan requirements. This makes the offer easier to review for customers, payment providers and internal admins.",
      "For agencies and ecommerce operators, the value is retention and operations: instead of creating one video and leaving, the brand can plan recurring live selling scripts, product rotations, seasonal offers and multilingual commerce support from the same Crelavo workspace.",
      "This blog topic strengthens coverage for TikTok Shop AI Live Sales Agent, AI live commerce agent, AI avatar sales agent, live sales scripts and safe ecommerce automation while linking to pricing, terms and the dedicated live sales landing page."
    ],
    image: "/blog/ai-production-studio.svg",
    imageAlt: "TikTok Shop AI live sales agent workflow with safety controls",
    ctaLabel: "Open TikTok Shop live sales page",
    ctaHref: "/tiktok-shop-ai-live-sales-agent",
    linkedKeywords: [
      { label: "TikTok Shop AI Live Sales Agent", href: "/tiktok-shop-ai-live-sales-agent" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Live Sales Plans", href: "/live-sales-credits" }
    ],
    order: 13,
    active: true
  },
  {
    id: "brand-memory-retention-guide",
    kicker: "Brand memory retention",
    title: "Why Brand Memory keeps ecommerce teams inside one AI production workspace",
    summary: "A practical guide to reusable brand voice, logo rules, colors, CTAs and audience memory for repeat ecommerce video, website and campaign production.",
    body: [
      "Most AI tools force users to repeat the same brand instructions every time they create a new output. That creates friction for ecommerce teams, agencies and founders that need consistent product videos, landing pages, captions, UGC scripts and marketplace assets every week.",
      "A Brand Memory workflow solves this by saving the brand voice, logo notes, colors, target audience, preferred CTAs and words or claims to avoid. Once those rules are saved, every new Crelavo production can start closer to the brand's actual identity instead of asking the user to rewrite the same context.",
      "For retention, this matters because the workspace becomes more valuable over time. A user who has saved multiple brand rules, campaign preferences and product directions is less likely to leave after one video because the next request is faster and more consistent.",
      "For agencies, Brand Memory also supports multi-client work. Each client can have a different voice, tone, visual direction and CTA rule set, while the agency uses one production environment to prepare videos, websites, marketplace copy and campaign briefs.",
      "This article connects Brand Memory, brand voice, AI brand kit builder, ecommerce campaign production and repeat creative workflows while pointing visitors to the dedicated Brand Memory service page."
    ],
    image: "/blog/brand-content-seo.svg",
    imageAlt: "Brand memory and brand voice hub for repeat AI production",
    ctaLabel: "Open Brand Memory",
    ctaHref: "/brand-memory",
    linkedKeywords: [
      { label: "Brand Memory", href: "/brand-memory" },
      { label: "AI Brand Kit Builder", href: "/ai-brand-kit-builder" },
      { label: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator" }
    ],
    order: 14,
    active: true
  },
  {
    id: "hook-ugc-variation-guide",
    kicker: "Hook and UGC testing",
    title: "How to create 5 ad hooks before spending credits on final video renders",
    summary: "A conversion-focused guide to first-three-second hooks, UGC angles, captions and A/B ad testing for ecommerce product videos.",
    body: [
      "The first three seconds of a product ad decide whether the viewer keeps watching. For ecommerce sellers, it is usually smarter to test several hooks as scripts before spending higher credits on final video renders.",
      "A strong hook can use curiosity, problem-solution framing, social proof, objection handling or a direct offer. Crelavo's AI Hook & UGC Generator turns one product into several opening ideas so the user can compare which angle is most likely to work.",
      "This keeps costs under control. Text hooks, UGC script angles and caption variants can be prepared as a low-credit planning step. Only the strongest concept needs to move into preview video, voice-over or final MP4 production.",
      "For agencies and brands, this creates a practical upsell path: one product can become five ad concepts, then one or more final videos. That increases campaign quality and average order value without forcing users into blind expensive generation.",
      "This article supports SEO for AI hook generator, UGC ad scripts, first three second hooks, ecommerce ad testing and AI product video generator while linking to the dedicated service page."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "AI hook and UGC ad variation workflow for ecommerce products",
    ctaLabel: "Generate hook variations",
    ctaHref: "/ai-hook-generator",
    linkedKeywords: [
      { label: "AI Hook & UGC Generator", href: "/ai-hook-generator" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Ad Performance Score Checker", href: "/free-tools/ad-performance-score-checker" }
    ],
    order: 15,
    active: true
  },
  {
    id: "marketplace-localization-global-guide",
    kicker: "Marketplace localization",
    title: "How to localize a Trendyol product listing for Amazon US, UK or Germany",
    summary: "A global expansion guide for sellers who want localized marketplace titles, bullet points, descriptions, SEO keywords, ad scripts and social captions.",
    body: [
      "A direct translation is rarely enough when a seller wants to move from a local marketplace to Amazon US, Amazon UK, Germany, Etsy or Shopify. Buyers search differently, compare differently and respond to different benefit language in each market.",
      "Crelavo's AI Marketplace Localization Studio starts from a product link or listing, then adapts the title, bullet points, product description, SEO keywords, ad script and social caption set for the selected target country.",
      "For a Trendyol seller, this can mean turning Turkish product language into Amazon-style listing copy for the US or UK, or a more structured German marketplace description. The goal is market adaptation, not word-for-word translation.",
      "The first phase should stay low-cost and text-focused: listing copy, SEO terms, ad scripts and campaign language. Premium upgrades such as dubbing, visual text replacement, localized videos or lip-sync should remain package-locked and credit-gated.",
      "This article connects marketplace localization, Trendyol to Amazon listing, ecommerce globalization, AI dubbing and product ad localization while linking to the dedicated localization service page."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Marketplace localization workflow from Trendyol to Amazon and global ecommerce",
    ctaLabel: "Open localization studio",
    ctaHref: "/ai-marketplace-localization",
    linkedKeywords: [
      { label: "AI Marketplace Localization Studio", href: "/ai-marketplace-localization" },
      { label: "Trendyol Product Video", href: "/trendyol-product-video" },
      { label: "AI Dubbing & Voice", href: "/ai-dubbing-voice" }
    ],
    order: 16,
    active: true
  },
  {
    id: "competitor-ad-analysis-guide",
    kicker: "Competitor ad analysis",
    title: "How to analyze competitor ads without copying their creative",
    summary: "A safe guide to reading public competitor ad structure, hooks, pacing and offer language, then creating an original campaign for your own product.",
    body: [
      "Ecommerce teams often notice a competitor ad that seems to work, but copying it is the wrong strategy. Exact scripts, logos, visuals and protected creative should not be reproduced. The useful approach is to understand the structure behind the ad.",
      "Crelavo's Competitor Ad Analyzer focuses on public structure: hook type, pacing, offer framing, objection handling, proof signals, CTA timing and weak points. The output should be an original campaign brief for the user's own product, not a clone of the competitor's creative.",
      "This is especially useful for agencies and marketplace sellers. A public Facebook Ads Library example, TikTok ad observation or uploaded note can become a breakdown of why the ad works and how to produce a different version for the user's own brand.",
      "The analysis phase can stay lightweight and low-risk. Premium phases can later add video upload analysis, frame-by-frame breakdown, shot list planning and final product video production, always with original creative rules.",
      "This article supports SEO for competitor ad analyzer, competitor ad breakdown, ecommerce ad analysis and original campaign generation while linking to the dedicated service page."
    ],
    image: "/blog/managed-delivery-workflow.svg",
    imageAlt: "Competitor ad analyzer creating original ecommerce campaign brief",
    ctaLabel: "Analyze competitor ad",
    ctaHref: "/competitor-ad-analyzer",
    linkedKeywords: [
      { label: "Competitor Ad Analyzer", href: "/competitor-ad-analyzer" },
      { label: "AI Hook & UGC Generator", href: "/ai-hook-generator" },
      { label: "Growth Intelligence", href: "/growth-intelligence" }
    ],
    order: 17,
    active: true
  },
  {
    id: "free-tiktok-hook-generator-guide",
    kicker: "Free AI tools SEO",
    title: "Free TikTok Hook Generator guide for ecommerce product videos",
    summary: "A practical guide to using a free TikTok hook generator for ecommerce product videos, UGC ads, Shorts, Reels and Crelavo production workflows.",
    body: [
      "A strong TikTok hook is often the difference between a product video that gets ignored and a product video that earns enough attention to test the offer. Ecommerce sellers, Shopify brands, Amazon sellers and Trendyol stores usually need several hook angles before they spend credits on final video production.",
      "A free TikTok Hook Generator gives the seller a low-friction way to test first-three-second ideas. Instead of starting from a blank prompt, the user can enter a product, offer, audience or pain point and compare curiosity hooks, problem-solution hooks, social proof hooks and direct offer hooks.",
      "The best workflow is simple: generate several hooks, choose the strongest angle, then continue into Crelavo's AI Product Video Generator or Shopify Product Link to Ad Video workflow. That turns a free text idea into a production brief with script direction, visual notes, CTA timing, captions and final delivery expectations.",
      "This topic supports long-tail SEO for free TikTok hook generator, AI hook generator for product videos, UGC ad hook generator, TikTok ad script generator, YouTube Shorts script generator and short-form video script generator. It also connects free tools with paid production paths so visitors understand what to do after they get a result.",
      "For conversion, the free tool should not feel like a dead end. The best result can become a product video brief, ecommerce campaign, ad script, landing page section or social media campaign. Crelavo keeps the next step close: categories, tools, pricing and assistant workspace all connect from the free tool funnel."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Free TikTok hook generator feeding ecommerce product video production",
    ctaLabel: "Try TikTok hook generator",
    ctaHref: "/free-tools/tiktok-hook-generator",
    linkedKeywords: [
      { label: "TikTok Hook Generator", href: "/free-tools/tiktok-hook-generator" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" },
      { label: "Shopify Product Link to Ad Video", href: "/shopify-product-link-to-ad-video" }
    ],
    order: 18,
    active: true
  },
  {
    id: "ai-website-builder-vs-managed-production",
    kicker: "AI website builder SEO",
    title: "AI Website Builder vs managed AI production studio: what small businesses need",
    summary: "A comparison guide explaining when a simple AI website builder is enough and when a managed AI production studio is better for websites, apps, videos, brand kits and campaign assets.",
    body: [
      "An AI website builder can help a small business generate a landing page faster, but many real launches need more than one page. A founder may need website copy, product visuals, app screens, explainer videos, social ad scripts, brand kit notes, pricing sections, FAQ content and a delivery-ready package.",
      "That is where a managed AI production studio is different. Crelavo treats the website as one part of a wider production workflow. The user can start with AI website builder intent, then connect the page to AI app builder workflows, AI ecommerce builder assets, AI video generator requests and free tools for hooks, prompts and product descriptions.",
      "For a simple one-page site, a basic AI website builder may be enough. For a product launch, ecommerce campaign, SaaS MVP or agency client package, managed production gives more structure: categories, credits, source handoff, README notes, preview paths, revision context and dashboard delivery.",
      "This article targets long-tail searches such as AI website builder for small business, AI website builder for landing pages, managed AI website production service, AI SaaS landing page generator and AI app prototype builder. It explains the difference without positioning Crelavo as only a page generator.",
      "The practical recommendation is to use Crelavo when the website needs connected assets: product videos, social campaign copy, brand kit direction, app screens or ecommerce landing pages. The website becomes part of a launch package rather than an isolated output."
    ],
    image: "/blog/website-app-production.svg",
    imageAlt: "AI website builder compared with managed AI production studio workflow",
    ctaLabel: "Open website builder",
    ctaHref: "/ai-website-builder",
    linkedKeywords: [
      { label: "AI Website Builder", href: "/ai-website-builder" },
      { label: "AI App Builder", href: "/ai-app-builder" },
      { label: "AI Ecommerce Builder", href: "/ai-ecommerce-builder" }
    ],
    order: 19,
    active: true
  },
  {
    id: "ecommerce-campaign-assets-checklist",
    kicker: "Ecommerce campaign checklist",
    title: "Ecommerce campaign asset checklist for AI product videos, landing pages and ads",
    summary: "A checklist-style guide for ecommerce teams that need product videos, landing pages, ad scripts, product descriptions, captions, thumbnails, brand assets and category links before launch.",
    body: [
      "A strong ecommerce campaign usually needs more than one product video. Before launch, a team may need product descriptions, hook ideas, UGC ad scripts, marketplace copy, landing page sections, thumbnails, captions, brand visuals, offer language and category links that send buyers to the right place.",
      "The first asset is the core product story: what problem the product solves, who it is for, why it is better and what proof supports the offer. This story can become a product description, an Amazon listing angle, a Shopify product video script or a Trendyol product video brief.",
      "The second asset group is short-form creative. Teams should prepare TikTok hooks, Reels captions, YouTube Shorts scripts, UGC-style scripts, thumbnail notes and CTA variants before final rendering. Crelavo's free tools and product video workflows make this easier to prepare before credits are spent on final production.",
      "The third asset group is conversion support: landing page copy, FAQ answers, pricing direction, product comparison notes, trust signals and visual consistency. These help the traffic from ads, marketplace listings and social posts convert instead of bouncing.",
      "This article supports SEO for ecommerce campaign asset checklist, AI ecommerce campaign generator, product video script generator, product description generator, Shopify product video ads and Amazon product ad videos. It also links the campaign planning process to Crelavo categories, tools and pricing."
    ],
    image: "/blog/ecommerce-product-campaigns.svg",
    imageAlt: "Ecommerce campaign asset checklist for product videos landing pages and ads",
    ctaLabel: "Open ecommerce builder",
    ctaHref: "/ai-ecommerce-builder",
    linkedKeywords: [
      { label: "AI Ecommerce Builder", href: "/ai-ecommerce-builder" },
      { label: "Product Description Generator", href: "/free-tools/product-description-generator" },
      { label: "AI Product Video Generator", href: "/ai-product-video-generator" }
    ],
    order: 20,
    active: true
  },
  {
    id: "managed-delivery-workflow",
    kicker: "AI + Human QA delivery",
    title: "An expert-reviewed workflow for credits, production status and final delivery",
    summary: "Crelavo connects request intake, credit reservation, production routing, asset generation, revision context and final delivery across web, app, video, voice, visual and brand projects.",
    body: [
      "The difference between a simple AI tool and an AI production studio is workflow. Crelavo is designed around request intake, production category selection, credit reservation, production status and final delivery. A user should be able to request mobile application screens, SaaS dashboards, marketplace listing assets, AI videos, music videos, animations, avatar videos, lip-sync, voice cloning, visual cloning, brand kits or visual packages and still understand where the job stands.",
      "AI + Human Quality Assurance is especially important when a project crosses formats. A campaign might include AI website production, AI app production, AI video ads, AI voice-over, AI image generation and marketplace assets. Without a dashboard and expert review structure, those outputs can become confusing. Crelavo keeps them tied to a request, package and delivery path.",
      "Credit reservation also makes the experience clearer. Users can see that different production types have different scope. A short AI video, a music video, a long video clip, a SaaS panel set, a brand kit, a visual package, a script to video workflow or a product link to ad video package may require different credit levels and delivery expectations. This makes the platform easier to expand without hiding complexity.",
      "The dashboard model also supports admin-assisted production. Teams can start with automated workflows and still keep room for review, upload, delivery links, revision notes and future provider integrations. This is useful while Crelavo grows from structured production management toward deeper AI automation across video, image, voice, app, website and campaign modules.",
      "For public SEO, the AI + Human QA delivery article connects broad category language to operational trust. It mentions AI production studio, artificial intelligence video, advertising video, AI video advertising, AI website production, AI application production, AI avatar video, AI voice-over, AI image creation, brand kit production and expert-reviewed creative delivery in a way that describes the platform rather than listing terms without context.",
      "The goal is a Blog / Content page that feels substantial. Visitors should see that Crelavo can support websites, mobile apps, SaaS dashboards, marketplace listing assets, AI videos, text to video, image to video, script to video, music videos, long video clips, cinematic scenes, lip-sync, voice cloning, visual cloning, brand kits, visual packages and final production delivery from one organized workspace."
    ],
    image: "/blog/managed-delivery-workflow.svg",
    imageAlt: "AI and human QA delivery dashboard with credits and production status",
    ctaLabel: "View productions",
    ctaHref: "/dashboard/productions",
    linkedKeywords: [
      { label: "production status", href: "/dashboard/productions" },
      { label: "credit reservation", href: "/dashboard/credits" },
      { label: "final delivery", href: "/showcase/live-workspace" }
    ],
    order: 21,
    active: true
  }
];

export const defaultFooterHelpPanels: FooterHelpPanel[] = [
  {
    id: "faq",
    title: "Frequently Asked Questions",
    description: "Short answers about Crelavo production, credits and delivery.",
    items: [
      { title: "What can Crelavo produce?", body: "Websites, apps, e-commerce campaigns, AI videos, avatars, voice-over, visuals, brand kits, documents and AI + human QA delivery packages." },
      { title: "Is it only a video generator?", body: "No. It is designed as a wider AI production studio for digital products, campaigns and creative assets." }
    ],
    order: 1,
    active: true
  },
  {
    id: "refund-policy",
    title: "Refund Policy",
    description: "Clear production and credit usage rules.",
    items: [
      { title: "Reserved credits", body: "Refunds are not available once credits are reserved or production work begins." },
      { title: "Subscriptions", body: "Monthly and yearly subscriptions renew automatically through the payment provider until cancelled. Failed renewals may suspend subscription benefits until payment is updated." },
      { title: "Top-up credits", body: "One-time top-up credit packages do not renew automatically and can be purchased repeatedly whenever extra balance is needed." },
      { title: "Before production", body: "Billing questions before credit reservation can be reviewed by support." }
    ],
    order: 2,
    active: true
  },
  {
    id: "contact-support",
    title: "Contact / Support",
    description: "Support is available through the public contact page and support@crelavo.com.",
    items: [
      { title: "Support channels", body: "Customers can use /contact or email support@crelavo.com for billing, account, production and delivery questions." }
    ],
    order: 3,
    active: true
  }
];

export const defaultSocialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/crelavohq", order: 1, active: true },
  { label: "YouTube", href: "https://www.youtube.com/channel/UCU6X_Sq5M2QWO_62gZml31g", order: 2, active: true },
  { label: "TikTok", href: "https://www.tiktok.com/@crelavo", order: 3, active: true },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/crelavo", order: 4, active: false },
  { label: "X / Twitter", href: "https://x.com/crelavohq", order: 5, active: true }
];

export const defaultShowcaseSlides: ShowcaseSlideConfig[] = [
  { id: "launcher-explore", section: "launcher", title: "Explore", kicker: "Samples", description: "Browse large sample outputs and open dedicated detail pages.", href: "/showcase/explore-samples", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192157407622951-1783192157402.png", order: 1, active: true },
  { id: "launcher-assets", section: "launcher", title: "Assets", kicker: "Materials", description: "Use images, videos, audio references and documents across productions.", href: "/showcase/assets-library", tone: "green", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192199380895416-1783192199376.png", order: 2, active: true },
  { id: "launcher-omni", section: "launcher", title: "Omni", kicker: "Assistant", description: "Tell Crelavo what you want to create and let the system route the workflow.", href: "/showcase/omni-assistant", tone: "blue", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192218134042523-1783192218131.png", order: 3, active: true },
  { id: "launcher-generate", section: "launcher", title: "Generate", kicker: "Create", description: "Start video, web, app, brand file or visual production from one hub.", href: "/dashboard/assistant-workspace", tone: "pink", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192231039044746-1783192231031.png", order: 4, active: true },
  { id: "launcher-workspace", section: "launcher", title: "Workspace", kicker: "Live tracking", description: "Track live productions, revisions, outputs and final delivery packages.", href: "/showcase/live-workspace", tone: "amber", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192247858193551-1783192247854.png", order: 5, active: true },
  { id: "launcher-all-tools", section: "launcher", title: "All Tools", kicker: "Catalog", description: "Open the full tool catalog and choose the right production entry.", href: "/tools", tone: "purple", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192261949279707-1783192261944.png", order: 6, active: true },
  { id: "launcher-brand-memory", section: "launcher", title: "Brand Memory", kicker: "Retention", description: "Save brand voice, logos, colors and campaign rules for repeat production.", href: "/brand-memory", tone: "green", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/image/1783201146423541199-1783201146419.png", order: 7, active: true },
  { id: "launcher-hook-ugc", section: "launcher", title: "Hook & UGC", kicker: "Ad testing", description: "Create multiple first-three-second hooks and UGC angles for one product.", href: "/ai-hook-generator", tone: "pink", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/image/1783201171597890267-1783201171595.png", order: 8, active: true },
  { id: "launcher-marketplace-localization", section: "launcher", title: "Localization", kicker: "Global sales", description: "Adapt marketplace listings, ad scripts and product copy for global ecommerce.", href: "/ai-marketplace-localization", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/image/1783199284177175093-1783199284173.png", order: 9, active: true },
  { id: "launcher-competitor-ad", section: "launcher", title: "Competitor Ads", kicker: "Analysis", description: "Analyze public ad structure and create an original campaign response.", href: "/competitor-ad-analyzer", tone: "amber", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/image/1783199441797068118-1783199441793.png", order: 10, active: true }
];

export const defaultSiteContentConfig: SiteContentConfig = {
  navLinks: defaultPublicNavLinks,
  blogTopics: defaultBlogTopics,
  footerHelpPanels: defaultFooterHelpPanels,
  socialLinks: defaultSocialLinks,
  showcaseSlides: defaultShowcaseSlides
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object");
}

function normalizeBlogKeywordLinks(input: unknown): BlogKeywordLink[] {
  if (!Array.isArray(input)) return [];
  return input.filter(isRecord).map((item) => ({
    label: String(item.label ?? "").trim(),
    href: String(item.href ?? "").trim()
  })).filter((item) => item.label && item.href).slice(0, 3);
}

export function normalizePublicNavLinks(input: unknown): PublicNavLink[] {
  if (!Array.isArray(input)) return defaultPublicNavLinks;
  const links = input.filter(isRecord).map((item, index) => ({
    label: String(item.label ?? "").trim(),
    href: String(item.href ?? "").trim(),
    order: Number(item.order ?? index + 1),
    active: Boolean(item.active)
  })).filter((item) => item.label && item.href);
  if (!links.length) return defaultPublicNavLinks;
  const mergedLinks = [...links];
  for (const defaultLink of defaultPublicNavLinks.filter((item) => ["/live-sales-credits", "/drone-credits", "/growth-intelligence", "/affiliate"].includes(item.href))) {
    if (!mergedLinks.some((item) => item.href === defaultLink.href)) mergedLinks.push(defaultLink);
  }
  return mergedLinks.sort((a, b) => a.order - b.order);
}

export function normalizeBlogTopics(input: unknown): BlogTopic[] {
  if (!Array.isArray(input)) return defaultBlogTopics;
  const topics = input.filter(isRecord).map((item, index) => {
    const id = String(item.id ?? `topic-${index + 1}`).trim();
    const defaultTopic = defaultBlogTopics.find((topic) => topic.id === id);
    const linkedKeywords = normalizeBlogKeywordLinks(item.linkedKeywords);
    return {
      id,
      kicker: String(item.kicker ?? "Blog / Content").trim(),
      title: String(item.title ?? "").trim(),
      summary: String(item.summary ?? "").trim(),
      body: Array.isArray(item.body) ? item.body.map((line) => String(line).trim()).filter(Boolean) : [],
      image: String(item.image ?? "").trim(),
      imageAlt: String(item.imageAlt ?? "").trim(),
      mediaKind: item.mediaKind === "video" || item.mediaKind === "video-slot" ? item.mediaKind : defaultTopic?.mediaKind ?? "image",
      videoUrl: String(item.videoUrl ?? defaultTopic?.videoUrl ?? "").trim(),
      videoPoster: String(item.videoPoster ?? defaultTopic?.videoPoster ?? "").trim(),
      ctaLabel: String(item.ctaLabel ?? "Open workspace").trim(),
      ctaHref: String(item.ctaHref ?? "/dashboard/assistant-workspace").trim(),
      linkedKeywords: linkedKeywords.length ? linkedKeywords : defaultTopic?.linkedKeywords ?? [],
      order: Number(item.order ?? index + 1),
      active: Boolean(item.active)
    };
  }).filter((item) => item.id && item.title && item.summary && item.body.length);
  return topics.length ? topics.sort((a, b) => a.order - b.order) : defaultBlogTopics;
}

export function normalizeFooterHelpPanels(input: unknown): FooterHelpPanel[] {
  if (!Array.isArray(input)) return defaultFooterHelpPanels;
  const panels = input.filter(isRecord).map((item, index) => ({
    id: String(item.id ?? `panel-${index + 1}`).trim(),
    title: String(item.title ?? "").trim(),
    description: String(item.description ?? "").trim(),
    items: Array.isArray(item.items) ? item.items.filter(isRecord).map((entry) => ({ title: String(entry.title ?? "").trim(), body: String(entry.body ?? "").trim() })).filter((entry) => entry.title && entry.body) : [],
    order: Number(item.order ?? index + 1),
    active: Boolean(item.active)
  })).filter((item) => item.id && item.title && item.items.length);
  return panels.length ? panels.sort((a, b) => a.order - b.order) : defaultFooterHelpPanels;
}

export function normalizeSocialLinks(input: unknown): SocialLink[] {
  if (!Array.isArray(input)) return defaultSocialLinks;
  const links = input.filter(isRecord).map((item, index) => ({
    label: String(item.label ?? "").trim(),
    href: String(item.href ?? "").trim(),
    order: Number(item.order ?? index + 1),
    active: Boolean(item.active)
  })).filter((item) => item.label && /^https:\/\//.test(item.href));
  return links.length ? links.sort((a, b) => a.order - b.order) : defaultSocialLinks;
}

export function normalizeShowcaseSlides(input: unknown): ShowcaseSlideConfig[] {
  const allowedSections = new Set(["launcher", "features", "categories"]);
  const allowedTones = new Set(["cyan", "purple", "green", "amber", "pink", "blue"]);
  if (!Array.isArray(input)) return defaultShowcaseSlides;
  const slides = input.filter(isRecord).map((item, index) => ({
    id: String(item.id ?? `slide-${index + 1}`).trim(),
    section: allowedSections.has(String(item.section)) ? String(item.section) as ShowcaseSlideConfig["section"] : "launcher",
    title: String(item.title ?? "").trim(),
    kicker: String(item.kicker ?? "Showcase").trim(),
    description: String(item.description ?? "").trim(),
    href: String(item.href ?? "/dashboard/assistant-workspace").trim(),
    tone: allowedTones.has(String(item.tone)) ? String(item.tone) as ShowcaseSlideConfig["tone"] : "cyan",
    imageUrl: String(item.imageUrl ?? "").trim(),
    order: Number(item.order ?? index + 1),
    active: Boolean(item.active)
  })).filter((item) => item.id && item.title && item.href);
  return slides.length ? slides.sort((a, b) => a.order - b.order) : defaultShowcaseSlides;
}

export function normalizeSiteContentConfig(input: unknown): SiteContentConfig {
  const value = isRecord(input) ? input : {};
  return {
    navLinks: normalizePublicNavLinks(value.navLinks),
    blogTopics: normalizeBlogTopics(value.blogTopics),
    footerHelpPanels: normalizeFooterHelpPanels(value.footerHelpPanels),
    socialLinks: normalizeSocialLinks(value.socialLinks),
    showcaseSlides: normalizeShowcaseSlides(value.showcaseSlides)
  };
}
