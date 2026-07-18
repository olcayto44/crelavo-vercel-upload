import Link from "next/link";
import type { SampleVideo } from "@/lib/sample-videos";

type PageDemoVideoSectionProps = {
  sample?: SampleVideo;
  badge: string;
  title: string;
  description: string;
  fallbackFeatures: string[];
  ctaHref: string;
  ctaLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  adminHint: string;
};

export function pickPageDemoVideo(videos: SampleVideo[], keys: string[]) {
  const normalizedKeys = keys.map((key) => key.toLowerCase());
  return videos.find((item) => {
    const haystack = [item.id, item.category, item.title].join(" ").toLowerCase();
    return normalizedKeys.some((key) => haystack.includes(key));
  });
}

export function PageDemoVideoSection({ sample, badge, title, description, fallbackFeatures, ctaHref, ctaLabel, secondaryHref, secondaryLabel, adminHint }: PageDemoVideoSectionProps) {
  const videoTitle = sample?.title || title;
  const videoDescription = sample?.description || description;
  const detailFeatures = sample?.features?.length ? sample.features : fallbackFeatures;
  void adminHint;

  return (
    <section className="page-demo-video-section showcase-detail-hero tone-green">
      <div className="showcase-detail-copy">
        <span className="badge">{badge}</span>
        <h2 className="page-demo-showcase-title">{videoTitle}</h2>
        <p>{videoDescription}</p>
        <div className="showcase-detail-actions">
          <Link className="btn" href={ctaHref}>{ctaLabel}</Link>
          {secondaryHref && secondaryLabel ? <Link className="btn secondary" href={secondaryHref}>{secondaryLabel}</Link> : null}
        </div>
      </div>
      {sample?.videoUrl ? (
        <div className="showcase-video-panel" aria-label={`${title} video preview`}>
          <video className="showcase-detail-video" src={sample.videoUrl} poster={sample.thumbnailUrl} controls playsInline preload="metadata" />
        </div>
      ) : (
        <div className="showcase-info-card" aria-label={`${title} preview details`}>
          <span className="badge">Preview access</span>
          <h3>What customers can test</h3>
          <ul>
            {detailFeatures.map((feature) => <li key={feature}>{feature}</li>)}
          </ul>
          <p>Preview outputs are prepared inside the customer workflow. The 24-hour preview includes one 10-second watermarked video, and downloads are closed until the selected plan starts.</p>
        </div>
      )}
    </section>
  );
}
