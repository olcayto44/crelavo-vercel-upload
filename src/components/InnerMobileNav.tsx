"use client";

import { AuthHeaderControls } from "@/components/auth/AuthHeaderControls";

const css = `
#cl-inner-nav,#cl-mnav-toggle,label.cl-mnav,#cl-mnav-sheet{display:none}
@media(max-width:980px){
  body:has(#cl-inner-nav) .site-main-nav{display:none!important}
  #cl-inner-nav{display:block;position:sticky;top:0;z-index:298;height:56px;background:#070b18;border-bottom:1px solid rgba(255,255,255,.08)}
  #cl-inner-nav .cl-mobile-brand{display:flex;position:fixed;top:10px;left:12px;z-index:300;align-items:center;height:34px;color:#f8fbff;text-decoration:none;font:750 18px/1 Inter,system-ui,sans-serif}
  #cl-mnav-toggle{position:absolute;left:-9999px}
  label.cl-mnav{display:flex;position:fixed;top:10px;right:12px;z-index:300;align-items:center;justify-content:center;min-width:72px;height:34px;padding:0 12px;border:1px solid rgba(255,255,255,.16);border-radius:8px;background:#070b18;color:#f8fbff;font:650 12px/1 Inter,system-ui,sans-serif;cursor:pointer}
  #cl-mnav-sheet{display:none;position:fixed;inset:0;z-index:299;background:rgba(7,11,24,.97);flex-direction:column;gap:4px;padding:72px 20px 96px;overflow:auto;font-family:Inter,system-ui,sans-serif}
  #cl-mnav-toggle:checked~#cl-mnav-sheet{display:flex}
  #cl-mnav-sheet>a{display:block;padding:12px 4px;border-bottom:1px solid rgba(255,255,255,.08);color:#f8fbff;font:600 16px/1.3 Inter,system-ui,sans-serif;text-decoration:none}
  #cl-mnav-sheet .langs{display:flex;gap:12px;padding-top:16px}
  #cl-mnav-sheet .langs a{color:#f8fbff;text-decoration:none;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:8px 14px}
  #cl-mnav-sheet .crelavo-mobile-auth{display:flex;align-items:center;justify-content:center;padding:20px 0 8px;border-top:1px solid rgba(255,255,255,.1)}
   #cl-mnav-sheet .crelavo-mobile-auth .crelavo-auth-controls{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;width:100%}
   #cl-mnav-sheet .crelavo-mobile-auth .crelavo-auth-signin,#cl-mnav-sheet .crelavo-mobile-auth .crelavo-auth-join{display:inline-flex;align-items:center;justify-content:center;height:42px;margin:0;white-space:nowrap}
}
@media(min-width:981px){#cl-inner-nav,#cl-mnav-toggle,label.cl-mnav,#cl-mnav-sheet{display:none!important}}
`;

export function InnerMobileNav() {
  return <><style id="cl-inner-nav-css">{css}</style><div id="cl-inner-nav"><a className="cl-mobile-brand" href="/">Crelavo</a><input type="checkbox" id="cl-mnav-toggle" aria-hidden="true" /><label htmlFor="cl-mnav-toggle" className="cl-mnav" aria-label="Menu">Menu</label><nav id="cl-mnav-sheet" aria-label="Mobile menu"><a href="/categories">Create</a><a href="/tools">Tools</a><a href="/pricing">Pricing</a><a href="/live-sales-credits">Live Sales</a><a href="/drone-credits">Drone</a><a href="/dashboard/create">Assistant</a><a href="/dashboard">Dashboard</a><a href="/contact">Contact</a><a href="/blog">Blog</a><div className="langs"><a href="/de/ki-video-generator">DE</a><a href="/fr/generateur-video-ia">FR</a><a href="/tr/yapay-zeka-video-uretici">TR</a></div><div className="crelavo-mobile-auth"><AuthHeaderControls /></div></nav></div></>;
}
