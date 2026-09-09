import Link from "next/link";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { absoluteShowcaseVideoImage, type ShowcaseVideo } from "@/lib/showcase-videos";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "").replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");

type ShowcaseVideoDetailVideo = Pick<ShowcaseVideo, "id" | "title" | "kicker" | "description" | "videoUrl" | "details" | "bestFor" | "imageUrl" | "duration" | "orientation" | "productionDetails"> & { uploadDate?: string };

function VideoJsonLd({ video }: { video: ShowcaseVideoDetailVideo }) {
  const pageUrl = `${siteUrl}/showcase/videos/${video.id}`;
  const thumbnailUrl = absoluteShowcaseVideoImage(video, siteUrl);
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": `${pageUrl}#video`,
    name: video.title,
    description: video.description,
    thumbnailUrl: [thumbnailUrl],
    uploadDate: video.uploadDate,
    contentUrl: video.videoUrl,
    embedUrl: pageUrl,
    url: pageUrl,
    publisher: {
      "@type": "Organization",
      name: "Crelavo",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/icon.svg` }
    },
    potentialAction: { "@type": "WatchAction", target: pageUrl },
    about: video.bestFor.join(", "),
    genre: video.kicker
  };
  if (video.duration) schema.duration = video.duration;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export function ShowcaseVideoDetail({
  video,
  backHref = "/#video-showcase",
  backLabel = "Back to showcase videos",
  actionHref = `/dashboard/create?category=video&sample=${encodeURIComponent(video.id)}`,
  actionLabel = "Create a similar video"
}: {
  video: ShowcaseVideoDetailVideo;
  backHref?: string;
  backLabel?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const imageUrl = absoluteShowcaseVideoImage(video, siteUrl);
  return (
    <main>
      <SiteStructuredData />
      <VideoJsonLd video={video} />
      <Header />
      <section className="showcase-detail-shell">
        <Link className="btn secondary" href={backHref}><ArrowLeft size={16} /> {backLabel}</Link>
        <section className="video-showcase-hero-layout">
          <div className="showcase-detail-hero">
            <span className="badge">{video.kicker}</span>
            <h1>{video.title}</h1>
            <p>{video.description}</p>
            <div className="social-chip-row video-showcase-hero-chips">
              {video.bestFor.slice(0, 3).map((tag) => <span key={tag}><CheckCircle2 size={14} /> {tag}</span>)}
            </div>
            <Link className="btn" href={actionHref}><PlayCircle size={16} /> {actionLabel}</Link>
          </div>
          <div className={`video-showcase-player-section ${video.orientation === "portrait" ? "portrait" : "landscape"}`}>
            <div className="video-showcase-player-frame">
              <video className="video-showcase-player-media" controls playsInline preload="metadata" poster={imageUrl} aria-label={`${video.title} Crelavo AI video showcase`}>
                <source src={video.videoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
        </section>
        <div className="showcase-detail-grid">
          <section className="showcase-detail-card">
            <h2>Why this video matters</h2>
            {video.details.map((detail) => <p key={detail}>{detail}</p>)}
          </section>
          <section className="showcase-detail-card">
            <h2>Best for</h2>
            <div className="social-chip-row">
              {video.bestFor.map((tag) => <span key={tag}><CheckCircle2 size={14} /> {tag}</span>)}
            </div>
          </section>
        </div>
        <section className="showcase-detail-card showcase-video-info-card">
          <span className="badge">Video details</span>
          <h2>What this example is about</h2>
          <div className="showcase-video-info-grid">
            {(video.productionDetails ?? video.details.map((detail, index) => ({ title: index === 0 ? "Production context" : index === 1 ? "Use case" : "Delivery purpose", text: detail }))).map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
