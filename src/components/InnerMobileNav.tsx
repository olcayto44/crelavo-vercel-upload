"use client";

import { useEffect } from "react";

const css = `
.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}
.page-with-rails{padding-left:0!important;padding-right:0!important}
#cl-inner-nav,#cl-mnav-toggle,label.cl-mnav,#cl-mnav-sheet,.cl-sticky{display:none}
#cl-mnav-panel,nav#cl-mnav-panel{display:none!important;height:0!important;overflow:hidden!important;position:absolute!important;left:-9999px!important}
html body .auth-modal-backdrop{z-index:5000!important;position:fixed!important;inset:0!important;display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:rgba(8,11,18,.86)!important;align-items:stretch!important;justify-content:flex-end!important}
html body .auth-modal-card{z-index:5001!important;position:fixed!important;top:0!important;right:0!important;bottom:0!important;width:min(100vw,420px)!important;max-width:100%!important;height:100vh!important;display:block!important;visibility:visible!important;background:#0f1626!important;color:#f8fbff!important;overflow:auto!important;padding:32px 22px!important;font-family:Inter,system-ui,sans-serif!important}
html body .auth-google-btn,html body .auth-modal-provider{display:flex!important;visibility:visible!important;opacity:1!important;width:100%!important}
@media(max-width:980px){
#cl-inner-nav{display:block!important}
html body header.site-main-nav{display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-start!important;min-height:56px!important;height:56px!important;padding:8px 88px 8px 12px!important;overflow:visible!important;background:#070b18!important;position:sticky!important;top:0!important;z-index:80!important}
html body header.site-main-nav .logo{display:flex!important;visibility:visible!important;flex:0 0 auto!important}
html body header.site-main-nav nav,html body header.site-main-nav .nav-links,html body header.site-main-nav .primary-nav-links,html body header.site-main-nav .tools-mega-wrap,html body header.site-main-nav .tools-mega-menu,html body header.site-main-nav .header-language-links,html body header.site-main-nav button.cl-mnav,html body header.site-main-nav .cl-mobile-actions{display:none!important;visibility:hidden!important;pointer-events:none!important}
html body header.site-main-nav .nav-session-bar{display:block!important;position:static!important;width:0!important;height:0!important;margin:0!important;padding:0!important;overflow:visible!important;border:0!important}
html body header.site-main-nav .nav-session-bar>:not(.auth-modal-backdrop){position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important}
#cl-mnav-toggle{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
label.cl-mnav{display:inline-flex!important;position:fixed!important;top:10px!important;right:12px!important;z-index:300!important;align-items:center!important;justify-content:center!important;min-width:72px!important;height:34px!important;padding:0 12px!important;border:1px solid rgba(255,255,255,.16)!important;border-radius:8px!important;background:#070b18!important;color:#f8fbff!important;font:650 12px/1 Inter,system-ui,sans-serif!important;cursor:pointer!important}
#cl-mnav-sheet{display:none!important;position:fixed!important;inset:0!important;z-index:299!important;background:rgba(7,11,24,.97)!important;flex-direction:column!important;gap:4px!important;padding:72px 20px 96px!important;overflow:auto!important;font-family:Inter,system-ui,sans-serif}
#cl-mnav-toggle:checked~#cl-mnav-sheet{display:flex!important}
#cl-mnav-sheet>a{display:block!important;padding:12px 4px!important;border-bottom:1px solid rgba(255,255,255,.08)!important;color:#f8fbff!important;font:600 16px/1.3 Inter,system-ui,sans-serif!important;text-decoration:none!important}
#cl-mnav-sheet .langs,#cl-mnav-sheet .auth{display:flex!important;gap:12px!important;padding-top:16px!important}
#cl-mnav-sheet .langs a{color:#f8fbff!important;text-decoration:none!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:999px!important;padding:8px 14px!important}
#cl-mnav-sheet .auth a,.cl-sticky a{flex:1!important;display:flex!important;align-items:center!important;justify-content:center!important;height:44px!important;border-radius:999px!important;font:650 14px/1 Inter,system-ui,sans-serif!important;text-decoration:none!important}
#cl-mnav-sheet .auth a.gin,.cl-sticky a.gin,.cl-sticky a.uye{background:rgba(255,255,255,.08)!important;color:#f8fbff!important;border:1px solid rgba(255,255,255,.16)!important}
#cl-mnav-sheet .auth a.uye,.cl-sticky a.pro{background:linear-gradient(180deg,#38bdf8,#0284c7)!important;color:#04203a!important}
.cl-sticky{display:flex!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:250!important;gap:8px!important;padding:10px 12px calc(10px + env(safe-area-inset-bottom))!important;background:rgba(7,11,24,.94)!important;border-top:1px solid rgba(255,255,255,.1)!important}
html body:not(:has(main.omni-work-route)){padding-bottom:72px}
html body:has(main.omni-work-route) .cl-sticky{display:none!important}
html body .auth-modal-card{width:100%!important;left:0!important;right:0!important;border-radius:0!important}
}
@media(min-width:981px){#cl-inner-nav,#cl-mnav-toggle,label.cl-mnav,#cl-mnav-sheet,.cl-sticky{display:none!important}}
`;

export function InnerMobileNav() {
  useEffect(() => {
    const pin = () => {
      const source = document.getElementById("cl-inner-nav-css");
      if (!source) return;
      document.getElementById("cl-inner-nav-css-head")?.remove();
      const style = document.createElement("style");
      style.id = "cl-inner-nav-css-head";
      style.textContent = source.textContent;
      document.head.appendChild(style);
    };
    const scrub = () => document.querySelectorAll("#cl-mnav-panel,nav#cl-mnav-panel").forEach((node) => node.remove());
    const promoteAuth = () => {
      const modal = document.querySelector(".auth-modal-backdrop");
      if (modal && modal.parentNode !== document.body) document.body.appendChild(modal);
    };
    const run = () => { pin(); scrub(); promoteAuth(); };
    run();
    const timers = [80, 400].map((delay) => window.setTimeout(run, delay));
    const observer = new MutationObserver(promoteAuth);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest('a[href*="auth=login"],a[href*="auth=register"]') as HTMLAnchorElement | null;
      if (!link) return;
      event.preventDefault();
      const url = new URL(window.location.href);
      url.searchParams.set("auth", link.href.includes("register") ? "register" : "login");
      window.location.assign(`${url.pathname}${url.search}${url.hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      timers.forEach(window.clearTimeout);
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return <>
    <style id="cl-inner-nav-css" dangerouslySetInnerHTML={{ __html: css }} />
    <div id="cl-inner-nav">
      <input type="checkbox" id="cl-mnav-toggle" aria-hidden="true" />
      <label htmlFor="cl-mnav-toggle" className="cl-mnav" aria-label="Menu">Menu</label>
      <nav id="cl-mnav-sheet" aria-label="Mobil menü">
        <a href="/categories">Create</a><a href="/">Home</a><a href="/tools">Tools</a><a href="/pricing">Credit Packages</a><a href="/live-sales-credits">Live Sales</a><a href="/drone-credits">Drone</a><a href="/dashboard/assistant-workspace">Assistant</a><a href="/growth-intelligence">Growth</a><a href="/affiliate">Affiliate</a><a href="/dashboard/productions">Productions</a><a href="/dashboard">Dashboard</a><a href="/contact">Contact</a><a href="/blog">Blog</a>
        <div className="langs"><a href="/de/ki-video-generator">DE</a><a href="/fr/generateur-video-ia">FR</a><a href="/tr/yapay-zeka-video-uretici">TR</a></div>
        <div className="auth"><a className="gin" href="?auth=login">Giriş</a><a className="uye" href="?auth=register">Üye ol</a></div>
      </nav>
    </div>
    <div className="cl-sticky"><a className="pro" href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Pro $9.99</a><a className="gin" href="?auth=login">Giriş</a><a className="uye" href="?auth=register">Üye ol</a></div>
  </>;
}