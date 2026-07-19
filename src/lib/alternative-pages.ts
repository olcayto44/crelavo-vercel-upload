export type AlternativeComparisonRow = {
  feature: string;
  crelavo: string;
  competitor: string;
};

export type AlternativePage = {
  slug: string;
  competitor: string;
  category: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  summary: string;
  bestFor: string;
  competitorFit: string;
  crelavoFit: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  h2Sections: { title: string; body: string; bullets: string[] }[];
  comparison: AlternativeComparisonRow[];
  faq: { question: string; answer: string }[];
  relatedSlugs: string[];
};

const commonComparison = (competitor: string): AlternativeComparisonRow[] => [
  { feature: "AI product video workflow", crelavo: "Product links, campaign context, hooks and delivery paths can start from one production request.", competitor: `${competitor} may support creative creation, but the workflow usually starts from a template, editor or single-purpose generation path.` },
  { feature: "Ecommerce campaign pages", crelavo: "Dedicated Shopify, Amazon, Trendyol and product-link campaign paths are connected to Crelavo categories.", competitor: `${competitor} is not primarily organized around Crelavo's ecommerce campaign funnel.` },
  { feature: "Website, app and campaign production", crelavo: "Crelavo combines video, website, app, brand and campaign production in one managed system.", competitor: `${competitor} may be stronger in its own core category, but not always as broad as a managed production studio.` },
  { feature: "Managed delivery", crelavo: "Credits, production requests, dashboard delivery, source handoff notes and revision context are part of the flow.", competitor: `${competitor} is often used as a self-serve creation tool or editor.` },
  { feature: "Internal SEO funnel", crelavo: "Alternative pages connect to tools, categories, product video, ecommerce pages, pricing and assistant workspace.", competitor: `${competitor} comparison intent usually needs a separate decision path.` }
];

export const alternativePages: AlternativePage[] = [
  {
    slug: "canva-alternative",
    competitor: "Canva",
    category: "Design and creative production",
    title: "Canva alternative",
    metaTitle: "Canva Alternative for AI Product Videos and Campaign Assets | Crelavo",
    metaDescription: "Compare Crelavo as a Canva alternative for ecommerce product videos, AI campaign assets, websites, apps, brand kits and managed creative delivery.",
    h1: "Canva alternative for AI product videos, ecommerce campaigns and managed creative delivery",
    summary: "Crelavo is a Canva alternative for teams that need more than design templates: product videos, ecommerce campaign assets, websites, app concepts, brand kits and production delivery can start from one request.",
    bestFor: "ecommerce sellers, agencies and founders who want campaign production instead of only template-based design",
    competitorFit: "Canva is useful for fast design templates, social graphics, presentations and brand visuals.",
    crelavoFit: "Crelavo is better when the goal is a full production path: product link to ad video, landing page copy, campaign hooks, website/app assets and dashboard delivery.",
    primaryKeyword: "Canva alternative",
    secondaryKeywords: ["Canva alternative for product videos", "AI design tool alternative", "AI campaign asset generator", "Canva alternative for ecommerce", "managed creative production platform"],
    h2Sections: [
      { title: "Why choose Crelavo instead of a template-only design workflow?", body: "A design editor is helpful when the final need is a graphic. Crelavo is built for users who need campaign output: video, copy, landing page direction, product visuals and delivery notes in one production workflow.", bullets: ["Start from a product link or campaign idea", "Connect visuals to videos, hooks and landing copy", "Use one workspace for ecommerce and growth assets"] },
      { title: "SEO use cases for this Canva alternative", body: "Search visitors often compare Canva with broader AI production tools. This page targets users looking for a Canva alternative for ecommerce ads, AI product video and managed campaign assets.", bullets: ["Shopify product campaign assets", "Amazon product video and ad hooks", "Brand kit plus campaign production"] }
    ],
    comparison: commonComparison("Canva"),
    faq: [
      { question: "Is Crelavo a direct Canva replacement?", answer: "Not exactly. Canva is strong for self-serve design. Crelavo is positioned as a broader AI production studio for campaign assets, product videos, websites, apps and delivery workflows." },
      { question: "When should I use Crelavo instead of Canva?", answer: "Use Crelavo when you need product video, ecommerce campaign assets, landing copy, website/app production or a managed production request rather than only a design template." }
    ],
    relatedSlugs: ["adcreative-ai-alternative", "product-video-generator-alternative", "wix-ai-alternative"]
  },
  {
    slug: "runway-alternative",
    competitor: "Runway",
    category: "AI video generation",
    title: "Runway alternative",
    metaTitle: "Runway Alternative for Product Videos and Campaign Production | Crelavo",
    metaDescription: "Explore Crelavo as a Runway alternative for ecommerce product videos, AI ad campaigns, social clips, landing pages and managed creative delivery.",
    h1: "Runway alternative for ecommerce product videos and AI campaign production",
    summary: "Crelavo is a Runway alternative for teams that want AI video connected to product pages, campaign briefs, landing copy, website/app assets and delivery workflows.",
    bestFor: "teams that need AI video as part of an ecommerce or marketing production funnel",
    competitorFit: "Runway is known for advanced generative video creation and creative experimentation.",
    crelavoFit: "Crelavo is better when video must connect to ecommerce pages, social ads, product hooks, campaign assets and production delivery.",
    primaryKeyword: "Runway alternative",
    secondaryKeywords: ["Runway alternative for ecommerce", "AI video generator alternative", "AI product video workflow", "Runway alternative for ads", "managed AI video production"],
    h2Sections: [
      { title: "From AI video generation to campaign delivery", body: "Crelavo does not treat video as an isolated clip. A product video can connect to campaign strategy, hook writing, product page context, social captions and dashboard delivery.", bullets: ["Product-link-to-video paths", "Campaign-ready video briefs", "Social ad and ecommerce CTA support"] },
      { title: "Best Runway alternative searches to target", body: "This page supports search intent around AI video production, product video generators and campaign workflows for sellers and agencies.", bullets: ["AI product ad video generator", "Runway alternative for marketing videos", "AI video production service"] }
    ],
    comparison: commonComparison("Runway"),
    faq: [
      { question: "Is Crelavo better than Runway for ecommerce campaigns?", answer: "Crelavo is more focused on ecommerce and campaign production paths. Runway is strong for generative video experimentation." },
      { question: "Can Crelavo help with product video briefs?", answer: "Yes. Crelavo can route product link, campaign angle, hooks, captions and delivery expectations into one production request." }
    ],
    relatedSlugs: ["heygen-alternative", "pictory-alternative", "product-video-generator-alternative"]
  },
  {
    slug: "synthesia-alternative",
    competitor: "Synthesia",
    category: "Avatar and business video",
    title: "Synthesia alternative",
    metaTitle: "Synthesia Alternative for AI Videos, Campaigns and Ecommerce | Crelavo",
    metaDescription: "Compare Crelavo as a Synthesia alternative for AI videos, ecommerce campaigns, product ads, website/app assets and managed creative production.",
    h1: "Synthesia alternative for AI videos, product campaigns and broader creative production",
    summary: "Crelavo is a Synthesia alternative for users who want AI video plus ecommerce campaign pages, product ad workflows, website/app assets and managed delivery in one system.",
    bestFor: "businesses that need more than presenter videos and want broader campaign output",
    competitorFit: "Synthesia is known for AI avatar and presenter-style business videos.",
    crelavoFit: "Crelavo is better when the project needs product video, ecommerce campaigns, website/app production, brand files and creative delivery paths.",
    primaryKeyword: "Synthesia alternative",
    secondaryKeywords: ["Synthesia alternative for product videos", "AI avatar video alternative", "business video generator alternative", "AI campaign production studio"],
    h2Sections: [
      { title: "Beyond avatar videos", body: "Presenter videos can be useful, but many teams also need product ads, ecommerce landing pages, hooks, campaign visuals and delivery files. Crelavo connects those needs in one production path.", bullets: ["Product video plus campaign copy", "Avatar and non-avatar video workflows", "Brand and website production support"] },
      { title: "Who should consider this Synthesia alternative?", body: "Crelavo is useful for ecommerce sellers, agencies, founders and teams that want a complete AI production request instead of only a talking-head video.", bullets: ["Ecommerce product demos", "Social ad variants", "Landing page and campaign asset packages"] }
    ],
    comparison: commonComparison("Synthesia"),
    faq: [
      { question: "Does Crelavo only create avatar videos?", answer: "No. Crelavo covers broader production categories, including product videos, campaign assets, websites, apps, brand kits and visual packages." },
      { question: "Why compare Crelavo with Synthesia?", answer: "Many users searching for Synthesia alternatives want AI business video. Crelavo expands that intent into broader campaign and ecommerce production." }
    ],
    relatedSlugs: ["heygen-alternative", "runway-alternative", "invideo-alternative"]
  },
  {
    slug: "heygen-alternative",
    competitor: "HeyGen",
    category: "Avatar and talking video",
    title: "HeyGen alternative",
    metaTitle: "HeyGen Alternative for AI Product Videos and Campaign Assets | Crelavo",
    metaDescription: "Crelavo is a HeyGen alternative for teams that need AI video, ecommerce product campaigns, social ads, website/app assets and managed delivery.",
    h1: "HeyGen alternative for AI videos, product campaigns and managed creative production",
    summary: "Crelavo is a HeyGen alternative for teams that want talking video options plus product video, ecommerce campaign assets, social hooks and delivery workflows.",
    bestFor: "teams that need avatar/talking video as one part of a larger marketing production workflow",
    competitorFit: "HeyGen is commonly used for AI avatars, talking videos, localization and presenter-style content.",
    crelavoFit: "Crelavo is better when the goal includes ecommerce product ads, landing pages, campaign packs, brand assets and dashboard delivery.",
    primaryKeyword: "HeyGen alternative",
    secondaryKeywords: ["HeyGen alternative for ecommerce", "AI talking video alternative", "AI avatar video alternative", "product video generator with campaign assets"],
    h2Sections: [
      { title: "Crelavo as a broader HeyGen alternative", body: "A talking avatar can explain a product, but ecommerce teams often need more: product close-ups, hooks, captions, landing copy and campaign pages. Crelavo gives those requests a wider production structure.", bullets: ["Avatar and non-avatar creative paths", "Product link to campaign request", "Social and landing page output support"] },
      { title: "Internal links for HeyGen alternative intent", body: "This page links visitors to AI product video, Shopify product video, campaign categories and the tools catalog so the comparison intent can move into a real request.", bullets: ["AI product video generator", "Shopify product link to ad video", "Crelavo categories and pricing"] }
    ],
    comparison: commonComparison("HeyGen"),
    faq: [
      { question: "Is Crelavo only for talking videos?", answer: "No. Talking videos are one possible category, but Crelavo also covers ecommerce videos, product campaigns, websites, apps, brand kits and creative delivery." },
      { question: "When is Crelavo a better fit than HeyGen?", answer: "When the video is part of a larger campaign package, ecommerce funnel or managed production workflow." }
    ],
    relatedSlugs: ["synthesia-alternative", "runway-alternative", "veed-alternative"]
  },
  {
    slug: "pictory-alternative",
    competitor: "Pictory",
    category: "AI video and content repurposing",
    title: "Pictory alternative",
    metaTitle: "Pictory Alternative for Product Videos and AI Campaign Assets | Crelavo",
    metaDescription: "Use Crelavo as a Pictory alternative for ecommerce product videos, campaign briefs, ad hooks, landing copy, social assets and managed delivery.",
    h1: "Pictory alternative for product videos, ecommerce campaigns and AI production workflows",
    summary: "Crelavo is a Pictory alternative for users who want video creation connected to product pages, ecommerce campaigns, hooks, captions and production delivery.",
    bestFor: "marketers and sellers who need campaign-ready product videos rather than only content repurposing",
    competitorFit: "Pictory is often used for turning scripts, articles or long content into videos.",
    crelavoFit: "Crelavo is better when the request starts from a product, ecommerce campaign, landing page need or broader creative package.",
    primaryKeyword: "Pictory alternative",
    secondaryKeywords: ["Pictory alternative for product videos", "AI video maker alternative", "AI ad video generator", "content to campaign workflow"],
    h2Sections: [
      { title: "Product campaign workflow instead of only content repurposing", body: "Crelavo helps turn product context into campaign assets. That makes it useful for sellers and agencies who need video, hooks, landing copy and delivery notes.", bullets: ["Product URL to brief", "Video plus ad copy", "Internal links to ecommerce tools"] },
      { title: "Pictory alternative SEO coverage", body: "This page targets users comparing AI video tools for marketing, ecommerce and product ads.", bullets: ["AI product video maker", "Pictory alternative for ads", "AI campaign video workflow"] }
    ],
    comparison: commonComparison("Pictory"),
    faq: [
      { question: "What makes Crelavo different from Pictory?", answer: "Crelavo focuses on managed production workflows across video, ecommerce campaigns, websites, apps, visuals and delivery paths." },
      { question: "Can Crelavo support social video campaigns?", answer: "Yes. Campaign requests can connect video, captions, hooks, CTA direction and ecommerce landing pages." }
    ],
    relatedSlugs: ["invideo-alternative", "veed-alternative", "product-video-generator-alternative"]
  },
  {
    slug: "invideo-alternative",
    competitor: "InVideo",
    category: "AI video editing and creation",
    title: "InVideo alternative",
    metaTitle: "InVideo Alternative for Ecommerce Product Videos | Crelavo",
    metaDescription: "Compare Crelavo as an InVideo alternative for AI product videos, ecommerce ad campaigns, creative assets, landing pages and managed delivery.",
    h1: "InVideo alternative for ecommerce product videos and campaign-ready creative assets",
    summary: "Crelavo is an InVideo alternative for teams that need product video generation connected to ecommerce campaign planning, website/app production, captions, hooks and delivery.",
    bestFor: "sellers, creators and agencies that want AI video plus campaign output",
    competitorFit: "InVideo is useful for self-serve video creation, editing and template-led marketing content.",
    crelavoFit: "Crelavo is better when video needs to be part of a larger production package with ecommerce pages, hooks, visuals and handoff notes.",
    primaryKeyword: "InVideo alternative",
    secondaryKeywords: ["InVideo alternative for ecommerce", "AI video editor alternative", "AI ad video platform", "product video campaign generator"],
    h2Sections: [
      { title: "Why Crelavo for ecommerce video campaigns?", body: "Crelavo routes product pages, campaign intent and creative outputs into one production path. The page can support users who search for video tools but need more than an editor.", bullets: ["Product ad video workflow", "Shopify/Amazon/Trendyol campaign paths", "Campaign copy and CTA support"] },
      { title: "Internal SEO links for InVideo alternative users", body: "Visitors can continue into product video generator pages, campaign categories, tools, samples and pricing.", bullets: ["AI product video generator", "Campaign category", "Tools catalog"] }
    ],
    comparison: commonComparison("InVideo"),
    faq: [
      { question: "Is Crelavo an editor like InVideo?", answer: "Crelavo is positioned more as an AI production studio and request workflow than only a self-serve editor." },
      { question: "Can Crelavo help with ecommerce product ad videos?", answer: "Yes. Ecommerce product video and product-link campaign workflows are core Crelavo paths." }
    ],
    relatedSlugs: ["pictory-alternative", "kapwing-alternative", "runway-alternative"]
  },
  {
    slug: "adcreative-ai-alternative",
    competitor: "AdCreative.ai",
    category: "AI ad creative",
    title: "AdCreative.ai alternative",
    metaTitle: "AdCreative.ai Alternative for Product Videos and Campaign Assets | Crelavo",
    metaDescription: "Crelavo is an AdCreative.ai alternative for AI product videos, ecommerce campaign assets, ad hooks, landing pages, websites and managed delivery.",
    h1: "AdCreative.ai alternative for product videos, ecommerce campaigns and creative production",
    summary: "Crelavo is an AdCreative.ai alternative for teams that want ad creative connected to product videos, ecommerce pages, hooks, landing copy, website/app assets and delivery workflows.",
    bestFor: "teams that need ad creative plus production assets, not only static ad variations",
    competitorFit: "AdCreative.ai is associated with AI ad creatives, ad copy and performance-focused design variations.",
    crelavoFit: "Crelavo is better when the ad idea must expand into product videos, campaign pages, social assets, website/app flows and managed delivery.",
    primaryKeyword: "AdCreative.ai alternative",
    secondaryKeywords: ["AI ad creative alternative", "AI campaign asset generator", "product ad video generator", "AdCreative alternative for ecommerce"],
    h2Sections: [
      { title: "Ad creative plus production delivery", body: "Crelavo connects ad creative intent with video, product page context, hooks, landing copy and production delivery. This helps teams move from idea to usable campaign assets.", bullets: ["Product videos and ad hooks", "Landing page and campaign copy", "Dashboard delivery paths"] },
      { title: "High-intent keywords for ad creative alternatives", body: "This page strengthens SEO around AI ad generator, ecommerce ad creative, product video ads and campaign asset production.", bullets: ["AI ad creative generator", "AI product ad video", "ecommerce campaign assets"] }
    ],
    comparison: commonComparison("AdCreative.ai"),
    faq: [
      { question: "Does Crelavo only create ad images?", answer: "No. Crelavo supports broader production paths including AI video, ecommerce campaigns, websites, apps, brand kits and delivery packages." },
      { question: "Why use Crelavo as an AdCreative.ai alternative?", answer: "Use Crelavo when ad creative needs to become a wider product campaign with video, copy, page direction and delivery workflow." }
    ],
    relatedSlugs: ["canva-alternative", "product-video-generator-alternative", "shopify-video-app-alternative"]
  },
  {
    slug: "wix-ai-alternative",
    competitor: "Wix AI",
    category: "AI website builder",
    title: "Wix AI alternative",
    metaTitle: "Wix AI Alternative for Websites, Apps and Campaign Assets | Crelavo",
    metaDescription: "Compare Crelavo as a Wix AI alternative for AI website production, app concepts, ecommerce campaigns, product videos and managed creative delivery.",
    h1: "Wix AI alternative for website production, app concepts and campaign assets",
    summary: "Crelavo is a Wix AI alternative for users who want website production connected to AI videos, ecommerce campaigns, app concepts, brand assets and delivery workflows.",
    bestFor: "founders and small businesses that need more than a simple website builder",
    competitorFit: "Wix AI is useful for building websites quickly inside a website builder ecosystem.",
    crelavoFit: "Crelavo is better when the website is part of a broader launch package with videos, app screens, ecommerce campaigns and managed creative files.",
    primaryKeyword: "Wix AI alternative",
    secondaryKeywords: ["AI website builder alternative", "Wix alternative for AI websites", "AI landing page production", "website and campaign production studio"],
    h2Sections: [
      { title: "Website production connected to campaign assets", body: "Crelavo positions website production as part of a broader launch system. A founder can request site content, app direction, product video, campaign hooks and brand assets from one place.", bullets: ["Landing page and website paths", "App and SaaS MVP support", "Campaign and video links"] },
      { title: "SEO intent for Wix AI alternative users", body: "Users searching for Wix AI alternatives may want a builder, but they may also need launch content, product videos and campaign material.", bullets: ["AI website builder for startups", "AI SaaS landing page", "AI ecommerce website production"] }
    ],
    comparison: commonComparison("Wix AI"),
    faq: [
      { question: "Is Crelavo a website builder?", answer: "Crelavo includes AI website production paths, but it is broader than a traditional website builder because it connects websites with videos, apps, campaign assets and delivery." },
      { question: "When is Crelavo a better fit than Wix AI?", answer: "When you need a launch package or campaign workflow instead of only a website editor." }
    ],
    relatedSlugs: ["framer-ai-alternative", "durable-ai-alternative", "canva-alternative"]
  },
  {
    slug: "framer-ai-alternative",
    competitor: "Framer AI",
    category: "AI website builder",
    title: "Framer AI alternative",
    metaTitle: "Framer AI Alternative for Websites and Launch Campaigns | Crelavo",
    metaDescription: "Explore Crelavo as a Framer AI alternative for AI website production, SaaS launch pages, product videos, campaign assets and managed delivery.",
    h1: "Framer AI alternative for launch websites, product videos and campaign assets",
    summary: "Crelavo is a Framer AI alternative for founders and teams that need launch pages connected to product videos, app concepts, social assets and managed production delivery.",
    bestFor: "founders, SaaS teams and agencies building launch assets around a website",
    competitorFit: "Framer AI is useful for fast website and landing page creation in a design-focused web builder.",
    crelavoFit: "Crelavo is better when the site needs to sit inside a full launch package: video, app screens, campaign copy, brand assets and delivery notes.",
    primaryKeyword: "Framer AI alternative",
    secondaryKeywords: ["Framer alternative AI website", "AI landing page builder alternative", "SaaS launch page generator", "website and video campaign production"],
    h2Sections: [
      { title: "Launch assets beyond a landing page", body: "A landing page is only one part of a launch. Crelavo can connect the website request with AI video, social copy, campaign assets, app screens and delivery files.", bullets: ["SaaS and startup landing pages", "Product videos for launch campaigns", "Brand and social asset support"] },
      { title: "Framer AI alternative keyword cluster", body: "This page supports searches around AI landing pages, SaaS website builders and managed launch production.", bullets: ["AI website builder for SaaS", "AI landing page production", "Framer AI alternative for startups"] }
    ],
    comparison: commonComparison("Framer AI"),
    faq: [
      { question: "Why compare Crelavo with Framer AI?", answer: "Many users looking for AI website builders need more than a page: launch video, campaign copy, app concept and delivery structure." },
      { question: "Can Crelavo help with SaaS launch pages?", answer: "Yes. Crelavo includes website, SaaS, app and campaign production paths." }
    ],
    relatedSlugs: ["wix-ai-alternative", "durable-ai-alternative", "canva-alternative"]
  },
  {
    slug: "durable-ai-alternative",
    competitor: "Durable AI",
    category: "AI website builder",
    title: "Durable AI alternative",
    metaTitle: "Durable AI Alternative for Websites and Business Campaigns | Crelavo",
    metaDescription: "Crelavo is a Durable AI alternative for AI website production, business launch assets, ecommerce campaigns, product videos and managed creative delivery.",
    h1: "Durable AI alternative for business websites, campaign assets and product videos",
    summary: "Crelavo is a Durable AI alternative for businesses that want website production connected to ecommerce campaigns, AI videos, app concepts, brand assets and delivery workflows.",
    bestFor: "small businesses and ecommerce teams that need website plus campaign production",
    competitorFit: "Durable AI is associated with fast AI website creation for businesses.",
    crelavoFit: "Crelavo is better when the website is only one part of a bigger business production request involving product videos, ads, brand files and launch content.",
    primaryKeyword: "Durable AI alternative",
    secondaryKeywords: ["Durable alternative AI website", "AI business website builder alternative", "AI website and campaign generator", "small business AI production studio"],
    h2Sections: [
      { title: "Business website plus marketing production", body: "Crelavo connects website needs with campaign material, product video, social assets and brand outputs. This is useful when the business needs a launch package, not only a quick page.", bullets: ["Website production", "AI product video", "Campaign and social assets"] },
      { title: "Durable AI alternative SEO intent", body: "The page captures users who compare quick AI website builders but may also need ecommerce and creative production.", bullets: ["AI website builder for small business", "business campaign assets", "website plus video production"] }
    ],
    comparison: commonComparison("Durable AI"),
    faq: [
      { question: "Is Crelavo only for websites?", answer: "No. Website production is one category; Crelavo also supports video, ecommerce, app, brand and campaign production." },
      { question: "When should a business choose Crelavo?", answer: "When it wants website content plus videos, campaign assets, brand files or delivery support." }
    ],
    relatedSlugs: ["wix-ai-alternative", "framer-ai-alternative", "shopify-video-app-alternative"]
  },
  {
    slug: "product-video-generator-alternative",
    competitor: "Product video generators",
    category: "Ecommerce product video",
    title: "Product video generator alternative",
    metaTitle: "Product Video Generator Alternative for Ecommerce Campaigns | Crelavo",
    metaDescription: "Crelavo is a product video generator alternative for Shopify, Amazon, Trendyol and ecommerce teams that need videos, hooks, captions and campaign assets.",
    h1: "Product video generator alternative for ecommerce campaigns and product-link workflows",
    summary: "Crelavo is a product video generator alternative for sellers who want product videos connected to campaign briefs, ad hooks, captions, landing copy and ecommerce pages.",
    bestFor: "Shopify, Amazon, Trendyol and marketplace sellers who need product videos plus campaign assets",
    competitorFit: "A generic product video generator may create a clip from images, text or templates.",
    crelavoFit: "Crelavo is better when the product video must connect to a product URL, campaign goal, ecommerce copy, social assets and delivery flow.",
    primaryKeyword: "product video generator alternative",
    secondaryKeywords: ["AI product video generator alternative", "ecommerce product video maker", "product link to ad video", "Shopify product video generator", "Amazon product ad video"],
    h2Sections: [
      { title: "Product link to ad video workflow", body: "Crelavo focuses on the path from product URL to campaign request. That gives ecommerce teams a clearer workflow than starting from a blank editor.", bullets: ["Shopify product link to video", "Amazon product ad video", "Trendyol product video"] },
      { title: "SEO pages connected to this alternative", body: "The product video alternative page links to campaign, tools, Shopify, Amazon, Trendyol and Chrome extension funnel pages.", bullets: ["Campaign category", "Chrome extension funnel", "AI product video generator"] }
    ],
    comparison: commonComparison("generic product video generators"),
    faq: [
      { question: "Is Crelavo only a product video generator?", answer: "No. Product videos are a core ecommerce path, but Crelavo also supports campaign copy, websites, apps, brand assets and managed delivery." },
      { question: "Can Crelavo start from product links?", answer: "Yes. Product-link-to-campaign workflows are central to the ecommerce acquisition funnel." }
    ],
    relatedSlugs: ["shopify-video-app-alternative", "adcreative-ai-alternative", "runway-alternative"]
  },
  {
    slug: "shopify-video-app-alternative",
    competitor: "Shopify video apps",
    category: "Shopify ecommerce video",
    title: "Shopify video app alternative",
    metaTitle: "Shopify Video App Alternative for Product Ads | Crelavo",
    metaDescription: "Crelavo is a Shopify video app alternative for product-link-to-video workflows, ecommerce campaign assets, hooks, landing copy and managed creative delivery.",
    h1: "Shopify video app alternative for product-link ad videos and ecommerce campaign assets",
    summary: "Crelavo is a Shopify video app alternative for merchants who want product link to ad video workflows, hooks, captions, campaign pages and delivery structure.",
    bestFor: "Shopify merchants and agencies that need product video plus campaign assets",
    competitorFit: "A Shopify video app may focus on store-specific video creation or embedding.",
    crelavoFit: "Crelavo is better when Shopify product context must become a wider campaign request across video, copy, social assets and landing pages.",
    primaryKeyword: "Shopify video app alternative",
    secondaryKeywords: ["Shopify product video app alternative", "Shopify product link to ad video", "AI Shopify video generator", "Shopify campaign asset generator"],
    h2Sections: [
      { title: "From Shopify product page to campaign request", body: "Crelavo can route Shopify product context into a campaign flow. The goal is to reduce manual brief writing and create product videos, hooks and assets from one path.", bullets: ["Shopify product link workflow", "Chrome extension funnel", "Campaign category links"] },
      { title: "Why this page matters for SEO", body: "Shopify merchants search for apps, video tools and product ad solutions. This page captures that intent and routes it into Crelavo's ecommerce production system.", bullets: ["Shopify video app alternative", "Shopify product ad video", "AI ecommerce campaign generator"] }
    ],
    comparison: commonComparison("Shopify video apps"),
    faq: [
      { question: "Is Crelavo installed as a Shopify app today?", answer: "This page positions the workflow and acquisition funnel. The Chrome extension and app-store paths can be expanded later while public SEO intent is built now." },
      { question: "What should Shopify sellers use first?", answer: "They can start from the Shopify product link to ad video page or the campaign category page." }
    ],
    relatedSlugs: ["product-video-generator-alternative", "adcreative-ai-alternative", "durable-ai-alternative"]
  },
  {
    slug: "veed-alternative",
    competitor: "VEED",
    category: "Online video editing",
    title: "VEED alternative",
    metaTitle: "VEED Alternative for AI Product Videos and Campaigns | Crelavo",
    metaDescription: "Compare Crelavo as a VEED alternative for AI product videos, ecommerce campaigns, social ads, captions, landing copy and managed delivery.",
    h1: "VEED alternative for AI product videos, ecommerce campaigns and managed creative workflows",
    summary: "Crelavo is a VEED alternative for users who want video creation connected to product pages, campaign hooks, ecommerce assets, websites, apps and delivery paths.",
    bestFor: "teams that need video output as part of a broader campaign package",
    competitorFit: "VEED is widely used for online video editing, captions, recording and social video workflows.",
    crelavoFit: "Crelavo is better when video is part of an ecommerce or launch production request with product context and delivery assets.",
    primaryKeyword: "VEED alternative",
    secondaryKeywords: ["VEED alternative for product videos", "online video editor alternative", "AI video campaign tool", "AI product video editor alternative"],
    h2Sections: [
      { title: "Video editing versus production workflow", body: "Crelavo is not only an editing surface. It is a request and delivery workflow for teams that need product videos, hooks, social assets and campaign pages.", bullets: ["Product video workflow", "Campaign copy support", "Delivery and revision context"] },
      { title: "VEED alternative keyword coverage", body: "This page supports comparison searches around online video editors, AI video tools and product ad workflows.", bullets: ["AI video editor alternative", "product video maker", "social ad video workflow"] }
    ],
    comparison: commonComparison("VEED"),
    faq: [
      { question: "Is Crelavo a direct VEED editor replacement?", answer: "Crelavo is broader than an editor. It focuses on AI production requests, ecommerce campaigns and delivery workflows." },
      { question: "Can Crelavo help with captions and social assets?", answer: "Yes, Crelavo can include social hooks, captions and campaign direction as part of a production request." }
    ],
    relatedSlugs: ["kapwing-alternative", "invideo-alternative", "pictory-alternative"]
  },
  {
    slug: "kapwing-alternative",
    competitor: "Kapwing",
    category: "Online video and content editing",
    title: "Kapwing alternative",
    metaTitle: "Kapwing Alternative for Product Videos and AI Campaigns | Crelavo",
    metaDescription: "Crelavo is a Kapwing alternative for AI product videos, ecommerce campaign assets, social clips, website/app production and managed creative delivery.",
    h1: "Kapwing alternative for product videos, social campaigns and AI production delivery",
    summary: "Crelavo is a Kapwing alternative for teams that need social video and product campaign assets connected to ecommerce pages, websites, apps and delivery workflows.",
    bestFor: "creators, ecommerce teams and agencies that need social video plus campaign output",
    competitorFit: "Kapwing is useful for online editing, social content creation, subtitles and collaborative video work.",
    crelavoFit: "Crelavo is better when social video must become a broader ecommerce or business campaign package.",
    primaryKeyword: "Kapwing alternative",
    secondaryKeywords: ["Kapwing alternative for ecommerce", "AI social video alternative", "product campaign video workflow", "managed AI content production"],
    h2Sections: [
      { title: "Social content connected to ecommerce production", body: "Crelavo links social video needs to product links, campaign copy, landing pages and delivery paths so teams can build a complete acquisition workflow.", bullets: ["Social video and hooks", "Product ad creative", "Campaign category links"] },
      { title: "Kapwing alternative SEO cluster", body: "This page captures users looking for video editing alternatives and routes them toward campaign-ready Crelavo services.", bullets: ["AI social media video", "product video ads", "ecommerce campaign assets"] }
    ],
    comparison: commonComparison("Kapwing"),
    faq: [
      { question: "What is different about Crelavo compared with Kapwing?", answer: "Crelavo is structured around production requests and campaign delivery, while Kapwing is commonly used as an online editor." },
      { question: "Can Crelavo support social media campaigns?", answer: "Yes. Social hooks, captions, product videos and campaign assets can be included in the workflow." }
    ],
    relatedSlugs: ["veed-alternative", "invideo-alternative", "adcreative-ai-alternative"]
  },
  {
    slug: "descript-alternative",
    competitor: "Descript",
    category: "Video and audio editing",
    title: "Descript alternative",
    metaTitle: "Descript Alternative for AI Video Campaign Production | Crelavo",
    metaDescription: "Crelavo is a Descript alternative for teams that need AI video campaign assets, ecommerce product videos, social clips and managed creative delivery.",
    h1: "Descript alternative for AI video campaigns, product ads and managed creative production",
    summary: "Crelavo is a Descript alternative for teams that need AI video connected to product campaigns, social hooks, landing copy, website/app assets and delivery workflows.",
    bestFor: "teams that need marketing production rather than only audio/video editing",
    competitorFit: "Descript is known for audio and video editing, transcription, screen recording and creator workflows.",
    crelavoFit: "Crelavo is better when editing or video output must connect to ecommerce campaigns, product ads, websites, apps and broader delivery.",
    primaryKeyword: "Descript alternative",
    secondaryKeywords: ["Descript alternative for marketing videos", "AI video campaign alternative", "product video production workflow", "AI content production studio"],
    h2Sections: [
      { title: "From editing workflow to production system", body: "Crelavo is useful when the goal is not only editing existing footage but creating campaign-ready outputs from a product, service or launch idea.", bullets: ["Campaign brief support", "Product video and social assets", "Website/app production paths"] },
      { title: "Descript alternative long-tail SEO", body: "This page supports searches around AI video editing alternatives and routes users toward Crelavo's campaign production pages.", bullets: ["AI video production service", "marketing video workflow", "product ad video generator"] }
    ],
    comparison: commonComparison("Descript"),
    faq: [
      { question: "Is Crelavo mainly an editing tool?", answer: "No. Crelavo is a broader AI production studio for video, ecommerce, websites, apps, visuals, brand kits and delivery workflows." },
      { question: "When should I choose Crelavo over an editor?", answer: "When you need new campaign assets, product videos, copy, landing page direction or managed delivery instead of only editing existing media." }
    ],
    relatedSlugs: ["veed-alternative", "kapwing-alternative", "runway-alternative"]
  },
  {
    slug: "jasper-ai-alternative",
    competitor: "Jasper AI",
    category: "AI marketing content",
    title: "Jasper AI alternative",
    metaTitle: "Jasper AI Alternative for Campaign Assets and Product Videos | Crelavo",
    metaDescription: "Crelavo is a Jasper AI alternative for teams that need marketing copy plus product videos, ecommerce campaign assets, websites, apps and delivery workflows.",
    h1: "Jasper AI alternative for campaign assets, product videos and managed AI production",
    summary: "Crelavo is a Jasper AI alternative for users who want marketing copy connected to videos, ecommerce campaigns, websites, apps, brand assets and production delivery.",
    bestFor: "teams that need copy plus visual, video and campaign production",
    competitorFit: "Jasper AI is associated with AI writing, marketing copy and brand voice workflows.",
    crelavoFit: "Crelavo is better when copy needs to become a full campaign package with videos, visuals, landing pages, product assets and delivery notes.",
    primaryKeyword: "Jasper AI alternative",
    secondaryKeywords: ["AI marketing copy alternative", "campaign asset generator", "AI product video and copy workflow", "Jasper alternative for ecommerce"],
    h2Sections: [
      { title: "Marketing copy plus production output", body: "Crelavo can connect copywriting intent to product videos, ecommerce pages, social captions, hooks, websites and campaign assets.", bullets: ["Ad hooks and captions", "Product video requests", "Landing page and website production"] },
      { title: "Jasper AI alternative SEO intent", body: "This page targets users who search for AI marketing tools but need a broader production studio rather than only copy generation.", bullets: ["AI campaign generator", "marketing asset production", "AI ecommerce campaign copy"] }
    ],
    comparison: commonComparison("Jasper AI"),
    faq: [
      { question: "Is Crelavo a copywriting-only tool?", answer: "No. Copy can be part of a Crelavo request, but the platform also supports video, visuals, websites, apps, brand kits and delivery." },
      { question: "Why compare Crelavo with Jasper AI?", answer: "Users searching for Jasper alternatives often need marketing content. Crelavo expands that into campaign production assets." }
    ],
    relatedSlugs: ["adcreative-ai-alternative", "canva-alternative", "product-video-generator-alternative"]
  },
  {
    slug: "best-ai-production-studio-alternatives",
    competitor: "AI production studio tools",
    category: "AI production studio",
    title: "Best AI production studio alternatives",
    metaTitle: "Best AI Production Studio Alternatives for Video, Websites and Campaign Assets | Crelavo",
    metaDescription: "Explore the best AI production studio alternatives for websites, apps, product videos, ecommerce campaigns, ad creative and managed creative delivery.",
    h1: "Best AI production studio alternatives for video, websites, apps and campaign assets",
    summary: "This page captures users searching for the best AI production studio alternatives and routes them toward Crelavo's managed production paths for video, websites, apps, ecommerce campaigns and delivery-ready files.",
    bestFor: "teams that want a broader production studio instead of a single-purpose AI tool",
    competitorFit: "AI production studio tools often focus on one output type, editor, or workflow surface.",
    crelavoFit: "Crelavo combines campaign production, video, websites, apps, brand kits, ecommerce workflows and managed delivery in one system.",
    primaryKeyword: "best AI production studio alternatives",
    secondaryKeywords: ["AI production studio alternative", "managed AI production studio", "AI video website campaign studio", "ecommerce production studio alternative"],
    h2Sections: [
      { title: "What users expect from a production studio", body: "Visitors searching this phrase usually need more than a generator. They want campaign outputs, source files, page direction, revision support and a clean delivery path.", bullets: ["Product videos and ad assets", "Website and landing page production", "Source ZIP and README delivery"] },
      { title: "Why Crelavo fits this search intent", body: "Crelavo covers the broader workflow: request intake, campaign direction, production package selection, delivery notes and admin-supported handoff. That makes it a stronger fit than a narrow editor or single-purpose generator.", bullets: ["Campaign category routing", "Admin-assisted delivery flow", "Video, website and app outputs"] }
    ],
    comparison: commonComparison("AI production studio tools"),
    faq: [
      { question: "Is Crelavo only a video tool?", answer: "No. Crelavo is a wider production studio for video, websites, apps, ecommerce campaigns, visuals and delivery workflows." },
      { question: "Why use this page for SEO?", answer: "It captures high-intent visitors comparing production studio tools and sends them into a managed Crelavo request path." }
    ],
    relatedSlugs: ["canva-alternative", "runway-alternative", "product-video-generator-alternative"]
  }
];

export function getAlternativePage(slug: string) {
  return alternativePages.find((page) => page.slug === slug);
}

export function getRelatedAlternativePages(page: AlternativePage) {
  return page.relatedSlugs
    .map((slug) => getAlternativePage(slug))
    .filter((item): item is AlternativePage => Boolean(item));
}

export const alternativeHubKeywords = [
  "AI tool alternatives",
  "Canva alternative",
  "Runway alternative",
  "Synthesia alternative",
  "AI product video generator alternative",
  "AI website builder alternative",
  "ecommerce campaign generator alternative",
  "AI ad creative alternative",
  "best AI production studio alternatives"
];
