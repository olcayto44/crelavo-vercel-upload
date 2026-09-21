export const LOCAL_CATEGORIES = [
  "website",
  "saas",
  "mobile_app",
  "admin_project",
  "video_clipping",
  "ad_score_checker",
  "campaign_calendar",
  "document_pack",
] as const;

export type LocalCategory = (typeof LOCAL_CATEGORIES)[number];
export type LocalEngineFile = { path: string; content: string; mime: string };
export type LocalEngineInput = { prompt?: string; type?: string; category?: string; scene?: string | number; action?: string };
export type LocalEngineResult = { ok: boolean; spend: boolean; engine: "local"; category: string; code?: string; message?: string; title: string; body: string; files: LocalEngineFile[]; media: null };
const LOCAL_SET = new Set<string>(LOCAL_CATEGORIES);

export function normalizeCategory(raw?: string): string {
  return String(raw || "").trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}
export function isLocalCategory(category?: string, type?: string): boolean {
  const cat = normalizeCategory(category); if (LOCAL_SET.has(cat)) return true;
  return LOCAL_SET.has(normalizeCategory(type));
}
export function isCopyLayoutColorOnly(prompt?: string): boolean {
  const p = String(prompt || "").trim().toLowerCase();
  if (!p || p.length > 180) return false;
  const produce = /\b(build|create|generate|produce|full|website|saas|app|admin|calendar|score|clip|document|pitch|proposal|pack|page)\b/;
  if (produce.test(p)) return false;
  return /\b(copy|headline|title|subtitle|text|wording|rename|rewrite this line)\b/.test(p) || /\b(layout|spacing|padding|margin|align|grid|stack|move)\b/.test(p) || /\b(color|colour|background|font|dark|light|blue|red|gold|black|white)\b/.test(p);
}
function brandFromPrompt(prompt: string): string { const line = String(prompt || "").trim().split(/\n/)[0] || "Crelavo Project"; const cleaned = line.replace(/["']/g, "").slice(0, 48).trim(); return cleaned || "Crelavo Project"; }
function sceneIndex(scene?: string | number): number { const n = parseInt(String(scene ?? "1"), 10); if (!Number.isFinite(n) || n < 1) return 1; return Math.min(4, n); }
function file(path: string, content: string, mime = "text/plain"): LocalEngineFile { return { path, content, mime }; }
function ok(category: string, title: string, body: string, files: LocalEngineFile[], spend: boolean): LocalEngineResult { return { ok: true, spend, engine: "local", category, title, body, files, media: null }; }
function css(): string { return `*{box-sizing:border-box}html,body{margin:0;font-family:Inter,system-ui,sans-serif;background:#07080f;color:#eef3ff}
a{color:inherit;text-decoration:none}img{max-width:100%}
.wrap{max-width:1080px;margin:0 auto;padding:32px 20px}
.nav{display:flex;gap:16px;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #1c2438}
.btn{display:inline-block;padding:12px 18px;border-radius:999px;background:linear-gradient(90deg,#7c5cff,#22d3ee);color:#071018;font-weight:700}
.card{background:#101627;border:1px solid #243049;border-radius:18px;padding:20px;margin:12px 0}
h1{font-size:42px;line-height:1.1;margin:12px 0}p{color:#c6d0e4;line-height:1.6}
.grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}`; }
function htmlPage(title: string, inner: string): string { return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title><link rel="stylesheet" href="./styles.css"/></head><body>${inner}</body></html>`; }

function websitePack(prompt: string, scene: number): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const brief = prompt.trim() || `${brand} landing, catalog, story and checkout.`;
  const nav = `<header class="nav"><strong>${brand}</strong><nav><a href="./index.html">Home</a><a href="./catalog.html">Catalog</a><a href="./story.html">Story</a><a href="./checkout.html">Checkout</a></nav></header>`;
  const pages = [
    { title: "Home", file: "index.html", body: "Hero, proof, and one clear start.", inner: `${nav}<main class="wrap"><p>PAGE 01 / HOME</p><h1>${brand}</h1><p>${brief}</p><a class="btn" href="./catalog.html">Start here</a></main>` },
    { title: "Catalog", file: "catalog.html", body: "Products, offers, and the next click.", inner: `${nav}<main class="wrap"><p>PAGE 02 / CATALOG</p><h1>Catalog</h1><div class="grid"><div class="card"><h3>Offer 01</h3><p>${brief}</p></div><div class="card"><h3>Offer 02</h3><p>Proof, price, and a short reason to buy.</p></div><div class="card"><h3>Offer 03</h3><p>Bundle or refill path.</p></div></div></main>` },
    { title: "Story", file: "story.html", body: "Why it exists, who it is for.", inner: `${nav}<main class="wrap"><p>PAGE 03 / STORY</p><h1>Story</h1><div class="card"><p>${brief}</p><p>Keep the promise visible. One customer, one result, one next step.</p></div></main>` },
    { title: "Checkout", file: "checkout.html", body: "Buy path. Host this yourself.", inner: `${nav}<main class="wrap"><p>PAGE 04 / CHECKOUT</p><h1>Checkout</h1><div class="card"><p>Connect your own payments on the host you choose. Crelavo delivers files only.</p><p>${brief}</p></div></main>` },
  ];
  const selected = pages[scene - 1] || pages[0];
  const files = [file("styles.css", css(), "text/css"), ...pages.map((p) => file(p.file, htmlPage(`${brand} · ${p.title}`, p.inner), "text/html")), file("README.md", `# ${brand} website\n\nCrelavo delivers source files. You host them.\n\nOpen index.html, catalog.html, story.html, checkout.html.\nDo not wait on MiniMax or HeyGen.\n`, "text/markdown")];
  return ok("website", selected.title, selected.body, files, true);
}
function saasPack(prompt: string, scene: number): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const screens = [{ title: "Dashboard", body: "Home metrics and the next action." }, { title: "Auth", body: "Sign in and session gate." }, { title: "Billing", body: "Plan, invoice, and portal." }, { title: "Settings", body: "Workspace and members." }]; const selected = screens[scene - 1] || screens[0];
  const files = [file("src/pages/Dashboard.tsx", `export default function Dashboard(){return (<main><h1>${brand} Dashboard</h1><p>${prompt}</p></main>);}`, "text/plain"), file("src/pages/Auth.tsx", `export default function Auth(){return (<main><h1>Sign in</h1><p>Use your existing auth. Crelavo does not host this app.</p></main>);}`, "text/plain"), file("src/pages/Billing.tsx", `export default function Billing(){return (<main><h1>Billing</h1><p>Keep payments on the platform you already use.</p></main>);}`, "text/plain"), file("src/pages/Settings.tsx", `export default function Settings(){return (<main><h1>Settings</h1><p>Workspace, members, brand.</p></main>);}`, "text/plain"), file("README.md", `# ${brand} SaaS starter\n\nFiles only. You host and deploy.\nScreens: Dashboard, Auth, Billing, Settings.\n`, "text/markdown")];
  return ok("saas", selected.title, selected.body, files, true);
}
function mobilePack(prompt: string, scene: number): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const screens = [{ title: "Home", body: "First screen after open." }, { title: "Catalog", body: "List and product cards." }, { title: "Story", body: "Brand story screen." }, { title: "Checkout", body: "Order review screen." }]; const selected = screens[scene - 1] || screens[0];
  const files = [file("App.tsx", `import { Text, View } from "react-native";\nexport default function App(){return (<View style={{flex:1,justifyContent:"center",padding:24}}><Text>${brand}</Text><Text>${prompt}</Text></View>);}`, "text/plain"), file("screens/Home.tsx", `import { Text, View } from "react-native";\nexport default function Home(){return (<View><Text>Home</Text></View>);}`, "text/plain"), file("screens/Catalog.tsx", `import { Text, View } from "react-native";\nexport default function Catalog(){return (<View><Text>Catalog</Text></View>);}`, "text/plain"), file("README.md", `# ${brand} mobile starter\n\nExpo / React Native files. You run and publish the app store build yourself.\nCrelavo does not do app-store setup.\n`, "text/markdown")];
  return ok("mobile_app", selected.title, selected.body, files, true);
}
function adminPack(prompt: string, scene: number): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const screens = [{ title: "Admin home", body: "CRUD entry and counts." }, { title: "Records", body: "List, search, edit." }, { title: "Roles", body: "Owner, admin, support." }, { title: "Setup", body: "Host this yourself." }]; const selected = screens[scene - 1] || screens[0];
  const files = [file("schema.sample.sql", `-- Sample customer schema. Do not run against Crelavo credit tables.\ncreate table if not exists records (\n  id text primary key,\n  title text not null,\n  status text not null default 'draft',\n  created_at timestamptz default now()\n);\n`, "text/plain"), file("src/AdminHome.tsx", `export default function AdminHome(){return (<main><h1>${brand} Admin</h1><p>${prompt}</p></main>);}`, "text/plain"), file("SETUP.md", `# ${brand} admin setup\n\nYou host the panel and the database.\nCrelavo does not deploy servers or domains.\n`, "text/markdown")];
  return ok("admin_project", selected.title, selected.body, files, true);
}
function clippingPack(prompt: string): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const clips = [1,2,3,4,5,6,7,8].map((n) => ({ id: `clip_${String(n).padStart(2,"0")}`, in: `${(n-1)*45}`, out: `${(n-1)*45+18}`, title: `${brand} clip ${n}`, hook: n === 1 ? prompt.slice(0,120) : `Moment ${n}: keep the peak, cut the wait.` }));
  const files = [file("clips.json", JSON.stringify({ brief: prompt, clips }, null, 2), "application/json"), file("captions.vtt", `WEBVTT\n\n${clips.map((c,i) => `${i+1}\n00:00:${String(i*3).padStart(2,"0")}.000 --> 00:00:${String(i*3+2).padStart(2,"0")}.000\n${c.hook}\n`).join("\n")}`, "text/vtt"), file("CLIP-PLAN.md", `# ${brand} clip plan\n\nLocal file plan. No MiniMax. No HeyGen.\nPaste this into your editor and cut the source video yourself.\n\n${clips.map((c) => `- ${c.id} ${c.in}s-${c.out}s · ${c.title}`).join("\n")}\n`, "text/markdown")];
  return ok("video_clipping", "Clip plan ready", "Eight cut points, captions, and an editor list. Source video stays with you.", files, true);
}
function adScorePack(prompt: string): LocalEngineResult {
  const text = prompt.trim(); let score = 40; if (/https?:|shopify|amazon|trendyol/i.test(text)) score += 10; if (/\b(buy|shop|get|order|now|cta)\b/i.test(text)) score += 15; if (/\b(review|proof|before|after|result|testimonial|guarantee)\b/i.test(text)) score += 15; if (text.split(/\s+/).length >= 12) score += 10; if (text.length < 24) score -= 15; score = Math.max(12, Math.min(96, score));
  const angles = [`Hook: put the main benefit in the first 3 seconds. ${text.slice(0,80)}`, "Proof: add one review, result, or before/after in the first screen.", "CTA: one visible action. Shop, book, or start. Not both."]; const body = `Ad Score: ${score}/100. Fix first: first 3 seconds, visible CTA, one proof point.`;
  return ok("ad_score_checker", `Ad Score: ${score}/100`, body, [file("SCORE.md", `# Ad score report\n\nScore: ${score}/100\n\nInput:\n${text}\n\nStrong:\nClear product angle if the offer can be said in one line.\n\nFix first:\n${angles.map((a,i) => `${i+1}. ${a}`).join("\n")}\n`, "text/markdown"), file("angles.json", JSON.stringify({ score, angles, input: text }, null, 2), "application/json")], true);
}
function calendarPack(prompt: string): LocalEngineResult {
  const brand = brandFromPrompt(prompt); const days = Array.from({length:30},(_,i) => { const d = new Date(); d.setUTCDate(d.getUTCDate()+i); const iso=d.toISOString().slice(0,10); const kind=i%7===0?"Launch":i%3===0?"Proof":"Hook"; return {date:iso,kind,note:`${kind} for ${brand}`}; }); const csv=["date,kind,note",...days.map((x)=>`${x.date},${x.kind},"${x.note}"`)].join("\n");
  return ok("campaign_calendar", "30-day calendar", "Seasonal brief, hooks, and launch days as files.", [file("calendar.csv",csv,"text/csv"),file("CALENDAR.md",`# ${brand} campaign calendar\n\n${prompt}\n\n${days.map((x)=>`- ${x.date} · ${x.kind}`).join("\n")}\n`,"text/markdown")], true);
}
function documentPack(prompt: string): LocalEngineResult {
  const brand=brandFromPrompt(prompt); const files=[file("PITCH.md",`# ${brand} pitch\n\nProblem\n${prompt}\n\nSolution\nA clear offer, one buyer, one proof, one ask.\n\nAsk\nNext meeting or checkout.\n`,"text/markdown"),file("PROPOSAL.md",`# ${brand} proposal\n\nScope\nDeliver the files in this pack.\n\nOut of scope\nHosting, domain, app-store, and server setup stay with you.\n`,"text/markdown"),file("README.md",`# ${brand} document pack\n\nPitch, proposal, and setup notes. No MiniMax. No HeyGen.\n`,"text/markdown")];
  return ok("document_pack","Pitch / proposal pack","Markdown files ready to download and edit.",files,true);
}
function colorRevise(category:string,prompt:string):LocalEngineResult{return ok(category,"Updated",prompt.trim(),[],false);}
export async function runLocalEngine(input:LocalEngineInput):Promise<LocalEngineResult>{
  const category=normalizeCategory(input.category)||normalizeCategory(input.type); const prompt=String(input.prompt||"").trim(); const scene=sceneIndex(input.scene);
  if(!LOCAL_SET.has(category))return{ok:false,spend:false,engine:"local",category,code:"not_local",message:"Not a local file/copy category.",title:"",body:"",files:[],media:null};
  if(!prompt)return{ok:false,spend:false,engine:"local",category,code:"empty_prompt",message:"Write what to produce first.",title:"",body:"",files:[],media:null};
  if(isCopyLayoutColorOnly(prompt))return colorRevise(category,prompt);
  switch(category as LocalCategory){case"website":return websitePack(prompt,scene);case"saas":return saasPack(prompt,scene);case"mobile_app":return mobilePack(prompt,scene);case"admin_project":return adminPack(prompt,scene);case"video_clipping":return clippingPack(prompt);case"ad_score_checker":return adScorePack(prompt);case"campaign_calendar":return calendarPack(prompt);case"document_pack":return documentPack(prompt);default:return colorRevise(category,prompt);}
}
