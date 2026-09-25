import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";
import { showcaseVideos } from "@/lib/showcase-videos";

export const metadata: Metadata = {
  title: "Crelavo AI Production Studio for Ecommerce",
  description: "Product videos, campaigns and live-commerce from one AI production studio.",
  alternates: { canonical: "/" },
  openGraph: { title: "Crelavo AI Production Studio for Ecommerce", description: "Product videos, campaigns and live-commerce from one AI production studio.", url: "/", type: "website", images: [{ url: "https://www.crelavo.com/showcase/ai-production-studio.webp", width: 1792, height: 1024, alt: "Crelavo AI production studio" }] }
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Crelavo",
  url: "https://www.crelavo.com/",
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "9.99", priceCurrency: "USD", url: "/pricing#clp" },
  publisher: { "@type": "Organization", name: "Crelavo", url: "https://www.crelavo.com/" }
};

const fallbackPoster = "/showcase/ai-production-studio.webp";
const landscapeFilmIds = new Set(["product-link-to-video-showcase", "ad-creative-angles-showcase", "lower-ad-costs-showcase", "crelavo-shot-montage-road", "crelavo-action-film-final"]);

const films = showcaseVideos.map((video) => ({
  href: `/showcase/videos/${video.id}`,
  kicker: video.kicker,
  title: video.title,
  poster: video.imageUrl || fallbackPoster,
  video: video.videoUrl,
  landscape: landscapeFilmIds.has(video.id)
}));

const css = `
.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none}
header.site-main-nav{background:#070b18}
@media(max-width:980px){header.container.nav.site-main-nav,header.nav.site-main-nav,header.site-main-nav{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;gap:8px!important;min-height:56px;padding:8px 12px!important;position:sticky;top:0;z-index:80;background:#070b18;overflow:visible!important}header.site-main-nav .logo{flex:0 0 auto;z-index:3;position:relative}header.site-main-nav nav,header.site-main-nav nav.nav-links,header.site-main-nav nav.primary-nav-links,header.site-main-nav .nav-links,header.site-main-nav .primary-nav-links,header.site-main-nav .tools-mega-menu,header.site-main-nav .tools-mega-wrap,header.site-main-nav .nav-session-bar,header.site-main-nav .header-language-links{display:none!important;visibility:hidden!important;pointer-events:none!important}.cl-mnav{display:inline-flex!important;flex:0 0 34px;align-items:center;justify-content:center;width:34px;height:34px;padding:0;margin:0 8px 0 0;border:0;background:transparent;color:#f8fbff;border-radius:8px;cursor:pointer;z-index:4;position:relative!important;gap:4px;flex-direction:column}.cl-mnav span{display:block;width:19px;height:2px;border-radius:2px;background:#f8fbff;transition:transform .2s ease,opacity .2s ease}.cl-mnav.is-open span:nth-child(1){transform:translateY(6px) rotate(45deg)}.cl-mnav.is-open span:nth-child(2){opacity:0}.cl-mnav.is-open span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}.cl-mobile-actions{display:flex;align-items:center;gap:8px;margin-left:auto;white-space:nowrap}.cl-mobile-actions a{color:#f8fbff;text-decoration:none;font:600 11px/1 Inter,system-ui,sans-serif;padding:7px 8px;border-radius:8px}.cl-mobile-actions a:first-child{background:#0ea5e9;color:#04203a}.cl-mobile-actions a:last-child{border:1px solid rgba(255,255,255,.16)}
}
@media(min-width:981px){.cl-mnav,#cl-mnav-panel,.cl-mobile-actions{display:none!important}}
@media(max-width:420px){header.site-main-nav .header-language-links{display:none!important}header.site-main-nav .nav-session-bar{max-width:64%}}#clh{--navy:#070b18;--cyan:#0ea5e9;--muted:#aeb8cc;--card:rgba(255,255,255,.055);--line:rgba(255,255,255,.1);--text:#f8fbff;font-family:Inter,system-ui,sans-serif;color:var(--text);background:var(--navy);padding:0 0 88px}
#clh *{box-sizing:border-box}#clh a{color:inherit;text-decoration:none}#clh h1,#clh h2,#clh h3{margin:0;letter-spacing:-.04em}#clh p{margin:0;color:var(--muted);line-height:1.55}#clh .wrap{max-width:1180px;margin:0 auto;padding:0 20px}#clh .btn{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:13px 22px;font-size:14px;font-weight:650;border:1px solid transparent}#clh .btn-cyan{background:linear-gradient(180deg,#38bdf8,#0284c7);color:#04203a;box-shadow:0 0 32px rgba(14,165,233,.35)}#clh .btn-ghost{background:rgba(255,255,255,.06);border-color:var(--line);color:var(--text)}#clh .stage{position:relative;min-height:min(92vh,860px);overflow:hidden;display:flex;align-items:flex-end;background:#020617}#clh .stage-bg{position:absolute;inset:0;display:flex;align-items:center;justify-content:flex-end;background:#020617}#clh .stage-bg video{width:100%;height:100%;object-fit:cover;object-position:center 28%;display:block}#clh .stage-veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,11,24,.2) 0%,rgba(7,11,24,.45) 42%,rgba(7,11,24,.94) 100%),linear-gradient(90deg,rgba(7,11,24,.72) 0%,rgba(7,11,24,.15) 55%,rgba(7,11,24,.55) 100%);pointer-events:none}#clh .stage-grain{position:absolute;inset:0;pointer-events:none;opacity:.18;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")}#clh .stage-copy{position:relative;z-index:2;width:100%;padding:56px 20px 48px}#clh .stage-copy .inner{max-width:1180px;margin:0 auto}#clh .live{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(14,165,233,.35);background:rgba(14,165,233,.12);color:#7dd3fc;border-radius:999px;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}#clh .live i{width:7px;height:7px;border-radius:50%;background:#0ea5e9;box-shadow:0 0 10px #0ea5e9;animation:clh-pulse 1.6s ease-in-out infinite}#clh .stage h1{font-size:clamp(44px,8vw,92px);line-height:.92;max-width:16ch;margin:18px 0 16px;color:#f8fbff}#clh .stage h1 em{font-style:normal;color:#7dd3fc}#clh .lede{max-width:560px;font-size:17px;margin-bottom:26px}#clh .cta-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px}#clh .proof{display:flex;flex-wrap:wrap;gap:16px;color:var(--muted);font-size:13px}#clh .proof b{color:#f8fbff;font-weight:650}#clh .wall{max-width:none;padding:64px 12px 8px}#clh .kicker{display:inline-flex;color:#7dd3fc;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}#clh .wall h2,#clh .paths h2,#clh .packs-head h2,#clh .final h2{font-size:clamp(28px,4vw,46px);margin:0 0 8px}#clh .sub{margin-bottom:22px}#clh .films{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}#clh .film{position:relative;display:block;border-radius:22px;overflow:hidden;border:1px solid var(--line);background:#020617;aspect-ratio:9/16}#clh .film video{width:100%;height:100%;object-fit:cover;object-position:center center;display:block;pointer-events:none;transition:transform .8s ease}#clh .film:hover video{transform:scale(1.04)}#clh .film .meta{position:absolute;left:0;right:0;bottom:0;padding:52px 16px 14px;background:linear-gradient(transparent,rgba(7,11,24,.92))}#clh .film small{display:block;color:#7dd3fc;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px}#clh .film h3{font-size:18px}#clh .more{display:inline-flex;margin-top:18px;color:#7dd3fc;font-weight:650}#clh .paths{padding:56px 0 8px}#clh .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}#clh .card{border:1px solid var(--line);background:var(--card);border-radius:22px;padding:22px;min-height:168px;display:flex;flex-direction:column;gap:8px}#clh .card span{color:#7dd3fc;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}#clh .card h3{font-size:22px}#clh .card p{font-size:14px;flex:1}#clh .packs-head{padding:56px 0 0}#clh .packs{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}#clh .pack{border:1px solid var(--line);background:var(--card);border-radius:22px;padding:20px}#clh .pack span{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:4px 10px;font-size:11px;color:var(--muted);margin-bottom:10px}#clh .pack strong{display:block;font-size:24px;margin-bottom:6px}#clh .pack p{font-size:13.5px}#clh .final{margin:64px 20px 0;max-width:1180px;margin-left:auto;margin-right:auto;border:1px solid var(--line);background:linear-gradient(180deg,rgba(14,165,233,.16),rgba(255,255,255,.03));border-radius:28px;padding:40px 24px;text-align:center}#clh .final p{max-width:620px;margin:0 auto 20px}@keyframes clh-pulse{0%,100%{opacity:1}50%{opacity:.35}}@media(prefers-reduced-motion:reduce){#clh .live i{animation:none}#clh .film:hover video{transform:none}}@media(max-width:980px){#clh .films,#clh .grid-3,#clh .packs{grid-template-columns:1fr 1fr}#clh .stage{min-height:min(86vh,720px)}#clh .stage h1{font-size:clamp(36px,11vw,64px)}#clh .stage-bg{justify-content:center}}@media(max-width:680px){#clh .films{grid-template-columns:1fr 1fr}#clh .grid-3,#clh .packs{grid-template-columns:1fr}#clh .stage{min-height:78vh}#clh .stage-copy{padding:40px 16px 36px}#clh .final{margin:48px 16px 0;padding:28px 16px}#clh .stage-bg video{width:100%;height:100%;object-fit:cover;object-position:center 24%}}
.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}
nav#cl-mnav-panel{display:none!important}
#cl-mnav-toggle{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
label.cl-mnav,#cl-mnav-sheet,.cl-sticky{display:none}
#clh{overflow-x:hidden}
#clh .films{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important}
#clh .film{position:relative!important;width:auto!important;max-width:none!important;height:auto!important;aspect-ratio:9/16!important;overflow:hidden!important}
#clh .film video,#clh a.film>video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center!important}
#clh .stage-bg{position:absolute!important;inset:0!important;display:block!important}
#clh .stage-bg video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center 28%!important}
@media(max-width:980px){
header.container.nav.site-main-nav,header.nav.site-main-nav,header.site-main-nav{display:flex!important;align-items:center!important;justify-content:center!important;min-height:56px!important;height:56px!important;padding:8px 56px 8px 12px!important;position:sticky;top:0;z-index:80;background:#070b18;overflow:hidden!important}
header.site-main-nav .logo{display:flex!important;visibility:visible!important;position:relative;z-index:3}
header.site-main-nav nav,header.site-main-nav .nav-links,header.site-main-nav .primary-nav-links,header.site-main-nav .tools-mega-wrap,header.site-main-nav .tools-mega-menu,header.site-main-nav .nav-session-bar,header.site-main-nav .header-language-links,header.site-main-nav button.cl-mnav,header.site-main-nav .cl-mobile-actions{display:none!important;visibility:hidden!important;pointer-events:none!important}
label.cl-mnav{display:inline-flex!important;position:fixed!important;top:10px;right:12px;z-index:300;flex-direction:column;align-items:center;justify-content:center;gap:4px;width:34px;height:34px;padding:0;border:0;background:transparent;cursor:pointer}
label.cl-mnav span{display:block;width:19px;height:2px;border-radius:2px;background:#f8fbff;transition:transform .2s ease,opacity .2s ease}
#cl-mnav-toggle:checked + label.cl-mnav span:nth-child(1){transform:translateY(6px) rotate(45deg)}
#cl-mnav-toggle:checked + label.cl-mnav span:nth-child(2){opacity:0}
#cl-mnav-toggle:checked + label.cl-mnav span:nth-child(3){transform:translateY(-6px) rotate(-45deg)}
#cl-mnav-sheet{display:none;position:fixed;inset:0;z-index:290;background:#070b18;padding:64px 22px 96px;overflow:auto;font-family:Inter,system-ui,sans-serif}
#cl-mnav-toggle:checked ~ #cl-mnav-sheet{display:block!important}
#cl-mnav-sheet>a{display:block;padding:13px 0;border-bottom:1px solid rgba(255,255,255,.1);color:#f8fbff;text-decoration:none;font:650 16px/1.2 Inter,system-ui,sans-serif}
#cl-mnav-sheet .cl-langs{display:flex;gap:10px;padding-top:16px}
#cl-mnav-sheet .cl-langs a{color:#f8fbff;text-decoration:none;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:8px 14px;font:650 13px/1 Inter,system-ui,sans-serif}
.cl-sticky{display:flex!important;position:fixed;left:0;right:0;bottom:0;z-index:250;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:rgba(7,11,24,.94);border-top:1px solid rgba(255,255,255,.1);backdrop-filter:blur(12px)}
.cl-sticky a{flex:1;display:flex;align-items:center;justify-content:center;height:44px;border-radius:999px;text-decoration:none;font:650 14px/1 Inter,system-ui,sans-serif}
.cl-sticky a.pro{background:linear-gradient(180deg,#38bdf8,#0284c7);color:#04203a}
.cl-sticky a.login{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.16);color:#f8fbff}
#clh{padding-bottom:108px}
#clh .films{grid-template-columns:repeat(2,minmax(0,1fr))!important}
#clh .grid-3,#clh .packs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
[aria-label="Open Crelavo live avatar"]{transform:translateY(-64px)}
}
@media(min-width:981px){#cl-mnav-toggle,label.cl-mnav,#cl-mnav-sheet,.cl-sticky{display:none!important}}
@media(max-width:680px){#clh .films{grid-template-columns:repeat(2,minmax(0,1fr))!important}#clh .grid-3,#clh .packs{grid-template-columns:1fr!important}#clh .stage-bg video{object-position:center 24%!important}}#cl-mnav-panel{display:none!important;visibility:hidden!important;height:0!important;max-height:0!important;overflow:hidden!important;position:absolute!important;left:-9999px!important;width:0!important;pointer-events:none!important}
html body #clh .stage{position:relative!important;min-height:min(92vh,860px)!important;overflow:hidden!important;display:flex!important;align-items:flex-end!important;background:#020617!important}
html body #clh .stage-bg{position:absolute!important;inset:0!important;display:block!important;width:100%!important;height:100%!important;margin:0!important}
html body #clh .stage-bg video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;min-width:100%!important;min-height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center 28%!important;display:block!important}
html body #clh .films{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:14px!important;align-items:start!important;height:auto!important}
html body #clh a.film{position:relative!important;display:block!important;width:100%!important;height:0!important;padding:0!important;padding-top:177.777%!important;aspect-ratio:unset!important;min-height:0!important;max-height:none!important;overflow:hidden!important;border-radius:22px!important}
html body #clh a.film video{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover!important;object-position:center!important;display:block!important;pointer-events:none!important}
html body #clh a.film.ls video{object-position:center 32%!important}
@media(max-width:980px){
html body header.container.nav.site-main-nav,html body header.nav.site-main-nav,html body header.site-main-nav{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:space-between!important;min-height:56px!important;padding:8px 12px!important;overflow:hidden!important;background:#070b18!important;position:sticky!important;top:0!important;z-index:80!important}
html body header.site-main-nav .logo{display:flex!important;flex:0 0 auto!important;visibility:visible!important;z-index:3!important}
html body header.site-main-nav nav,html body header.site-main-nav .nav-links,html body header.site-main-nav .primary-nav-links,html body header.site-main-nav .tools-mega-wrap,html body header.site-main-nav .tools-mega-menu,html body header.site-main-nav .nav-session-bar,html body header.site-main-nav .header-language-links,html body header.site-main-nav .cl-mobile-actions,html body header.site-main-nav button.cl-mnav,html body header.site-main-nav [data-cl-mnav-trigger]{display:none!important;visibility:hidden!important;pointer-events:none!important;width:0!important;height:0!important;overflow:hidden!important;max-height:0!important}
label.cl-mnav{display:inline-flex!important;position:fixed!important;top:10px!important;right:12px!important;z-index:300!important;align-items:center!important;justify-content:center!important;min-width:72px!important;height:34px!important;padding:0 12px!important;margin:0!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:8px!important;background:#070b18!important;color:#f8fbff!important;font:650 12px/1 Inter,system-ui,sans-serif!important;cursor:pointer!important}
label.cl-mnav span{display:none!important}
#cl-mnav-sheet{display:none!important;position:fixed!important;inset:0!important;z-index:299!important;background:rgba(7,11,24,.97)!important;flex-direction:column!important;gap:4px!important;padding:72px 20px 96px!important;overflow:auto!important}
#cl-mnav-toggle:checked ~ #cl-mnav-sheet{display:flex!important}
#cl-mnav-sheet>a{display:block!important;padding:12px 4px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;color:#f8fbff!important;font:600 16px/1.3 Inter,system-ui,sans-serif!important}
#cl-mnav-sheet .langs{display:flex!important;gap:16px!important;padding-top:16px!important}
#cl-mnav-sheet .langs a{color:#f8fbff!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:999px!important;padding:8px 14px!important}
.cl-sticky{display:flex!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:250!important;gap:8px!important;padding:10px 12px calc(10px + env(safe-area-inset-bottom))!important;background:rgba(7,11,24,.94)!important;border-top:1px solid rgba(255,255,255,.1)!important}
.cl-sticky a{flex:1!important;display:flex!important;align-items:center!important;justify-content:center!important;height:44px!important;border-radius:999px!important;font:650 14px/1 Inter,system-ui,sans-serif!important;text-decoration:none!important}
.cl-sticky a.pro{background:linear-gradient(180deg,#38bdf8,#0284c7)!important;color:#04203a!important}
.cl-sticky a.gin{background:rgba(255,255,255,.08)!important;color:#f8fbff!important;border:1px solid rgba(255,255,255,.16)!important}
html body #clh .films,html body #clh .grid-3{grid-template-columns:repeat(2,minmax(0,1fr))!important}
html body #clh .packs{grid-template-columns:repeat(2,minmax(0,1fr))!important}
html body #clh .stage{min-height:min(86vh,720px)!important}
}
@media(max-width:680px){html body #clh .grid-3,html body #clh .packs{grid-template-columns:1fr!important}html body #clh .stage{min-height:78vh!important}}#cl-home-nav{display:none!important}
@media(max-width:980px){
#cl-home-nav{display:block!important}
#cl-mnav-sheet .auth{display:flex!important;gap:8px!important;padding-top:18px!important}
#cl-mnav-sheet .auth a{flex:1!important;display:flex!important;align-items:center!important;justify-content:center!important;height:44px!important;border-radius:999px!important;font:650 14px/1 Inter,system-ui,sans-serif!important;text-decoration:none!important}
#cl-mnav-sheet .auth a.gin{background:rgba(255,255,255,.08)!important;color:#f8fbff!important;border:1px solid rgba(255,255,255,.16)!important}
#cl-mnav-sheet .auth a.uye{background:linear-gradient(180deg,#38bdf8,#0284c7)!important;color:#04203a!important}
.cl-sticky a.uye{background:rgba(255,255,255,.08)!important;color:#f8fbff!important;border:1px solid rgba(255,255,255,.16)!important}
}
@media(max-width:980px){
html body header.container.nav.site-main-nav,html body header.nav.site-main-nav,html body header.site-main-nav{overflow:visible!important}
html body header.site-main-nav .nav-session-bar{display:block!important;visibility:visible!important;pointer-events:auto!important;position:static!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:visible!important;border:0!important;max-height:none!important;max-width:none!important}
}
/* CL-CAMP $9.99 */
#clh-strip{display:inline-flex;align-items:center;border-radius:999px;padding:6px 12px;background:#22d3ee;color:#04203a;font:800 12px/1.2 Inter,system-ui,sans-serif;margin:0 0 12px}
#clh-miss{margin:0 0 6px;color:#f8fbff;font:800 15px/1.2 Inter,system-ui,sans-serif}
#clh-price{margin:0 0 10px;color:#fff;font:800 clamp(40px,12vw,72px)/.9 Inter,system-ui,sans-serif;letter-spacing:-.04em}
#clh-price span{display:block;margin-top:6px;font:700 16px/1.3 Inter,system-ui,sans-serif;color:#c9d6ea;letter-spacing:0}
#clh .stage-copy .lede{max-width:520px;margin-bottom:18px}
#clh .stage-copy .proof,#clh .cta-row a.btn-ghost:not(.gin){display:none!important}
#clh .cta-row a.gin{background:transparent;border:0;color:#c9d6ea;box-shadow:none;height:auto;padding:10px 8px;font:650 13px/1 Inter,system-ui,sans-serif}
[aria-label="Open Crelavo live avatar"]{display:none!important;transform:none!important}
.cl-sticky a.uye{display:none!important}
.cl-sticky a.gin{flex:0 0 auto!important;min-width:76px!important;padding:0 14px!important;height:40px!important;font-size:12px!important}
.cl-sticky a.pro{flex:1 1 auto!important}
#clh .pack.intro strong{color:#22d3ee}
/* CL-CHROME 1 */
@media (min-width: 981px) {
  header.site-main-nav,
  .site-main-nav.nav {
    overflow: visible !important;
    display: flex !important;
    grid-template-columns: none !important;
  }
  header.site-main-nav .nav-links {
    overflow: visible !important;
    flex: 1 1 auto !important;
    width: auto !important;
    gap: 18px !important;
  }
  .primary-nav-links > a[href="/"],
  .primary-nav-links > a[href="/live-sales-credits"],
  .primary-nav-links > a[href="/drone-credits"],
  .primary-nav-links > a[href="/growth-intelligence"],
  .primary-nav-links > a[href="/affiliate"],
  .primary-nav-links > a[href="/dashboard/productions"],
  .primary-nav-links > a[href="/contact"],
  .primary-nav-links > a[href="/blog"] {
    display: none !important;
  }
}
@media (max-width: 980px) {
  html body:has(header.site-main-nav):not(:has(main.dashboard-shell-layout)):not(:has(main.omni-work-route)) header.site-main-nav {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-width: none !important;
    height: 56px !important;
    z-index: 200 !important;
    overflow: visible !important;
    background: #070b18 !important;
  }
  html body:has(header.site-main-nav):not(:has(main.dashboard-shell-layout)):not(:has(main.omni-work-route)) {
    padding-top: 56px !important;
  }
  label.cl-mnav {
    position: fixed !important;
    top: 11px !important;
    right: 12px !important;
    z-index: 201 !important;
  }
  [aria-label="Open Crelavo live avatar"],
  html body [style*="right:14px"][style*="bottom:14px"] {
    display: none !important;
  }
}
/* CL-SHOWCASE 2 */
html body #clh a.film .meta{
  position:absolute!important;
  left:0!important;
  right:0!important;
  bottom:0!important;
  z-index:2!important;
  padding:78px 14px 14px!important;
  background:linear-gradient(180deg,transparent 0%,rgba(7,11,24,.72) 38%,#070b18 86%)!important;
  pointer-events:none!important;
}
html body #clh a.film .meta small{
  display:block!important;
  white-space:nowrap!important;
  overflow:hidden!important;
  text-overflow:ellipsis!important;
}
html body #clh a.film .meta h3{
  font-size:15px!important;
  line-height:1.25!important;
  font-weight:700!important;
  overflow:hidden!important;
  display:-webkit-box!important;
  -webkit-line-clamp:2!important;
  -webkit-box-orient:vertical!important;
  word-break:break-word!important;
  margin:0!important;
}
html body #clh a.film.still video{
  object-fit:cover!important;
  object-position:center 12%!important;
}
html body #clh .films a.film{display:block!important;}

`;

const menuScript = `
(function(){
  function pin(){var src=document.getElementById('clh-css');if(!src)return;var old=document.getElementById('clh-css-head');if(old)old.parentNode.removeChild(old);var style=document.createElement('style');style.id='clh-css-head';style.textContent=src.textContent;document.head.appendChild(style);}
  function scrub(){var nodes=document.querySelectorAll('#cl-mnav-panel,nav#cl-mnav-panel');for(var i=0;i<nodes.length;i++){if(nodes[i]&&nodes[i].parentNode)nodes[i].parentNode.removeChild(nodes[i]);}}
  pin();scrub();setTimeout(function(){pin();scrub();},80);setTimeout(function(){pin();scrub();},400);
  document.addEventListener("click",function(e){
    var el=e.target&&e.target.closest&&e.target.closest("a.cikis");
    if(!el)return;
    e.preventDefault();
    var nodes=document.querySelectorAll(".signed-in-actions button.auth-mini-btn");
    for(var i=0;i<nodes.length;i++){
      if(/sign out|çıkış/i.test((nodes[i].textContent||"").trim())){nodes[i].click();return;}
    }
    if(nodes[0])nodes[0].click();
  });
  (function(){
    var HOME="https://www.crelavo.com/";
    function authed(){return !!document.querySelector(".nav-session-bar .signed-in-actions,.nav-session-bar .user-info-pill");}
    function hashPending(){var h=location.hash||"";return h.indexOf("access_token=")!==-1||h.indexOf("error=")!==-1;}
    function goHome(){
      if(hashPending())return;
      if(location.pathname!=="/"||location.search||location.hash){location.replace(HOME);}
    }
    function sync(){
      if(authed()){
        document.documentElement.classList.add("cl-authed");
        goHome();
      } else {
        document.documentElement.classList.remove("cl-authed");
      }
    }
    sync();
    var bar=document.querySelector(".nav-session-bar");
    if(bar&&window.MutationObserver){new MutationObserver(sync).observe(bar,{childList:true,subtree:true});}
    setTimeout(sync,80);setTimeout(sync,400);setTimeout(sync,1200);
    if(hashPending()){setTimeout(function(){if(!hashPending()&&authed())goHome();},800);}
  })();
  var root=document.getElementById('clh');if(!root)return;
  var hero=root.querySelector('.stage-bg video');var films=[].slice.call(root.querySelectorAll('.films video'));
  function prep(v){try{v.muted=true;v.defaultMuted=true;v.playsInline=true;v.loop=true;v.setAttribute('playsinline','');v.setAttribute('muted','');v.removeAttribute('autoplay');v.removeAttribute('autoPlay');}catch(e){}}
  function play(v){prep(v);try{var p=v.play();if(p&&p.catch)p.catch(function(){});}catch(e){}}
  function pause(v){try{v.pause();}catch(e){}}
  if(hero){prep(hero);hero.preload='metadata';}
  films.forEach(function(v){prep(v);v.preload='none';pause(v);});
  if('IntersectionObserver' in window){
    if(hero){new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting)play(hero);else pause(hero);});},{threshold:0.6}).observe(hero);}
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.target.closest&&e.target.closest("a.film.still")) return;
        if(e.isIntersecting) play(e.target);
        else pause(e.target);
      });
    },{threshold:0.25});
    films.forEach(function(v){io.observe(v);});
  }
})();
`;

export default async function HomePage() {
  const siteContent = await getConfiguredSiteContentConfig();
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }} />
    <Header navLinks={siteContent.navLinks} />
    <main className="public-home-page"><style id="clh-css" dangerouslySetInnerHTML={{ __html: css }} />
      <div id="cl-home-nav">
        <input type="checkbox" id="cl-mnav-toggle" aria-hidden="true" />
        <label htmlFor="cl-mnav-toggle" className="cl-mnav" aria-label="Menu">Menu</label>
        <nav id="cl-mnav-sheet" aria-label="Mobil menü">
          <a href="/categories">Create</a><a href="/tools">Tools</a><a href="/pricing">Pricing</a><a href="/live-sales-credits">Live Sales</a><a href="/drone-credits">Drone</a><a href="/dashboard/create">Assistant</a><a href="/dashboard">Dashboard</a><a href="/contact">Contact</a><a href="/blog">Blog</a>
          <div className="langs"><a href="/de/ki-video-generator">DE</a><a href="/fr/generateur-video-ia">FR</a><a href="/tr/yapay-zeka-video-uretici">TR</a></div>
          <div className="auth"><AuthHeaderControls /></div>
        </nav>
      </div>
      <section id="clh">
        <div className="stage"><a className="stage-bg" href="/showcase/videos/crelavo-wow-reel" aria-label="Open Crelavo Wow Reel"><video muted loop playsInline preload="metadata" src="https://cdn.hailuoai.video/moss/prod/2026-08-08-08/video/1786148830090586661-1786148830070.mp4" /></a><div className="stage-veil" /><div className="stage-grain" /><div className="stage-copy"><div className="inner"><span id="clh-strip">Free member. No card.</span><h1>Make the feed look <em>expensive.</em></h1><p className="lede">Create a free Crelavo account. No card. After you are in, the 24h Pro preview is optional.</p><div className="cta-row"><a className="btn btn-cyan" href="/join">Create a free account</a></div></div></div></div>
        <div className="wrap wall" id="clh-films"><span className="kicker">Showcase</span><h2>The work hits first. Copy comes second.</h2><p className="sub">Muted playback. Every film opens its full Crelavo example.</p><div className="films">{films.map((film) => <a className={film.href.endsWith("/lower-ad-costs-showcase") ? "film still" : film.landscape ? "film ls" : "film"} href={film.href} key={film.href}><video muted loop playsInline preload="none" poster={film.poster} src={film.video} /><span className="meta"><small>{film.kicker}</small><h3>{film.title}</h3></span></a>)}</div><a className="more" href="/showcase/explore-samples">Browse all 32 samples →</a></div>
        <div className="wrap paths"><span className="kicker">Start with one outcome</span><h2>Pick the job. The studio opens the path.</h2><p className="sub">Omni Assistant is the production door. Credits only move after scope is visible.</p><div className="grid-3"><a className="card" href="/join?idea=Sell+internationally"><span>01</span><h3>Sell internationally</h3><p>Localize hooks, visuals and campaign direction for another market before you buy more traffic.</p></a><a className="card" href="/free-tools/ad-performance-score-checker"><span>02</span><h3>Test an existing ad</h3><p>Run the free AI Ad Scorer on hook, CTA and proof before you spend production credits.</p></a><a className="card" href="/join"><span>03</span><h3>Create from scratch</h3><p>Product video, landing page, campaign pack or launch asset from one brief.</p></a></div></div>
        <div className="wrap packs-head"><span className="kicker">Packages</span><h2>Four ways in. Prices match live checkout.</h2><div className="packs"><a className="pack intro" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg"><span>INTRO</span><strong>$9.99/mo</strong><p>24h preview, then $9.99. Card required. No charge until the preview ends.</p></a><a className="pack" href="/live-sales-credits"><span>Live Sales</span><strong>from $249/mo</strong><p>Starter 10 hours / 1 platform. Service hours, not credits.</p></a><a className="pack" href="/drone-credits"><span>Drone</span><strong>from $299</strong><p>Drone Location 2,600 credits one-time.</p></a><a className="pack" href="/growth-intelligence"><span>Growth</span><strong>from $179/mo</strong><p>Starter: 1 competitor, weekly PDF. Intelligence service.</p></a></div></div>
        <div className="final"><h2>Create a free account. No card.</h2><p>Pro 24h preview is optional after signup.</p><div className="cta-row" style={{justifyContent:"center"}}><a className="btn btn-cyan" href="/join">Create a free account</a></div></div>
      </section>

      <script dangerouslySetInnerHTML={{ __html: menuScript }} />
    </main>
  </>;
}