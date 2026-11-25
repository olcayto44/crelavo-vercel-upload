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
const results=[], linkPaths=new Set(), byPath=new Map();
try {
for(const path of paths){
 const issues=[]; let item={path,issues};
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
  const dom=await page.evaluate(()=>{
   const main=document.querySelector("main");
   const alt=Object.fromEntries([...document.querySelectorAll('link[rel="alternate"][hreflang]')].map(a=>[a.hreflang,a.href]));
   const schemas=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>{try{return JSON.parse(s.textContent)}catch{return null}});
   return {lang:document.documentElement.lang,title:document.title,h1:[...(main?.querySelectorAll("h1")||[])].map(e=>e.textContent.trim()),h2:main?.querySelectorAll("h2").length||0,h3:main?.querySelectorAll("h3").length||0,description:document.querySelector('meta[name="description"]')?.content||"",canonical:document.querySelector('link[rel="canonical"]')?.href||"",robots:document.querySelector('meta[name="robots"]')?.content||"",alt,schemas,links:[...(main?.querySelectorAll("a[href]")||[])].map(a=>a.getAttribute("href")),images:[...(main?.querySelectorAll("img")||[])].map(i=>({src:i.getAttribute("src"),alt:i.getAttribute("alt")})),textLength:main?.innerText.length||0};
  });
  item.title=dom.title;item.h1=dom.h1;item.h2=dom.h2;item.h3=dom.h3;item.description=dom.description;item.imageCount=dom.images.length;item.textLength=dom.textLength;
  if(dom.lang!==language(path))issues.push("DOM lang "+dom.lang);
  if(!dom.title||dom.h1.length!==1||!dom.h1[0])issues.push("Missing title or single H1");
  if(!dom.h2)issues.push("Missing H2"); // H3 is optional where there are no subsections.
  if(!dom.description)issues.push("Missing description");
  const studioLinks=dom.links.filter(href=>/^\/dashboard\/studio\/[a-z0-9-]+(?:\?|$)/.test(href));
  if(!studioLinks.length)issues.push("Missing clean Studio CTA");
  item.studioLinks=studioLinks;
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
  if(dom.images.some(i=>i.alt===null))issues.push("Missing image alt");
  for(const l of dom.links){const u=new URL(l,base);if(u.origin===base.origin||u.origin===canonicalOrigin){if(!u.pathname.startsWith("/api/")&&!u.pathname.startsWith("/admin"))linkPaths.add(u.pathname+u.search);}}
  byPath.set(path,dom.alt);
  item.viewport=[];
  for(const width of [1440,768,390]){
    await page.setViewportSize({width,height:900});
    const size=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:document.documentElement.clientWidth,main:document.querySelector("main")?.getBoundingClientRect().width||0}));
    item.viewport.push({width,...size});
    if(size.scroll>size.width+2)issues.push("Horizontal overflow "+width);
  }
 }catch(e){issues.push(String(e));}
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
const report={total:results.length,passed:results.filter(x=>!x.issues.length).length,failed:results.filter(x=>x.issues.length).length,duplicateTitles:duplicates("title"),duplicateDescriptions:duplicates("description"),brokenPublicLinks:linkResults.filter(x=>x.error||x.status>=400),linkResults,studioResults,results,limitations:"Navigation timing is not Lighthouse/Core Web Vitals; authenticated Studio workflows, translation quality and keyword volume require separate verification."};
await writeFile(out+"/report.json",JSON.stringify(report,null,2));
console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,brokenPublicLinks:report.brokenPublicLinks,duplicateTitles:report.duplicateTitles.length,duplicateDescriptions:report.duplicateDescriptions.length}));
if(report.failed||report.brokenPublicLinks.length||report.duplicateTitles.length||report.duplicateDescriptions.length||studioResults.some(s=>s.error||s.status>=400))process.exitCode=1;
}finally{await browser.close();}
