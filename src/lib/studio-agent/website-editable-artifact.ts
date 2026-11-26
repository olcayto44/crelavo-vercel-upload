import {WebsiteDesignSpec,defaultWebsiteResponsiveSettings,defaultWebsiteSiteSettings,defaultWebsiteSeoSettings,defaultWebsitePageSeo,type WebsiteDesignSpecInput} from "../website-design-schema";
import {websitePageManifest,type WebsiteEngineInput} from "../website-engine";
import {WebsiteAICopySchema,type WebsiteAICopy} from "./website-ai-copy";
// One approved AI copy result can now feed both the legacy delivery and the editable
// multi-page design. No second provider call, no invented business facts or executable code.
const fit=(v:string,max:number)=>{const value=v.trim();if(value.length<=max)return value;const cut=value.slice(0,max-1);const i=cut.lastIndexOf(" ");return (i>max/2?cut.slice(0,i):cut).trimEnd()+"…";};
export function prepareEditableWebsiteBrief(input:WebsiteEngineInput,customer=false){
 if((!customer&&input.locale!=="en")||input.scope!=="marketing_website")throw Error("editable_scope_not_supported");
 const brand=fit(input.brand,80),pages=websitePageManifest(input.pages);
 // Reject non-renderable route/label input before a provider claim. Never silently omit a page.
 const spec=WebsiteDesignSpec.parse({version:2,brand,language:input.locale??"en",layout:"service",palette:"sand",pages:pages.map((p,i)=>({slug:p.slug,nav:fit(p.title,40),title:fit(p.title,32)+" | "+fit(brand,34),description:"Draft content for "+p.slug+".",headline:fit(p.title,100),lead:"Content requires owner review.",sections:[{heading:"Page content",body:"Add verified business information."}],faq:[]}))});
 return spec;
}
export function buildEditableWebsiteFromCopy(input:WebsiteEngineInput,raw:WebsiteAICopy,customer=false,allSecondary?:NonNullable<WebsiteAICopy["secondaryPages"]>):WebsiteDesignSpecInput{
 const base=prepareEditableWebsiteBrief(input,customer),copy=WebsiteAICopySchema.parse(raw);
 const style=input.style.toLowerCase();
 const layout=copy.artDirection?.layout??(/editorial|magazine|luxury|classic/.test(style)?"editorial":/gallery|visual|portfolio|creative/.test(style)?"gallery":"service");
 const palette=copy.artDirection?.palette??(/dark|black|night/.test(style)?"ink":/green|nature|organic|forest/.test(style)?"forest":"sand");
 const home=base.pages[0];
 const manifest=websitePageManifest(input.pages);
 const proposed=new Map((allSecondary??copy.secondaryPages??[]).map(p=>{const route=manifest.find(v=>v.slug!=="home"&&v.title===p.pageTitle);if(!route)throw Error("unapproved_secondary_page");return [route.slug,p] as const;}));
 const pages=base.pages.map((p,i)=>i===0?{...home,title:fit(base.brand,32)+" | "+fit(copy.headline,34),description:fit(copy.intro,160),headline:fit(copy.headline,100),lead:fit(copy.intro,320),seo:defaultWebsitePageSeo(),sections:copy.features.map(f=>({heading:fit(f.title,80),body:f.body})),faq:copy.faq.map(f=>({question:fit(f.question,120),answer:f.answer}))}:proposed.has(p.slug)?{...p,...(()=>{const v=proposed.get(p.slug)!;return {title:v.title,description:v.description,headline:v.headline,lead:v.lead,sections:[v.section]};})(),seo:defaultWebsitePageSeo()}:{...p,seo:defaultWebsitePageSeo()});
 return WebsiteDesignSpec.parse({...base,layout,palette,responsive:defaultWebsiteResponsiveSettings,siteSettings:defaultWebsiteSiteSettings(),seoSettings:defaultWebsiteSeoSettings(),pages});
}
