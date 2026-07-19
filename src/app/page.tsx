import { Boxes, Clapperboard, Grid3X3, Image, Layers3, MonitorPlay, Plane, RadioTower, Sparkles, Wand2 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { FaqSection } from "@/components/FaqSection";
import { FaqStructuredData } from "@/components/FaqStructuredData";
import { CampaignPromoSlot } from "@/components/CampaignPromoSlot";
import { HardReloadLink } from "@/components/HardReloadLink";
import { Header } from "@/components/Header";
import { HomeShowcaseSlider, type HomeShowcaseSlide } from "@/components/HomeShowcaseSlider";
import { SampleVideoGallery } from "@/components/SampleVideoGallery";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { SplashAd } from "@/components/SplashAd";
import { phaseOneFeaturePages } from "@/lib/feature-phase-one";
import { getConfiguredSampleVideos } from "@/lib/sample-video-config";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { categoryShowcaseItems, featureShowcaseItems } from "@/lib/showcase-items";

const platformHighlights = [
  "Campaigns",
  "AI Agents",
  "Video & MV",
  "Web / App / SaaS",
  "Brand & Files"
];

const homepageGoalWizard = [
  {
    title: "I want to sell my product internationally",
    description: "Localize product ads, hooks, visuals and campaign direction for another country.",
    cta: "Start global campaign",
    href: "/dashboard/assistant-workspace?idea=I%20want%20to%20sell%20my%20product%20internationally&category=cultural_localization&mode=media",
    badge: "Recommended for global sellers",
    step: "01"
  },
  {
    title: "I want to test my existing ad",
    description: "Use the free AI Ad Scorer to find hook, CTA, proof and conversion weaknesses before spending more budget.",
    cta: "Score my ad free",
    href: "/free-tools/ad-performance-score-checker",
    badge: "Fastest free entry",
    step: "02"
  },
  {
    title: "I want to create from scratch",
    description: "Create a product video, website, landing page, campaign pack, virtual model visual or launch asset from one brief.",
    cta: "Start from scratch",
    href: "/dashboard/assistant-workspace?idea=I%20want%20to%20create%20from%20scratch&mode=media",
    badge: "Best for new ideas",
    step: "03"
  }
];

const appLauncherSlides: HomeShowcaseSlide[] = [
  { title: "Explore", kicker: "Samples", description: "Browse large sample outputs and open dedicated detail pages.", href: "/showcase/explore-samples", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192157407622951-1783192157402.png" },
  { title: "Assets", kicker: "Materials", description: "Use images, videos, audio references and documents across productions.", href: "/showcase/assets-library", tone: "green", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192199380895416-1783192199376.png" },
  { title: "Omni", kicker: "Assistant", description: "Tell Crelavo what you want to create and let the system route the workflow.", href: "/showcase/omni-assistant", tone: "blue", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192218134042523-1783192218131.png" },
  { title: "Generate", kicker: "Create", description: "Start video, web, app, brand file or visual production from one hub.", href: "/dashboard/assistant-workspace", tone: "pink", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192231039044746-1783192231031.png" },
  { title: "Workspace", kicker: "Live tracking", description: "Track live productions, revisions, outputs and final delivery packages.", href: "/showcase/live-workspace", tone: "amber", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192247858193551-1783192247854.png" },
  { title: "Drone", kicker: "Aerial style", description: "Plan AI map/location drone-style videos and future aerial production workflows from Crelavo.", href: "/showcase/drone-aerial-video", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192231039044746-1783192231031.png" },
  { title: "All Tools", kicker: "Catalog", description: "Open the full tool catalog and choose the right production entry.", href: "/tools", tone: "purple", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192261949279707-1783192261944.png" }
];

const featuredTools = [
  { title: "AI Video Generator", href: "/tools/ai-video-generator", icon: Clapperboard },
  { title: "AI Avatar Video Studio", href: "/tools/talking-video", icon: MonitorPlay },
  { title: "Drone Shoot", href: "/drone-credits", icon: Plane },
  { title: "Avatar Live Stream", href: "/live-sales-credits", icon: RadioTower },
  { title: "Image & Visual Pack", href: "/tools/image-visual-pack", icon: Image },
  { title: "Website Builder", href: "/tools/website-builder", icon: Wand2 },
  { title: "SaaS / App Builder", href: "/tools/saas-app-builder", icon: Layers3 },
  { title: "Brand & Files", href: "/tools/brand-files", icon: Boxes }
];

const featurePreviewVideos = [
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200420847185558-1783200420793.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200446193878757-1783200446163.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200475974783117-1783200475940.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200506566226583-1783200506537.mp4"
];

function featurePreviewVideo(slug: string) {
  const index = Math.abs(Array.from(slug).reduce((total, char) => total + char.charCodeAt(0), 0)) % featurePreviewVideos.length;
  return featurePreviewVideos[index];
}

const homeFeaturePathCopy: Record<string, { title: string; description: string; tags: string[] }> = {
  "ai-ad-performance-score-checker": {
    title: "AI Ad Performance Score Checker for TikTok, Meta and ecommerce ads",
    description: "Score hooks, CTA clarity, first-three-second strength, offer angle and product video readiness before spending credits on full campaign production.",
    tags: ["ad score", "TikTok hooks", "ROAS signals"]
  },
  "ai-virtual-model-studio": {
    title: "AI Virtual Model Studio for fashion, jewelry and product catalog visuals",
    description: "Create model-style ecommerce image packs for apparel, accessories, jewelry and beauty products without planning a full photo shoot first.",
    tags: ["AI model photos", "fashion visuals", "catalog images"]
  },
  "ai-cultural-localization": {
    title: "AI Cultural Localization for cross-border ecommerce campaign creative",
    description: "Adapt product hooks, claims, CTA, buyer psychology and video brief direction for country-specific markets instead of only translating copy.",
    tags: ["global ads", "localization brief", "country fit"]
  },
  "ai-campaign-calendar": {
    title: "AI Campaign Calendar for seasonal ecommerce launches and ad planning",
    description: "Plan Black Friday, Ramadan/Eid, Valentine’s Day, summer sale and product launch creative before production deadlines arrive.",
    tags: ["campaign calendar", "seasonal ads", "launch planning"]
  },
  "crelavo-academy": {
    title: "Crelavo Academy for AI product video, UGC ads and ecommerce marketing",
    description: "Learn product video workflows, hook strategy, UGC ad planning and credit-based production paths before starting an expert-reviewed Crelavo request.",
    tags: ["AI marketing course", "UGC lessons", "video workflow"]
  },
  "community-showcase": {
    title: "Community Showcase for AI ad examples, ecommerce videos and reusable styles",
    description: "Browse example-style proof, then turn approved ad, UGC, product video or website references into a similar Crelavo production request.",
    tags: ["AI ad examples", "showcase proof", "reuse style"]
  }
};

const seoNicheLinks = [
  { title: "AI Product Video Generator", href: "/ai-product-video-generator", description: "Product links, ad scripts, previews and final video delivery." },
  { title: "Shopify Product Link to Ad Video", href: "/shopify-product-link-to-ad-video", description: "Turn Shopify product URLs into short-form ad video workflows." },
  { title: "Amazon Product Ad Video", href: "/amazon-product-ad-video", description: "Marketplace product angles, scripts and video delivery planning." },
  { title: "Trendyol Product Video", href: "/trendyol-product-video", description: "Localized product video workflows for Turkish ecommerce sellers." },
  { title: "TikTok Shop AI Live Sales Agent", href: "/tiktok-shop-ai-live-sales-agent", description: "Live commerce scripts, safe claims and fair-use service plans." },
  { title: "AI Ecommerce Campaign Generator", href: "/ai-ecommerce-campaign-generator", description: "Product-link campaigns with video, copy, landing page and asset direction." },
  { title: "Brand Memory & Brand Voice Hub", href: "/brand-memory", description: "Save brand voice, logos, colors and campaign rules for repeat production." },
  { title: "AI Hook & UGC Generator", href: "/ai-hook-generator", description: "Create multiple first-three-second hooks and UGC angles for ad testing." },
  { title: "AI Marketplace Localization Studio", href: "/ai-marketplace-localization", description: "Adapt listings, ad scripts and marketplace copy for global ecommerce." },
  { title: "Competitor Ad Analyzer", href: "/competitor-ad-analyzer", description: "Analyze public ad structure and create an original campaign response." },
  { title: "AI Ad Performance Score Checker", href: "/ai-ad-performance-score-checker", description: "Score hooks, CTA clarity and creative weaknesses before launching paid production." },
  { title: "AI Virtual Model Studio", href: "/ai-virtual-model-studio", description: "Create model-style ecommerce visuals for fashion, jewelry, beauty and catalog campaigns." },
  { title: "AI Cultural Localization", href: "/ai-cultural-localization", description: "Adapt hooks, scripts, CTA and buyer psychology for country-specific markets." },
  { title: "AI Campaign Calendar", href: "/ai-campaign-calendar", description: "Plan seasonal launches, holiday campaigns and production-ready ecommerce asset packs." },
  { title: "Crelavo Academy", href: "/crelavo-academy", description: "Learn AI product video, UGC ad and ecommerce workflows before starting production." },
  { title: "Community Showcase", href: "/community-showcase", description: "Use approved AI ad, product video and website examples as reusable production directions." }
];

type ShowcaseSection = "launcher" | "features" | "categories";

function slidesForSection(slides: (HomeShowcaseSlide & { section?: ShowcaseSection; order?: number; active?: boolean })[], section: ShowcaseSection, fallback: HomeShowcaseSlide[]) {
  const configured = slides
    .filter((slide) => slide.section === section && slide.active)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return configured.length ? configured : fallback;
}


export default async function HomePage() {
  const [configuredSampleVideos, siteContent] = await Promise.all([
    getConfiguredSampleVideos(),
    getConfiguredSiteContentConfig()
  ]);

  return (
    <>
      <FaqStructuredData />
      <SiteStructuredData />
      <SplashAd />
      <Header navLinks={siteContent.navLinks} />
      <main>
        <div className="page-with-rails">
          <aside className="ad-rail ad-rail-left"><AdSlot slotId="left-rail" /></aside>
          <aside className="ad-rail ad-rail-right"><AdSlot slotId="right-rail" /></aside>
          <section className="container section home-section-tight clean-feed-section home-platform-hero">
            <div>
            <span className="badge"><Sparkles size={16} /> Crelavo — AI production studio for websites, apps, e-commerce and campaigns</span>
            <h1>Launch websites, apps and product campaigns from one AI production studio.</h1>
            <p>
              Turn ideas, briefs, Shopify, Amazon or Trendyol product links into AI + human QA reviewed websites, mobile apps, e-commerce assets, ad videos, visuals, voice-over content and campaign-ready delivery packages.
            </p>
            <div className="home-highlight-row">
              {platformHighlights.map((item, index) => <span key={item}>{index > 0 ? " • " : ""}{item}</span>)}
            </div>
            </div>
            <div className="promo-corner-slot"><CampaignPromoSlot /></div>
          </section>

          <section className="container section home-section-tight clean-feed-section home-goal-wizard" aria-labelledby="home-goal-wizard-heading">
            <div className="sample-video-head home-goal-wizard-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Start with your goal</span>
                <h2 id="home-goal-wizard-heading">What do you want Crelavo to do first?</h2>
                <p className="section-lead">Skip the category maze. Pick one outcome and Omni Assistant will open the right production path instantly.</p>
              </div>
              <span className="badge home-goal-qa-badge">AI speed + human quality assurance</span>
            </div>
            <div className="home-goal-wizard-grid">
              {homepageGoalWizard.map((goal, index) => (
                <HardReloadLink className={`home-goal-card home-goal-card-${index + 1}`} href={goal.href} key={goal.title}>
                  <span className="home-goal-step">{goal.step}</span>
                  <span className="badge">{goal.badge}</span>
                  <h3>{goal.title}</h3>
                  <p>{goal.description}</p>
                  <span className="home-goal-cta">{goal.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

        <HomeShowcaseSlider title="Explore Crelavo" subtitle="A large moving entry showcase for samples, assets, Omni Assistant, generation, workspace tracking and the full tool catalog." slides={slidesForSection(siteContent.showcaseSlides, "launcher", appLauncherSlides)} />

        <HomeShowcaseSlider title="Seedance, Canvas and production features" subtitle="A Kling-style moving showcase for Crelavo's AI engines, workspace and asset flow. Every slide has a different visual feel and feature." slides={slidesForSection(siteContent.showcaseSlides, "features", featureShowcaseItems)} />

        <section className="container section home-section-tight clean-feed-section">
          <div className="sample-video-head">
            <div>
              <span className="badge"><Sparkles size={15} /> Popular production paths</span>
              <h2>Product-link video, brand memory, localization and ad growth workflows</h2>
              <p className="section-lead">Start from the most searched commercial use cases: product videos, marketplace localization, brand memory, hook testing, competitor ad analysis and AI ecommerce campaigns.</p>
            </div>
            <HardReloadLink className="btn secondary" href="/pricing">Compare pricing</HardReloadLink>
          </div>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {seoNicheLinks.map((item, index) => (
              <HardReloadLink className={`card admin-category-card tools-tone-${index % 5}`} href={item.href} key={item.href}>
                <span className="badge">{index >= 10 ? "New feature" : "Popular solution"}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <span className="text-link">Explore solution</span>
              </HardReloadLink>
            ))}
          </div>
        </section>

        <section className="container section home-section-tight clean-feed-section" aria-labelledby="new-feature-paths-heading">
          <div className="sample-video-head">
            <div>
              <span className="badge"><Sparkles size={15} /> New Crelavo feature paths</span>
              <h2 id="new-feature-paths-heading">AI ad scoring, virtual model visuals, cultural localization and campaign planning tools for ecommerce teams</h2>
              <p className="section-lead">Use these niche Crelavo entry points to validate ad ideas, prepare market-specific creative, plan seasonal campaigns and turn examples into credit-based production requests.</p>
            </div>
            <HardReloadLink className="btn secondary" href="/tools">See all feature tools</HardReloadLink>
          </div>
          <div className="admin-category-grid" style={{ marginTop: 16 }}>
            {phaseOneFeaturePages.map((page) => {
              const featureCopy = homeFeaturePathCopy[page.slug] ?? { title: page.title, description: page.summary, tags: [page.primaryKeyword] };
              return (
                <div className="card admin-category-card production-pricing-card" key={page.slug}>
                  <div className="sample-video-preview sample-video-preview-cinematic" aria-label={`${page.title} preview`}>
                    <video className="sample-card-video" src={featurePreviewVideo(page.slug)} muted loop playsInline preload="none" />
                    <small>{page.badge}</small>
                    <strong>Preview</strong>
                  </div>
                  <span className="badge">{page.primaryKeyword}</span>
                  <h3>{featureCopy.title}</h3>
                  <p>{featureCopy.description}</p>
                  <div className="category-option-row" aria-label={`${page.title} SEO tags`}>
                    {featureCopy.tags.map((tag) => <small key={`${page.slug}-${tag}`}>{tag}</small>)}
                  </div>
                  <HardReloadLink className="btn" href="/dashboard/credits">Paketi oluştur</HardReloadLink>
                  <HardReloadLink className="btn secondary" href={`/${page.slug}`}>Sayfayı incele</HardReloadLink>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container section home-section-tight home-tool-strip-section">
          <div className="sample-video-head">
            <div>
              <span className="badge"><Grid3X3 size={15} /> All Tools</span>
              <h2>Choose a tool or let Omni Assistant decide</h2>
              <p className="section-lead">Start from video, visuals, websites, SaaS, apps, brand kits or production packages. Crelavo routes the request into the right assistant workflow.</p>
            </div>
            <HardReloadLink className="btn secondary" href="/tools">Open all tools</HardReloadLink>
          </div>
          <div className="home-tool-strip-grid">
            {featuredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <HardReloadLink className="home-tool-pill" href={tool.href} key={tool.title}>
                  <Icon size={18} />
                  <span>{tool.title}</span>
                </HardReloadLink>
              );
            })}
          </div>
        </section>

        <section className="container section home-section-tight clean-feed-section">
          <div className="sample-video-head">
            <div>
              <span className="badge"><Sparkles size={15} /> Affiliate Program</span>
              <h2>Earn recurring commission by promoting Crelavo</h2>
              <p className="section-lead">Creators, agencies and growth partners can apply for early affiliate access. Growth Intelligence, Live Sales and production packages create higher-ticket referral opportunities than normal credit top-ups.</p>
            </div>
            <HardReloadLink className="btn" href="/affiliate">Open affiliate page</HardReloadLink>
          </div>
          <div className="admin-info-grid" style={{ marginTop: 14 }}>
            <div><span>Launch commission</span><strong>15-30%</strong><small>30-day attribution, 30-day hold and $50 minimum payout</small></div>
            <div><span>High-ticket offer</span><strong>Growth Intelligence</strong><small>$179, $499 and $1,999 monthly service plans</small></div>
            <div><span>Best channels</span><strong>TikTok + YouTube Shorts</strong><small>AI tools, ecommerce, no-code and agency content</small></div>
            <div><span>Partner dashboard</span><strong>Prepared</strong><small>Whop + manual ledger; no commission on refunded/cancelled sales</small></div>
          </div>
        </section>

        <HomeShowcaseSlider title="Crelavo production categories" subtitle="A second moving showcase for video, web, apps, avatars, brand files, e-commerce, music videos and animation with optional uploaded image/voice or selected/generated character and voice." slides={slidesForSection(siteContent.showcaseSlides, "categories", categoryShowcaseItems)} reverse />

<section id="sample-outputs" className="container section home-section-tight clean-feed-section top-sample-section">
  <SampleVideoGallery title="Explore sample outputs" subtitle="Large Kling-style cards open a dedicated sample page. Details, features and create actions appear after clicking the card." videos={configuredSampleVideos} shuffleOnLoad />
</section>
        <FaqSection />
        <AdSlot slotId="footer" />
        </div>
      </main>
    </>
  );
}
