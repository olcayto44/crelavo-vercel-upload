import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
const base = new URL(process.env.AUDIT_BASE_URL || "http://127.0.0.1:3000");
const canonicalOrigin = "https://www.crelavo.com";
const out = "category-audit-results";
await mkdir(out, { recursive: true });
const xmlRes = await fetch(new URL("/sitemap.xml", base), {redirect:"manual"});
if (!xmlRes.ok) throw new Error("Sitemap HTTP "+xmlRes.status);
const xml = await xmlRes.text();
const groups = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(m=>m[1]).filter(x=>x.includes('hreflang="x-default"'));
if(groups.length !== 185) throw new Error("Expected 185 localized category sitemap entries; received "+groups.length);
const paths = groups.map(g=>new URL(g.match(/<loc>(.*?)<\/loc>/s)[1]).pathname);
if(new Set(paths).size!==185) throw new Error("Duplicate category URLs");
const expected = new Set(paths);
const language = p=>({"tr":"tr-TR","de":"de-DE","fr":"fr-FR","zh":"zh-Hans"}[p.split("/")[1]]||"en");
const tag = p=>language(p)==="en"?"en-US":language(p);
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({viewport:{width:1440,height:900}});
const page = await context.newPage();
let pageErrors=[];page.on("pageerror",e=>pageErrors.push(String(e.message).slice(0,300)));
await context.addInitScript(()=>{window.__categoryPerf={lcp:null,cls:0};try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__categoryPerf.lcp=entry.startTime}).observe({type:"largest-contentful-paint",buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__categoryPerf.cls+=entry.value}).observe({type:"layout-shift",buffered:true})}catch{}});
const screenshotDir=out+"/screenshots";await mkdir(screenshotDir,{recursive:true});
const results=[], linkPaths=new Set(), byPath=new Map(), imageChecks=new Map();
try {
for(const path of paths){
 const issues=[]; pageErrors=[]; let item={path,issues};
 try{
  const start=performance.now();
  await page.setViewportSize({width:1440,height:900});
  const res=await page.goto(new URL(path,base).href,{waitUntil:"domcontentloaded",timeout:30000});
  item.http=res?.status();item.navigationMs=Math.round(performance.now()-start);
  if(item.http!==200)issues.push("HTTP "+item.http);
  if(new URL(page.url()).pathname!==path)issues.push("Unexpected redirect");
  const raw=await res.text();
  const serverLang=raw.match(/<html[^>]*\blang="([^"]+)"/i)?.[1];
  if(serverLang!==language(path))issues.push("SSR lang: "+serverLang);
  await page.locator('link[rel="canonical"]').waitFor({state:"attached",timeout:10000});
  const dom=await page.evaluate(()=>{
   const main=document.querySelector("main[data-category-detail]")||document.querySelector("main");
   const alt=Object.fromEntries([...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(a=>[a.hreflang,a.href]));
   const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{return JSON.parse(s.textContent)}catch{return null}});
   return {recovery:document.body.innerText.includes("This page needs to reload"),category:main?.getAttribute("data-category-detail"),lang:document.documentElement.lang,title:document.title,h1:[...(main?.querySelectorAll("h1")||[])].map(e=>e.textContent.trim()),h2:main?.querySelectorAll("h2").length||0,h3:main?.querySelectorAll("h3").length||0,description:document.querySelector('meta[name="description"]')?.content||"",canonical:document.querySelector('link[rel="canonical"]')?.href||"",robots:document.querySelector('meta[name="robots"]')?.content||"",alt,schemas,links:[...(main?.querySelectorAll("a[href]")||[])].map(a=>a.getAttribute("href")),images:[...(main?.querySelectorAll("img")||[])].map(i=>({src:i.getAttribute("src"),alt:i.getAttribute("alt")})),textLength:main?.innerText.length||0};
  });
  item.title=dom.title;item.h1=dom.h1;item.h2=dom.h2;item.h3=dom.h3;item.description=dom.description;item.imageCount=dom.images.length;item.textLength=dom.textLength;
  if(dom.recovery||!dom.category)issues.push("Missing category shell or global recovery screen");
  if(dom.lang!==language(path))issues.push("DOM lang "+dom.lang);
  if(!dom.title||dom.h1.length!==1||!dom.h1[0])issues.push("Missing title or single H1");
  if(!dom.h2)issues.push("Missing H2"); // H3 is optional where there are no subsections.
  if(!dom.description)issues.push("Missing description");
  const studioLinks=dom.links.filter(href=>/^\/dashboard\/studio\/[a-z0-9-]+(?:\?|$)/.test(href));
  if(!studioLinks.length)issues.push("Missing clean Studio CTA");
  item.studioLinks=studioLinks;
  const languageLinks=await page.locator("main a[hreflang]").evaluateAll(nodes=>nodes.map(a=>({tag:a.hreflang,href:a.getAttribute("href")})));
  for(const l of ["en-US","tr-TR","de-DE","fr-FR","zh-Hans"]){if(l===tag(path))continue;const target=dom.alt[l];if(target&&!languageLinks.some(a=>a.tag===l&&new URL(a.href,base).pathname===new URL(target).pathname))issues.push("Missing visible language link "+l);}
  item.languageLinks=languageLinks;
  if(dom.canonical!==canonicalOrigin+path)issues.push("Wrong canonical");
  if(/noindex/i.test(dom.robots))issues.push("Unexpected noindex");
  for(const l of ["en-US","tr-TR","de-DE","fr-FR","zh-Hans","x-default"]) {
    if(!dom.alt[l])issues.push("Missing hreflang "+l);
    else if(new URL(dom.alt[l]).origin!==canonicalOrigin||!expected.has(new URL(dom.alt[l]).pathname))issues.push("Unknown hreflang "+l);
  }
  if(dom.alt[tag(path)]!==canonicalOrigin+path)issues.push("Missing self hreflang");
  if(!dom.schemas.length||dom.schemas.some(s=>!s))issues.push("Invalid or missing JSON-LD");
  const entities=dom.schemas.flatMap(s=>s?.["@graph"]||[s]).filter(Boolean);
  if(!entities.some(e=>e["@type"]==="WebPage"||e["@type"]==="SoftwareApplication"||e["@type"]==="Service"))issues.push("Missing page entity");
  for(const entity of entities){if(entity["@type"]==="WebPage"&&entity.url&&entity.url!==canonicalOrigin+path)issues.push("Schema URL mismatch");if(entity["@type"]==="BreadcrumbList"&&(!Array.isArray(entity.itemListElement)||entity.itemListElement.some((e,i)=>e.position!==i+1||!e.name||!e.item)))issues.push("Invalid breadcrumb positions or items");}
  if(dom.images.some(i=>i.alt===null))issues.push("Missing image alt");
  // Validate first-party category artwork without relying on third-party showcase CDN availability.
  const localArt=new Set();
  const collectArt=(value)=>{if(typeof value!=="string"||!value)return;try{let u=new URL(value,base);if(u.origin===base.origin&&u.pathname==="/_next/image"){const original=u.searchParams.get("url");if(!original)return;u=new URL(original,base);}if((u.origin===base.origin||u.origin===canonicalOrigin)&&/^\/(category-art|showcase)\/.*\.(webp|png|jpe?g|avif)$/i.test(u.pathname))localArt.add(u.pathname);}catch{}};
  for(const i of dom.images)collectArt(i.src);
  for(const entity of entities)if(entity["@type"]==="ImageObject"){collectArt(entity.contentUrl);collectArt(entity.url);}
  item.localArtwork=[];
  for(const src of localArt){if(!imageChecks.has(src)){try{const r=await context.request.get(new URL(src,base).href,{timeout:15000,maxRedirects:0});imageChecks.set(src,{status:r.status(),type:r.headers()["content-type"]||""});}catch(e){imageChecks.set(src,{error:String(e)});}}const check=imageChecks.get(src);item.localArtwork.push({src,...check});if(check.status!==200||!check.type?.startsWith("image/"))issues.push("Invalid category artwork "+src);}

  for(const l of dom.links){const u=new URL(l,base);if(u.origin===base.origin||u.origin===canonicalOrigin){if(!u.pathname.startsWith("/api/")&&!u.pathname.startsWith("/admin"))linkPaths.add(u.pathname+u.search);}}
  byPath.set(path,dom.alt);
  await page.waitForLoadState("load",{timeout:15000});
  await page.evaluate(()=>document.fonts.ready);
  // Website Builder now has four approved, committed assets. Require all four
  // in each locale, and decode the actual browser images (including lazy cards).
  if(dom.category==="website"||["/ai-website-builder","/tr/yapay-zeka-web-sitesi-olusturucu","/de/ki-website-builder","/fr/createur-site-web-ia","/zh/ai-website-builder"].includes(path)){
    const required=["website-builder-hero.webp","business-website-concept.webp","online-store-concept.webp","creative-portfolio-concept.webp"];
    const artwork=await page.locator('main img').evaluateAll(async imgs=>{
      const selected=imgs.filter(i=>decodeURIComponent(i.getAttribute("src")||"").includes("/category-art/website/"));
      return Promise.all(selected.map(async i=>{i.loading="eager";let decoded=false;try{await Promise.race([i.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error("Image decode timeout")),10000))]);decoded=true;}catch{}return {src:decodeURIComponent(i.getAttribute("src")||""),alt:i.alt,width:i.naturalWidth,height:i.naturalHeight,decoded};}));
    });
    item.websiteArtwork=artwork;
    for(const file of required){const matches=artwork.filter(i=>i.src.includes("/category-art/website/"+file));if(matches.length!==1||!matches[0].decoded||!matches[0].width||!matches[0].height||!matches[0].alt.trim())issues.push("Missing or undecodable Website Builder artwork "+file);}
    const og=await page.locator('meta[property="og:image"]').getAttribute("content");
    if(og!==canonicalOrigin+"/category-art/website/website-builder-hero.webp")issues.push("Missing Website Builder Open Graph artwork");
    if(!entities.some(e=>e["@type"]==="ImageObject"&&(e.contentUrl===canonicalOrigin+"/category-art/website/website-builder-hero.webp"||e.url===canonicalOrigin+"/category-art/website/website-builder-hero.webp")))issues.push("Missing Website Builder ImageObject");
  }

  item.labMetrics=await page.evaluate(()=>{const nav=performance.getEntriesByType("navigation")[0];return {ttfbMs:nav?Math.round(nav.responseStart):null,lcpMs:window.__categoryPerf?.lcp??null,cls:window.__categoryPerf?.cls??null,transferBytes:performance.getEntriesByType("resource").reduce((n,r)=>n+r.transferSize,0)}});
  item.viewport=[];
  for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:900});
    const size=await page.evaluate(()=>{const width=document.documentElement.clientWidth,scroll=document.documentElement.scrollWidth;const offenders=scroll>width+2?[...document.querySelectorAll("body *")].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>width+2&&getComputedStyle(e).position!=="fixed"}).slice(0,12).map(e=>({tag:e.tagName,cls:String(e.className).slice(0,160),right:Math.round(e.getBoundingClientRect().right)})):[];return {scroll,width,main:document.querySelector("main")?.getBoundingClientRect().width||0,offenders};});
    item.viewport.push({width,...size});
    if(size.scroll>size.width+2)issues.push("Horizontal overflow "+width);
    if(path==="/ai-website-builder"||path==="/tr/yapay-zeka-web-sitesi-olusturucu"||path==="/de/ki-website-builder"||path==="/fr/createur-site-web-ia"||path==="/zh/ai-website-builder"||issues.length)await page.screenshot({path:screenshotDir+"/"+path.replace(/[^a-z0-9-]/g,"_")+"-"+width+".png",animations:"disabled",timeout:10000});
  }
 }catch(e){issues.push(String(e));}
 item.pageErrors=[...pageErrors];if(pageErrors.length)issues.push("Client exception: "+pageErrors[0]);
 results.push(item);
 console.log(path,issues.length?"FAIL "+issues.join("; "):"PASS");
}
for(const item of results){const links=byPath.get(item.path)||{};for(const [key,value] of Object.entries(links)){if(key==="x-default")continue;const target=byPath.get(new URL(value).pathname);if(!target||target[tag(item.path)]!==canonicalOrigin+item.path)item.issues.push("Nonreciprocal "+key);}}
const linkResults=[]; const studioResults=[];
for(const path of [...linkPaths].filter(p=>p.startsWith("/dashboard/studio/"))){
 try{const r=await context.request.get(new URL(path,base).href,{timeout:15000,maxRedirects:0});studioResults.push({path,status:r.status(),location:r.headers().location||null});}catch(e){studioResults.push({path,error:String(e)});}
}
for(const path of [...linkPaths].filter(p=>!expected.has(p)&&!p.startsWith("/dashboard/"))){
 try{const r=await context.request.get(new URL(path,base).href,{timeout:15000,maxRedirects:5});linkResults.push({path,status:r.status()});}catch(e){linkResults.push({path,error:String(e)});}
}
const duplicates=(key)=>Object.entries(results.reduce((acc,x)=>{const v=JSON.stringify(x[key]);(acc[v]??=[]).push(x.path);return acc;},{})).filter(([v,p])=>v!=="undefined"&&p.length>1).map(([value,paths])=>({value,paths}));
// Public Studio preview routes should not redirect guests into checkout.
const dashboardResult = await (async()=>{
 try {
  const res=await page.goto(new URL("/dashboard",base).href,{waitUntil:"domcontentloaded",timeout:30000});
  const final=new URL(page.url());
  const allowed=final.origin===base.origin&&(final.pathname==="/dashboard"||final.pathname==="/auth/login");
  const login=await page.getByRole("dialog",{name:"Sign in to Crelavo"}).isVisible().catch(()=>false);
  return {status:res?.status(),path:final.pathname,sameOrigin:final.origin===base.origin,loginDialogVisible:login,ok:allowed&&res?.status()===200&&(final.pathname==="/auth/login"||login)};
 }catch(e){return {ok:false,error:String(e)};}
})();
const websiteArtworkPages=results.filter(x=>Array.isArray(x.websiteArtwork));const websiteArtworkValid=websiteArtworkPages.length===5&&websiteArtworkPages.every(x=>x.websiteArtwork.length===4&&x.websiteArtwork.every(i=>i.decoded&&i.width>0&&i.height>0&&i.alt.trim()));
const failedStudioRoutes=studioResults.filter(s=>s.error||s.status!==200);
const studioCountValid=new Set(studioResults.map(s=>new URL(s.path,base).pathname)).size===37;
const report={total:results.length,passed:results.filter(x=>!x.issues.length).length,failed:results.filter(x=>x.issues.length).length,duplicateTitles:duplicates("title"),duplicateDescriptions:duplicates("description"),brokenPublicLinks:linkResults.filter(x=>x.error||x.status>=400),linkResults,studioResults,failedStudioRoutes,dashboardResult,studioCountValid,websiteArtworkValid,results,limitations:"Lab LCP/CLS/TTFB are single-run local Chromium observations, not field Core Web Vitals or INP. Authenticated Studio workflows, native translation review and measured keyword volume require separate verification."};
await writeFile(out+"/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,brokenPublicLinks:report.brokenPublicLinks,duplicateTitles:report.duplicateTitles,duplicateDescriptions:report.duplicateDescriptions,failedStudioRoutes:report.failedStudioRoutes,dashboardResult:report.dashboardResult,studioCountValid,websiteArtworkValid}));
if(report.failed||report.brokenPublicLinks.length||report.duplicateTitles.length||report.duplicateDescriptions.length||failedStudioRoutes.length||!dashboardResult.ok||!studioCountValid||!websiteArtworkValid)process.exitCode=1;
}finally{await browser.close();}
