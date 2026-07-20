import Link from "next/link";
import { ServicePageStructuredData } from "@/components/ServicePageStructuredData";
import type { ServicePage } from "@/lib/service-pages";
import { caseStudyProofs, testimonialProofs } from "@/lib/social-proof";

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

function buildMarketplaceGuide(page: ServicePage) {
  const slug = page.slug;
  if (!["shopify-product-link-to-ad-video", "amazon-product-ad-video", "trendyol-product-video", "ai-ecommerce-builder"].includes(slug)) return null;

  const marketplace = slug.includes("shopify") ? "Shopify" : slug.includes("amazon") ? "Amazon" : slug.includes("trendyol") ? "Trendyol" : "ecommerce marketplace";
  const audience = slug.includes("shopify")
    ? "Shopify store owners, DTC brands and dropshipping teams"
    : slug.includes("amazon")
      ? "Amazon sellers, marketplace brands and product launch teams"
      : slug.includes("trendyol")
        ? "Trendyol sellers, Turkish ecommerce shops and marketplace teams"
        : "ecommerce operators, marketplace sellers and product-led brands";
  const productSource = slug.includes("shopify") ? "a Shopify product URL" : slug.includes("amazon") ? "an Amazon listing" : slug.includes("trendyol") ? "a Trendyol product page" : "a product page, marketplace listing or store catalog";
  const proofSignals = slug.includes("shopify")
    ? "product images, offer structure, reviews, product benefits, bundles, variants and shipping promises"
    : slug.includes("amazon")
      ? "listing bullets, review patterns, comparison points, problem-solution claims and trust signals"
      : slug.includes("trendyol")
        ? "marketplace title, buyer expectations, local offer framing, benefit hierarchy and social proof"
        : "product benefits, customer objections, price/value signals, reviews and campaign context";

  return {
    title: `${marketplace} video solution guide for product-led campaigns`,
    paragraphs: [
      `${marketplace} product video campaigns need more than a generic AI video prompt. ${audience} usually start with ${productSource}, but the page alone does not automatically become a strong ad. Crelavo treats the product page as the source of a structured production brief: what the product is, who should care, which benefit should appear first, which objection must be handled and what kind of visual proof should be shown before the call to action. This makes the workflow useful for search visitors who want a marketplace-specific video solution, not a broad AI video generator with no ecommerce context.`,
      `The first step is extracting the correct selling angle from ${proofSignals}. Instead of turning every detail into a crowded video, Crelavo separates the brief into hook, problem, proof, product moment, offer and CTA. A skincare product might need close-up texture and trust language, a kitchen gadget might need a fast before-and-after demonstration, and a fashion product might need model-style context, size confidence and lifestyle framing. This category-specific structure helps the final video feel like a marketplace ad, not a random animated clip.`,
      `The second step is platform adaptation. A ${marketplace} campaign may need TikTok, Reels, Shorts, Meta ad, product page embed or marketplace retargeting versions. The same product can require different pacing: a five-second hook for cold traffic, a 15-second explainer for retargeting, a 30-second product story for warm audiences or a static thumbnail for catalog discovery. Crelavo keeps those formats connected to credit estimates and delivery expectations so the user understands what can be prepared before full production starts.`,
      `The third step is creative QA. Marketplace sellers often lose performance because the video says too much, shows the product too late or uses a CTA that does not match the buyer journey. Crelavo’s AI + human QA positioning is designed to catch these issues early: unclear claims, weak first-three-second hooks, missing product proof, poor platform fit, unhelpful captions or a mismatch between the listing and the ad promise. This is especially important when the product comes from a real store or marketplace page, because the ad should support the actual offer instead of inventing unsupported claims.`,
      `The fourth step is delivery. A useful ${marketplace} video solution should produce more than one file. It should leave the user with a production-ready script, shot direction, caption/CTA notes, thumbnail guidance, preview expectations, revision logic and a clear route into dashboard delivery. That is why this page links to pricing, campaign categories, product video generators, ecommerce guides and sample pages. The goal is to help the user move from product page research into a managed production workflow with fewer guesses and clearer credit planning.`,
      `For SEO, this guide also gives Google more context about the page. The page is not only about “AI video”; it is about ${marketplace} product video workflows, marketplace ad creative, product-link-to-video conversion, ecommerce campaign planning and delivery-ready production. Those terms help separate the page from generic AI video tools and make it more relevant for buyers who already know the marketplace they sell on. When the user is ready, the assistant workflow can collect the product link, target audience, platform, style, delivery format and credit package so the request starts with the right production information.`
    ]
  };
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
  const marketplaceGuide = buildMarketplaceGuide(page);
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

      <section className="card admin-wide-card" style={{ marginTop: 18 }}>
        <span className="badge">Proof and case studies</span>
        <h2>Why teams use Crelavo before full production</h2>
        <p>These conservative proof blocks connect each service page to approved examples, role-based testimonials and case-study paths without making unsupported revenue or ROAS claims.</p>
        <div className="admin-category-grid">
          {testimonialProofs.slice(0, 2).map((item) => (
            <div className="card admin-category-card" key={item.name}>
              <span className="badge">{item.role}</span>
              <h3>{item.name}</h3>
              <p>“{item.quote}”</p>
              <p><strong>{item.result}</strong></p>
            </div>
          ))}
          {caseStudyProofs.slice(0, 2).map((item) => (
            <Link className="card admin-category-card" href={item.href} key={item.title}>
              <span className="badge">{item.segment}</span>
              <h3>{item.title}</h3>
              <p><strong>Before:</strong> {item.before}</p>
              <p><strong>After:</strong> {item.after}</p>
            </Link>
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

      {marketplaceGuide ? (
        <article className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Marketplace video guide</span>
          <h2>{marketplaceGuide.title}</h2>
          {marketplaceGuide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </article>
      ) : null}

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
