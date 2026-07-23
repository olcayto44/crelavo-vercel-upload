export type FreeTool = {
  slug: string;
  title: string;
  turkishTitle: string;
  keyword: string;
  description: string;
  category: string;
  placeholder: string;
  sampleOutputs: string[];
  assistantHref: string;
};

export const freeTools: FreeTool[] = [
  {
    slug: "tiktok-hook-generator",
    title: "TikTok Hook Generator",
    turkishTitle: "TikTok Kanca Üretici",
    keyword: "TikTok Hook Generator",
    category: "Video and social",
    description: "Generate scroll-stopping TikTok hook ideas for products, apps, services and launch campaigns.",
    placeholder: "Describe your product, offer or video topic",
    sampleOutputs: ["Nobody talks about this simple way to launch faster...", "I tested this product so you do not have to...", "If you sell online, this one change can save hours..."],
    assistantHref: "/dashboard/assistant-workspace?mode=social&category=social&idea=TikTok%20Hook%20Generator"
  },
  {
    slug: "ai-prompt-generator",
    title: "AI Prompt Generator",
    turkishTitle: "Yapay Zeka Prompt Üretici",
    keyword: "AI Prompt Generator",
    category: "Prompt and planning",
    description: "Turn a rough idea into a clearer AI prompt for video, website, app, image or campaign production.",
    placeholder: "Write the thing you want AI to create",
    sampleOutputs: ["Create a clean landing page hero for...", "Generate a short product video script showing...", "Design a premium brand visual direction for..."],
    assistantHref: "/dashboard/assistant-workspace?idea=AI%20Prompt%20Generator"
  },
  {
    slug: "product-description-generator",
    title: "Product Description Generator",
    turkishTitle: "Ürün Açıklaması Üretici",
    keyword: "Product Description Generator",
    category: "Ecommerce",
    description: "Write benefit-focused product descriptions for ecommerce pages, ads and marketplace listings.",
    placeholder: "Paste product name, features and target buyer",
    sampleOutputs: ["A benefit-led product description with proof points", "A short marketplace listing description", "A premium product page paragraph"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=ecommerce&idea=Product%20Description%20Generator"
  },
  {
    slug: "youtube-title-generator",
    title: "YouTube Title Generator",
    turkishTitle: "YouTube Başlık Üretici",
    keyword: "YouTube Title Generator",
    category: "Video and social",
    description: "Create clickable YouTube titles for tutorials, product videos, Shorts and launch content.",
    placeholder: "Describe your video topic",
    sampleOutputs: ["I Built This in 60 Seconds With AI", "The Fastest Way to Launch a Product Page", "Before You Buy This Tool, Watch This"],
    assistantHref: "/dashboard/assistant-workspace?mode=media&category=video&idea=YouTube%20Title%20Generator"
  },
  {
    slug: "instagram-caption-generator",
    title: "Instagram Caption Generator",
    turkishTitle: "Instagram Açıklama Üretici",
    keyword: "Instagram Caption Generator",
    category: "Social media",
    description: "Generate Instagram captions for launches, products, services, reels and creator posts.",
    placeholder: "Describe the post or campaign",
    sampleOutputs: ["Short caption with CTA", "Storytelling caption with benefit", "Launch caption with hashtags"],
    assistantHref: "/dashboard/assistant-workspace?mode=social&category=social&idea=Instagram%20Caption%20Generator"
  },
  {
    slug: "hashtag-generator",
    title: "Hashtag Generator",
    turkishTitle: "Hashtag Üretici",
    keyword: "Hashtag Generator",
    category: "Social media",
    description: "Create hashtag sets for TikTok, Instagram, YouTube Shorts and product campaigns.",
    placeholder: "Enter your niche, product or campaign",
    sampleOutputs: ["#aistartup #productlaunch #smallbusiness", "#ecommercebrand #tiktokads #aitools", "#contentcreator #launchstrategy #digitalproduct"],
    assistantHref: "/dashboard/assistant-workspace?mode=social&category=social&idea=Hashtag%20Generator"
  },
  {
    slug: "business-name-generator",
    title: "Business Name Generator",
    turkishTitle: "İşletme İsmi Üretici",
    keyword: "Business Name Generator",
    category: "Branding",
    description: "Generate brand, startup, store and product name ideas with positioning notes.",
    placeholder: "Describe the business or product",
    sampleOutputs: ["Short modern name ideas", "Premium brand name ideas", "Descriptive ecommerce store names"],
    assistantHref: "/dashboard/assistant-workspace?idea=Business%20Name%20Generator"
  },
  {
    slug: "landing-page-copy-generator",
    title: "Landing Page Copy Generator",
    turkishTitle: "Landing Page Metni Üretici",
    keyword: "Landing Page Copy Generator",
    category: "Website",
    description: "Generate hero copy, sections, benefits and CTA ideas for landing pages and websites.",
    placeholder: "Describe your product, audience and offer",
    sampleOutputs: ["Hero headline + subheadline", "Benefit section outline", "CTA and proof section ideas"],
    assistantHref: "/dashboard/assistant-workspace?mode=project&category=website&idea=Landing%20Page%20Copy%20Generator"
  },
  {
    slug: "ad-copy-generator",
    title: "Ad Copy Generator",
    turkishTitle: "Reklam Metni Üretici",
    keyword: "Ad Copy Generator",
    category: "Advertising",
    description: "Generate short ad copy variants for products, SaaS, apps, ecommerce and campaigns.",
    placeholder: "Describe your product and target customer",
    sampleOutputs: ["Problem-solution ad copy", "Direct response ad copy", "Short social ad copy"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Ad%20Copy%20Generator"
  },
  {
    slug: "ecommerce-ad-script-generator",
    title: "Free AI E-Commerce Ad Script Writer",
    turkishTitle: "Ücretsiz E-Ticaret Reklam Senaryosu Üretici",
    keyword: "AI E-Commerce Ad Script Writer",
    category: "Ecommerce video ads",
    description: "Paste a Shopify, Amazon or Trendyol product link or product notes and generate TikTok, Reels and Shorts ad script angles before turning the best script into a Crelavo AI video workflow.",
    placeholder: "Paste a Shopify, Amazon or Trendyol product link, or describe the product, offer and buyer",
    sampleOutputs: ["Hook + product problem + proof + CTA script", "UGC-style product demo script", "TikTok/Reels short ad angle with conversion CTA"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=video&idea=Ecommerce%20Ad%20Script%20Generator"
  },
  {
    slug: "review-to-ad-script-generator",
    title: "Free AI Review-to-Ad Script Generator",
    turkishTitle: "Ücretsiz Yorumdan Reklam Senaryosu Üretici",
    keyword: "Review to Ad Script Generator",
    category: "Social proof ads",
    description: "Turn approved customer reviews, testimonials or product feedback into UGC-style TikTok, Reels and Shorts ad scripts for ecommerce campaigns.",
    placeholder: "Paste an approved customer review, product name, buyer pain point and target platform",
    sampleOutputs: ["Customer review hook + product proof + CTA", "UGC testimonial ad script", "Social proof video brief for ecommerce"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=video&idea=Review%20to%20Ad%20Script%20Generator"
  },
  {
    slug: "ad-reference-analyzer",
    title: "Free AI Ad Reference Analyzer",
    turkishTitle: "Ücretsiz Reklam Referans Analiz Aracı",
    keyword: "AI Ad Reference Analyzer",
    category: "Ad structure analysis",
    description: "Paste a winning ad reference, competitor ad notes or product video script and extract the hook, pacing, scene structure, CTA and safe rewrite direction without reusing copyrighted footage, music, logos or exact copy.",
    placeholder: "Paste a reference ad link, transcript, competitor ad notes or describe the video structure you want to analyze",
    sampleOutputs: ["Winning structure blueprint: hook, scene order, proof point and CTA", "Copyright-safe rewrite direction for your product", "Localization-ready ad variation plan"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Ad%20Reference%20Analyzer"
  },
  {
    slug: "ad-performance-score-checker",
    title: "Free AI Ad Performance Score Checker",
    turkishTitle: "Ücretsiz Reklam Performans Skoru Kontrolü",
    keyword: "AI Ad Performance Score Checker",
    category: "Ad performance",
    description: "Score a product ad script, hook or campaign idea for first-three-second strength, CTA clarity, platform fit and conversion potential before spending budget or production credits.",
    placeholder: "Paste your ad script, hook, product offer or video idea",
    sampleOutputs: ["Hook score with improvement notes", "CTA clarity and platform fit score", "Ad performance checklist before production"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=campaign&idea=Ad%20Performance%20Score%20Checker"
  },
  {
    slug: "tiktok-ad-script-generator",
    title: "TikTok Ad Script Generator",
    turkishTitle: "TikTok Reklam Senaryosu Üretici",
    keyword: "TikTok Ad Script Generator",
    category: "Video and ads",
    description: "Create short TikTok ad scripts with hook, product proof, benefit and CTA structure.",
    placeholder: "Describe the product and offer",
    sampleOutputs: ["5-second hook + 20-second demo", "UGC style product script", "Problem-solution TikTok ad script"],
    assistantHref: "/dashboard/assistant-workspace?mode=media&category=video&idea=TikTok%20Ad%20Script%20Generator"
  },
  {
    slug: "youtube-shorts-script-generator",
    title: "YouTube Shorts Script Generator",
    turkishTitle: "YouTube Shorts Senaryo Üretici",
    keyword: "YouTube Shorts Script Generator",
    category: "Video and social",
    description: "Generate short-form scripts for YouTube Shorts, product demos and educational clips.",
    placeholder: "Describe the short video topic",
    sampleOutputs: ["Hook + 3 beats + CTA", "Educational short script", "Product teaser script"],
    assistantHref: "/dashboard/assistant-workspace?mode=media&category=video&idea=YouTube%20Shorts%20Script%20Generator"
  },
  {
    slug: "ecommerce-product-idea-generator",
    title: "Ecommerce Product Idea Generator",
    turkishTitle: "E-Ticaret Ürün Fikri Üretici",
    keyword: "Ecommerce Product Idea Generator",
    category: "Ecommerce",
    description: "Generate ecommerce product ideas, angles and campaign directions for stores and creators.",
    placeholder: "Enter niche, audience or trend",
    sampleOutputs: ["Product idea with buyer angle", "Store concept idea", "Product ad direction"],
    assistantHref: "/dashboard/assistant-workspace?mode=commerce&category=ecommerce&idea=Ecommerce%20Product%20Idea%20Generator"
  },
  {
    slug: "startup-idea-generator",
    title: "Startup Idea Generator",
    turkishTitle: "Startup Fikri Üretici",
    keyword: "Startup Idea Generator",
    category: "Startup",
    description: "Generate startup, SaaS and app ideas with target user, value proposition and MVP direction.",
    placeholder: "Enter industry, audience or problem",
    sampleOutputs: ["SaaS MVP idea", "App concept with user problem", "B2B startup angle"],
    assistantHref: "/dashboard/assistant-workspace?mode=project&category=app&idea=Startup%20Idea%20Generator"
  },
  {
    slug: "seo-meta-title-generator",
    title: "SEO Meta Title Generator",
    turkishTitle: "SEO Meta Başlık Üretici",
    keyword: "SEO Meta Title Generator",
    category: "SEO",
    description: "Generate SEO-friendly meta title ideas for service pages, products, tools and blog posts.",
    placeholder: "Enter page topic and keyword",
    sampleOutputs: ["Keyword-focused title", "Benefit-led meta title", "Tool page SEO title"],
    assistantHref: "/dashboard/assistant-workspace?idea=SEO%20Meta%20Title%20Generator"
  },
  {
    slug: "brand-slogan-generator",
    title: "Brand Slogan Generator",
    turkishTitle: "Marka Sloganı Üretici",
    keyword: "Brand Slogan Generator",
    category: "Branding",
    description: "Generate slogan and tagline ideas for brands, products, startups and campaigns.",
    placeholder: "Describe your brand and promise",
    sampleOutputs: ["Short brand slogan", "Premium campaign tagline", "Clear product promise"],
    assistantHref: "/dashboard/assistant-workspace?idea=Brand%20Slogan%20Generator"
  }
];

export const freeToolMap = new Map(freeTools.map((tool) => [tool.slug, tool]));
