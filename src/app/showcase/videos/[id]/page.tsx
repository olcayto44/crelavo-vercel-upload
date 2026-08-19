import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteShowcaseVideoImage, getShowcaseVideo, showcaseVideos } from "@/lib/showcase-videos";
import { ShowcaseVideoDetail } from "@/components/ShowcaseVideoDetail";

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
  return <ShowcaseVideoDetail video={video} />;
}
