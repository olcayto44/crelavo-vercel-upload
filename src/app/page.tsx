import type { Metadata } from "next";
import { Clapperboard, Grid3X3, Plane, Sparkles, Wand2 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { FaqSection } from "@/components/FaqSection";
import { FaqStructuredData } from "@/components/FaqStructuredData";
import { CrelavoPremiumHero } from "@/components/CrelavoPremiumHero";
import { HardReloadLink } from "@/components/HardReloadLink";
import { Header } from "@/components/Header";
import { HomeShowcaseSlider, type HomeShowcaseSlide } from "@/components/HomeShowcaseSlider";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { SplashAd } from "@/components/SplashAd";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { caseStudyProofs, socialProofMetrics, testimonialProofs, trustedProofSlots } from "@/lib/social-proof";

export const metadata: Metadata = {
  title: "Crelavo AI Production Platform for Ecommerce Ads, Product Videos and Campaigns",
  description: "Start with free AI ad scoring, test Crelavo with a $10 or $20 preview, then scale ecommerce product videos, UGC ads, landing pages and campaign assets with credits.",
  keywords: ["AI product video generator", "AI ad scorer", "ecommerce video ads", "Shopify product video", "Amazon product video", "UGC ad scripts", "AI campaign generator"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Crelavo AI Production Platform for Ecommerce Ads and Product Videos",
    description: "Score ads free, test a preview, then scale product videos, UGC ads and ecommerce campaign assets.",
    url: "/",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Crelavo AI Production Platform",
    description: "Free ad scoring, low-risk preview checkout and credit-based AI production for ecommerce teams."
  }
};

const homepageGoalWizard = [
  {
    title: "I want to sell my product internationally",
    description: "Localize product ads, hooks, visuals and campaign direction for another country.",
    cta: "Start global campaign",
    href: "/dashboard/create?idea=I%20want%20to%20sell%20my%20product%20internationally&category=cultural_localization&mode=media",
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
    href: "/dashboard/create?idea=I%20want%20to%20create%20from%20scratch&mode=media",
    badge: "Best for new ideas",
    step: "03"
  }
];

const appLauncherSlides: HomeShowcaseSlide[] = [
  { title: "Explore", kicker: "Samples", description: "Browse large sample outputs and open dedicated detail pages.", href: "/showcase/explore-samples", tone: "cyan", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192157407622951-1783192157402.png" },
  { title: "Assets", kicker: "Materials", description: "Use images, videos, audio references and documents across productions.", href: "/showcase/assets-library", tone: "green", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192199380895416-1783192199376.png" },
  { title: "Omni", kicker: "Assistant", description: "Tell Crelavo what you want to create and let the system route the workflow.", href: "/showcase/omni-assistant", tone: "blue", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192218134042523-1783192218131.png" },
  { title: "Generate", kicker: "Create", description: "Start video, web, app, brand file or visual production from one hub.", href: "/dashboard/create", tone: "pink", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192231039044746-1783192231031.png" },
  { title: "Workspace", kicker: "Live tracking", description: "Track live productions, revisions, outputs and final delivery packages.", href: "/showcase/live-workspace", tone: "amber", imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-07-05-03/image/1783192247858193551-1783192247854.png" }
];

const featuredTools = [
  { title: "Product Video Workflow", href: "/ai-product-video-generator", icon: Clapperboard },
  { title: "Free Ad Scorer", href: "/free-tools/ad-performance-score-checker", icon: Sparkles },
  { title: "Localization Brief", href: "/ai-cultural-localization", icon: Plane },
  { title: "Website / App Assets", href: "/ai-website-builder", icon: Wand2 },
  { title: "Full Tools Catalog", href: "/tools", icon: Grid3X3 }
];

const paidGrowthFunnelCards = [
  {
    badge: "Free tool entry",
    title: "Score your ad before buying production credits",
    description: "Use the free AI Ad Scorer to find weak hooks, CTA gaps and proof problems before moving into the $10 Business preview or $20 Team preview.",
    href: "/free-tools/ad-performance-score-checker",
    cta: "Run the free ad score"
  },
  {
    badge: "Meta Sales hook",
    title: "$20 Team Annual preview for agencies",
    description: "For Shopify, Amazon FBA and WooCommerce teams: test the Team Annual workflow for 24 hours before the $1,300 yearly plan continues.",
    href: "/dashboard/payment?package=team&billing=yearly&campaign=team-annual-174000",
    cta: "Start $20 team preview"
  },
  {
    badge: "Business launch offer",
    title: "$79 Business now includes 12,000 credits",
    description: "A lower-risk monthly path for small brands that want to generate product ad drafts, social variations and campaign assets before scaling up.",
    href: "/dashboard/payment?package=business&billing=monthly&campaign=business-12000",
    cta: "Start $10 business preview"
  }
];

const lightweightHomeCards = [
  {
    badge: "Free entry",
    title: "Score an ad before spending credits",
    description: "Use the free AI Ad Scorer as the fastest low-friction starting point.",
    href: "/free-tools/ad-performance-score-checker",
    cta: "Open free scorer"
  },
  {
    badge: "Pricing clarity",
    title: "Estimate credits before production",
    description: "See simple credit examples for videos, campaigns and starter packages.",
    href: "/pricing",
    cta: "View pricing"
  },
  {
    badge: "Production paths",
    title: "Browse tools without crowding the homepage",
    description: "Open the full tool catalog for video, image, voice, web, app and campaign workflows.",
    href: "/tools",
    cta: "Open tools"
  }
];

const homeDeliveryTrust = [
  {
    badge: "1",
    title: "Start with one clear brief",
    description: "Choose a goal, paste a product link or describe the asset you need. Crelavo keeps the request focused before production starts."
  },
  {
    badge: "2",
    title: "Review scope before credits move",
    description: "Credit estimates, format choices and delivery expectations are shown before the final production reserve is confirmed."
  },
  {
    badge: "3",
    title: "Receive dashboard delivery",
    description: "Outputs are organized as preview links, final downloads, source files, README notes or revision-ready delivery packages."
  }
];

export default async function HomePage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <FaqStructuredData />
      <SiteStructuredData />
      <SplashAd />
      <Header navLinks={siteContent.navLinks} />
      <main className="public-funnel-page public-home-page">
        <div className="page-with-rails">
          <aside className="ad-rail ad-rail-left"><AdSlot slotId="left-rail" /></aside>
          <aside className="ad-rail ad-rail-right"><AdSlot slotId="right-rail" /></aside>
          <CrelavoPremiumHero />

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

          <section className="container section home-section-tight clean-feed-section" aria-labelledby="home-paid-growth-funnel-heading">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Paid traffic funnel</span>
                <h2 id="home-paid-growth-funnel-heading">Start free, test with a preview, then scale only when the creative works</h2>
                <p className="section-lead">Crelavo is now positioned for Meta Sales traffic: free ad scoring, low-risk Whop previews and clear upgrade paths for Shopify, Amazon and agency teams.</p>
              </div>
              <HardReloadLink className="btn" href="/free-tools/ad-performance-score-checker">Open free Ad Scorer</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {paidGrowthFunnelCards.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.title}>
                  <span className="badge">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <section className="container section home-section-tight clean-feed-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> How delivery works</span>
                <h2>Know what happens before you spend credits</h2>
                <p className="section-lead">Crelavo should feel safe before checkout: clear brief, visible scope, dashboard delivery and revision-ready handoff.</p>
              </div>
              <HardReloadLink className="btn" href="/dashboard/create">Start a production brief</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {homeDeliveryTrust.map((item) => (
                <div className="card admin-category-card" key={item.title}>
                  <span className="badge">Step {item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <HomeShowcaseSlider title="Explore Crelavo" subtitle="A light moving showcase for samples, assets, Omni Assistant, generation and workspace tracking." slides={appLauncherSlides} />

          <section className="container section home-section-tight clean-feed-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Fastest next steps</span>
                <h2>Start light, then move into full production only when the path is clear</h2>
                <p className="section-lead">The homepage now stays focused: score the idea, estimate credits, or open the full catalog from the side menu when you need more detail.</p>
              </div>
              <HardReloadLink className="btn secondary" href="/categories">Open categories</HardReloadLink>
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {lightweightHomeCards.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.href}>
                  <span className="badge">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <section className="container section home-section-tight home-tool-strip-section">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Grid3X3 size={15} /> Key tools</span>
                <h2>Choose a focused entry point or let Omni Assistant decide</h2>
                <p className="section-lead">A short tool strip keeps the homepage fast while the full catalog stays available from Tools.</p>
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

          <section className="container section home-section-tight clean-feed-section" aria-labelledby="home-social-proof-heading">
            <div className="sample-video-head">
              <div>
                <span className="badge"><Sparkles size={15} /> Social proof</span>
                <h2 id="home-social-proof-heading">Proof scenarios and case-study paths before full production</h2>
                <p className="section-lead">Crelavo now shows conservative proof blocks: sample planning scenarios, approved example paths and case-study routes that connect directly to credits, free tools and Assistant Workspace.</p>
              </div>
              <HardReloadLink className="btn secondary" href="/community-showcase">Open proof hub</HardReloadLink>
            </div>
            <div className="admin-info-grid" style={{ marginTop: 16 }}>
              {socialProofMetrics.map((metric) => (
                <div key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.note}</small></div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {trustedProofSlots.map((slot) => (
                <div className="card admin-category-card" key={slot.label}>
                  <span className="badge">{slot.segment}</span>
                  <h3>{slot.label}</h3>
                  <p><strong>{slot.status}</strong></p>
                  <p>{slot.note}</p>
                </div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {testimonialProofs.map((item) => (
                <div className="card admin-category-card" key={item.name}>
                  <span className="badge">{item.role}</span>
                  <h3>{item.name}</h3>
                  <p>{item.scenario}</p>
                  <p><strong>{item.result}</strong></p>
                </div>
              ))}
            </div>
            <div className="admin-category-grid" style={{ marginTop: 16 }}>
              {caseStudyProofs.map((item) => (
                <HardReloadLink className="card admin-category-card" href={item.href} key={item.title}>
                  <span className="badge">{item.segment}</span>
                  <h3>{item.title}</h3>
                  <p><strong>Before:</strong> {item.before}</p>
                  <p><strong>After:</strong> {item.after}</p>
                  <span className="text-link">{item.cta}</span>
                </HardReloadLink>
              ))}
            </div>
          </section>

          <FaqSection />
          <AdSlot slotId="footer" />
        </div>
      </main>
    </>
  );
}
