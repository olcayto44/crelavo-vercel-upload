import {createHash} from "node:crypto";
type File={name:string;content:string};
const digest=(s:string)=>createHash("sha256").update(s,"utf8").digest("hex");
// Bounded structural acceptance of output from our controlled renderer. Not a
// general HTML sanitizer, browser/accessibility audit or production certification.
export function inspectWebsiteArtifact(entries:File[],options:{root:string;requiredPages:string[];language:string}){
 const errors:string[]=[],warnings:string[]=[],paths=new Set<string>(),htmls:File[]=[];
 const fail=(name:string,reason:string)=>errors.push(name+": "+reason);
 if(entries.length<2||entries.length>350)throw Error("artifact_file_limit");
 let bytes=0;
 for(const e of entries){
  if(typeof e.content!=="string"||!/^([a-zA-Z0-9_.-]+\/)*[a-zA-Z0-9_.-]+$/.test(e.name)||e.name.split("/").some(p=>p==="."||p==="..")||paths.has(e.name))throw Error("artifact_path_invalid");
  paths.add(e.name);bytes+=Buffer.byteLength(e.content,"utf8");
  if(e.name.startsWith(options.root)&&e.name.endsWith(".html"))htmls.push(e);
 }
 if(bytes>8*1024*1024)throw Error("artifact_size_limit");
 for(const p of [...options.requiredPages,"styles.css"])if(!paths.has(options.root+p))fail(p,"missing required file");
 for(const e of htmls){
  const h=e.content;
  if(!h.startsWith("<!doctype html>")||!h.includes('<html lang="'+options.language+'">'))fail(e.name,"invalid document language or doctype");
  if((h.match(/<h1(?:\s[^>]*)?>/g)||[]).length!==1)fail(e.name,"expected one H1");
  if(!/<title>[^<]+<\/title>/.test(h)||!/<meta name="description" content="[^"]+">/.test(h)||!h.includes('name="viewport"'))fail(e.name,"missing title, description or viewport");
  if(!h.includes('<meta name="robots" content="noindex,nofollow">'))fail(e.name,"preview indexing fence missing");
  if(!/<main(?:\s[^>]*)?>/.test(h)||!h.includes("</main>"))fail(e.name,"main landmark missing");
  for(const m of h.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){
   if(!m[0].startsWith('<script type="application/ld+json">')){fail(e.name,"unexpected executable script");continue;}
   try{JSON.parse(m[1]);}catch{fail(e.name,"invalid JSON-LD");}
  }
  if(/<(?:iframe|object|embed|base|form)\b/i.test(h)||/<[a-z][^>]*\s(?:on[a-z]+|srcdoc)\s*=/i.test(h))fail(e.name,"unexpected active markup");
  for(const m of h.matchAll(/\b(?:href|src)="\.\/([^"#?]+)"/g))if(!paths.has(options.root+m[1]))fail(e.name,"broken relative asset: "+m[1]);
  for(const m of h.matchAll(/<img\b[^>]*>/gi))if(!/\balt="[^"]*"/.test(m[0]))fail(e.name,"image missing alt");
  if(/Content requires owner review\.|Add verified business information\.|Draft content for [a-z0-9-]+\./.test(h))warnings.push(e.name+": content requires owner review");
 }
 return {version:"website-structural-v1",passed:errors.length===0,errors,warnings,files:entries.map(e=>({path:e.name,bytes:Buffer.byteLength(e.content,"utf8"),sha256:digest(e.content)})),totalBytes:bytes,checkedHtmlPages:htmls.length,browserVerified:false,releaseReady:false};
}
export function requireWebsiteArtifact(entries:File[],options:Parameters<typeof inspectWebsiteArtifact>[1]){
 const report=inspectWebsiteArtifact(entries,options);
 if(!report.passed)throw Error("website_structural_acceptance_failed: "+report.errors.join("; ").slice(0,500));
 return report;
}
