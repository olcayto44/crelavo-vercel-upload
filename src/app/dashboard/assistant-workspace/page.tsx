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
const SCRIPT_BLOCK: string = `
(function(){
  if (window.__clAssistantBound) return;
  window.__clAssistantBound = true;
  document.documentElement.classList.add("cl-assistant-page");

  var SK = "crelavo.assistant.workspace.v1";
  var CK = "crelavo.credits.balance";
  var IMG = { lip: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=900&q=80", perfume: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=80", coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80", studio: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=900&q=80" };
  var GROUPS = [
    {id:"build", label:"Build", blurb:"Website, SaaS, app, admin panel", types:["website","saas","mobile","admin"]},
    {id:"media", label:"Create Media", blurb:"Video, talking, animation, cinematic", types:["video","talking","documentary","animation","music_video","drama","cinematic","clipping","tools"]},
    {id:"growth", label:"Marketing & Growth", blurb:"Campaigns, scores, agents, live sales", types:["campaign","ad_score","calendar","agent","localization","cultural","live_sales"]},
    {id:"avatar", label:"Avatars & Voice", blurb:"Avatar, lip sync, voice, style clone", types:["avatar","lip_sync","voice","visual_clone"]},
    {id:"brand", label:"Brand & Files", blurb:"Images, brand kit, documents", types:["image","brand_kit","document"]},
    {id:"special", label:"Special Video", blurb:"Anime, nature, drone, studio", types:["anime","animal","nature","space","drone","stickman","studio"]}
  ];
  var T = [
    {id:"website", cat:"website", group:"build", family:"website", label:"Website", base:400, package_id:"website_landing"},
    {id:"saas", cat:"saas", group:"build", family:"saas", label:"SaaS", base:500, package_id:"saas_starter"},
    {id:"mobile", cat:"mobile_app", group:"build", family:"mobile", label:"Mobile App", base:450, package_id:"mobile_app_starter"},
    {id:"admin", cat:"admin_project", group:"build", family:"admin", label:"Admin Panel", base:420, package_id:"admin_basic"},
    {id:"video", cat:"video", group:"media", family:"video", label:"AI Video", base:200, package_id:"video_premium"},
    {id:"talking", cat:"talking_video", group:"media", family:"talking", label:"Advanced Talking", base:200, package_id:"talking_video_premium"},
    {id:"documentary", cat:"documentary", group:"media", family:"video", label:"Documentary", base:200, package_id:"video_premium"},
    {id:"animation", cat:"animation", group:"media", family:"video", label:"Animation", base:200, package_id:"video_premium"},
    {id:"music_video", cat:"music_video", group:"media", family:"video", label:"Music Video / MV", base:200, package_id:"video_premium"},
    {id:"drama", cat:"drama", group:"media", family:"video", label:"Drama / Short Series", base:200, package_id:"video_premium"},
    {id:"cinematic", cat:"cinematic_video", group:"media", family:"video", label:"Cinematic", base:200, package_id:"video_premium"},
    {id:"clipping", cat:"video_clipping", group:"media", family:"video", label:"Video Clipping", base:200, package_id:"video_premium"},
    {id:"tools", cat:"video_tools", group:"media", family:"video", label:"Video Tools", base:200, package_id:"video_premium"},
    {id:"campaign", cat:"campaign", group:"growth", family:"campaign", label:"Text-to-Campaign", base:250, package_id:"campaign_starter"},
    {id:"ad_score", cat:"ad_score_checker", group:"growth", family:"score", label:"Ad Score Checker", base:250, package_id:"ad_score_basic"},
    {id:"calendar", cat:"campaign_calendar", group:"growth", family:"calendar", label:"Campaign Calendar", base:250, package_id:"campaign_calendar_month"},
    {id:"agent", cat:"ai_agent", group:"growth", family:"agent", label:"AI Agents", base:250, package_id:"ai_agent_starter"},
    {id:"localization", cat:"localization", group:"growth", family:"campaign", label:"Global Localization", base:250, package_id:"campaign_starter"},
    {id:"cultural", cat:"cultural_localization", group:"growth", family:"campaign", label:"Cultural Localization", base:250, package_id:"campaign_starter"},
    {id:"live_sales", cat:"live_sales_agent", group:"growth", family:"live", label:"AI Live Sales Agent", base:0, package_id:"live_sales_starter"},
    {id:"avatar", cat:"avatar", group:"avatar", family:"avatar", label:"Avatar Design / Video", base:280, package_id:"avatar_premium"},
    {id:"lip_sync", cat:"lip_sync", group:"avatar", family:"talking", label:"Lip Sync", base:200, package_id:"talking_video_premium"},
    {id:"voice", cat:"voice_clone", group:"avatar", family:"voice", label:"Voice Cloning", base:280, package_id:"voice_clone_starter"},
    {id:"visual_clone", cat:"visual_clone", group:"avatar", family:"image", label:"Visual / Style Clone", base:80, package_id:"image_single"},
    {id:"image", cat:"image", group:"brand", family:"image", label:"Image / Banner / Poster", base:80, package_id:"image_single"},
    {id:"brand_kit", cat:"brand_kit", group:"brand", family:"brand", label:"Brand Kit", base:180, package_id:"brand_kit_full"},
    {id:"document", cat:"document_pack", group:"brand", family:"document", label:"Document / File Pack", base:180, package_id:"document_pitch"},
    {id:"anime", cat:"anime_short_film", group:"special", family:"video", label:"Anime Short Film", base:200, package_id:"video_premium"},
    {id:"animal", cat:"animal_video", group:"special", family:"video", label:"Animal", base:200, package_id:"video_premium"},
    {id:"nature", cat:"nature_video", group:"special", family:"video", label:"Nature", base:200, package_id:"video_premium"},
    {id:"space", cat:"planet_space_video", group:"special", family:"video", label:"Planet / Space", base:200, package_id:"video_premium"},
    {id:"drone", cat:"drone_video", group:"special", family:"video", label:"Drone / Satellite", base:200, package_id:"video_premium"},
    {id:"stickman", cat:"stickman_animation", group:"special", family:"video", label:"Stickman", base:200, package_id:"video_premium"},
    {id:"studio", cat:"studio", group:"special", family:"video", label:"Studio / Series-Film", base:200, package_id:"video_premium"}
  ];
  var EMPTY = {
    video: [
      {key:"input", label:"INPUT", multi:0, opts:[["text","Text"],["image","Image"],["clip","Video clip"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["16:9","16:9"],["1:1","1:1"]]},
      {key:"duration", label:"DURATION", multi:0, opts:[["8s","8s included"],["15s","15s"],["30s","30s"]]}
    ],
    talking: [
      {key:"input", label:"INPUT", multi:0, opts:[["text","Text"],["image","Image"],["audio","Audio"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["16:9","16:9"],["1:1","1:1"]]},
      {key:"duration", label:"DURATION", multi:0, opts:[["8s","8s included"],["15s","15s"],["30s","30s"]]}
    ],
    website: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["landing","Landing"],["business","Business"],["ecom","Ecommerce"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    saas: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["dash","Dashboard"],["mvp","MVP"],["billing","Billing"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    mobile: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["ui","App UI"],["expo","Expo starter"],["admin","App + admin"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    admin: [
      {key:"siteType", label:"TYPE", multi:0, opts:[["basic","Basic panel"],["advanced","Advanced"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    campaign: [
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["1:1","1:1"],["16:9","16:9"]]},
      {key:"channel", label:"CHANNEL", multi:0, opts:[["tiktok","TikTok"],["ig","Instagram"],["email","Email"]]}
    ],
    score: [{key:"report", label:"REPORT", multi:0, opts:[["basic","Basic score"],["detail","Detailed"]]}],
    calendar: [{key:"span", label:"SPAN", multi:0, opts:[["month","Month"],["season","Season"]]}],
    agent: [{key:"agent", label:"AGENT", multi:0, opts:[["influencer","Influencer"],["social","Social manager"]]}],
    live: [
      {key:"plan", label:"PLAN", multi:0, opts:[["starter","Starter $249"],["pro","Pro $799"],["agency","Agency $2499"]]},
      {key:"channel", label:"CHANNEL", multi:0, opts:[["tiktok","TikTok"],["ig","Instagram"],["web","Website"]]},
      {key:"language", label:"LANGUAGE", multi:0, opts:[["en","English"]]}
    ],
    avatar: [
      {key:"kind", label:"OUTPUT", multi:0, opts:[["still","Still"],["talking","Talking video"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["9:16","9:16"],["1:1","1:1"]]}
    ],
    image: [
      {key:"kind", label:"TYPE", multi:0, opts:[["banner","Banner"],["poster","Poster"],["product","Product"]]},
      {key:"format", label:"FORMAT", multi:0, opts:[["1:1","1:1"],["9:16","9:16"],["16:9","16:9"]]}
    ],
    brand: [{key:"pack", label:"PACK", multi:0, opts:[["full","Full kit"],["logo","Logo first"]]}],
    document: [{key:"kind", label:"TYPE", multi:0, opts:[["pitch","Pitch deck"],["proposal","Proposal"],["catalog","Catalog"]]}],
    voice: [{key:"kind", label:"TYPE", multi:0, opts:[["clone","Clone"],["narration","Narration"]]}]
  };
  var DEF = {
    video:{input:"text", format:"9:16", duration:"8s", delivery:["mp4"]},
    talking:{input:"text", format:"9:16", duration:"8s", delivery:["mp4"]},
    website:{siteType:"landing", language:"en", delivery:["zip"]},
    saas:{siteType:"dash", language:"en", delivery:["zip"]},
    mobile:{siteType:"ui", language:"en", delivery:["zip"]},
    admin:{siteType:"basic", language:"en", delivery:["zip"]},
    campaign:{format:"9:16", channel:"tiktok", delivery:["zip"]},
    score:{report:"basic", delivery:["pdf"]},
    calendar:{span:"month", delivery:["ics"]},
    agent:{agent:"influencer", delivery:["json"]},
    live:{plan:"starter", channel:"tiktok", language:"en", avatar:"brand"},
    avatar:{kind:"talking", format:"9:16"},
    image:{kind:"banner", format:"1:1"},
    brand:{pack:"full", delivery:["zip"]},
    document:{kind:"pitch", delivery:["zip"]},
    voice:{kind:"clone", delivery:["wav"]}
  };

  var EX = {
    video:[
      {title:"UGC lipstick", img:IMG.lip, chips:{input:"text", format:"9:16", duration:"8s"}, prompt:"UGC lipstick ad. Talking to camera, product close-up, then a clear CTA."},
      {title:"16:9 product hero", img:IMG.perfume, chips:{input:"text", format:"16:9", duration:"8s"}, prompt:"Cinematic 16:9 product hero for this perfume on a sunlit table."}
    ],
    website:[
      {title:"Coffee landing", img:IMG.coffee, chips:{siteType:"landing", language:"en"}, prompt:"Landing page for a specialty coffee brand. Hero, menu, and checkout CTA."},
      {title:"Studio site", img:IMG.studio, chips:{siteType:"business", language:"en"}, prompt:"Business website for a production studio with work, about, and contact."}
    ],
    campaign:[
      {title:"TikTok product ad", img:IMG.lip, chips:{format:"9:16", channel:"tiktok"}, prompt:"Turn this lipstick into a TikTok product-link ad with hook and CTA."},
      {title:"Launch pack", img:IMG.perfume, chips:{format:"9:16", channel:"ig"}, prompt:"Multi-asset launch campaign for this perfume: stills, caption, and 9:16."}
    ],
    live:[
      {title:"TikTok live seller", img:IMG.lip, chips:{plan:"starter", channel:"tiktok", language:"en"}, prompt:"Set up a TikTok live sales agent for this beauty catalog."},
      {title:"IG shop hours", img:IMG.perfume, chips:{plan:"pro", channel:"ig", language:"en"}, prompt:"Instagram live sales agent, product Q&A and checkout prompts."}
    ]
  };
  function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;",""\\\\"":"&quot;","'":"&#39;"}[ch];});}
  function fmt(n){return Number(n||0).toLocaleString("en-US");}
  function typeById(id){for(var i=0;i<T.length;i++) if(T[i].id===id) return T[i]; return null;}
  function groupById(id){for(var i=0;i<GROUPS.length;i++) if(GROUPS[i].id===id) return GROUPS[i]; return null;}
  function famOf(){var t=typeById(state.type); return t?t.family:"video";}
  function clone(o){return JSON.parse(JSON.stringify(o));}

  var state = {
    view:"groups",
    group:null,
    type:null,
    fromQuery:false,
    chips:{},
    allTemp:null,
    messages:[],
    draft:"",
    files:[],
    credits:0,
    production:null,
    outputs:[],
    busy:false,
    sessionId:(Date.now()+"-"+Math.random().toString(16).slice(2))
  };

  function persist(){
    var dump = {
      view:state.view, group:state.group, type:state.type, fromQuery:state.fromQuery,
      chips:state.chips, messages:state.messages, draft:state.draft,
      production:state.production, outputs:state.outputs, sessionId:state.sessionId, credits:state.credits
    };
    try{ localStorage.setItem(SK, JSON.stringify(dump)); }catch(e){}
  }
  function restore(){
    try{
      var raw = localStorage.getItem(SK);
      if(!raw) return;
      var d = JSON.parse(raw);
      if(!d) return;
      state.view=d.view||state.view; state.group=d.group; state.type=d.type;
      state.chips=d.chips||{}; state.messages=d.messages||[]; state.draft=d.draft||"";
      state.production=d.production; state.outputs=d.outputs||[]; state.sessionId=d.sessionId||state.sessionId;
      if(typeof d.credits==="number") state.credits=d.credits;
    }catch(e){}
  }
  function saveCredits(){ try{ localStorage.setItem(CK, String(state.credits)); }catch(e){} }

  function resolveQuery(){
    var q = new URLSearchParams(location.search);
    var cat=(q.get("category")||"").toLowerCase();
    var type=(q.get("type")||"").toLowerCase();
    var mode=(q.get("mode")||"").toLowerCase();
    if(mode==="social" && (!cat || cat==="social")) return "campaign";
    var i;
    for(i=0;i<T.length;i++) if(T[i].cat===cat) return T[i].id;
    for(i=0;i<T.length;i++) if(T[i].label.toLowerCase()===type || T[i].id===type) return T[i].id;
    return null;
  }

  function selectType(id, fromQuery){
    var t=typeById(id); if(!t) return;
    if(state.type!==id){
      state.messages=[]; state.production=null; state.files=[]; state.draft="";
      state.chips=clone(DEF[t.family]||{});
    }
    state.type=id; state.group=t.group; state.fromQuery=!!fromQuery;
    state.view="empty";
    persist(); render();
  }

  function estimate(){
    var t=typeById(state.type);
    if(!t) return {total:0, parts:[], service:false};
    if(t.family==="live") return {total:0, parts:[], service:true};
    var c=state.chips||{};
    var parts=[]; var total=0;
    total+=t.base; parts.push({n:t.base,label:"base"});
    if(c.duration==="15s"){ total+=80; parts.push({n:80,label:"15s"}); }
    if(c.duration==="30s"){ total+=180; parts.push({n:180,label:"30s"}); }
    if(c.duration==="60s"){ total+=400; parts.push({n:400,label:"60s"}); }
    if(c.quality==="720p"){ total+=100; parts.push({n:100,label:"720p"}); }
    if(c.quality==="1080p"){ total+=200; parts.push({n:200,label:"1080p"}); }
    if(c.quality==="1080ppro"){ total+=350; parts.push({n:350,label:"1080p Pro"}); }
    if(c.quality==="4k"){ total+=600; parts.push({n:600,label:"4K"}); }
    var del=c.delivery||[];
    if(del.indexOf("srt")>=0){ total+=40; parts.push({n:40,label:"SRT"}); }
    if(del.indexOf("wav")>=0){ total+=60; parts.push({n:60,label:"WAV"}); }
    if(del.indexOf("alts")>=0){ total+=150; parts.push({n:150,label:"3 alternatives"}); }
    if(c.siteType==="business"){ total+=150; parts.push({n:150,label:"business"}); }
    if(c.siteType==="ecom"){ total+=280; parts.push({n:280,label:"ecommerce"}); }
    var pages=c.pages||[];
    if(pages.indexOf("extra")>=0){ total+=80; parts.push({n:80,label:"extra page"}); }
    if(pages.indexOf("blog")>=0){ total+=200; parts.push({n:200,label:"blog"}); }
    if(del.indexOf("admin")>=0){ total+=180; parts.push({n:180,label:"admin"}); }
    if(c.language==="extra"){ total+=120; parts.push({n:120,label:"language"}); }
    return {total:total, parts:parts, service:false};
  }
  function chipOn(row, chips, v){
    if(row.multi) return (chips[row.key]||[]).indexOf(v)>=0;
    return chips[row.key]===v;
  }
  function setChip(chips, row, v){
    if(row.multi){
      var arr=(chips[row.key]||[]).slice();
      var i=arr.indexOf(v);
      if(row.key==="delivery" && (v==="mp4"||v==="zip"||v==="pdf"||v==="ics"||v==="json"||v==="wav") && i>=0) return chips;
      if(i>=0) arr.splice(i,1); else arr.push(v);
      chips[row.key]=arr;
    } else {
      chips[row.key]=v;
    }
    return chips;
  }
  function rowsFor(kind){
    var f=famOf();
    var rows=kind==="all"?EMPTY[f]||[]:EMPTY[f]||[];
    return rows||[];
  }
  function chipRowHtml(row, chips){
    var h='<div class="cl-row"><span class="cl-k">'+esc(row.label)+'</span><div class="cl-chips">';
    for(var i=0;i<row.opts.length;i++){
      var o=row.opts[i];
      var on=chipOn(row,chips,o[0]);
      h+='<button type="button" class="cl-chip'+(on?" on":"")+'" data-act="chip" data-k="'+esc(row.key)+'" data-v="'+esc(o[0])+'" data-m="'+(row.multi?1:0)+'">'+esc(o[1])+'</button>';
    }
    return h+"</</div></div>";
  }

  function setupBar(){
    var t=typeById(state.type); if(!t) return "";
    var c=state.chips; var bits=[];
    bits.push(t.label);
    if(c.input==="text") bits.push("Text");
    if(c.input==="image") bits.push("Image");
    if(c.input==="clip") bits.push("Video clip");
    if(c.input==="audio") bits.push("Audio");
    if(c.format) bits.push(c.format);
    if(c.duration) bits.push(c.duration);
    if(c.siteType==="landing") bits.push("Landing");
    if(c.siteType==="business") bits.push("Business");
    if(c.siteType==="ecom") bits.push("Ecommerce");
    if(c.plan==="starter") bits.push("Starter");
    if(c.plan==="pro") bits.push("Pro");
    if(c.plan==="agency") bits.push("Agency");
    if(c.channel) bits.push(c.channel==="ig"?"Instagram":c.channel==="web"?"Website":c.channel);
    return '<div class="cl-setup">'+bits.map(function(b){return '<span class="cl-mini"><i></i>'+esc(b)+'</span>';}).join("")+'<button type="button" class="cl-mini edit" data-act="all">Edit</button></div>';
  }

  function poster(){
    if(state.files[0]&&state.files[0].url) return state.files[0].url;
    var blob=state.messages.map(function(m){return m.text||"";}).join(" ");
    if(/lipstick/i.test(blob)) return IMG.lip;
    if(/perfume/i.test(blob)) return IMG.perfume;
    return IMG.lip;
  }

  function ackText(){
    var t=typeById(state.type); var c=state.chips; var bits=[];
    if(c.format) bits.push(c.format);
    if(c.duration) bits.push(c.duration==="8s"?"8 seconds":c.duration.replace("s"," seconds"));
    if(c.siteType) bits.push(c.siteType+"");
    if(t.family==="live") bits.push((c.plan||"starter")+" · "+(c.channel||"tiktok"));
    return "Got it. "+bits.join(", ")+".";
  }

  function authReady(){
    if(window.__clUserId && window.__clAccessToken) return Promise.resolve({userId:window.__clUserId,token:window.__clAccessToken});
    if(window.__clAuthError) return Promise.reject(new Error(window.__clAuthError));
    return new Promise(function(resolve,reject){
      var timer=setTimeout(function(){reject(new Error("Session verification timed out."));},10000);
      window.addEventListener("cl-auth-ready",function done(){
        clearTimeout(timer); window.removeEventListener("cl-auth-ready",done);
        if(window.__clUserId && window.__clAccessToken) resolve({userId:window.__clUserId,token:window.__clAccessToken});
        else reject(new Error(window.__clAuthError||"You must sign in before starting production."));
      });
    });
  }
  function apiHeaders(token){ return {"Content-Type":"application/json","Authorization":"Bearer "+token}; }
  function productionUrl(p){
    var o=p&&p.output_json&&typeof p.output_json==="object"?p.output_json:{};
    var vals=[p&&p.delivery_link,p&&p.delivery_zip_url,p&&p.preview_url,p&&p.source_files_url,o.finalVideoUrl,o.final_video_url,o.providerFinalUrl,o.deliveryUrl,o.previewUrl,o.sourceFilesUrl];
    for(var i=0;i<vals.length;i++) if(/^https?:\/\//i.test(String(vals[i]||""))) return String(vals[i]);
    return "";
  }
  function pollProduction(auth,id,attempt){
    fetch("/api/automation/status",{method:"POST",headers:apiHeaders(auth.token),body:JSON.stringify({production_id:id,user_id:auth.userId,auto:true})})
      .then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Status refresh failed.");return j;});})
      .then(function(j){
        state.production=j.production||j; persist(); render();
        var status=String(state.production.status||"").toLowerCase();
        if(status==="ready"){state.busy=false;state.messages.push({role:"bot",text:"Ready. Your production can be downloaded below."});persist();render();loadCredits();return;}
        if(status==="failed"||status==="cancelled"){state.busy=false;state.messages.push({role:"bot",text:"Production "+status+". "+String(state.production.admin_notes||"")});persist();render();return;}
        if(attempt<40)setTimeout(function(){pollProduction(auth,id,attempt+1);},6000);
        else {state.busy=false;state.messages.push({role:"bot",text:"Production is still running. You can refresh its status here."});persist();render();}
      }).catch(function(e){state.busy=false;state.messages.push({role:"bot",text:e.message});persist();render();});
  }
  function goToAssistant(promptText){
    var t=typeById(state.type); if(!t||state.busy) return;
    state.busy=true; state.messages.push({role:"bot",text:"Creating the production and starting the real provider…"}); persist(); render();
    authReady().then(function(auth){
      var c=state.chips||{}; var duration=parseInt(String(c.duration||"15"),10)||15;
      var dispatch=t.family==="image"?"generate_image":"start_production";
      var payload={user_id:auth.userId,title:(t.label+" — "+promptText).slice(0,120),prompt:promptText,project_details:promptText+"\n\nSelected options: "+JSON.stringify(c),production_type:t.cat,package_id:t.package_id,output_duration_seconds:duration,aspect_ratio:c.format||undefined,delivery_requirements:{requested:true,status:"pending",formats:c.delivery||[]},request_metadata:{source:"assistant_workspace",selectedOptions:c},legal_acceptance:true,dispatch_action:dispatch,confirmation:{confirmed:true,source:"assistant_workspace_send"}};
      return fetch("/api/productions",{method:"POST",headers:apiHeaders(auth.token),body:JSON.stringify(payload)}).then(function(r){return r.json().then(function(j){if(!r.ok)throw new Error(j.error||"Production could not be created.");return {auth:auth,data:j};});});
    }).then(function(result){
      state.production=result.data.production||{}; state.messages.push({role:"bot",text:"Production created. Live status: "+String(state.production.status||"queued")+"."});persist();render();pollProduction(result.auth,state.production.id,0);
    }).catch(function(e){state.busy=false;state.messages.push({role:"bot",text:"Could not start: "+e.message});persist();render();});
  }

  function renderApp(){
    var el=document.getElementById("cl-app");
    var ttl=document.getElementById("cl-ttl");
    var t=typeById(state.type);
    ttl.textContent = t?t.label : "Crelavo";
    document.getElementById("cl-cred-n").textContent = fmt(state.credits);
    var h="";
    if(state.view==="groups"){
      h+='<div class="cl-hero"><div class="cl-bot">'+botSvg()+'</div><h1>What should we make?</h1><p>Pick a production group, then a type.</p></div><div class="cl-groups">';
      for(var i=0;i<GROUPS.length;i++){
        var g=GROUPS[i];
        h+='<button type="button" class="cl-g" data-act="group" data-id="'+g.id+'"><b>'+esc(g.label)+'</b><span>'+g.types.length+' types · '+esc(g.blurb)+'</span></button>';
      }
      h+="</div>";
    } else if(state.view==="types"){
      var gg=groupById(state.group);
      h+='<div class="cl-hero"><h1>'+esc(gg?gg.label:"Types")+'</h1><p>Only this group. Unrelated options stay hidden.</p></div><div class="cl-types">';
      var ids=gg?gg.types:[];
      for(var j=0;j<ids.length;j++){
        var tt=typeById(ids[j]); if(!tt) continue;
        h+='<button type="button" class="cl-t" data-act="type" data-id="'+tt.id+'"><b>'+esc(tt.label)+'</b><span>'+(tt.family==="live"?"Service path · no credits":("From "+fmt(tt.base)+" credits"))+'</span></button>';
      }
      h+="</div>";
    } else if(state.view==="empty"){
      h+='<div class="cl-hero"><div class="cl-bot">'+botSvg()+'</div><h1>What should we make?</h1><p>Pick options, then send a message.</p></div>';
      var rows=rowsFor("empty");
      for(var r=0;r<rows.length;r++) h+=chipRowHtml(rows[r], state.chips);
      h+='<button type="button" class="cl-all" data-act="all">All</button>';
      var ex=EX[famOf()]||EX.video;
      h+='<div class="cl-ex-h">EXAMPLES</div><div class="cl-ex">';
      for(var e=0;e<ex.length;e++){
        h+='<button type="button" data-act="ex" data-i="'+e+'"><img alt="" src="'+esc(ex[e].img)+'"><span>'+esc(ex[e].title)+'</span></button>';
      }
      h+='</div><p class="cl-cap">Tap to fill chips and a starter sentence. Does not start production.</p>';
    } else {
      h+=setupBar();
      h+='<div class="cl-chat">';
      for(var m=0;m<state.messages.length;m++){
        var msg=state.messages[m];
        h+='<div class="cl-msg '+msg.role+'">'+esc(msg.text);
        if(msg.thumb) h+='<img class="th" alt="" src="'+esc(msg.thumb)+'">';
        h+="</div>";
      }
      if(state.production){
        var ps=String(state.production.status||"queued").toLowerCase(); var readyUrl=productionUrl(state.production);
        h+='<div class="cl-ready" id="cl-current-output"><div class="hd"><span class="cl-badge">'+(ps==="ready"?"READY":"LIVE")+'</span>'+esc(ps.replace(/_/g," "))+'</div>';
        if(readyUrl) h+='<div class="cl-dl"><a class="pri" href="'+esc(readyUrl)+'" target="_blank" rel="noreferrer" download style="text-align:center;text-decoration:none">Download</a></div>';
        else h+='<div class="cl-dlnote">'+(state.busy?"Production is running…":"Output is not ready yet.")+'</div><div class="cl-dl"><button type="button" class="ghost" data-act="refresh">Refresh</button></div>';
        h+='</div>';
      }
      h+="</div>";
    }
    el.innerHTML=h;
    renderDock();
  }
  function renderDock(){
    var dock=document.getElementById("cl-dock");
    var show = state.view==="empty" || state.view==="chat";
    dock.style.display = show ? "block" : "none";
    if(!show){ dock.innerHTML=""; return; }
    var est=estimate();
    var h="";
    if(state.view==="chat"){
      if(est.service) h+='<div class="cl-est"><b>Service plan · no credits</b><span>Playbook + avatar setup</span></div>';
      else {
        var parts=[];
        for(var i=0;i<est.parts.length;i++) parts.push(est.parts[i].n+" "+est.parts[i].label);
        h+='<div class="cl-est"><b>Estimated '+fmt(est.total)+' credits · not deducted yet</b><span>'+esc(parts.join(" + "))+'</span></div>';
      }
    }
    h+='<div class="cl-comp"><button type="button" class="cl-paper" data-act="attach" aria-label="Attach">';
    h+='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21.4 11.6 12 21a6 6 0 1 1-8.5-8.5l9.9-9.9a4 4 0 0 1 5.7 5.7L9.2 18.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/></svg></button>';
    h+='<input id="cl-file" type="file" accept="image/*,video/*,audio/*" hidden>';
    h+='<input id="cl-draft" type="text" placeholder="Message Crelavo..." value="'+esc(state.draft)+'">';
    h+='<button type="button" class="cl-send" data-act="send" aria-label="Send"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></button></div>';
    dock.innerHTML=h;
  }

  function botSvg(){
    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="14" width="28" height="22" rx="8"/><circle cx="19" cy="24" r="2" fill="currentColor"/><circle cx="29" cy="24" r="2" fill="currentColor"/><path d="M18 31c2 2 10 2 12 0"/><path d="M24 14V9"/><circle cx="24" cy="7" r="2"/></svg>';
  }

  function goBack(){
    if(state.view==="chat"||state.view==="empty"){
      if(state.fromQuery){ location.href="/categories"; return; }
      state.view="groups"; persist(); render(); return;
    }
    if(state.view==="types"){ state.view="groups"; persist(); render(); return; }
    location.href="/categories";
  }

  function send(){
    var input=document.getElementById("cl-draft");
    if(input) state.draft=input.value;
    var text=(state.draft||"").trim();
    if(!text && !state.files.length) return;
    if(!state.type) return;
    state.view="chat";
    state.messages=[];
    state.messages.push({role:"user", text:text||"Use the attached file."});
    state.messages.push({role:"bot", text:ackText()});
    state.messages.push({role:"bot", text:"Starting production here with these options.", thumb: poster()});
    state.draft="";
    persist(); render();
    goToAssistant(text||"Use the attached file.");
  }

  function onClick(ev){
    var btn=ev.target.closest("[data-act]");
    if(!btn) return;
    var act=btn.getAttribute("data-act");
    if(act==="back") goBack();
    if(act==="group"){ state.group=btn.getAttribute("data-id"); state.view="types"; persist(); render(); }
    if(act==="type") selectType(btn.getAttribute("data-id"), false);
    if(act==="chip"){
      var row=null;
      var rows=rowsFor("empty");
      for(var i=0;i<rows.length;i++) if(rows[i].key===btn.getAttribute("data-k")) {row=rows[i]; break;}
      if(!row) row={key:btn.getAttribute("data-k"), multi:+btn.getAttribute("data-m")};
      setChip(state.chips, row, btn.getAttribute("data-v"));
      persist(); render();
    }
    if(act==="ex"){
      var pack=(EX[famOf()]||EX.video)[+btn.getAttribute("data-i")];
      if(pack){
        for(var key in pack.chips) state.chips[key]=pack.chips[key];
        state.draft=pack.prompt;
        persist(); render();
        var di=document.getElementById("cl-draft"); if(di) di.focus();
      }
    }
    if(act==="attach"){ var f=document.getElementById("cl-file"); if(f) f.click(); }
    if(act==="send") send();
    if(act==="outputs"){ state.view="chat"; render(); setTimeout(function(){var x=document.getElementById("cl-current-output");if(x)x.scrollIntoView({behavior:"smooth",block:"center"});},0); }
    if(act==="refresh" && state.production && state.production.id){ authReady().then(function(a){state.busy=true;render();pollProduction(a,state.production.id,40);}).catch(function(e){state.messages.push({role:"bot",text:e.message});render();}); }
  }

  function bind(){
    var root=document.getElementById("cl-assistant");
    root.addEventListener("click", onClick);
    root.addEventListener("change", function(ev){
      if(ev.target && ev.target.id==="cl-file" && ev.target.files && ev.target.files[0]){
        var f=ev.target.files[0];
        state.files=[{name:f.name, type:f.type, url:URL.createObjectURL(f)}];
      }
    });
    root.addEventListener("keydown", function(ev){
      if(ev.key==="Enter" && ev.target && ev.target.id==="cl-draft"){ ev.preventDefault(); send(); }
    });
    root.addEventListener("input", function(ev){
      if(ev.target && ev.target.id==="cl-draft") state.draft=ev.target.value;
    });
    if(window.visualViewport){
      var pin=function(){
        var vv=window.visualViewport;
        var kb=Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        root.style.setProperty("--kb", kb+"px");
      };
      window.visualViewport.addEventListener("resize", pin);
      window.visualViewport.addEventListener("scroll", pin);
      pin();
    }
  }

  function loadCredits(){
    return authReady().then(function(a){
      return fetch("/api/credits?user_id="+encodeURIComponent(a.userId),{headers:apiHeaders(a.token),cache:"no-store"});
    }).then(function(r){return r.ok?r.json():null;}).then(function(j){
      if(j && typeof j.balance==="number"){ state.credits=j.balance; saveCredits(); return; }
    }).catch(function(){});
  }

  function boot(){
    restore();
    var qid=resolveQuery();
    if(qid){
      if(state.type!==qid || !state.messages.length) selectType(qid, true);
      else { state.fromQuery=true; state.view = state.messages.length?"chat":"empty"; }
    } else if(state.type && (state.view==="empty"||state.view==="chat")){
      /* keep restored workspace */
    } else {
      state.view="groups";
    }
    bind();
    loadCredits().then(function(){ persist(); render(); });
    render();
  }

  function render(){ renderApp(); }
  boot();
})();
`;
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
      <script id="cl-assistant-js" dangerouslySetInnerHTML={{ __html: SCRIPT_BLOCK }} />
      <SiteFooter />
    </>
  );
}
