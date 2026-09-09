import Link from "next/link";
import type { ShowcaseVideo } from "../../lib/showcase-videos";

export default function VideoTile({
  video,
  compact = false,
}: {
  video: ShowcaseVideo;
  compact?: boolean;
}) {
  return (
    <article className="cl-vitrin-tile">
      <Link
        className="cl-vitrin-shot"
        href={`/showcase/videos/${video.id}`}
        aria-label={`Watch ${video.title}`}
      >
        <video
          muted
          playsInline
          preload="metadata"
          poster={video.imageUrl}
          src={`${video.videoUrl}#t=0.1`}
        />
        <span className="cl-play" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <path d="M3 1.8v8.4L10.2 6 3 1.8Z" fill="currentColor" />
          </svg>
        </span>
      </Link>
      <div className="cl-vitrin-meta">
        <p className="cl-kicker">{video.kicker}</p>
        <h3>{video.title}</h3>
        {compact ? null : <p>{video.description}</p>}
        <div className="cl-vitrin-actions">
          <Link className="cl-btn" href={`/showcase/videos/${video.id}`}>
            Watch full screen
          </Link>
          <Link className="cl-text-link" href="/categories">
            Open category
          </Link>
        </div>
      </div>
    </article>
  );
}
