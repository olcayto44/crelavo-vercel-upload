import { runtimeArtifactDelivery } from '@/lib/website-runtime/delivery';
import { runtimePreviewDocument } from '@/lib/website-runtime/preview';
export type WebsiteView = {state:'ready'|'unavailable';reason?:string;title:string;pages:{path:string;label:string}[];html?:string;source?:'stored_files'|'runtime'};
const object=(v:unknown):Record<string,any>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,any>:{};
const unavailable=(title:string,reason:string):WebsiteView=>({state:'unavailable',title,reason,pages:[]});
// Pure read projection. Never builds fallback/sample content or calls a provider.
export function websiteView(record:Record<string,any>,requestedPage='index.html'):WebsiteView {
 const title=String(record.title||'Website projesi').slice(0,160),output=object(record.output_json);
 if(record.production_type!=='website')return unavailable(title,'wrong_category');
 if(record.status!=='ready'||output.websiteBillingPending===true)return unavailable(title,'output_not_ready');
 if(output.mock===true||output.isDemo===true||output.demo===true||output.mode==='mock'||output.providerMode==='mock'||output.requestMetadata?.mock===true)return unavailable(title,'demo_output');
 if(output.runtimeArtifact||output.runtimeBlueprint){
  try{
   if(runtimeArtifactDelivery(output).blockers.length)return unavailable(title,'runtime_not_verified');
   const seedFile=output.runtimeArtifact.files.find((f:any)=>f.path==='runtime/seed.json');
   const seed=JSON.parse(seedFile?.content||'{}');
   const pages=(seed.documents||[]).filter((r:any)=>r.collection==='pages'&&r.payload?.published===true).map((r:any)=>({path:r.payload.slug==='home'?'index.html':r.payload.slug+'.html',label:String(r.payload.title)})).filter((p:any)=>/^[a-z0-9][a-z0-9-]{0,79}\.html$/.test(p.path));
   if(!pages.some((p:any)=>p.path===requestedPage))return unavailable(title,'page_not_found');
   return {state:'ready',title,pages,source:'runtime',html:runtimePreviewDocument(output.runtimeArtifact,'public',requestedPage)};
  }catch{return unavailable(title,'runtime_not_verified');}
 }
 const files=Array.isArray(output.websiteFiles)?output.websiteFiles:[];
 if(files.length>100)return unavailable(title,'invalid_sources');
 const valid=files.filter((f:any)=>f&&typeof f.path==='string'&&typeof f.content==='string'&&f.content.length<=2000000);
 // Reject malformed artifacts rather than silently previewing a partial source bundle.
 if(valid.length!==files.length)return unavailable(title,'invalid_sources');
 // Fail closed on duplicate paths: a preview must never display an ambiguous artifact.
 if(new Set(valid.map((f:any)=>f.path)).size!==valid.length)return unavailable(title,'duplicate_source_paths');
 const pages=valid.filter((f:any)=>/^[a-z0-9][a-z0-9-]{0,79}\.html$/.test(f.path)&&/<(?:!doctype\s+html|html)(?:\s|>)/i.test(f.content)).map((f:any)=>({path:f.path,label:f.path==='index.html'?'Ana sayfa':f.path.replace(/\.html$/,'').replace(/-/g,' ')}));
 if(!pages.some((p:any)=>p.path==='index.html'))return unavailable(title,'website_source_missing');
 const page=valid.find((f:any)=>f.path===requestedPage&&pages.some((p:any)=>p.path===f.path));
 if(!page)return unavailable(title,'page_not_found');
 const css=valid.find((f:any)=>f.path==='styles.css')?.content||'';
 const html=page.content.replace(/<link[^>]+href=["'](?:\.\/)?styles\.css["'][^>]*>/i,'<style>'+css.replace(/<\/style/gi,'<\\/style')+'</style>');
 return {state:'ready',title,pages,html,source:'stored_files'};
}