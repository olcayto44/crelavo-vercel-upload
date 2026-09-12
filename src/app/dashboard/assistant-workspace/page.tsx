import { Header } from "@/components/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { AssistantWorkspaceAuthBridge } from "@/components/AssistantWorkspaceAuthBridge";
import { getConfiguredSiteContentConfig } from "@/lib/site-content-loader";

export const dynamic = "force-dynamic";

type AssistantWorkspaceSearchParams = {
  idea?: string | string[];
  category?: string | string[];
  type?: string | string[];
  mode?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
const STYLE_BLOCK: string = `.public-side-rail,.ad-rail,.ad-rail-right,.trial-fomo-rail,.trial-fomo-flash{display:none!important}
html.cl-assistant-page,html.cl-assistant-page body{background:#070b18!important}
.cl-assistant-root{--bg:#070b18;--cyan:#0ea5e9;--muted:#aeb8cc;--line:rgba(174,184,204,.16);--card:#0c1222;--text:#f8fbff;--kb:0px;--sticky:52px;position:relative;min-height:100dvh;background:var(--bg);color:var(--text);font-family:Inter,system-ui,sans-serif;padding-bottom:calc(var(--sticky) + 88px + env(safe-area-inset-bottom))}
.cl-assistant-root *{box-sizing:border-box}
.cl-top{position:sticky;top:0;z-index:40;display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(7,11,24,.92);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.cl-top .cl-back,.cl-top .cl-out{appearance:none;background:none;border:0;color:var(--muted);font:600 15px Inter,sans-serif;padding:8px;cursor:pointer}
.cl-top .cl-ttl{flex:1;text-align:center;color:var(--cyan);font-weight:700;font-size:16px}
.cl-cred{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(14,165,233,.45);color:var(--cyan);border-radius:999px;padding:5px 10px;font-size:13px;font-weight:700;white-space:nowrap}
.cl-cred svg{width:14px;height:14px}
.cl-app{max-width:880px;margin:0 auto;padding:8px 16px 24px}
.cl-setup{display:flex;gap:8px;overflow:auto;padding:10px 0 6px;scrollbar-width:none}
.cl-setup::-webkit-scrollbar{display:none}
.cl-mini{flex:0 0 auto;display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);background:#10182a;color:var(--text);border-radius:999px;padding:6px 10px;font-size:12px;font-weight:600}
.cl-mini i{width:6px;height:6px;border-radius:50%;background:var(--cyan);display:inline-block}
.cl-mini.edit{color:var(--muted);background:transparent}
.cl-hero{text-align:center;padding:28px 8px 10px}
.cl-bot{width:48px;height:48px;margin:0 auto 14px;color:var(--cyan)}
.cl-hero h1{margin:0 0 8px;font-size:28px;letter-spacing:-.03em}
.cl-hero p{margin:0;color:var(--muted);font-size:14px}
.cl-row{display:flex;align-items:center;gap:10px;margin:12px 0;flex-wrap:wrap}
.cl-k{width:78px;flex:0 0 78px;color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.06em}
.cl-chips{display:flex;flex-wrap:wrap;gap:8px}
.cl-chip,.cl-all{appearance:none;cursor:pointer;border-radius:999px;border:1px solid rgba(174,184,204,.38);background:transparent;color:var(--text);padding:8px 14px;font:600 13px Inter,sans-serif}
.cl-chip.on{background:var(--cyan);border-color:var(--cyan);color:#fff}
.cl-all{border-color:var(--cyan);color:var(--text);margin:8px 0 4px}
.cl-ex-h{margin:18px 0 8px;color:var(--muted);font-size:11px;font-weight:700;letter-spacing:.08em}
.cl-ex{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.cl-ex button{appearance:none;border:1px solid var(--line);background:#10182a;border-radius:14px;overflow:hidden;padding:0;text-align:left;color:var(--text);cursor:pointer}
.cl-ex img{width:100%;height:118px;object-fit:cover;display:block}
.cl-ex span{display:block;padding:8px 10px 10px;font-size:13px;font-weight:700}
.cl-cap{margin:10px 0 0;color:var(--muted);font-size:12px;line-height:1.4}
.cl-groups{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 0}
.cl-g,.cl-t{appearance:none;border:1px solid var(--line);background:#10182a;border-radius:16px;padding:16px;text-align:left;color:var(--text);cursor:pointer}
.cl-g b,.cl-t b{display:block;font-size:15px;margin-bottom:4px}
.cl-g span,.cl-t span{color:var(--muted);font-size:12px}
.cl-types{display:flex;flex-direction:column;gap:8px;padding:8px 0}
.cl-chat{display:flex;flex-direction:column;gap:10px;padding:8px 0 12px}
.cl-msg{max-width:86%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.45;white-space:pre-wrap}
.cl-msg.user{align-self:flex-end;background:#fff;color:#070b18;border-bottom-right-radius:6px}
.cl-msg.bot{align-self:flex-start;background:#1a2438;color:var(--text);border-bottom-left-radius:6px}
.cl-msg img.th{width:72px;height:72px;object-fit:cover;border-radius:10px;display:block;margin-top:8px}
.cl-ready{align-self:flex-start;width:min(340px,100%);background:#10182a;border:1px solid var(--line);border-radius:16px;padding:12px}
.cl-ready .hd{display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:12px;font-weight:700;color:var(--muted)}
.cl-badge{background:var(--cyan);color:#fff;border-radius:999px;padding:3px 8px;font-size:11px}
.cl-player{position:relative;width:220px;max-width:100%;aspect-ratio:9/16;border-radius:16px;overflow:hidden;background:#000;margin:0 auto 12px}
.cl-player[data-fmt="16:9"]{width:100%;aspect-ratio:16/9}
.cl-player[data-fmt="1:1"]{width:min(260px,100%);aspect-ratio:1/1}
.cl-player video,.cl-player img{width:100%;height:100%;object-fit:cover;display:block}
.cl-play{position:absolute;inset:0;margin:auto;width:56px;height:56px;border-radius:50%;border:0;background:#fff;cursor:pointer;display:grid;place-items:center}
.cl-play:after{content:"";border-style:solid;border-width:8px 0 8px 14px;border-color:transparent transparent transparent #070b18;margin-left:3px}
.cl-dl{display:flex;gap:8px;align-items:center}
.cl-dl .pri{flex:1;appearance:none;border:0;background:var(--cyan);color:#fff;font:700 14px Inter,sans-serif;border-radius:12px;padding:12px;cursor:pointer}
.cl-dl .ghost{appearance:none;border:1px solid var(--line);background:rgba(255,255,255,.04);color:var(--muted);border-radius:10px;padding:8px 10px;font:600 11px Inter,sans-serif}
.cl-dlnote{text-align:center;color:var(--muted);font-size:12px;margin:8px 0 0}
.cl-dock{position:fixed;left:0;right:0;bottom:calc(var(--sticky) + env(safe-area-inset-bottom) + var(--kb));z-index:80;background:linear-gradient(to top,#070b18 78%,transparent);padding:8px 16px 10px}
.cl-est{text-align:center;padding:4px 8px 8px}
.cl-est b{display:block;font-size:14px}
.cl-est span{display:block;color:var(--cyan);font-size:12px;margin-top:4px}
.cl-comp{display:flex;align-items:center;gap:8px;max-width:880px;margin:0 auto}
.cl-paper,.cl-send{appearance:none;border:0;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;cursor:pointer;flex:0 0 42px}
.cl-paper{background:transparent;color:var(--muted);border:1px solid var(--line)}
.cl-send{background:var(--cyan);color:#fff}
.cl-send:disabled{opacity:.35}
.cl-comp input[type=text]{flex:1;height:46px;border-radius:999px;border:1px solid var(--line);background:#10182a;color:var(--text);padding:0 16px;font:15px Inter,sans-serif;outline:none}
.cl-asst-sticky{position:fixed;left:0;right:0;bottom:0;z-index:60;height:var(--sticky);background:#070b18;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:center;padding:0 12px calc(env(safe-area-inset-bottom))}
.cl-asst-sticky a{display:block;width:min(640px,100%);text-align:center;background:var(--cyan);color:#fff;text-decoration:none;font:700 14px Inter,sans-serif;border-radius:12px;padding:10px 14px}
.cl-asst-live{position:fixed;right:14px;bottom:calc(var(--sticky) + 14px + env(safe-area-inset-bottom));z-index:70;width:58px;height:58px;border-radius:50%;background:#0b1220;border:1px solid rgba(14,165,233,.45);color:#fff;text-decoration:none;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 9px Inter,sans-serif;letter-spacing:.04em;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.cl-asst-live svg{width:20px;height:20px;margin-bottom:2px;color:var(--cyan)}
.cl-sheet,.cl-drawer{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.55);display:none}
.cl-sheet.on,.cl-drawer.on{display:block}
.cl-sheet .pan,.cl-drawer .pan{position:absolute;left:0;right:0;bottom:0;max-height:92dvh;overflow:auto;background:#0b1220;border-radius:22px 22px 0 0;padding:18px 16px 24px}
.cl-drawer .pan{left:auto;width:min(380px,100%);top:0;bottom:0;max-height:none;border-radius:18px 0 0 18px}
.cl-sheet h2,.cl-drawer h2{margin:0;font-size:28px}
.cl-sub{color:var(--cyan);font-size:13px;margin:4px 0 14px}
.cl-x{position:absolute;top:14px;right:14px;appearance:none;border:0;background:none;color:var(--muted);font-size:22px;cursor:pointer}
.cl-apply{position:sticky;bottom:0;display:flex;align-items:center;gap:10px;background:#0b1220;padding:12px 0 4px}
.cl-apply button{appearance:none;border:0;background:var(--cyan);color:#fff;border-radius:999px;padding:12px 22px;font:700 14px Inter,sans-serif;cursor:pointer;margin-left:auto}
.cl-out-item{border:1px solid var(--line);border-radius:12px;padding:12px;margin:8px 0;font-size:13px}
.cl-ready .pri{display:block;color:#fff}.cl-top .cl-out{color:var(--cyan);font-size:12px}
@media(min-width:900px){.cl-groups{grid-template-columns:1fr 1fr 1fr}.cl-ex img{height:150px}.cl-player[data-fmt="9:16"]{width:240px}}`;
export default async function AssistantWorkspacePage({ searchParams }: { searchParams?: Promise<AssistantWorkspaceSearchParams> }) {
  await searchParams;
  const siteContent = await getConfiguredSiteContentConfig();
  return (
    <>
      <Header navLinks={siteContent.navLinks} />
      <AssistantWorkspaceAuthBridge />
      <style id="cl-assistant-css" dangerouslySetInnerHTML={{ __html: STYLE_BLOCK }} />
      <main id="cl-assistant" className="cl-assistant-root">
        <div className="cl-top">
          <button type="button" className="cl-back" data-act="back" aria-label="Back">‹</button>
          <div className="cl-ttl" id="cl-ttl">Crelavo</div>
          <button type="button" className="cl-out" data-act="outputs">Outputs</button>
          <div className="cl-cred" id="cl-cred" title="Credits">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.4 2.3 7.2L12 16.8 5.7 20.8 8 13.6 2 9.2h7.6z"/></svg>
            <span id="cl-cred-n">0</span>
          </div>
        </div>
        <div className="cl-app" id="cl-app"></div>
        <div className="cl-dock" id="cl-dock"></div>
        <a className="cl-asst-live" href="/live-sales-credits" aria-label="LIVE">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 14v-1a8 8 0 0 1 16 0v1"/><path d="M4 14a2 2 0 0 0 2 2h1v-5H6a2 2 0 0 0-2 2zm16 0a2 2 0 0 1-2 2h-1v-5h1a2 2 0 0 1 2 2z"/><path d="M8 16v1a4 4 0 0 0 8 0v-1"/></svg>
          LIVE
        </a>
        <div className="cl-asst-sticky"><a href="https://whop.com/checkout/plan_ujLQgM3kEg0dg">Pro $9.99/mo</a></div>
      </main>
      <script id="cl-assistant-js" src="/assistant-workspace.js?v=20260912-1" defer></script>
      <SiteFooter />
    </>
  );
}
