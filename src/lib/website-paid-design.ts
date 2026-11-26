import {WebsiteDesignSpec,type WebsiteDesignSpecInput} from "./website-design-schema";
import {renderWebsiteDesignCandidate} from "./website-design-candidate";
import {requireWebsiteArtifact} from "./website-artifact-acceptance";
import type {WebsiteGeneratedFile} from "./providers/openai";
export function renderPaidWebsiteDesign(raw:unknown,limit=3){
 const design=WebsiteDesignSpec.parse(raw);
 if(design.pages.length>limit||design.industryScope||design.siteSettings?.membership?.showPlanPreview)throw Error("website_paid_scope_changed");
 const rendered=renderWebsiteDesignCandidate(design);
 const acceptance=requireWebsiteArtifact(rendered.files.map(f=>({name:f.path,content:f.content})),{root:"",requiredPages:rendered.manifest.pages.map(p=>p.path),language:design.language});
 if(acceptance.warnings.length)throw Error("website_incomplete_content");
 const files:WebsiteGeneratedFile[]=rendered.files.map(f=>({path:f.path,content:f.content,contentType:f.path.endsWith(".html")?"text/html":f.path.endsWith(".css")?"text/css":f.path.endsWith(".json")?"application/json":"text/markdown"}));
 files.push({path:"README.md",contentType:"text/markdown",content:"# "+design.brand+"\n\nOpen index.html locally. This is an unpublished, editable website. Review facts, configure hosting, contact delivery and indexing before public launch. The preview indexing fence must be removed only after owner approval.\n"});
 return {design,files,hash:rendered.manifest.designHash,pageManifest:design.pages.map(p=>({slug:p.slug,title:p.nav,path:p.slug==="home"?"index.html":p.slug+".html",section:p.slug==="home"?"hero":"custom"}))};
}
export function paidDesignHistory(output:Record<string,any>){
 const history=Array.isArray(output.websiteDesignHistory)?output.websiteDesignHistory:[];
 return history.slice(-10).flatMap(item=>{
  const parsed=WebsiteDesignSpec.safeParse(item?.design);
  return parsed.success&&Number.isSafeInteger(item.version)&&item.version>0&&typeof item.createdAt==="string"?[{version:item.version,design:parsed.data,createdAt:item.createdAt}]:[];
 });
}
export function paidDesignRevision(output:Record<string,any>,raw:WebsiteDesignSpecInput,limit:number,now:string){
 const previous=WebsiteDesignSpec.parse(output.plan?.editableDesign),version=Number(output.websiteDesignVersion??1);
 const next=renderPaidWebsiteDesign(raw,limit);
 return { ...output,websiteFiles:next.files,pageManifest:next.pageManifest,
   websiteContent:{siteTitle:next.design.brand,heroTitle:next.design.pages[0].headline,heroBody:next.design.pages[0].lead},
   plan:{...output.plan,editableDesign:next.design,editableDesignHash:next.hash},
   websiteDesignVersion:version+1,websiteDesignHistory:[...paidDesignHistory(output),{version,design:previous,createdAt:now}].slice(-10)};
}
