import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { ShowcaseVideoDetail } from "@/components/ShowcaseVideoDetail";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { getShowcaseItem, showcaseItems } from "@/lib/showcase-items";

export function generateStaticParams() {
  return showcaseItems.map((item) => ({ id: item.id }));
}

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://crelavo.com").trim().replace(/\/$/, "");
const fallbackShowcaseVideoUrl = "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200506566226583-1783200506537.mp4";
const fallbackShowcaseThumbnailUrl = `${siteUrl}/showcase/ai-production-studio.webp`;

const crelavoHomepageVideos = [
  {
    id: "crelavo-wow-reel",
    title: "Crelavo Wow Reel",
    kicker: "Viral visual",
    description: "A high-impact creature-led Crelavo concept built to stop the scroll.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4",
    details: [
      "This example is built as a viral visual hook: it uses an unexpected creature-led scene to catch attention fast before the visitor reads any long explanation.",
      "It shows how Crelavo can turn a brand idea into a scroll-stopping social video concept rather than a plain product demo.",
      "Best for awareness ads, social media openers, high-impact landing page sections and campaign visuals that need instant curiosity."
    ],
    bestFor: ["Viral hooks", "Top-of-funnel ads", "Social media attention", "Brand awareness"]
  },
  {
    id: "crelavo-energy-system",
    title: "Crelavo Energy System",
    kicker: "Premium motion",
    description: "A cinematic chain-and-cube sequence showing Crelavo as an energetic creative engine.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148834458072949-1786148834448.mp4",
    details: [
      "This example presents Crelavo as a premium creative system: connected motion, glowing cube energy and cinematic pacing make the brand feel more advanced.",
      "It is useful when the goal is not only to explain a tool, but to make the platform feel powerful, technical and valuable.",
      "Best for brand pages, product launch sections, premium motion identities and ads that need a polished technology feel."
    ],
    bestFor: ["Premium brand motion", "Technology positioning", "Product launch visuals", "High-value landing pages"]
  },
  {
    id: "crelavo-product-story",
    title: "Crelavo Product Story",
    kicker: "Presenter demo",
    description: "A direct product explanation for visitors who want to understand the platform quickly.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148847561742266-1786148847522.mp4",
    details: [
      "This example is the clearest product-story format: it explains what Crelavo does in a direct, presenter-style way for visitors who need fast understanding.",
      "It works as a practical trust-building video because it supports the landing page copy with a human-style explanation instead of only abstract visuals.",
      "Best for homepage explanation blocks, onboarding pages, product education, retargeting and visitors who already have buying intent."
    ],
    bestFor: ["Product explanation", "Homepage education", "Retargeting", "Conversion support"]
  },
  {
    id: "phoenix-awakening",
    title: "Phoenix Awakening",
    kicker: "3D animation",
    description: "A vivid mechanical phoenix teaser built for cinematic social-first storytelling.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-08-23/video/1786203250578603803-1786203250560.mp4",
    details: [
      "This example tests a premium 3D animated showcase direction: a mechanical phoenix awakens inside a crystal city, using rich light, motion and fantasy-sci-fi atmosphere instead of product explanation.",
      "It is designed for homepage proof and social media use, where the visual quality, cinematic sound and final Crelavo mark communicate capability without a traditional explainer.",
      "The strongest elements are the crystal heart opening, the phoenix reveal, the golden-blue motion trail and the final branded hero beat."
    ],
    bestFor: ["3D animation showcase", "Social teaser", "Homepage visual proof", "Cinematic brand mood"]
  },
  {
    id: "origami-dragon-meteor",
    title: "Origami Dragon Meteor",
    kicker: "Anime short film",
    description: "A fast neon anime teaser with a paper crane transforming into a luminous dragon.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-01/video/1786209159798605867-1786209159793.mp4",
    details: [
      "This short anime-film test opens with a neon meteor impact and a glowing paper crane before revealing the origami dragon transformation.",
      "The compact 9:16 cut is designed as a social-first teaser: fast visual escalation, anime energy and a memorable fantasy reveal without presenter footage or product explanation.",
      "It is the shorter available version of the anime production and is included as a direct Crelavo visual showcase while the longer HeyGen resource remains unavailable for download."
    ],
    bestFor: ["Anime short film", "Vertical social teaser", "Fantasy visual test", "Homepage visual proof"]
  },
  {
    id: "turkish-avatar-hook",
    title: "Turkish Avatar Hook",
    kicker: "Avatar speaker",
    description: "A Turkish-speaking avatar ad with a direct FOMO hook for Crelavo showcase and social use.",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786219244367608234-1786219244348.mp4",
    details: [
      "This avatar speaker test uses a Turkish voice-over and a direct FOMO opening line to show Crelavo's talking-video production capability.",
      "The 9:16 vertical format is built for homepage proof, Reels, TikTok, Shorts and paid social placements where the first seconds need to establish urgency.",
      "The strongest elements are the clear Turkish delivery, professional avatar presence, clean premium background and short social-ready runtime."
    ],
    bestFor: ["Avatar speaker", "Turkish social ad", "Homepage visual proof", "A-roll showcase"]
  },
  {
    id: "luxury-serum-demo",
    title: "Luxury Serum Demo",
    kicker: "Product demo",
    description: "A luxury skincare product demo with cinematic macro beauty shots and a premium hook.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/image/1786222106538364280-1786222106536.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/video/1786222067850341317-1786222067841.mp4",
    details: [
      "This product demo uses macro beauty shots, slow product motion and a premium lighting setup to show how Crelavo can present a real physical item.",
      "The format is built for homepage showcase and social media use, with a clean product hero frame and tactile commercial pacing.",
      "The visual language focuses on luxury skincare presentation, making the result suitable for ecommerce, ad campaigns and launch pages."
    ],
    bestFor: ["Product demo", "Beauty ad", "Ecommerce showcase", "Homepage visual proof"]
  },
  {
    id: "great-mishaps",
    title: "Great Mishaps",
    kicker: "3D animation",
    description: "A Pixar-style superhero comedy with five lovable misfit heroes and golden-hour cinematic chaos.",
    imageUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/image/1786224521060209859-1786224521053.png",
    videoUrl: "https://cdn.hailuoai.video/moss/prod/2026-08-09-05/video/1786224496725549080-1786224496690.mp4",
    details: [
      "This animated short introduces five clumsy heroes in a golden-hour cinematic world, using expressive Pixar-style staging and slapstick timing.",
      "The five-character ensemble is designed to show Crelavo's ability to handle full animated storytelling with character consistency and feature-film polish.",
      "The result works as a showcase for premium 3D animation, family-friendly comedy, and animated brand storytelling." 
    ],
    bestFor: ["3D animation", "Character comedy", "Hero team scene", "Homepage visual proof"]
  }
];

function absoluteUrl(value?: string) {
  if (!value) return fallbackShowcaseThumbnailUrl;
  if (/^https?:\/\//i.test(value)) return value;
  return `${siteUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function ShowcaseVideoStructuredData({ item, videoUrl }: { item: (typeof showcaseItems)[number]; videoUrl: string }) {
  const pageUrl = `${siteUrl}/showcase/${item.id}`;
  const thumbnailUrl = absoluteUrl(item.imageUrl);
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video`,
    name: item.videoTitle || `${item.title} showcase video`,
    description: item.videoDescription || item.longDescription,
    thumbnailUrl: [thumbnailUrl],
    uploadDate: "2026-07-05T00:00:00.000Z",
    contentUrl: videoUrl,
    embedUrl: pageUrl,
    url: pageUrl,
    publisher: { "@type": "Organization", name: "Crelavo", url: siteUrl },
    potentialAction: { "@type": "WatchAction", target: pageUrl }
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function buildShowcaseKeywords(item: { title: string; description: string; longDescription: string; bestFor: string[] }) {
  const base = [
    `${item.title} showcase`,
    `${item.title} demo`,
    `${item.title} examples`,
    `${item.title} workflow`,
    `${item.title} for ${item.bestFor[0] || "creators"}`
  ];

  if (item.title.toLowerCase().includes("sample") || item.title.toLowerCase().includes("explore")) {
    return [
      ...base,
      "AI production samples",
      "AI video production samples",
      "website and app production samples",
      "ecommerce campaign samples",
      "AI human QA delivery examples"
    ];
  }

  if (item.title.toLowerCase().includes("video") || item.title.toLowerCase().includes("motion") || item.title.toLowerCase().includes("seedance")) {
    return [
      ...base,
      "AI video showcase",
      "short-form video workflow",
      "AI product video examples",
      "cinematic video workflow",
      "motion production preview"
    ];
  }

  if (item.title.toLowerCase().includes("workspace") || item.title.toLowerCase().includes("assets") || item.title.toLowerCase().includes("omni")) {
    return [
      ...base,
      "production workspace demo",
      "asset library showcase",
      "assistant workflow example",
      "AI human QA delivery workflow",
      "project tracking preview"
    ];
  }

  return [
    ...base,
    "Crelavo showcase page",
    "AI production studio demo",
    "managed production workflow",
    "category showcase",
      "creative delivery examples",
      "AI product video examples",
      "ecommerce campaign showcase",
      "UGC product demo",
      "free AI tools workflow"
  ];
}

 type ShowcasePageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ video?: string }>;
};

export async function generateMetadata({ params }: ShowcasePageProps): Promise<Metadata> {
  const { id } = await params;
  const item = getShowcaseItem(id);
  if (!item) return { title: "Showcase detail | Crelavo" };
  const keywords = buildShowcaseKeywords(item).slice(0, 3).join(", ");
  return {
    title: `${item.title} showcase for ${item.bestFor[0] || "Crelavo users"} | Crelavo`,
    description: `${item.longDescription} Explore ${keywords} and related Crelavo categories, tools and production workflows.`,
    keywords: buildShowcaseKeywords(item),
    alternates: { canonical: `/showcase/${item.id}` },
    openGraph: {
      title: `${item.title} | Crelavo`,
      description: item.longDescription,
      url: `/showcase/${item.id}`,
      type: "website"
    }
  };
}

export default async function ShowcaseDetailPage({ params, searchParams }: ShowcasePageProps) {
  const [{ id }, siteContent] = await Promise.all([params, getConfiguredSiteContentConfig()]);
  const query = searchParams ? await searchParams : {};
  const item = getShowcaseItem(id);
  if (!item) notFound();
  const selectedHomepageVideo = id === "explore-samples" ? crelavoHomepageVideos.find((video) => video.id === query.video) : undefined;
  if (selectedHomepageVideo) {
    return <ShowcaseVideoDetail video={selectedHomepageVideo} backHref="/showcase/explore-samples" backLabel="Back to samples" actionHref={`/dashboard/create?category=video&sample=${encodeURIComponent(selectedHomepageVideo.id)}`} actionLabel="Create a similar video" />;
  }

  const keywords = buildShowcaseKeywords(item);
  const relatedItems = showcaseItems.filter((entry) => entry.group === item.group && entry.id !== item.id).slice(0, 3);
  const showcaseVideoUrl = item.videoUrl || fallbackShowcaseVideoUrl;
  const showcaseWebmUrl = item.webmUrl;
  const heroTitle = item.title;
  const heroEyebrow = item.eyebrow;
  const heroDescription = item.longDescription;

  return (
    <>
      <SiteStructuredData />
      <ShowcaseVideoStructuredData item={item} videoUrl={showcaseVideoUrl} />
      <Header navLinks={siteContent.navLinks} />
      <main className="showcase-detail-page">
        <section className={`container showcase-detail-hero tone-${item.tone}`}>
          <div className="showcase-detail-copy">
            <Link className="showcase-back-link" href="/">
              <ArrowLeft size={16} /> Back to homepage
            </Link>
            <span className="badge"><Sparkles size={15} /> {heroEyebrow}</span>
            <h1>{heroTitle}</h1>
            <p>{heroDescription}</p>
            <p className="section-lead">Search-friendly keywords: {keywords.slice(0, 4).join(", ")}. This showcase helps visitors move from inspiration into the right Crelavo category or production workflow.</p>
            <div className="showcase-detail-actions">
              <Link className="btn" href={item.primaryCtaHref}>{item.primaryCtaLabel}</Link>
              <Link className="btn secondary" href={item.secondaryCtaHref}>{item.secondaryCtaLabel}</Link>
            </div>
          </div>
          <div className="showcase-video-panel" aria-label={`Crelavo AI product video showcase preview for ${item.title}`}>
            <video className="showcase-detail-video" controls playsInline preload="none" poster={item.imageUrl} aria-label={`Crelavo AI product video showcase for ${item.title}`}>
              {showcaseWebmUrl ? <source src={showcaseWebmUrl} type="video/webm" /> : null}
              <source src={showcaseVideoUrl} type="video/mp4" />
            </video>
          </div>
        </section>


        <section className="container showcase-detail-keywords-section">
          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">SEO keyword coverage</span>
            <h2>{item.title} keywords and long-tail searches</h2>
            <p>This showcase page is designed to support search intent for people looking for demos, workflows, examples, production previews and category-specific inspiration.</p>
            <div className="showcase-pill-row">
              {keywords.slice(0, 10).map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
          </div>
        </section>

        <section className="container showcase-detail-keywords-section">
          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">Visual SEO links</span>
            <h2>Connect this showcase to samples, free tools and niche ecommerce pages</h2>
            <p>These links strengthen sample and showcase discovery around AI product video examples, ecommerce campaign showcase, UGC product demo and free AI tools workflow searches.</p>
            <div className="plan-feature-groups">
              <Link href="/samples/product-ad-skincare"><b>Product ad sample</b><small>ecommerce video sample</small></Link>
              <Link href="/samples/ugc-product-demo"><b>UGC product demo</b><small>UGC product demo</small></Link>
              <Link href="/ai-ugc-creator-program"><b>AI UGC creator program</b><small>AI UGC creator</small></Link>
              <Link href="/free-tools/tiktok-hook-generator"><b>TikTok Hook Generator</b><small>short-form hook workflow</small></Link>
              <Link href="/free-tools/ecommerce-ad-script-generator"><b>Ecommerce Ad Script Generator</b><small>ecommerce ad script</small></Link>
              <Link href="/categories/campaign"><b>Campaign category</b><small>ecommerce campaign showcase</small></Link>
            </div>
          </div>
        </section>

        <section className="container showcase-detail-grid-section">
          <div className="showcase-info-card">
            <span className="badge">Highlights</span>
            <h2>What this page explains</h2>
            <ul>
              {item.highlights.map((highlight) => (
                <li key={highlight}><CheckCircle2 size={18} /> {highlight}</li>
              ))}
            </ul>
          </div>

          <div className="showcase-info-card">
            <span className="badge">Workflow</span>
            <h2>How it works</h2>
            <ol>
              {item.workflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">Best for</span>
            <h2>Recommended use cases</h2>
            <div className="showcase-pill-row">
              {item.bestFor.map((useCase) => (
                <span key={useCase}>{useCase}</span>
              ))}
            </div>
          </div>
        </section>

        {relatedItems.length ? (
          <section className="container showcase-related-section">
            <div className="sample-video-head">
              <div>
                <span className="badge">Related</span>
                <h2>More {item.group === "feature" ? "production features" : "production categories"}</h2>
                <p className="section-lead">Explore other cards from the same moving showcase.</p>
              </div>
            </div>
            <div className="showcase-related-grid">
              {relatedItems.map((related) => (
                <Link className={`showcase-related-card tone-${related.tone}`} href={related.href} key={related.id}>
                  <span>{related.kicker}</span>
                  <strong>{related.title}</strong>
                  <p>{related.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
