import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FreeToolGenerator } from "@/components/FreeToolGenerator";
import { FreeToolStructuredData } from "@/components/FreeToolStructuredData";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { freeToolMap, freeTools } from "@/lib/free-tools";

export function generateStaticParams() {
  return freeTools.map((tool) => ({ toolSlug: tool.slug }));
}

function buildFreeToolKeywords(tool: { title: string; keyword: string; category: string; slug: string }) {
  const base = [
    `free ${tool.keyword}`,
    `${tool.keyword} online`,
    `${tool.keyword} for small business`,
    `${tool.keyword} for ecommerce brands`,
    `${tool.keyword} for agencies`,
    `${tool.keyword} for creators`
  ];

  if (tool.slug.includes("product") || tool.slug.includes("ecommerce") || tool.slug.includes("ad") || tool.category.toLowerCase().includes("ecommerce")) {
    return [
      ...base,
      "free product description generator",
      "AI product description generator for ecommerce",
      "Shopify product description generator",
      "Amazon listing description generator",
      "ecommerce ad script generator",
      "product video script generator"
    ];
  }

  if (tool.slug.includes("tiktok") || tool.slug.includes("shorts") || tool.slug.includes("hook") || tool.slug.includes("-script-")) {
    return [
      ...base,
      "free TikTok hook generator",
      "AI hook generator for product videos",
      "UGC ad hook generator",
      "TikTok ad script generator",
      "YouTube Shorts script generator",
      "short-form video script generator"
    ];
  }

  if (tool.slug.includes("landing") || tool.slug.includes("seo") || tool.slug.includes("prompt")) {
    return [
      ...base,
      "free AI prompt generator",
      "landing page headline generator",
      "SEO meta title generator",
      "AI landing page copy generator",
      "website copy generator for startups"
    ];
  }

  return [
    ...base,
    "free AI tool for marketing",
    "AI content generator for startups",
    "AI tool for product launch",
    "AI marketing workflow generator"
  ];
}

const freeToolCategoryLinks = [
  { href: "/free-tools", label: "All free AI tools", keyword: "free AI tools for marketing and ecommerce" },
  { href: "/ai-product-video-generator", label: "AI Product Video Generator", keyword: "turn free scripts into product videos" },
  { href: "/ai-ecommerce-builder", label: "AI Ecommerce Builder", keyword: "ecommerce production category" },
  { href: "/ai-social-media-ai", label: "AI Social Media AI", keyword: "social media campaign workflow" },
  { href: "/ai-video-generator", label: "AI Video Generator", keyword: "short-form video production category" },
  { href: "/categories", label: "Crelavo categories", keyword: "all AI production categories" },
  { href: "/tools", label: "AI tools catalog", keyword: "AI tools catalog" },
  { href: "/pricing", label: "Pricing and credits", keyword: "credit packages for production" }
];

const blogToProductLinks = [
  { href: "/blog/shopify-product-link-to-ai-video-guide", label: "Shopify product video guide", keyword: "Shopify product video" },
  { href: "/blog/amazon-product-page-to-ai-ad-video-guide", label: "Amazon product ad guide", keyword: "Amazon product ad video" },
  { href: "/blog/trendyol-product-video-campaign-guide", label: "Trendyol product video guide", keyword: "Trendyol product video" },
  { href: "/blog/ecommerce-product-page-to-video-workflow", label: "Product page to video workflow", keyword: "product page to video" },
  { href: "/blog/shopify-amazon-trendyol-ai-campaign-checklist", label: "AI ecommerce campaign checklist", keyword: "AI ecommerce campaign" }
];

export async function generateMetadata({ params }: { params: Promise<{ toolSlug: string }> }): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = freeToolMap.get(toolSlug);
  if (!tool) return {};
  const keywords = buildFreeToolKeywords(tool).slice(0, 3).join(", ");
  return {
    title: `${tool.title} for ${tool.category} | Free AI Tool | Crelavo`,
    description: `${tool.description} Use this free tool for ${keywords}, then continue into Crelavo production categories, pricing and delivery workflows.`,
    alternates: { canonical: `/free-tools/${tool.slug}` },
    openGraph: { title: tool.title, description: tool.description, url: `/free-tools/${tool.slug}`, type: "website" }
  };
}

export default async function FreeToolPage({ params }: { params: Promise<{ toolSlug: string }> }) {
  const { toolSlug } = await params;
  const tool = freeToolMap.get(toolSlug);
  if (!tool) notFound();
  const siteContent = await getConfiguredSiteContentConfig();
  const longTailKeywords = buildFreeToolKeywords(tool);
  return (
    <>
      <FreeToolStructuredData tool={tool} />
      <Header navLinks={siteContent.navLinks} />
      <main className="container section tools-page free-tool-detail-page">
        <section className="production-hero-card admin-overview-hero">
          <span className="badge">Free AI tool</span>
          <h1>{tool.title} for {tool.category}, ecommerce campaigns and production workflows</h1>
          <p>{tool.description}</p>
          <p className="section-lead">Use this page for long-tail searches like {longTailKeywords.slice(0, 4).join(", ")} before turning the result into a Crelavo production request.</p>
        </section>

        <FreeToolGenerator tool={tool} />

        <section className="card admin-wide-card free-tool-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">SEO keyword coverage</span>
          <h2>{tool.title} keywords, free AI tool searches and long-tail traffic</h2>
          <p>These keyword clusters help Crelavo free tools attract users from Google, Yandex, Bing and AI discovery searches before routing them into the right production category.</p>
          <div className="admin-category-grid">
            {longTailKeywords.slice(0, 12).map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Relevant for {tool.category.toLowerCase()} and connected to Crelavo production workflows.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card free-tool-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Related categories</span>
          <h2>Continue from this free tool into Crelavo categories</h2>
          <p>Every free tool links back to the important Crelavo category pages so visitors can move from a free result into video, ecommerce, website, social media or pricing paths.</p>
          <div className="plan-feature-groups">
            {freeToolCategoryLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <b>{item.label}</b>
                <small>{item.keyword}</small>
              </Link>
            ))}
          </div>
        </section>

        <article className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">How it helps</span>
          <h2>{tool.keyword} for faster production planning</h2>
          <p>{tool.title} helps users create a useful starting point before they open a full production workspace. Instead of beginning with a blank prompt, the user can shape an idea, hook, caption, product description, ad script or brand message first.</p>
          <p>After the quick result, Crelavo can route the idea into Assistant Workspace where the user can request preview, final ZIP, source files, README/setup notes, export notes and a revision path.</p>
          <p>Use this free tool to test the message before spending credits. For ecommerce and product campaigns, paste a product link, product notes, offer, buyer profile or platform goal, then compare the generated angles. The best result can become the first brief for a product video, landing page, campaign asset, short-form ad or live sales workflow.</p>
          <p>Crelavo is designed to connect free planning tools with managed production. A free result is not the final deliverable; it is the low-friction starting point that helps the assistant understand your product, audience, CTA and expected output before you move into a paid preview or full production package.</p>
        </article>

        <section className="card admin-wide-card free-tool-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Blog → product → free tool funnel</span>
          <h2>Read the guide, open the product workflow, then use this free tool</h2>
          <p>These internal links connect blog guides, product pages and free tools around niche ecommerce keywords like Shopify product video, Amazon product ad video, Trendyol product video, product page to video and AI ecommerce campaign.</p>
          <div className="plan-feature-groups">
            {blogToProductLinks.map((item) => (
              <Link href={item.href} key={item.href}>
                <b>{item.label}</b>
                <small>{item.keyword}</small>
              </Link>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Continue to production</span>
          <h2>Turn this free result into a Crelavo production</h2>
          <p>When the hook, script or campaign angle is ready, continue into the most relevant production path. These pages explain how Crelavo can turn product notes, marketplace links and ecommerce ideas into managed video and campaign deliverables.</p>
          <div className="service-grid" style={{ marginTop: 14 }}>
            <Link className="feature-link-card" href="/ai-product-video-generator">
              <span>AI Product Video Generator</span>
              <small>Convert product notes into a short-form video workflow.</small>
            </Link>
            <Link className="feature-link-card" href="/shopify-product-link-to-ad-video">
              <span>Shopify Product Link to Ad Video</span>
              <small>Plan a product-link video path for Shopify stores.</small>
            </Link>
            <Link className="feature-link-card" href="/amazon-product-ad-video">
              <span>Amazon Product Ad Video</span>
              <small>Shape marketplace product angles into ad video briefs.</small>
            </Link>
            <Link className="feature-link-card" href="/trendyol-product-video">
              <span>Trendyol Product Video</span>
              <small>Prepare localized ecommerce video campaigns for Trendyol sellers.</small>
            </Link>
            <Link className="feature-link-card" href="/ai-ecommerce-campaign-generator">
              <span>AI Ecommerce Campaign Generator</span>
              <small>Expand one winning angle into copy, visuals and video planning.</small>
            </Link>
            <Link className="feature-link-card" href="/pricing">
              <span>View Crelavo packages</span>
              <small>Check credits and production package options before launch.</small>
            </Link>
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">FAQ</span>
          <h2>{tool.title} questions</h2>
          <div className="plan-feature-groups">
            <div><b>Do I need an account to use the free result?</b><small>You can generate a quick starting result on the public page. Creating an account lets you carry the selected result into Crelavo Assistant Workspace and continue toward production.</small></div>
            <div><b>Can this replace a final production brief?</b><small>No. The free result is a starting point. The assistant can turn it into a fuller production request with deliverables, preview, credits, files and revision notes.</small></div>
            <div><b>Can I use Shopify, Amazon or Trendyol links?</b><small>Yes. You can paste a product link or product notes. The free tool creates script and campaign angles from the text you provide; deeper provider-based production happens after you continue into Crelavo.</small></div>
            <div><b>What is the next step after I like a result?</b><small>Use the production CTA to send the selected result into Assistant Workspace, then choose preview, credits or a full delivery package when you are ready.</small></div>
          </div>
        </section>
      </main>
    </>
  );
}
