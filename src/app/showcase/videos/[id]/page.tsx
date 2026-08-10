import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, PlayCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { SiteStructuredData } from "@/components/SiteStructuredData";
import { absoluteShowcaseVideoImage, getShowcaseVideo, showcaseVideos } from "@/lib/showcase-videos";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "").replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");

export function generateStaticParams() {
  return showcaseVideos.map((video) => ({ id: video.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = getShowcaseVideo(id);
  if (!video) return { title: "Crelavo video showcase" };
  const pageUrl = `${siteUrl}/showcase/videos/${video.id}`;
  const imageUrl = absoluteShowcaseVideoImage(video, siteUrl);
  return {
    title: `${video.title} | Crelavo AI Video Showcase`,
    description: video.description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `${video.title} | Crelavo AI Video Showcase`,
      description: video.description,
      url: pageUrl,
      siteName: "Crelavo",
      type: "video.other",
      images: [{ url: imageUrl, width: 1280, height: 720, alt: `${video.title} video thumbnail` }],
      videos: [{ url: video.videoUrl, type: "video/mp4" }]
    },
    twitter: {
      card: "summary_large_image",
      title: `${video.title} | Crelavo AI Video Showcase`,
      description: video.description,
      images: [imageUrl]
    }
  };
}

function VideoJsonLd({ video }: { video: NonNullable<ReturnType<typeof getShowcaseVideo>> }) {
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

export default async function ShowcaseVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = getShowcaseVideo(id);
  if (!video) notFound();
  const imageUrl = absoluteShowcaseVideoImage(video, siteUrl);
  return (
    <main>
      <SiteStructuredData />
      <VideoJsonLd video={video} />
      <Header />
      <section className="showcase-detail-shell">
        <Link className="btn secondary" href="/#video-showcase"><ArrowLeft size={16} /> Back to homepage videos</Link>
        <div className="showcase-detail-hero">
          <span className="badge">{video.kicker}</span>
          <h1>{video.title}</h1>
          <p>{video.description}</p>
        </div>
        <div className="showcase-detail-video-row" style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
          <div className="showcase-detail-video-wrap" style={{ width: "fit-content", maxWidth: "min(760px, 100%)", marginLeft: "auto", marginRight: "auto" }}>
            <video className="showcase-detail-video" style={{ width: "auto", maxWidth: "100%", height: "auto", maxHeight: "min(48vh, 420px)", display: "block" }} controls playsInline preload="metadata" poster={imageUrl} aria-label={`${video.title} Crelavo AI video showcase`}>
              <source src={video.videoUrl} type="video/mp4" />
            </video>
          </div>
        </div>
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
            <Link className="btn" href={`/dashboard/create?category=video&sample=${encodeURIComponent(video.id)}`}><PlayCircle size={16} /> Create a similar video</Link>
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
