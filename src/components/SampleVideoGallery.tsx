"use client";

import { useEffect, useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { Heart, PlayCircle } from "lucide-react";
import type { SampleVideo } from "@/lib/sample-videos";
import { sampleVideos } from "@/lib/sample-videos";

type SampleVideoGalleryProps = {
  title?: string;
  subtitle?: string;
  limit?: number;
  category?: string;
  videos?: SampleVideo[];
  shuffleOnLoad?: boolean;
};

function shuffleSamples(items: SampleVideo[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

const fallbackSampleVideoUrls = [
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200420847185558-1783200420793.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200446193878757-1783200446163.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200475974783117-1783200475940.mp4",
  "https://cdn.hailuoai.video/moss/prod/2026-07-05-05/video/1783200506566226583-1783200506537.mp4"
];

function sampleLikeCount(item: SampleVideo) {
  return 120 + Array.from(item.id).reduce((total, char) => total + char.charCodeAt(0), 0) % 880;
}

function samplePreviewUrl(item: SampleVideo, index: number) {
  return item.videoUrl || fallbackSampleVideoUrls[index % fallbackSampleVideoUrls.length];
}

function playPreview(event: MouseEvent<HTMLAnchorElement>) {
  const video = event.currentTarget.querySelector("video");
  video?.play().catch(() => undefined);
}

function pausePreview(event: MouseEvent<HTMLAnchorElement>) {
  const video = event.currentTarget.querySelector("video");
  if (!video) return;
  video.pause();
  video.currentTime = 0;
}

export function SampleVideoGallery({ title = "Sample video outputs", subtitle = "Verified video previews from Crelavo production workflows.", limit, category, videos = sampleVideos, shuffleOnLoad = false }: SampleVideoGalleryProps) {
  const baseItems = useMemo(() => {
    const filtered = category ? videos.filter((item) => item.category.toLowerCase().includes(category.toLowerCase())) : videos;
    return typeof limit === "number" ? filtered.slice(0, limit) : filtered;
  }, [category, limit, videos]);
  const [items, setItems] = useState<SampleVideo[]>(baseItems);
  const [allowVideoPreview, setAllowVideoPreview] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px) and (prefers-reduced-motion: no-preference)");
    const updatePreviewMode = () => setAllowVideoPreview(query.matches);
    updatePreviewMode();
    query.addEventListener("change", updatePreviewMode);
    return () => query.removeEventListener("change", updatePreviewMode);
  }, []);

  useEffect(() => {
    setItems(shuffleOnLoad ? shuffleSamples(baseItems) : baseItems);
  }, [baseItems, shuffleOnLoad]);

  if (!items.length) return null;

  return (
    <section className="sample-video-section">
      <div className="sample-video-head">
        <div>
          <span className="badge"><PlayCircle size={15} /> Sample outputs</span>
          <h2>{title}</h2>
          <p className="section-lead">{subtitle}</p>
        </div>
        <Link className="btn secondary" href="/categories">View all categories</Link>
      </div>
      <div className="sample-video-grid sample-video-grid-cinematic">
        {items.map((item, index) => (
          <Link className="sample-video-card sample-video-card-cinematic" href={`/samples/${item.id}`} key={item.id} onMouseEnter={allowVideoPreview ? playPreview : undefined} onMouseLeave={allowVideoPreview ? pausePreview : undefined}>
            <div className="sample-video-preview sample-video-preview-cinematic">
              {allowVideoPreview ? (
                <video className="sample-card-video" src={samplePreviewUrl(item, index)} muted loop playsInline preload="none" poster={item.thumbnailUrl} />
              ) : item.thumbnailUrl ? (
                <img className="sample-card-video" src={item.thumbnailUrl} alt={`${item.title} static preview`} loading="lazy" decoding="async" />
              ) : <div className="sample-card-video sample-card-static-fallback" aria-hidden="true" />}
              <span className="sample-video-play"><PlayCircle size={34} /></span>
              <small>{item.category}</small>
              <strong>{item.title}</strong>
              <span className="sample-card-like"><Heart size={15} /> {sampleLikeCount(item).toLocaleString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
