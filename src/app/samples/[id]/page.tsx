import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Clapperboard, Copy, Layers, Sparkles } from "lucide-react";
import { HardReloadLink } from "@/components/HardReloadLink";
import { Header } from "@/components/Header";
import { SampleEngagement } from "@/components/SampleEngagement";
import { SampleVideoGallery } from "@/components/SampleVideoGallery";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { assistantWorkspaceHref } from "@/lib/assistant-links";
import { sampleVideos } from "@/lib/sample-videos";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export function generateStaticParams() {
  return sampleVideos.map((item) => ({ id: item.id }));
}

const fallbackSampleDetailVideoUrl = "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200420847185558-1783200420793.mp4";

function buildSampleKeywords(sample: { title: string; category: string; format: string; duration: string; quality: string; features: string[] }) {
  const base = [
    `${sample.title} sample`,
    `${sample.category} sample`,
    `${sample.format} demo`,
    `${sample.duration} video`,
    `${sample.quality} production`
  ];

  const featureKeywords = sample.features.slice(0, 4).map((feature) => `${feature.toLowerCase()} workflow`);

  return [
    ...base,
    ...featureKeywords,
    `${sample.category} workflow`,
    `${sample.category} example`,
    "AI production sample",
    "creative workflow demo",
    "social video example"
  ];
}

type SamplePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SamplePageProps): Promise<Metadata> {
  const { id } = await params;
  const sample = sampleVideos.find((item) => item.id === id);
  if (!sample) return { title: "Sample detail | Crelavo" };
  const keywords = buildSampleKeywords(sample).slice(0, 4).join(", ");

  return {
    title: `${sample.title} sample for ${sample.category} | Crelavo`,
    description: `${sample.description} Explore ${keywords} and use this sample as a direct entry into the matching Crelavo production workflow.`,
    alternates: { canonical: `/samples/${sample.id}` },
    openGraph: {
      title: `${sample.title} | Crelavo sample`,
      description: sample.description,
      url: `/samples/${sample.id}`,
      type: "website"
    }
  };
}

export default async function SampleDetailPage({ params }: SamplePageProps) {
  const [{ id }, siteContent] = await Promise.all([params, getConfiguredSiteContentConfig()]);
  const sample = sampleVideos.find((item) => item.id === id);
  if (!sample) notFound();

  const createSimilarHref = assistantWorkspaceHref(`${sample.title} like this sample`, "media", sample.category);
  const related = sampleVideos.filter((item) => item.id !== sample.id).slice(0, 3);
  const sampleVideoUrl = sample.videoUrl || fallbackSampleDetailVideoUrl;
  const keywords = buildSampleKeywords(sample);

  return (
    <>
      <SiteStructuredData />
      <Header navLinks={siteContent.navLinks} />
      <main className="sample-detail-page">
        <section className="container sample-detail-hero">
          <div className="sample-detail-copy">
            <span className="badge"><Sparkles size={15} /> Sample production</span>
            <h1>{sample.title}</h1>
            <p>{sample.description}</p>
            <div className="sample-detail-actions">
              <HardReloadLink className="btn" href={createSimilarHref}>Create similar with Crelavo <ArrowRight size={16} /></HardReloadLink>
              <HardReloadLink className="btn secondary" href="/dashboard/assistant-workspace">Open Assistant</HardReloadLink>
            </div>
            <div className="sample-detail-meta-grid">
              <div><span>Category</span><strong>{sample.category}</strong></div>
              <div><span>Duration</span><strong>{sample.duration}</strong></div>
              <div><span>Quality</span><strong>{sample.quality}</strong></div>
              <div><span>Credit fit</span><strong>{sample.credits}</strong></div>
            </div>
          </div>
          <div className="sample-detail-player-card" aria-label={`${sample.title} video preview`}>
            <video className="sample-detail-player-video" src={sampleVideoUrl} controls playsInline preload="metadata" poster={sample.thumbnailUrl} />
          </div>
        </section>

        <section className="container sample-detail-keywords-section">
          <div className="showcase-info-card showcase-wide-card">
            <span className="badge">SEO keyword coverage</span>
            <h2>{sample.title} keywords and long-tail searches</h2>
            <p>This sample page supports visitors who search for demos, workflows, examples and similar production directions before starting a request.</p>
            <div className="showcase-pill-row">
              {keywords.slice(0, 10).map((keyword) => <span key={keyword}>{keyword}</span>)}
            </div>
          </div>
        </section>

        <SampleEngagement sampleId={sample.id} initialLikeCount={sample.likeCount} initialShareCount={sample.shareCount} initialComments={sample.comments} />

        <section className="container section home-section-tight sample-detail-workflow">
          <div className="sample-detail-section-head">
            <span className="badge"><Clapperboard size={15} /> What this sample includes</span>
            <h2>Use this page like Kling-style sample inspiration</h2>
            <p className="section-lead">The homepage card stays clean and visual. All details, features and create actions live here.</p>
          </div>
          <div className="grid">
            <div className="card"><Layers color="var(--cyan)" /><h3>Production features</h3><div className="sample-feature-row detail-feature-row">{sample.features.map((feature) => <small key={feature}>{feature}</small>)}</div></div>
            <div className="card"><Copy color="var(--purple)" /><h3>Prompt direction</h3><p>Crelavo opens the assistant with this sample as direction, then lets the user change category, materials, voice, output format and delivery package.</p></div>
            <div className="card"><Sparkles color="var(--green)" /><h3>Next step</h3><p>Users can create a similar production, add materials, confirm credits and track the final output in the production workspace.</p></div>
          </div>
        </section>

        <section className="container section home-section-tight">
          <SampleVideoGallery title="More sample outputs" subtitle="Open another large sample card, then create a similar production from its detail page." limit={3} videos={related} />
        </section>
      </main>
    </>
  );
}
