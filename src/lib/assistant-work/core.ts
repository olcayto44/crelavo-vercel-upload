import { bearerTokenFromRequest, supabaseAdmin } from "@/lib/supabase";
import { ledgerRead, ledgerSpend } from "./ledger";

export type PreviewKind = "html" | "video" | "audio" | "image" | "pdf" | "calendar" | "persona" | "live_sales";
export type Cat = { title: string; group: string; from: number; preview: PreviewKind; deliver: "zip" | "mp4" | "wav" | "png_zip" | "pdf" | "live_sales"; packs: Record<string, number> };

export const CATEGORIES: Record<string, Cat> = {
  website:{title:"Website",group:"build",from:500,preview:"html",deliver:"zip",packs:{landing:500,business:1500,ecommerce:10000}},
  saas:{title:"SaaS",group:"build",from:2500,preview:"html",deliver:"zip",packs:{dashboard:2500,mvp:6000,billing:12000}},
  mobile_app:{title:"Mobile App",group:"build",from:3000,preview:"html",deliver:"zip",packs:{ui:3000,expo:6000,admin:11000}},
  admin_project:{title:"Admin Panel Project",group:"build",from:3500,preview:"html",deliver:"zip",packs:{basic:3500,advanced:10000}},
  video:{title:"AI Video",group:"media",from:600,preview:"video",deliver:"mp4",packs:{"8s":600,"15s":3300,"30s":9600}},
  talking_video:{title:"Advanced Talking Video",group:"media",from:4200,preview:"video",deliver:"mp4",packs:{self:4200,multi:8200,regional:9800}},
  documentary:{title:"Documentary",group:"media",from:2200,preview:"video",deliver:"mp4",packs:{short:2200,explainer:5200,series:9800}},
  animation:{title:"Animation",group:"media",from:900,preview:"video",deliver:"mp4",packs:{explainer:900,character:3500}},
  music_video:{title:"Music Video / MV",group:"media",from:4000,preview:"video",deliver:"mp4",packs:{lyric:4000,performance:8500,cinematic:16000}},
  drama:{title:"Drama / Short Series",group:"media",from:5200,preview:"video",deliver:"zip",packs:{builder:5200,viral:7800,mini:12500}},
  cinematic_video:{title:"Cinematic Video",group:"media",from:3300,preview:"video",deliver:"mp4",packs:{pack:3300}},
  video_clipping:{title:"Video Clipping",group:"media",from:1800,preview:"video",deliver:"zip",packs:{shorts:1800,moments:4200}},
  video_tools:{title:"Video Tools",group:"media",from:900,preview:"video",deliver:"mp4",packs:{pack:900,watermark:1200}},
  campaign:{title:"Text-to-Campaign",group:"marketing",from:2500,preview:"html",deliver:"zip",packs:{starter:2500,product:6500,multi:7500}},
  ad_score_checker:{title:"AI Ad Performance Score Checker",group:"marketing",from:600,preview:"pdf",deliver:"pdf",packs:{basic:600,pack:1200}},
  campaign_calendar:{title:"AI Campaign Calendar",group:"marketing",from:800,preview:"calendar",deliver:"pdf",packs:{brief:800,seasonal:2200}},
  ai_agent:{title:"AI Agents",group:"marketing",from:5000,preview:"persona",deliver:"zip",packs:{influencer:5000,manager:12000,always:20000}},
  localization:{title:"Global Localization",group:"marketing",from:2000,preview:"video",deliver:"mp4",packs:{video:2000,cultural:6000,global:12000}},
  cultural_localization:{title:"AI Cultural Localization",group:"marketing",from:900,preview:"pdf",deliver:"pdf",packs:{country:900,script:1800}},
  live_sales_agent:{title:"AI Live Sales Agent",group:"marketing",from:0,preview:"live_sales",deliver:"live_sales",packs:{}},
  avatar:{title:"Avatar Design / Avatar Video",group:"avatars",from:2500,preview:"image",deliver:"png_zip",packs:{design:2500,video:6500,multi:8200}},
  lip_sync:{title:"Lip Sync Video",group:"avatars",from:1800,preview:"video",deliver:"mp4",packs:{sync:1800}},
  voice_clone:{title:"Voice Cloning",group:"avatars",from:2500,preview:"audio",deliver:"wav",packs:{pack:2500}},
  visual_clone:{title:"Visual Clone / Style Clone",group:"avatars",from:1500,preview:"image",deliver:"png_zip",packs:{pack:1500}},
  image:{title:"Image / Banner / Poster",group:"brand",from:100,preview:"image",deliver:"png_zip",packs:{single:100,pack:750}},
  brand_kit:{title:"Brand Kit",group:"brand",from:1500,preview:"html",deliver:"zip",packs:{full:3000}},
  document_pack:{title:"Document / File Pack",group:"brand",from:750,preview:"pdf",deliver:"pdf",packs:{pitch:750}},
  anime_short_film:{title:"Anime Short Film",group:"special",from:3200,preview:"video",deliver:"mp4",packs:{scene:3200,pack:9000}},
  animal_video:{title:"Animal Video",group:"special",from:900,preview:"video",deliver:"mp4",packs:{funny:900,cinematic:4200}},
  nature_video:{title:"Nature Video",group:"special",from:1200,preview:"video",deliver:"mp4",packs:{cinematic:1200,doc:5200}},
  planet_space_video:{title:"Planet / Space Video",group:"special",from:1500,preview:"video",deliver:"mp4",packs:{explainer:1500,cinematic:6500}},
  drone_video:{title:"Drone / Satellite Video",group:"special",from:2600,preview:"video",deliver:"mp4",packs:{location:2600,story:6800}},
  stickman_animation:{title:"Stickman Animation",group:"special",from:400,preview:"video",deliver:"mp4",packs:{short:400,education:1200,story:2500}},
  studio:{title:"Studio / Series-Film",group:"special",from:7800,preview:"video",deliver:"zip",packs:{series:7800,trailer:4200}}
};

const COPY_RE=/\b(copy|layout|color|colour|text|font|heading|headline|section|padding|margin|renk|metin|başlık|yazı|düzen)\b/i;
const ENGINE_RE=/\b(voice|ses|environment|ortam|product|ürün|scene|sahne|face|yüz|wardrobe|kıyafet|duration|süre|music|müzik|character|karakter)\b/i;
export type WorkFile={name:string;mime:string;text:string};
export type Job={id:string;userId:string;category:string;typeName:string;chips:string[];brief:string;revisions:string[];status:"previewing"|"halted_empty"|"delivered";chargedTotal:number;previewKind:PreviewKind;previewHtml:string;files:WorkFile[]};
const globals=globalThis as unknown as {__cawJobs?:Map<string,Job>};
globals.__cawJobs??=new Map();
const jobs=globals.__cawJobs;

export async function getWorkUserId(req:Request):Promise<string|null>{
  const token=bearerTokenFromRequest(req); if(!token)return null;
  try{const {data,error}=await supabaseAdmin().auth.getUser(token); return error?null:data.user?.id??null;}catch{return null;}
}
export async function chargeCredits(
  userId: string,
  amount: number,
  note: string
): Promise<
  | { ok: true; available: number }
  | { ok: false; code: string; available: number; message?: string }
> {
  if (!Number.isFinite(amount) || amount < 0) {
    return { ok: false, code: "invalid_amount", available: await ledgerRead(userId) };
  }
  if (amount === 0) return { ok: true, available: await ledgerRead(userId) };
  const result = await ledgerSpend(userId, Math.trunc(amount), note);
  if (!result.ok) return { ok: false, code: result.code, available: result.available, message: result.message };
  return { ok: true, available: result.available };
}
export function detectPack(category:string,chips:string[]){const j=chips.join(" ").toLowerCase();if(category==="website"){if(/e-?commerce|store/.test(j))return"ecommerce";if(/business/.test(j))return"business";if(/landing/.test(j))return"landing"}if(category==="video"){if(/\b30s\b/.test(j))return"30s";if(/\b15s\b/.test(j))return"15s";if(/\b8s\b/.test(j))return"8s"}return""}
export function quote(category:string,chips:string[],mode:"produce"|"revise",instruction=""){const cat=CATEGORIES[category]||CATEGORIES.video;if(cat.preview==="live_sales")return{credits:0,engine:false,reason:"live_sales"};if(mode==="revise"){const engine=ENGINE_RE.test(instruction)||!COPY_RE.test(instruction);return engine?{credits:Math.max(100,Math.round(cat.from*.15)),engine:true,reason:"part"}:{credits:0,engine:false,reason:"copy"}}const pack=detectPack(category,chips);const credits=pack&&cat.packs[pack]!=null?cat.packs[pack]:cat.from;return{credits,engine:credits>0,reason:pack||"from"}}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c] as string))}
function titleFrom(brief:string,fallback:string){return brief.replace(/\s+/g," ").trim().slice(0,72)||fallback}
function shell(title:string,inner:string){return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>:root{--bg:#070b18;--card:#0b1220;--line:#1e293b;--text:#f8fbff;--muted:#aeb8cc;--accent:#0ea5e9}*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--text)}.wrap{max-width:960px;margin:auto;padding:48px 24px}.hero h1{font-size:40px;margin:0 0 12px}.hero p,p{color:var(--muted)}.btn{display:inline-block;margin-top:20px;background:var(--accent);color:#072033;font-weight:700;border-radius:999px;padding:12px 22px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-top:36px}.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px}.phone{width:320px;margin:24px auto;border:8px solid #111827;border-radius:28px;overflow:hidden;min-height:560px;background:#0b1220}</style></head><body>${inner}</body></html>`}
function readme(category:string,title:string){return `# ${title}\n\nCrelavo production files. Host these yourself. Crelavo does not publish, host, or set up domains, servers, or app stores.\n\nCategory: ${category}\n`}
function buildFiles(category:string,brief:string,chips:string[],extra=""){const cat=CATEGORIES[category]||CATEGORIES.video;const title=titleFrom(brief,cat.title);const full=brief+(extra?`\n\n${extra}`:"");if(cat.preview==="live_sales"){return{previewKind:cat.preview,previewHtml:shell("Live Sales Agent trial",`<div class="wrap"><div class="hero"><h1>Live Sales Agent trial</h1><p>${esc(full||"Try the avatar agent here.")}</p><a class="btn" href="/dashboard/live-sales-agent">Open Live Sales</a></div></div>`),files:[] as WorkFile[]}}if(cat.preview==="html"){const inner=category==="mobile_app"?`<div class="phone"><div class="wrap"><h1>${esc(title)}</h1><p>${esc(full)}</p><div class="card">Home</div><div class="card">Catalog</div><div class="card">Account</div></div></div>`:category==="saas"||category==="admin_project"?`<div class="wrap"><h1>${esc(title)}</h1><p>${esc(full)}</p><div class="grid"><div class="card">Auth</div><div class="card">Dashboard</div><div class="card">Billing</div><div class="card">Admin</div></div></div>`:`<div class="wrap"><div class="hero"><h1>${esc(title)}</h1><p>${esc(full)}</p><span class="btn">Get started</span></div><div class="grid"><div class="card">Offer</div><div class="card">Proof</div><div class="card">Close</div></div></div>`;const html=shell(title,inner);return{previewKind:cat.preview,previewHtml:html,files:[{name:"index.html",mime:"text/html",text:html},{name:"README.md",mime:"text/markdown",text:readme(category,title)}]}}if(["pdf","calendar","persona"].includes(cat.preview)){const html=shell(title,`<div class="wrap"><div class="hero"><h1>${esc(title)}</h1><p>${esc(full)}</p></div><div class="card"><pre style="white-space:pre-wrap">${esc(full)}\n\nDeliverable: ${cat.deliver.toUpperCase()}</pre></div></div>`);return{previewKind:cat.preview,previewHtml:html,files:[{name:cat.preview==="persona"?"persona.html":"report.html",mime:"text/html",text:html},{name:"README.md",mime:"text/markdown",text:readme(category,title)}]}}const scenes=[`Open on the product. ${title}.`,`Show the requested environment.`,`Voice and motion match the brief.`,`End on the offer. ${full.slice(0,140)}`];const cards=scenes.map((s,i)=>`<div class="card"><small>SCENE ${i+1}</small><p>${esc(s)}</p></div>`).join("");const html=shell(title,`<div class="wrap"><div class="hero"><h1>${esc(title)}</h1><p>${esc(full)}</p><p>Final media uses the engine adapter when connected.</p></div><div class="grid">${cards}</div></div>`);return{previewKind:cat.preview,previewHtml:html,files:[{name:"preview.html",mime:"text/html",text:html},{name:"scenes.json",mime:"application/json",text:JSON.stringify({title,brief:full,chips,scenes},null,2)},{name:"subtitles.srt",mime:"application/x-subrip",text:`1\n00:00:00,000 --> 00:00:08,000\n${title}\n`},{name:"README.md",mime:"text/markdown",text:readme(category,title)+"\nMedia engine adapter is not connected. Plug MiniMax into runMediaEngine.\n"}]}}
export async function runMediaEngine(_job:Job):Promise<{url?:string}|null>{return null}
function crc32(buf:Uint8Array){let c=~0>>>0;for(const v of buf){c^=v;for(let k=0;k<8;k++)c=(c>>>1)^(0xedb88320&-(c&1))}return ~c>>>0}function u16(n:number){const b=new Uint8Array(2);new DataView(b.buffer).setUint16(0,n,true);return b}function u32(n:number){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);return b}
export function zipFiles(files:{name:string;text:string}[]){const enc=new TextEncoder(),locals:Uint8Array[]=[],centrals:Uint8Array[]=[];let offset=0;for(const f of files){const name=enc.encode(f.name),data=enc.encode(f.text),crc=crc32(data),local=new Uint8Array(30+name.length+data.length);local.set([80,75,3,4,20],0);local.set(u32(crc),14);local.set(u32(data.length),18);local.set(u32(data.length),22);local.set(u16(name.length),26);local.set(name,30);local.set(data,30+name.length);locals.push(local);const central=new Uint8Array(46+name.length);central.set([80,75,1,2,20,0,20],0);central.set(u32(crc),16);central.set(u32(data.length),20);central.set(u32(data.length),24);central.set(u16(name.length),28);central.set(u32(offset),42);central.set(name,46);centrals.push(central);offset+=local.length}const centralSize=centrals.reduce((n,x)=>n+x.length,0),end=new Uint8Array(22);end.set([80,75,5,6],0);end.set(u16(files.length),8);end.set(u16(files.length),10);end.set(u32(centralSize),12);end.set(u32(offset),16);const out=new Uint8Array(offset+centralSize+22);let p=0;for(const x of [...locals,...centrals]){out.set(x,p);p+=x.length}out.set(end,p);return out}
function publicJob(job:Job,balance:number,charged:number,warning:string|null){return{ok:true,balance,charged,warning,job:{id:job.id,category:job.category,typeName:job.typeName,status:job.status,chargedTotal:job.chargedTotal,previewKind:job.previewKind,previewHtml:job.previewHtml,files:job.files,liveSalesHref:job.category==="live_sales_agent"?"/dashboard/live-sales-agent":null}}}
async function charge(userId: string, amount: number, note: string) {
  let available: number;
  try {
    available = await ledgerRead(userId);
  } catch (error) {
    return { ok: false as const, code: "schema" as const, balance: 0, need: amount, message: error instanceof Error ? error.message : "Ledger read failed." };
  }
  if (amount <= 0) return { ok: true as const, balance: available, charged: 0, emptied: available === 0 };
  if (available <= 0) return { ok: false as const, code: "empty" as const, balance: available, need: amount };
  if (available < amount) return { ok: false as const, code: "insufficient" as const, balance: available, need: amount };
  const result = await chargeCredits(userId, amount, note);
  if (!result.ok) return { ok: false as const, code: result.code, balance: result.available, need: amount, message: result.message };
  return { ok: true as const, balance: result.available, charged: amount, emptied: result.available === 0 };
}
export async function handleAssistantWork(req: Request, body: Record<string, unknown>) {
  const userId = await getWorkUserId(req);
  const action = String(body.action || "");
  if (!userId) return { status: 401, payload: { ok: false, code: "sign_in", message: "Sign in to start production." } };

  let balance: number;
  try {
    balance = await ledgerRead(userId);
  } catch (error) {
    return { status: 500, payload: { ok: false, code: "schema", balance: 0, message: error instanceof Error ? error.message : "Ledger read failed." } };
  }
  if (action === "balance") return { status: 200, payload: { ok: true, balance } };

  const category = String(body.category || "video");
  const typeName = String(body.typeName || "");
  const chips = Array.isArray(body.chips) ? body.chips.map(String) : [];
  const message = String(body.message || "");
  const jobId = String(body.jobId || "");

  if (action === "quote") {
    return { status: 200, payload: { ok: true, balance, ...quote(category, chips, body.mode === "revise" ? "revise" : "produce", message) } };
  }

  if (action === "produce") {
    const q = quote(category, chips, "produce", message);
    const paid = await charge(userId, q.credits, `assistant_produce:${category}:${q.reason}`);
    if (!paid.ok) {
      return { status: paid.code === "schema" || paid.code === "rpc_error" ? 500 : 402, payload: { ok: false, code: paid.code, balance: paid.balance, need: paid.need, message: paid.message || (paid.code === "empty" || paid.code === "insufficient" ? `Not enough credits. Need ${paid.need}. Balance ${paid.balance}.` : "Production could not start.") } };
    }
    const built = buildFiles(category, message, chips);
    const job: Job = {
      id: "job_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), userId, category, typeName, chips, brief: message, revisions: [],
      status: paid.emptied ? "halted_empty" : "previewing", chargedTotal: paid.charged, previewKind: built.previewKind, previewHtml: built.previewHtml, files: built.files,
    };
    jobs.set(job.id, job);
    await runMediaEngine(job);
    return { status: 200, payload: publicJob(job, paid.balance, paid.charged, paid.emptied ? "Credits empty. Production stopped." : null) };
  }

  const job = jobs.get(jobId);
  if (!job || job.userId !== userId) return { status: 404, payload: { ok: false, code: "job_missing" } };

  if (action === "revise") {
    if (job.status === "halted_empty" && await ledgerRead(userId) <= 0) {
      return { status: 402, payload: { ok: false, code: "credits_empty", balance: 0, message: "Credits empty. Production stopped." } };
    }
    const paid = await charge(userId, quote(job.category, job.chips, "revise", message).credits, `assistant_revise:${job.category}`);
    if (!paid.ok) {
      if (paid.code === "empty" || paid.code === "insufficient") job.status = "halted_empty";
      return { status: paid.code === "schema" || paid.code === "rpc_error" ? 500 : 402, payload: { ok: false, code: paid.code, balance: paid.balance, need: paid.need, message: paid.message || (paid.code === "empty" || paid.code === "insufficient" ? `Not enough credits. Need ${paid.need}. Balance ${paid.balance}.` : "Revision could not start."), job: publicJob(job, paid.balance, 0, "Production stopped.").job } };
    }
    job.revisions.push(message);
    const built = buildFiles(job.category, job.brief, job.chips, job.revisions.map((r, i) => `Change ${i + 1}: ${r}`).join("\n"));
    job.previewHtml = built.previewHtml;
    job.files = built.files;
    job.chargedTotal += paid.charged;
    job.status = paid.emptied ? "halted_empty" : "previewing";
    await runMediaEngine(job);
    return { status: 200, payload: publicJob(job, paid.balance, paid.charged, paid.emptied ? "Credits empty. Production stopped." : null) };
  }

  if (action === "resume") {
    const current = await ledgerRead(userId);
    if (current <= 0) return { status: 402, payload: { ok: false, code: "credits_empty", balance: current, message: "Credits empty. Production stopped." } };
    job.status = "previewing";
    return { status: 200, payload: publicJob(job, current, 0, null) };
  }

  if (action === "deliver") {
    job.status = "delivered";
    const current = await ledgerRead(userId);
    const zip = zipFiles(job.files.length ? job.files : [{ name: "README.md", text: readme(job.category, job.typeName || job.category) }]);
    return { status: 200, payload: { ...publicJob(job, current, 0, null), zipName: (job.category || "crelavo") + ".zip", zipB64: Buffer.from(zip).toString("base64") } };
  }

  return { status: 400, payload: { ok: false, code: "bad_action" } };
}