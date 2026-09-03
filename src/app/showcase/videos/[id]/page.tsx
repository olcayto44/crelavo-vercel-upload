import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { absoluteShowcaseVideoImage } from "@/lib/showcase-videos";
import { getConfiguredShowcaseVideo, getConfiguredShowcaseVideos } from "@/lib/showcase-video-config";
import { ShowcaseVideoDetail } from "@/components/ShowcaseVideoDetail";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "").replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");

export async function generateStaticParams() {
  const videos = await getConfiguredShowcaseVideos();
  return videos.map((video) => ({ id: video.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const video = await getConfiguredShowcaseVideo(id);
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
       images: [{ url: imageUrl, width: video.orientation === "portrait" ? 720 : 1280, height: video.orientation === "portrait" ? 1280 : 720, alt: `${video.title} video thumbnail` }],
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

export default async function ShowcaseVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const video = await getConfiguredShowcaseVideo(id);
  if (!video) notFound();
  return <ShowcaseVideoDetail video={video} />;
}
