import Link from "next/link";
import { showcaseVideos } from "../../lib/showcase-videos";
import VideoTile from "./VideoTile";

export default function VideoVitrin({
  limit,
  heading = "Crelavo video showcase",
  kicker = "Showcase",
}: {
  limit?: number;
  heading?: string;
  kicker?: string;
}) {
  const items = typeof limit === "number" ? showcaseVideos.slice(0, limit) : showcaseVideos;
  return (
    <section className="cl-home-block" aria-labelledby="video-vitrin">
      <p className="cl-kicker">{kicker}</p>
      <h2 className="cl-h2" id="video-vitrin">
        {heading}
      </h2>
      <p className="cl-muted" style={{ marginBottom: 18 }}>
        Real Crelavo video examples: viral visual concepts, premium motion,
        presenter demos and localization-ready creative. Click a tile for the
        cream detail page. Media is the live public catalog — this pack does
        not invent a video backend.
      </p>
      <div className="cl-vitrin-grid">
        {items.map((v) => (
          <VideoTile key={v.id} video={v} />
        ))}
      </div>
      {typeof limit === "number" ? (
        <p style={{ marginTop: 22 }}>
          <Link className="cl-text-link" href="/showcase/videos">
            Open full showcase
          </Link>
        </p>
      ) : null}
    </section>
  );
}
