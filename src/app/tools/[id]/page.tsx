import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Layers3, PlayCircle, Sparkles } from "lucide-react";
import { HardReloadLink } from "@/components/HardReloadLink";
import { Header } from "@/components/Header";
import { SampleVideoGallery } from "@/components/SampleVideoGallery";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { assistantWorkspaceHref } from "@/lib/assistant-links";
import { featuredToolById, featuredTools } from "@/lib/featured-tools";
import { sampleVideos } from "@/lib/sample-videos";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export function generateStaticParams() {
  return featuredTools.map((tool) => ({ id: tool.id }));
}

type ToolPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ToolDetailPage({ params }: ToolPageProps) {
  const [{ id }, siteContent] = await Promise.all([params, getConfiguredSiteContentConfig()]);
  const tool = featuredToolById(id);
  if (!tool) notFound();

  const createHref = assistantWorkspaceHref(tool.assistantIdea, tool.assistantMode, tool.assistantCategory);
  const relatedSamples = sampleVideos.filter((sample) => {
    const haystack = `${sample.title} ${sample.category} ${sample.description}`.toLowerCase();
    return tool.highlights.some((highlight) => haystack.includes(highlight.toLowerCase().split(" ")[0])) || haystack.includes(tool.assistantCategory.replace("_", " "));
  }).slice(0, 4);
  const samples = relatedSamples.length ? relatedSamples : sampleVideos.slice(0, 4);

  return (
    <>
      <SiteStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="tool-detail-page">
        <section className="container sample-detail-hero tool-detail-hero">
          <div className="sample-detail-preview-card">
            <div className="sample-detail-preview tool-detail-preview">
              <span className="sample-video-play"><PlayCircle size={46} /></span>
              <small>{tool.category}</small>
              <strong>{tool.title}</strong>
              <em>{tool.format}</em>
            </div>
          </div>
          <div className="sample-detail-copy">
            <span className="badge"><Sparkles size={15} /> Crelavo tool page</span>
            <h1>{tool.title}</h1>
            <p>{tool.description}</p>
            <div className="sample-detail-actions">
              <HardReloadLink className="btn" href={createHref}>Create with this tool <ArrowRight size={16} /></HardReloadLink>
              <HardReloadLink className="btn secondary" href="/categories">View all tools</HardReloadLink>
            </div>
            <div className="sample-detail-meta-grid">
              <div><span>Category</span><strong>{tool.category}</strong></div>
              <div><span>Format</span><strong>{tool.format}</strong></div>
              <div><span>Quality</span><strong>{tool.quality}</strong></div>
              <div><span>Assistant mode</span><strong>{tool.assistantMode}</strong></div>
            </div>
          </div>
        </section>

        <section className="container section home-section-tight">
          <div className="sample-detail-section-head">
            <span className="badge"><Layers3 size={15} /> Tool details</span>
            <h2>What this tool can prepare</h2>
            <p className="section-lead">This page explains the tool first. Users can review details here, then start the assistant when they are ready.</p>
          </div>
          <div className="grid">
            <div className="card"><h3>Highlights</h3><div className="sample-feature-row detail-feature-row">{tool.highlights.map((item) => <small key={item}>{item}</small>)}</div></div>
            <div className="card"><h3>Workflow</h3>{tool.workflow.map((step, index) => <p key={step}><CheckCircle2 size={15} color="var(--green)" /> {index + 1}. {step}</p>)}</div>
            <div className="card"><h3>Delivery direction</h3><p>{tool.subtitle}</p><p>After confirmation, Crelavo can create a production record, track provider readiness and prepare the final delivery package.</p></div>
          </div>
        </section>

        <section className="container section home-section-tight">
          <SampleVideoGallery title="Related sample cards" subtitle="Open a sample page to see the Kling-style detail view before creating a similar production." limit={4} videos={samples} shuffleOnLoad />
        </section>
      </main>
    </>
  );
}
