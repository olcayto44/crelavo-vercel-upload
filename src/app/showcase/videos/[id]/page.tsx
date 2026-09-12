import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { absoluteShowcaseVideoImage, type ShowcaseVideo } from "@/lib/showcase-videos";
import { getConfiguredShowcaseVideo, getConfiguredShowcaseVideos } from "@/lib/showcase-video-config";

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.crelavo.com").trim().replace(/\/$/, "").replace(/^https:\/\/crelavo\.com$/i, "https://www.crelavo.com");

export async function generateStaticParams() { return (await getConfiguredShowcaseVideos()).map((video) => ({ id: video.id })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params; const video = await getConfiguredShowcaseVideo(id);
  if (!video) return { title: "Crelavo video showcase" };
  const imageUrl = absoluteShowcaseVideoImage(video, siteUrl); const title = `${video.title} | Crelavo AI Video Showcase`;
  return { title, description: video.description, alternates: { canonical: `${siteUrl}/showcase/videos/${video.id}` }, openGraph: { title, description: video.description, url: `${siteUrl}/showcase/videos/${video.id}`, siteName: "Crelavo", type: "video.other", images: [{ url: imageUrl }], videos: [{ url: video.videoUrl, type: "video/mp4" }] }, twitter: { card: "summary_large_image", title, description: video.description, images: [imageUrl] } };
}

const CLS_CSS = `
.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}.page-with-rails{padding-left:0!important;padding-right:0!important}#cls{--navy:#070b18;--muted:#aeb8cc;--card:rgba(255,255,255,.06);--line:rgba(255,255,255,.1);--text:#f8fbff;font-family:Inter,system-ui,sans-serif;color:var(--text);background:var(--navy);padding:28px 20px 72px}#cls *{box-sizing:border-box}#cls a{color:inherit;text-decoration:none}#cls .wrap{max-width:1120px;margin:0 auto}#cls .back{display:inline-flex;border:1px solid var(--line);background:rgba(255,255,255,.06);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:650;margin-bottom:22px}#cls .kicker{display:inline-flex;border:1px solid var(--line);background:rgba(14,165,233,.12);color:#7dd3fc;border-radius:999px;padding:6px 12px;font-size:12px;font-weight:650;letter-spacing:.04em;text-transform:uppercase}#cls h1,#cls h2,#cls h3{margin:0;letter-spacing:-.03em}#cls p{margin:0;color:var(--muted);line-height:1.6}#cls .hero{display:grid;grid-template-columns:.9fr 1.1fr;gap:22px;align-items:stretch;margin-bottom:18px}#cls .intro{border:1px solid var(--line);background:linear-gradient(180deg,rgba(14,165,233,.16),rgba(8,16,36,.72));border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:14px}#cls .intro h1{font-size:clamp(36px,4.4vw,52px);line-height:1.05}#cls .intro .lede{font-size:16px;max-width:420px}#cls .chips{display:flex;flex-wrap:wrap;gap:8px}#cls .chip{border:1px solid var(--line);background:rgba(255,255,255,.05);border-radius:999px;padding:6px 10px;font-size:12px;color:#dbeafe}#cls .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:650}#cls .btn-cyan{background:linear-gradient(180deg,#38bdf8,#0284c7);color:#04203a}#cls .btn-ghost{background:rgba(255,255,255,.06);border:1px solid var(--line)}#cls .cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:auto}#cls .player{border:1px solid var(--line);background:#020617;border-radius:24px;overflow:hidden;display:flex;align-items:center}#cls .player video{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#020617}#cls .grid-2{display:grid;grid-template-columns:1.2fr .8fr;gap:14px;margin:14px 0}#cls .card{border:1px solid var(--line);background:var(--card);border-radius:22px;padding:22px}#cls .card h2{font-size:22px;margin-bottom:12px}#cls .card p+p{margin-top:10px}#cls .details{margin-top:4px}#cls .details h2{font-size:24px;margin:10px 0 16px!important}#cls .info{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}#cls .info article{border:1px solid var(--line);background:rgba(2,6,23,.35);border-radius:16px;padding:16px}#cls .info h3{font-size:16px;margin-bottom:8px}#cls .info p{font-size:14px}@media(max-width:900px){#cls .hero,#cls .grid-2,#cls .info{grid-template-columns:1fr}}
`;

const INFO_TITLE: Record<string, string> = {
  "Production context": "What this video shows",
  "Use case": "Best use case",
  "Delivery purpose": "Crelavo workflow",
};
const INFO_FALLBACK = ["What this video shows", "Best use case", "Crelavo workflow"];
const PRO_MO = "https://whop.com/checkout/plan_ujLQgM3kEg0dg";
const PRO_YR = "https://whop.com/checkout/plan_fiabRYr6uWY43";
const POSTER_FALLBACK = "https://www.crelavo.com/showcase/ai-production-studio.webp";

function ideaHref(title: string) {
  const base = /video/i.test(title) ? title : `${title} video`;
  return `/dashboard/assistant-workspace?idea=${encodeURIComponent(base).replace(/%20/g, "+")}&category=video`;
}

function VideoShowcaseCls({ video }: { video: ShowcaseVideo }) {
  const chips = video.bestFor || [];
  const why = video.details || [];
  const info = (video.productionDetails && video.productionDetails.length
    ? video.productionDetails
    : INFO_FALLBACK.map((title, i) => ({ title, text: why[i] || "" }))
  ).map((row, i) => ({
    title: INFO_TITLE[row.title] || row.title || INFO_FALLBACK[i],
    text: row.text || "",
  }));
  const poster = video.imageUrl || POSTER_FALLBACK;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CLS_CSS }} />
      <main id="cls">
        <div className="wrap">
          <a className="back" href="/showcase/explore-samples">← Back to samples</a>
          <div className="hero">
            <div className="intro">
              <span className="kicker">{video.kicker}</span>
              <h1>{video.title}</h1>
              <p className="lede">{video.description}</p>
              <div className="chips">
                {chips.slice(0, 3).map((c) => <span className="chip" key={c}>{c}</span>)}
              </div>
              <div className="cta-row">
                <a className="btn btn-cyan" href={ideaHref(video.title)}>Create a similar video</a>
                <a className="btn btn-ghost" href={PRO_MO}>Start 24-hour Pro preview — $9.99/mo</a>
              </div>
            </div>
            <div className="player">
              <video
                controls muted loop playsInline autoPlay preload="auto"
                poster={poster}
                aria-label={`${video.title} Crelavo AI video showcase`}
              >
                <source src={video.videoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
          <div className="grid-2">
            <section className="card">
              <h2>Why this video matters</h2>
              {why.map((p) => <p key={p}>{p}</p>)}
            </section>
            <section className="card">
              <h2>Best for</h2>
              <div className="chips">
                {chips.map((c) => <span className="chip" key={c}>{c}</span>)}
              </div>
            </section>
          </div>
          <section className="card details">
            <span className="kicker">Video details</span>
            <h2>What this example is about</h2>
            <div className="info">
              {info.map((row) => (
                <article key={row.title}>
                  <h3>{row.title}</h3>
                  <p>{row.text}</p>
                </article>
              ))}
            </div>
          </section>
          <div className="cta-row" style={{ marginTop: 18 }}>
            <a className="btn btn-cyan" href={PRO_MO}>Start 24-hour Pro preview — $9.99/mo</a>
            <a className="btn btn-ghost" href={PRO_YR}>Annual Pro — $99/yr</a>
            <a className="btn btn-ghost" href="/free-tools/ad-performance-score-checker">Free AI ad scorer</a>
            <a className="btn btn-ghost" href="/showcase/explore-samples">More samples</a>
          </div>
        </div>
      </main>
    </>
  );
}

export default async function ShowcaseVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const video = await getConfiguredShowcaseVideo(id); if (!video) notFound();
  const siteContent = await getConfiguredSiteContentConfig();
  return <><Header navLinks={siteContent.navLinks} /><VideoShowcaseCls video={video} /></>;
}
