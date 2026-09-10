"use client";

import { useState } from "react";
import type { ConfiguredShowcaseVideo } from "@/lib/showcase-video-config";

type Filter = "all" | "product" | "ugc" | "fashion" | "cinematic" | "pets";

const fallbackPoster = "https://cdn.hailuoai.video/moss/prod/2026-08-10-22/image/1786373810525943745-1786373810523.png";

function categoryFor(video: ConfiguredShowcaseVideo): Exclude<Filter, "all"> {
  const id = video.id;
  if (/dog|pet/.test(id)) return "pets";
  if (/emerald|leopard|giant-fashion|coastal-bag/.test(id)) return "fashion";
  if (/ugc|relationship|turkish-avatar/.test(id)) return "ugc";
  if (/product|ad-creative|lower-ad|serum|skincare|ramen|soda|lip-balm|headphone/.test(id)) return "product";
  return "cinematic";
}

const css = `
.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}.page-with-rails{padding-left:0!important;padding-right:0!important}#cle{--navy:#070b18;--cyan:#0ea5e9;--muted:#aeb8cc;--card:rgba(255,255,255,.06);--line:rgba(255,255,255,.1);--text:#f8fbff;font-family:Inter,system-ui,sans-serif;color:var(--text);background:var(--navy);padding:28px 20px 80px}#cle *{box-sizing:border-box}#cle a{color:inherit;text-decoration:none}#cle .wrap{max-width:1180px;margin:0 auto}#cle .back{display:inline-flex;border:1px solid var(--line);background:rgba(255,255,255,.06);border-radius:999px;padding:8px 14px;font-size:13px;font-weight:650;margin-bottom:22px}#cle .kicker{display:inline-flex;border:1px solid var(--line);background:rgba(14,165,233,.12);color:#7dd3fc;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}#cle h1,#cle h2{margin:0;letter-spacing:-.03em}#cle p{margin:0;color:var(--muted);line-height:1.6}#cle .hero{display:grid;grid-template-columns:1.05fr .95fr;gap:22px;align-items:stretch;margin-bottom:22px}#cle .intro{border:1px solid var(--line);background:linear-gradient(180deg,rgba(14,165,233,.16),rgba(8,16,36,.78));border-radius:28px;padding:28px;display:flex;flex-direction:column;gap:14px}#cle .intro h1{font-size:clamp(36px,5vw,58px);line-height:1.02}#cle .intro .lede{font-size:16px;max-width:520px}#cle .cta-row,#cle .filters{display:flex;flex-wrap:wrap;gap:10px}#cle .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:12px 18px;font-size:14px;font-weight:650}#cle .btn-cyan{background:linear-gradient(180deg,#38bdf8,#0284c7);color:#04203a}#cle .btn-ghost{background:rgba(255,255,255,.06);border:1px solid var(--line)}#cle .hero-art{border:1px solid var(--line);border-radius:24px;overflow:hidden;background:#020617;min-height:280px}#cle .hero-art img{width:100%;height:100%;object-fit:cover;display:block;aspect-ratio:16/9}#cle .cats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:8px 0 28px}#cle .cat{border:1px solid var(--line);background:var(--card);border-radius:20px;overflow:hidden}#cle .cat img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}#cle .cat span{display:block;padding:12px 14px 16px;font-size:14px;font-weight:650}#cle .filters{margin:0 0 16px}#cle .filters button{border:1px solid var(--line);background:rgba(255,255,255,.05);color:#dbeafe;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:650;cursor:pointer;font-family:inherit}#cle .filters button.on{background:rgba(14,165,233,.18);border-color:rgba(14,165,233,.45);color:#7dd3fc}#cle .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#cle .tile{border:1px solid var(--line);background:var(--card);border-radius:22px;overflow:hidden;display:flex;flex-direction:column}#cle .tile video{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#020617}#cle .meta{display:flex;flex-direction:column;gap:8px;padding:14px 16px 18px}#cle .meta strong{font-size:18px;letter-spacing:-.02em}#cle .meta em{font-style:normal;color:var(--muted);font-size:13px;line-height:1.5}#cle .band{margin-top:28px;border:1px solid var(--line);background:linear-gradient(180deg,rgba(14,165,233,.14),rgba(8,16,36,.7));border-radius:24px;padding:28px;text-align:center}#cle .band h2{font-size:28px;margin-bottom:8px}#cle .band p{margin-bottom:16px}@media(max-width:980px){#cle .hero,#cle .cats,#cle .grid{grid-template-columns:1fr 1fr}}@media(max-width:640px){#cle .hero,#cle .cats,#cle .grid{grid-template-columns:1fr}}
`;

const categories = [
  ["Product ads", "https://cdn.hailuoai.video/moss/prod/2026-08-09-04/image/1786222106538364280-1786222106536.png"],
  ["UGC & avatars", "https://cdn.hailuoai.video/moss/prod/2026-08-11-04/image/1786392552674876040-1786392552671.png"],
  ["Cinematic", "https://cdn.hailuoai.video/moss/prod/2026-08-11-06/image/1786400804362105136-1786400804359.png"],
  ["Live commerce", "https://cdn.hailuoai.video/moss/prod/2026-08-10-21/image/1786368284679743170-1786368284668.png"]
] as const;

export function ExploreSamplesBody({ videos }: { videos: ConfiguredShowcaseVideo[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: `All ${videos.length}` },
    { id: "product", label: "Product ads" },
    { id: "ugc", label: "UGC" },
    { id: "fashion", label: "Fashion" },
    { id: "cinematic", label: "Cinematic" },
    { id: "pets", label: "Pets" }
  ];
  const visible = filter === "all" ? videos : videos.filter((video) => categoryFor(video) === filter);

  return <><style dangerouslySetInnerHTML={{ __html: css }} /><section id="cle"><div className="wrap">
    <a className="back" href="/">← Back to homepage</a>
    <div className="hero"><div className="intro"><span className="kicker">Sample output feed</span><h1>Explore samples</h1><p className="lede">Watch real Crelavo productions. Open any card for the full example, then start a similar video or a 24-hour Pro preview.</p><div className="cta-row"><a className="btn btn-cyan" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Start 24-hour Pro preview — $9.99/mo</a><a className="btn btn-ghost" href="/dashboard/assistant-workspace">Open assistant</a><a className="btn btn-ghost" href="/pricing">View pricing</a></div></div><div className="hero-art"><img src={fallbackPoster} alt="Crelavo sample production wall" /></div></div>
    <div className="cats">{categories.map(([label, image]) => <article className="cat" key={label}><img src={image} alt={`${label} still`} /><span>{label}</span></article>)}</div>
    <div className="filters" role="tablist" aria-label="Filter samples">{filters.map((item) => <button type="button" role="tab" aria-selected={filter === item.id} className={filter === item.id ? "on" : ""} onClick={() => setFilter(item.id)} key={item.id}>{item.label}</button>)}</div>
    <div className="grid" id="cle-grid">{visible.map((video) => <a className="tile" data-cat={categoryFor(video)} href={`/showcase/videos/${video.id}`} key={video.id}><video muted loop autoPlay playsInline preload="metadata" poster={video.imageUrl || fallbackPoster} src={video.videoUrl}></video><span className="meta"><span className="kicker">{video.kicker}</span><strong>{video.title}</strong><em>{video.description}</em></span></a>)}</div>
    <div className="band"><h2>24 hours to see the studio. Then $9.99/month unless you cancel.</h2><p>Card required. No charge until the preview ends. Annual Pro is $99/year after the same 24-hour window.</p><div className="cta-row" style={{justifyContent:"center"}}><a className="btn btn-cyan" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Start 24-hour Pro preview — $9.99/mo</a><a className="btn btn-ghost" href="https://whop.com/checkout/plan_fiabRYr6uWY43">Annual Pro — $99/yr</a></div></div>
  </div></section></>;
}