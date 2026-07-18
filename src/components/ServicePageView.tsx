import Link from "next/link";
import { ServicePageStructuredData } from "@/components/ServicePageStructuredData";
import type { ServicePage } from "@/lib/service-pages";

const relatedPages = [
  { href: "/ai-website-builder", label: "AI Website Builder" },
  { href: "/ai-app-builder", label: "AI App Builder" },
  { href: "/ai-ecommerce-builder", label: "AI Ecommerce Builder" },
  { href: "/ai-video-generator", label: "AI Video Generator" },
  { href: "/ai-product-video-generator", label: "AI Product Video Generator" },
  { href: "/shopify-product-link-to-ad-video", label: "Shopify Product Link to Ad Video" },
  { href: "/amazon-product-ad-video", label: "Amazon Product Ad Video" },
  { href: "/trendyol-product-video", label: "Trendyol Product Video" },
  { href: "/ai-social-media-ai", label: "AI Social Media AI" }
];

const categoryLinks = [
  { href: "/categories", label: "All AI production categories", keyword: "AI production categories" },
  { href: "/tools", label: "AI tools catalog", keyword: "AI tools for websites, apps, video and ecommerce" },
  { href: "/ai-ecommerce-builder", label: "Ecommerce campaign category", keyword: "AI ecommerce campaign generator" },
  { href: "/ai-video-generator", label: "AI video category", keyword: "AI video generator for product videos and social ads" },
  { href: "/ai-website-builder", label: "Website builder category", keyword: "AI website builder for landing pages and SaaS sites" },
  { href: "/pricing", label: "Pricing and credits", keyword: "AI production pricing and credit packages" }
];

const freeToolFunnelLinks = [
  { href: "/free-tools/tiktok-hook-generator", label: "TikTok Hook Generator", keyword: "TikTok hook generator" },
  { href: "/free-tools/ecommerce-ad-script-generator", label: "Ecommerce Ad Script Generator", keyword: "ecommerce ad script" },
  { href: "/free-tools/product-description-generator", label: "Product Description Generator", keyword: "product description generator" },
  { href: "/free-tools/ad-copy-generator", label: "Ad Copy Generator", keyword: "ad copy generator" },
  { href: "/free-tools/instagram-caption-generator", label: "Instagram Caption Generator", keyword: "Instagram caption generator" },
  { href: "/free-tools/seo-meta-title-generator", label: "SEO Meta Title Generator", keyword: "SEO meta title generator" }
];

function exampleHref(baseHref: string, example: string) {
  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}example=${encodeURIComponent(example)}`;
}

function buildLongTailKeywords(page: ServicePage) {
  const title = page.title.toLowerCase();
  const keyword = page.keyword;
  const base = [
    keyword,
    `${keyword} service`,
    `${keyword} workflow`,
    `${keyword} pricing`,
    `${keyword} for small business`,
    `${keyword} for agencies`,
    `${keyword} for ecommerce brands`
  ];

  if (title.includes("product") || title.includes("shopify") || title.includes("amazon") || title.includes("trendyol") || title.includes("ecommerce")) {
    return [
      ...base,
      "AI product video generator for ecommerce brands",
      "product link to ad video generator",
      "Shopify product video generator",
      "Amazon product ad video maker",
      "Trendyol product video service",
      "AI ecommerce campaign generator",
      "short product video for TikTok Reels and YouTube Shorts"
    ];
  }

  if (title.includes("website") || title.includes("app") || title.includes("saas")) {
    return [
      ...base,
      "AI website builder for landing pages",
      "AI app builder for SaaS MVPs",
      "AI website builder for small business",
      "AI SaaS landing page generator",
      "AI app prototype and dashboard builder",
      "managed AI website production service"
    ];
  }

  if (title.includes("video") || title.includes("avatar") || title.includes("dubbing") || title.includes("voice")) {
    return [
      ...base,
      "AI video generator for marketing campaigns",
      "AI video production service for social media",
      "AI voice over and dubbing workflow",
      "short-form AI video for ads",
      "managed AI video production platform"
    ];
  }

  return [
    ...base,
    "managed AI production studio",
    "AI marketing campaign generator",
    "AI launch asset production",
    "AI tools for business growth"
  ];
}

function buildSeoArticle(page: ServicePage) {
  const [firstSection, secondSection] = page.sections;
  return [
    {
      title: `What is ${page.keyword}?`,
      paragraphs: [
        `${page.keyword} is a focused Crelavo service path for users who want to move from an idea into a managed AI production workflow. Instead of sending users directly into a blank dashboard, this guide explains what the service does, what inputs are useful, what outputs can be prepared and how the final delivery can be tracked. For ${page.title}, the main goal is to help users understand the production path before they spend credits or request a live provider job.`,
        `${page.summary} This makes the page useful for search visitors, returning users and dashboard users who need a clear starting point. Crelavo positions each service as a delivery workflow, not only a prompt form, so the user can see what will be prepared and what kind of handoff can be expected.`
      ]
    },
    {
      title: `What Crelavo can deliver for ${page.title}`,
      paragraphs: [
        `The ${page.title} workflow is best for ${page.bestFor}. A user can start with inputs such as ${page.inputs.join(", ").toLowerCase()} and continue into a structured production request. Crelavo can organize the request into outputs such as ${page.outputs.join(", ").toLowerCase()}, then route the user toward the right workspace, package or delivery center.`,
        firstSection?.text ?? `This workflow helps turn an unclear request into a production-ready plan with delivery expectations, credit awareness and dashboard tracking.`
      ]
    },
    {
      title: `${page.title} delivery formats`,
      paragraphs: [
        `A key part of Crelavo is delivery clarity. Depending on the selected package and provider readiness, ${page.title} projects can be prepared with ${page.delivery.join(", ").toLowerCase()}. This helps users understand the difference between a preview, a final package, editable source material, setup notes and revision tracking.`,
        secondSection?.text ?? `The service is designed so each request can become a usable production package instead of disappearing into a simple chat response.`
      ]
    },
    {
      title: `Start your ${page.title} workflow`,
      paragraphs: [
        `Users can begin from this public page, compare delivery expectations on the pricing page, or continue into the dashboard when they are ready. Example uses include ${page.examples.join(", ").toLowerCase()}. The goal is to keep the path simple: understand the service, choose the right workflow, start the assistant-guided request and receive a clear production delivery path.`,
        `Crelavo keeps this service content aligned with the real production system as the platform grows. That means the page can stay connected to current delivery options, provider readiness, examples, pricing paths and assistant-guided workflows.`
      ]
    }
  ];
}

export function ServicePageView({ page }: { page: ServicePage }) {
  const article = buildSeoArticle(page);
  const longTailKeywords = buildLongTailKeywords(page);
  const related = relatedPages.filter((item) => item.href !== `/${page.slug}`).slice(0, 4);
  const visibleCategoryLinks = categoryLinks.filter((item) => item.href !== `/${page.slug}`).slice(0, 6);

  return (
    <>
      <ServicePageStructuredData page={page} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
        <span className="badge">{page.badge}</span>
        <h1>{page.title} for {page.bestFor}</h1>
        <p>{page.summary}</p>
        <p className="section-lead">Explore the {page.keyword} category for long-tail searches like {longTailKeywords.slice(1, 4).join(", ")}.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <Link className="btn" href={page.primaryCtaHref}>{page.primaryCtaLabel}</Link>
          {page.secondaryCtaHref ? <Link className="btn secondary" href={page.secondaryCtaHref}>View pricing and delivery options</Link> : null}
          <Link className="btn secondary" href="/tools">All tools</Link>
        </div>
      </section>

      <section className="admin-info-grid service-info-grid" style={{ marginTop: 18 }}>
        <div><span>Service</span><strong>{page.keyword}</strong><small>Main production category</small></div>
        <div><span>Best for</span><strong>{page.bestFor}</strong><small>Recommended use case</small></div>
        <div><span>Delivery</span><strong>{page.delivery.slice(0, 3).join(" + ")}</strong><small>Handoff formats</small></div>
        <div><span>Ready path</span><strong>Assistant workflow</strong><small>Continue with guided production</small></div>
      </section>

      <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
        <span className="badge">SEO keyword coverage</span>
        <h2>{page.title} keywords, long-tail searches and category intent</h2>
        <p>These search phrases help visitors find the right Crelavo production path from Google, Yandex, Bing, AI directories and category pages.</p>
        <div className="admin-category-grid">
          {longTailKeywords.slice(0, 12).map((keyword) => (
            <div className="card admin-category-card" key={keyword}>
              <h3>{keyword}</h3>
              <p>Relevant for {page.bestFor.toLowerCase()} and connected to the {page.keyword} service category.</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
        <span className="badge">Important categories</span>
        <h2>Browse related Crelavo categories before starting {page.title}</h2>
        <p>Category pages are important for SEO and user navigation, so every landing page links back to the main Crelavo production categories and high-intent service paths.</p>
        <div className="plan-feature-groups">
          {visibleCategoryLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              <b>{item.label}</b>
              <small>{item.keyword}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="card admin-wide-card free-tool-category-links" style={{ marginTop: 18 }}>
        <span className="badge">Free tools funnel</span>
        <h2>Prepare this production with free tools first</h2>
        <p>Use these free tools to create hooks, product descriptions, ad copy, captions and SEO titles before opening the full {page.title} workflow.</p>
        <div className="plan-feature-groups">
          {freeToolFunnelLinks.map((item) => (
            <Link href={item.href} key={item.href}>
              <b>{item.label}</b>
              <small>{item.keyword}</small>
            </Link>
          ))}
        </div>
      </section>

      <section className="service-three-col" style={{ marginTop: 18 }}>
        <div className="card admin-category-card"><span className="badge">Inputs</span><h2>What the user provides</h2>{page.inputs.map((item) => <p key={item}>{item}</p>)}</div>
        <div className="card admin-category-card"><span className="badge">Outputs</span><h2>What Crelavo prepares</h2>{page.outputs.map((item) => <p key={item}>{item}</p>)}</div>
        <div className="card admin-category-card"><span className="badge">Delivery</span><h2>How it can be delivered</h2>{page.delivery.map((item) => <p key={item}>{item}</p>)}</div>
      </section>

      <article className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
        <span className="badge">Service guide</span>
        {article.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </section>
        ))}
      </article>

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Example uses</span>
        <h2>{page.title} examples</h2>
        <div className="admin-category-grid">
          {page.examples.map((item) => (
            <Link className="card admin-category-card" href={exampleHref(page.primaryCtaHref, item)} key={item}>
              <span className="badge">{page.keyword}</span>
              <h3>{item}</h3>
              <p>Use this example as the starting brief for the {page.title} workflow.</p>
            </Link>
          ))}
        </div>
      </section>

      {page.faqItems?.length ? (
        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>{page.title} questions</h2>
          <div className="admin-category-grid">
            {page.faqItems.map((item) => <div className="card admin-category-card" key={item.question}><h3>{item.question}</h3><p>{item.answer}</p></div>)}
          </div>
        </section>
      ) : null}

      {page.internalLinks?.length ? (
        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Next paths</span>
          <h2>Continue from this service</h2>
          <div className="plan-feature-groups">
            {page.internalLinks.map((item) => <Link href={item.href} key={`${item.label}-${item.href}`}><b>{item.label}</b><small>Open recommended path</small></Link>)}
          </div>
        </section>
      ) : null}

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Related services</span>
        <h2>Explore related Crelavo services</h2>
        <div className="plan-feature-groups">
          {related.map((item) => <Link href={item.href} key={item.href}><b>{item.label}</b><small>Open this related service</small></Link>)}
          <Link href="/pricing"><b>Pricing and delivery options</b><small>Review credits, ZIP/source/README and handoff options</small></Link>
          <Link href="/dashboard/productions"><b>Production Delivery Center</b><small>Track previews, final packages, source files and revisions</small></Link>
        </div>
      </section>
    </main>
  </>
);
}
