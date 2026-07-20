import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "Crelavo API Documentation and Integration Roadmap for Ecommerce Teams",
  description: "Public Crelavo API documentation and integration roadmap covering 44 AI, ecommerce, marketplace, payment, analytics, email and automation integrations for technical teams.",
  keywords: [
    "Crelavo API documentation",
    "Crelavo integrations",
    "AI production API",
    "ecommerce video API",
    "Shopify video API integration",
    "marketplace product video integrations",
    "AI production studio API"
  ],
  alternates: { canonical: "/api-documentation" },
  openGraph: {
    title: "Crelavo API Documentation and Integrations",
    description: "Technical overview for Crelavo managed integrations, provider readiness and enterprise API planning.",
    url: "/api-documentation",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Crelavo API Documentation and Integrations",
    description: "44 API and integration areas for ecommerce, video, marketplace and enterprise teams."
  }
};

type IntegrationItem = {
  name: string;
  status: "available" | "pending" | "planned" | "internal";
  useCase: string;
};

type IntegrationGroup = {
  title: string;
  description: string;
  items: IntegrationItem[];
};

const integrationGroups: IntegrationGroup[] = [
  {
    title: "Core AI and creative providers",
    description: "Model and provider layer for assistant reasoning, image/video generation, voice, automation and content extraction.",
    items: [
      { name: "OpenAI", status: "available", useCase: "Assistant reasoning, content analysis, brief generation and structured production planning." },
      { name: "Google Maps", status: "available", useCase: "Location context, local business pages, regional campaign planning and map-based discovery." },
      { name: "Runway", status: "available", useCase: "AI video generation and creative video provider routing." },
      { name: "ElevenLabs", status: "available", useCase: "Voice-over, narration and voice delivery workflows." },
      { name: "Replicate", status: "available", useCase: "Model routing for image, video and creative experiments where supported." },
      { name: "Apify", status: "available", useCase: "Public data extraction, research workflows and ecommerce/content collection where permitted." },
      { name: "Shotstack", status: "pending", useCase: "Programmatic video editing, render automation and timeline assembly after portal access is stable." },
      { name: "D-ID", status: "pending", useCase: "Talking video and avatar-video provider option after API access is finalized." },
      { name: "Music generation API", status: "pending", useCase: "Background music, song and audio generation provider layer." }
    ]
  },
  {
    title: "Ecommerce and marketplace integrations",
    description: "Product page, catalog and marketplace data integrations for product-link-to-video and seller campaign workflows.",
    items: [
      { name: "Shopify Admin API", status: "pending", useCase: "Store catalog, product data, order context and app installation workflow." },
      { name: "WooCommerce REST API", status: "pending", useCase: "WooCommerce product data and store campaign workflows." },
      { name: "Amazon Selling Partner API", status: "pending", useCase: "Amazon seller catalog, listing context and marketplace campaign support." },
      { name: "Trendyol API", status: "pending", useCase: "Trendyol seller catalog and regional marketplace product-video workflows." },
      { name: "TikTok Shop API", status: "pending", useCase: "Shop product context, live sales paths and commerce content workflows." },
      { name: "Google Merchant Center API", status: "planned", useCase: "Product feed validation and shopping campaign readiness." },
      { name: "Meta Catalog API", status: "planned", useCase: "Catalog-based ad creative and product feed campaign planning." },
      { name: "Pinterest Catalog API", status: "planned", useCase: "Visual product discovery, pins and ecommerce content distribution planning." }
    ]
  },
  {
    title: "Social publishing and ad channel APIs",
    description: "Social publishing, content distribution and ad platform connections for post-launch growth automation.",
    items: [
      { name: "Meta Graph API", status: "pending", useCase: "Facebook/Instagram page, content and campaign integration path." },
      { name: "YouTube Data API", status: "pending", useCase: "YouTube Shorts metadata, publishing and channel content workflows." },
      { name: "TikTok Content Posting API", status: "pending", useCase: "TikTok publishing workflow after app approval and permission setup." },
      { name: "TikTok Ads API", status: "planned", useCase: "Ad campaign signal connection and paid growth measurement." },
      { name: "Meta Ads API", status: "planned", useCase: "Paid campaign reporting, creative testing and ad performance signals." },
      { name: "Google Ads API", status: "planned", useCase: "Search, YouTube and shopping campaign measurement integration." },
      { name: "LinkedIn Marketing API", status: "planned", useCase: "B2B launch distribution, sponsored content and company page workflows." },
      { name: "X API", status: "planned", useCase: "Founder launch posts, social listening and community distribution." }
    ]
  },
  {
    title: "Payments, finance and customer lifecycle",
    description: "Payment, entitlement, billing, refund, email and customer communication integrations.",
    items: [
      { name: "Whop", status: "internal", useCase: "Payment events, entitlement checks, revenue validation and live checkout flow." },
      { name: "Stripe", status: "planned", useCase: "Alternative billing and enterprise payment path if required later." },
      { name: "Resend", status: "available", useCase: "Transactional email, smoke tests, delivery notifications and customer communication." },
      { name: "Supabase Auth", status: "internal", useCase: "User identity, session handling, login and one-time trial-credit eligibility." },
      { name: "Supabase Database", status: "internal", useCase: "Credits, productions, audit records, requests and admin workflow storage." },
      { name: "Supabase Storage", status: "internal", useCase: "Production files, source packages, delivery assets and evidence attachments." },
      { name: "Refund evidence package", status: "internal", useCase: "Contract acceptance, production confirmation, logs and dispute-support evidence." },
      { name: "Partner commission tracking", status: "internal", useCase: "Referral attribution, partner payouts and finance verification." }
    ]
  },
  {
    title: "Automation, analytics and infrastructure",
    description: "Operational layer for workflow automation, analytics, monitoring, CDN delivery and SEO discovery.",
    items: [
      { name: "n8n", status: "pending", useCase: "Workflow automation and provider orchestration after core manual flow is validated." },
      { name: "Zapier", status: "planned", useCase: "No-code enterprise handoffs and partner workflow triggers." },
      { name: "Google Analytics 4", status: "planned", useCase: "Traffic, activation and conversion analytics after live configuration." },
      { name: "Google Tag Manager", status: "planned", useCase: "Tag deployment, pixel management and event routing." },
      { name: "Meta Pixel", status: "planned", useCase: "Retargeting and paid social conversion signal setup." },
      { name: "TikTok Pixel", status: "planned", useCase: "TikTok traffic, retargeting and conversion measurement." },
      { name: "Vercel", status: "internal", useCase: "Hosting, deployment, preview builds and production release flow." },
      { name: "Vercel Analytics", status: "planned", useCase: "Lightweight performance and traffic insight for public pages." },
      { name: "Cloudflare", status: "planned", useCase: "DNS, caching, security and CDN rules if moved into Cloudflare management." },
      { name: "Google Search Console", status: "planned", useCase: "Indexing, sitemap submission and SEO performance monitoring." },
      { name: "Bing Webmaster Tools", status: "planned", useCase: "Bing/Yandex-style discovery support and indexing diagnostics." }
    ]
  }
];

const statusCopy: Record<IntegrationItem["status"], string> = {
  available: "Available / acquired",
  pending: "Pending API access",
  planned: "Planned roadmap",
  internal: "Internal system"
};

const statusCounts = integrationGroups.flatMap((group) => group.items).reduce<Record<IntegrationItem["status"], number>>((acc, item) => {
  acc[item.status] += 1;
  return acc;
}, { available: 0, pending: 0, planned: 0, internal: 0 });

const faq = [
  {
    question: "Is the Crelavo public API fully open today?",
    answer: "No. This page documents the managed integration roadmap and current provider status. Public API access will be exposed after the core payment, credit, provider and security flows are stable."
  },
  {
    question: "Can enterprise or technical teams request integration help now?",
    answer: "Yes. Teams can contact Crelavo with the marketplace, store, social channel or provider they need. The current phase is managed onboarding rather than self-serve API key creation."
  },
  {
    question: "Does this page expose API keys or secrets?",
    answer: "No. Secrets are never listed publicly. API keys must stay inside environment variables, provider dashboards and secure deployment settings."
  },
  {
    question: "Which integrations are already acquired?",
    answer: "The current acquired provider set includes OpenAI, Google Maps, Runway, ElevenLabs, Replicate, Apify and Resend. Other commerce, social, automation and video APIs remain pending or planned."
  }
];

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Crelavo API and integration map",
  numberOfItems: integrationGroups.flatMap((group) => group.items).length,
  itemListElement: integrationGroups.flatMap((group) => group.items).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    description: `${statusCopy[item.status]}: ${item.useCase}`
  }))
};

const techArticleJsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Crelavo API Documentation and Integration Roadmap",
  description: "Technical overview of Crelavo managed integrations for AI production, ecommerce product video, marketplace workflows, social publishing, payments, analytics and automation.",
  author: { "@type": "Organization", name: "Crelavo" },
  publisher: { "@type": "Organization", name: "Crelavo" },
  mainEntityOfPage: "/api-documentation"
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default async function ApiDocumentationPage() {
  const siteContent = await getConfiguredSiteContentConfig();
  const totalIntegrations = integrationGroups.flatMap((group) => group.items).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">API documentation</span>
          <h1>Crelavo API documentation and integration roadmap for ecommerce, video and enterprise teams</h1>
          <p className="section-lead">
            This public documentation page maps {totalIntegrations} API and integration areas across AI providers, ecommerce marketplaces, social publishing, payments, analytics and automation. It is written for technical teams that need to understand how Crelavo can connect product data, campaign requests and managed AI production delivery.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/contact">Request integration help</Link>
            <Link className="btn secondary" href="/dashboard/connections">Open dashboard connections</Link>
            <Link className="btn secondary" href="/shopify-product-link-to-ad-video">Shopify product video workflow</Link>
          </div>
        </section>

        <section className="admin-info-grid service-info-grid" style={{ marginTop: 18 }}>
          <div><span>Total map</span><strong>{totalIntegrations} integrations</strong><small>Provider, commerce, social, payment and infrastructure coverage.</small></div>
          <div><span>Available</span><strong>{statusCounts.available} acquired</strong><small>OpenAI, Google Maps, Runway, ElevenLabs, Replicate, Apify and Resend.</small></div>
          <div><span>Pending</span><strong>{statusCounts.pending} APIs</strong><small>Commerce, social, video editing and automation access still needs setup.</small></div>
          <div><span>Security</span><strong>No secrets exposed</strong><small>Keys stay in environment variables and provider dashboards.</small></div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Current status</span>
          <h2>Managed integrations first, public API access later</h2>
          <p>
            Crelavo is currently structured around managed production workflows: users submit a request, credits are reserved, providers are routed, admin review validates the result and delivery appears in the dashboard. Public self-serve API keys should come after the payment, credit, provider, refund evidence and security flow is stable.
          </p>
          <p>
            This page is intentionally conservative: it explains the integration map and technical roadmap without claiming that every listed API is already live. It also gives search engines a clear technical page for enterprise, ecommerce and developer-intent queries.
          </p>
        </section>

        {integrationGroups.map((group) => (
          <section className="card admin-wide-card" style={{ marginTop: 18 }} key={group.title}>
            <span className="badge">Integration group</span>
            <h2>{group.title}</h2>
            <p>{group.description}</p>
            <div className="admin-category-grid">
              {group.items.map((item) => (
                <div className="card admin-category-card" key={item.name}>
                  <span className="badge">{statusCopy[item.status]}</span>
                  <h3>{item.name}</h3>
                  <p>{item.useCase}</p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Developer paths</span>
          <h2>Where technical visitors should go next</h2>
          <div className="plan-feature-groups">
            <Link href="/contact"><b>Enterprise integration request</b><small>Ask for a managed integration or technical onboarding call</small></Link>
            <Link href="/dashboard/connections"><b>Dashboard connections</b><small>Internal connection status and account setup path</small></Link>
            <Link href="/shopify-ai-product-video-app"><b>Shopify AI product video app</b><small>Shopify-facing app and product video SEO path</small></Link>
            <Link href="/woocommerce-ai-product-video-plugin"><b>WooCommerce video plugin</b><small>WooCommerce REST API roadmap and plugin positioning</small></Link>
            <Link href="/alternatives/best-ai-product-video-generators"><b>Best AI product video generators</b><small>Comparison page for product video API/tool buyers</small></Link>
            <Link href="/pricing"><b>Credits and delivery</b><small>Understand how production requests are priced and delivered</small></Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Security and implementation notes</span>
          <h2>API key handling and enterprise guardrails</h2>
          <ul>
            <li>Never paste API keys, provider tokens or customer secrets into chat or public pages.</li>
            <li>Use environment variables, provider dashboards and secure deployment settings for secrets.</li>
            <li>Validate credit reservation, cancellation, refund evidence and idempotency before allowing automated paid production.</li>
            <li>Publish customer logos, case studies and metrics only after written approval and source verification.</li>
          </ul>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>Crelavo API documentation questions</h2>
          <div className="admin-category-grid">
            {faq.map((item) => (
              <div className="card admin-category-card" key={item.question}>
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
