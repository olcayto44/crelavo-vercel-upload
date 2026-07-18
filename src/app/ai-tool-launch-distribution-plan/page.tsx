import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { launchCopyPack, launchDistributionChannels, launchDistributionChecklist, launchDistributionKeywords, launchDistributionUrlPacks, launchUtmTemplates } from "@/lib/launch-distribution";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const metadata: Metadata = {
  title: "AI Tool Launch Distribution Plan for SaaS and Organic Traffic | Crelavo",
  description: "A niche AI tool launch distribution plan covering AI directory submission, SaaS launch distribution, Product Hunt launch timing, organic traffic planning, community posts and UTM tracking.",
  keywords: launchDistributionKeywords,
  alternates: { canonical: "/ai-tool-launch-distribution-plan" },
  openGraph: {
    title: "AI Tool Launch Distribution Plan | Crelavo",
    description: "Launch distribution checklist for AI tools, SaaS products, ecommerce workflows, directories, communities, social posts and organic traffic channels.",
    url: "/ai-tool-launch-distribution-plan",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Tool Launch Distribution Plan | Crelavo",
    description: "AI startup launch checklist, SaaS launch distribution, directory submission and organic traffic plan."
  }
};

export default async function AiToolLaunchDistributionPlanPage() {
  const siteContent = await getConfiguredSiteContentConfig();

  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <main className="container section service-page-detail">
        <section className="production-hero-card admin-overview-hero service-hero-card">
          <span className="badge">Launch distribution plan</span>
          <h1>AI tool launch distribution plan for SaaS, directories, communities and organic traffic</h1>
          <p className="section-lead">
            This launch plan helps Crelavo route external traffic into the right public pages: AI directories, SaaS listings, founder posts, ecommerce communities, Product Hunt preparation, short-form social, Pinterest visual search and UTM-tracked launch campaigns.
          </p>
          <p>
            The page targets niche searches like AI tool launch plan, SaaS launch distribution, AI startup launch checklist, Product Hunt launch, AI directory submission and organic traffic plan.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link className="btn" href="/tools">Open tools catalog</Link>
            <Link className="btn secondary" href="/alternatives">AI tool alternatives</Link>
            <Link className="btn secondary" href="/free-tools">Free AI tools</Link>
          </div>
        </section>

        <section className="card admin-wide-card service-keyword-cluster" style={{ marginTop: 18 }}>
          <span className="badge">Niche SEO keywords</span>
          <h2>AI launch keywords, SaaS distribution searches and organic traffic terms</h2>
          <p>These 3-4 word keyword targets match practical launch intent instead of broad generic marketing searches.</p>
          <div className="admin-category-grid">
            {launchDistributionKeywords.map((keyword) => (
              <div className="card admin-category-card" key={keyword}>
                <h3>{keyword}</h3>
                <p>Connected to launch channels, directory listings, community posts, founder distribution and Crelavo public SEO pages.</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-seo-article" style={{ marginTop: 18 }}>
          <span className="badge">Channel plan</span>
          <h2>Launch channels for Crelavo external traffic</h2>
          <p>
            Each channel gets a focused URL pack and message angle. The goal is not to post every Crelavo page everywhere. The goal is to match search intent and community context to the right Crelavo landing page.
          </p>
          <div className="admin-category-grid">
            {launchDistributionChannels.map((channel) => (
              <div className="card admin-category-card" key={channel.channel}>
                <span className="badge">{channel.priority} · {channel.keyword}</span>
                <h3>{channel.channel}</h3>
                <p><strong>Timing:</strong> {channel.timing}</p>
                <p>{channel.copyAngle}</p>
                <p><strong>Guardrail:</strong> {channel.guardrail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">URL packs</span>
          <h2>Which Crelavo URLs to share by channel</h2>
          <div className="admin-category-grid">
            {launchDistributionUrlPacks.map((pack) => (
              <div className="card admin-category-card" key={pack.name}>
                <h3>{pack.name}</h3>
                <ul>{pack.urls.map((url) => <li key={url}><Link href={url}>{url}</Link></li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">Launch copy</span>
          <h2>Ready launch copy for directories, LinkedIn, X and communities</h2>
          <h3>Directory one-liner</h3>
          <p>{launchCopyPack.directoryOneLiner}</p>
          <h3>LinkedIn founder post</h3>
          <div className="workspace-action-note">{launchCopyPack.linkedinPost.map((line) => <p key={line}>{line}</p>)}</div>
          <h3>X / Twitter thread</h3>
          <ol>{launchCopyPack.xThread.map((line) => <li key={line}>{line}</li>)}</ol>
          <h3>Community-safe post</h3>
          <p>{launchCopyPack.communityPost}</p>
        </section>

        <section className="card admin-wide-card" style={{ marginTop: 18 }}>
          <span className="badge">UTM tracking</span>
          <h2>Launch UTM templates for external traffic attribution</h2>
          <div className="admin-info-grid">
            {launchUtmTemplates.map((utm) => (
              <div key={utm.template}>
                <span>{utm.source}</span>
                <strong>{utm.medium}</strong>
                <small>{utm.template}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="card admin-wide-card service-category-links" style={{ marginTop: 18 }}>
          <span className="badge">Checklist and internal links</span>
          <h2>Launch distribution checklist before major public launch</h2>
          <ul>{launchDistributionChecklist.map((item) => <li key={item}>{item}</li>)}</ul>
          <div className="plan-feature-groups" style={{ marginTop: 18 }}>
            <Link href="/tools"><b>AI tools catalog</b><small>AI tools catalog</small></Link>
            <Link href="/alternatives"><b>AI tool alternatives</b><small>comparison SEO hub</small></Link>
            <Link href="/free-tools"><b>Free AI tools</b><small>free AI tools workflow</small></Link>
            <Link href="/showcase/explore-samples"><b>Explore samples</b><small>AI production samples</small></Link>
            <Link href="/ai-ugc-creator-program"><b>AI UGC creator program</b><small>creator sourcing page</small></Link>
            <Link href="/pricing"><b>Pricing and credits</b><small>conversion page</small></Link>
          </div>
        </section>
      </main>
    </>
  );
}
