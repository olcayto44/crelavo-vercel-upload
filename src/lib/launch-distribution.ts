export const launchDistributionKeywords = [
  "AI tool launch plan",
  "SaaS launch distribution",
  "AI startup launch checklist",
  "Product Hunt launch",
  "AI directory submission",
  "organic traffic plan",
  "startup launch channels",
  "AI product launch",
  "SaaS directory listing",
  "community launch plan",
  "founder launch post",
  "launch UTM tracking"
];

export const launchDistributionChannels = [
  {
    channel: "AI directories",
    priority: "P1",
    keyword: "AI directory submission",
    timing: "Immediately after public pages are stable",
    primaryUrls: ["/", "/tools", "/categories", "/ai-video-generator", "/ai-product-video-generator", "/ai-website-builder"],
    copyAngle: "Crelavo as an AI production studio for video, websites, apps, ecommerce campaigns and AI + human QA delivery.",
    guardrail: "Manual submission only; use consistent product name, description and category tags."
  },
  {
    channel: "SaaS and startup directories",
    priority: "P1",
    keyword: "SaaS directory listing",
    timing: "After AI directories and sitemap/index checks",
    primaryUrls: ["/", "/alternatives", "/pricing", "/growth-intelligence", "/ai-website-builder", "/ai-app-builder"],
    copyAngle: "Crelavo helps founders and small teams launch websites, apps, product videos and campaign assets from one workspace.",
    guardrail: "Avoid overclaiming automation before provider/API phase is complete."
  },
  {
    channel: "Founder social posts",
    priority: "P1",
    keyword: "founder launch post",
    timing: "Weekly build-in-public cadence",
    primaryUrls: ["/", "/tools", "/free-tools", "/alternatives", "/blog/shopify-amazon-trendyol-ai-campaign-checklist"],
    copyAngle: "Show the practical build path: free tools, product-link video pages, alternatives SEO and creator sourcing.",
    guardrail: "Do not claim customer traction or revenue numbers without verified data."
  },
  {
    channel: "Ecommerce communities",
    priority: "P1",
    keyword: "ecommerce launch plan",
    timing: "After product-link pages and free tools are live",
    primaryUrls: ["/shopify-product-link-to-ad-video", "/amazon-product-ad-video", "/trendyol-product-video", "/chrome-extension", "/free-tools/ecommerce-ad-script-generator"],
    copyAngle: "Turn product pages into AI ad videos, hooks, captions and campaign assets.",
    guardrail: "Feedback-first posts only; avoid spam and avoid posting the same copy everywhere."
  },
  {
    channel: "Reddit and Indie communities",
    priority: "P2",
    keyword: "community launch plan",
    timing: "After site messaging is stable and support flow is ready",
    primaryUrls: ["/free-tools", "/ai-tool-launch-distribution-plan", "/alternatives", "/ai-product-video-generator"],
    copyAngle: "Ask for feedback on a narrow workflow instead of dropping a broad promotional pitch.",
    guardrail: "Read each community rule before posting; one useful post beats many promotional links."
  },
  {
    channel: "Product Hunt",
    priority: "P3",
    keyword: "Product Hunt launch",
    timing: "Only after final payment/onboarding validation",
    primaryUrls: ["/", "/tools", "/free-tools", "/showcase/explore-samples", "/pricing"],
    copyAngle: "Launch Crelavo as a multi-output AI production studio with free tools, examples and ecommerce workflows.",
    guardrail: "Wait until Whop/payment, onboarding and support paths are fully tested."
  },
  {
    channel: "Short-form social",
    priority: "P2",
    keyword: "short form launch",
    timing: "Ongoing after public samples are reviewed",
    primaryUrls: ["/samples/ugc-product-demo", "/samples/product-ad-skincare", "/ai-ugc-creator-program", "/free-tools/tiktok-hook-generator"],
    copyAngle: "Use sample pages, UGC demo angles and hook tools to create TikTok, Reels and Shorts content.",
    guardrail: "Manual publish only; no API auto-posting before social OAuth rules are ready."
  },
  {
    channel: "Pinterest and visual search",
    priority: "P2",
    keyword: "visual SEO traffic",
    timing: "After sample/showcase SEO blocks are live",
    primaryUrls: ["/showcase/explore-samples", "/samples/product-ad-skincare", "/samples/ugc-product-demo", "/ai-product-video-generator"],
    copyAngle: "Pin sample outputs, visual workflows and product video examples into niche boards.",
    guardrail: "Use original/owned visuals only; keep titles keyword-focused and avoid duplicate pins."
  }
];

export const launchCopyPack = {
  directoryOneLiner: "Crelavo is an AI production studio for websites, apps, product videos, ecommerce campaigns, brand kits and AI + human QA delivery.",
  linkedinPost: [
    "I’m building Crelavo as an AI production studio for teams that need more than one generator.",
    "The goal is to connect websites, apps, product videos, ecommerce campaigns, free tools, samples and delivery workflows in one place.",
    "The current focus is practical: Shopify product links to ad videos, Amazon product pages to campaign assets, Trendyol product videos, AI tool alternatives and free planning tools.",
    "If you sell online or build with AI tools, I’d love feedback on the workflow."
  ],
  xThread: [
    "1/ AI tools are powerful, but most teams still need a production workflow, not just a generator.",
    "2/ Crelavo combines video, website, app, ecommerce campaign, brand and delivery paths.",
    "3/ The ecommerce path starts from product pages: Shopify, Amazon, Trendyol or any product URL.",
    "4/ Free tools help prepare hooks, descriptions, ad scripts and SEO titles before production.",
    "5/ Samples and showcase pages make the workflow easier to understand before users start a request."
  ],
  communityPost: "I’m building an AI production workflow for turning product pages into videos, ad hooks and campaign assets. The first use case is ecommerce sellers who want a product-page-to-video path without writing a full creative brief. I’m looking for feedback on whether this workflow feels useful and what should be simplified first.",
  redditSafeTitle: "Feedback request: product page to AI video workflow for ecommerce sellers"
};

export const launchUtmTemplates = [
  { source: "linkedin", medium: "social", campaign: "ai_tool_launch", template: "?utm_source=linkedin&utm_medium=social&utm_campaign=ai_tool_launch" },
  { source: "x", medium: "social", campaign: "ai_tool_launch", template: "?utm_source=x&utm_medium=social&utm_campaign=ai_tool_launch" },
  { source: "reddit", medium: "community", campaign: "product_page_to_video", template: "?utm_source=reddit&utm_medium=community&utm_campaign=product_page_to_video" },
  { source: "directory", medium: "referral", campaign: "ai_directory_submission", template: "?utm_source=directory&utm_medium=referral&utm_campaign=ai_directory_submission" },
  { source: "newsletter", medium: "outreach", campaign: "ai_newsletter_outreach", template: "?utm_source=newsletter&utm_medium=outreach&utm_campaign=ai_newsletter_outreach" },
  { source: "pinterest", medium: "visual_search", campaign: "sample_seo", template: "?utm_source=pinterest&utm_medium=visual_search&utm_campaign=sample_seo" },
  { source: "producthunt", medium: "launch", campaign: "final_launch", template: "?utm_source=producthunt&utm_medium=launch&utm_campaign=final_launch" }
];

export const launchDistributionChecklist = [
  "Confirm sitemap includes core pages, alternatives, blog guides, free tools, samples and launch plan page.",
  "Use one primary URL per channel; do not blast every page in every community.",
  "Start with AI directories and SaaS listings before major launch platforms.",
  "Use feedback-first language for Reddit, Indie Hackers and ecommerce communities.",
  "Track every external post with source, medium and campaign UTM parameters.",
  "Keep Product Hunt and Hacker News for the final Whop/payment-verified launch window.",
  "Review Google/Bing/Yandex indexing after each major content deploy."
];

export const launchDistributionUrlPacks = [
  {
    name: "AI tool directory pack",
    urls: ["/", "/tools", "/categories", "/ai-video-generator", "/ai-website-builder", "/ai-product-video-generator", "/free-tools"]
  },
  {
    name: "Ecommerce community pack",
    urls: ["/shopify-product-link-to-ad-video", "/amazon-product-ad-video", "/trendyol-product-video", "/chrome-extension", "/free-tools/ecommerce-ad-script-generator"]
  },
  {
    name: "Founder/startup pack",
    urls: ["/ai-website-builder", "/ai-app-builder", "/alternatives", "/free-tools", "/growth-intelligence", "/ai-tool-launch-distribution-plan"]
  },
  {
    name: "Visual/sample traffic pack",
    urls: ["/showcase/explore-samples", "/samples/product-ad-skincare", "/samples/ugc-product-demo", "/ai-ugc-creator-program", "/free-tools/tiktok-hook-generator"]
  }
];
