import {createHash} from "node:crypto";
import {z} from "zod";
import {WebsiteDesignSpec} from "../website-design-schema";
import {applyWebsiteRevision,WebsiteRevisionProposal} from "../website-assistant-revision";
// Server constructs this from the authenticated, saved site, never from model or browser claims.
const input=z.strictObject({siteId:z.string().uuid(),version:z.number().int().positive(),design:WebsiteDesignSpec});
export function prepareWebsiteRevisionContext(raw:unknown){
 const v=input.parse(raw);
 return {...v,baseHash:createHash("sha256").update(JSON.stringify(v.design)).digest("hex")};
}
export type WebsiteRevisionContext=ReturnType<typeof prepareWebsiteRevisionContext>;
export function websiteRevisionPromptContext(context:WebsiteRevisionContext){
 const d=context.design;
 // Do not send contact records, media bytes, account details, payment data or credentials.
 return {version:context.version,brand:d.brand,language:d.language,palette:d.palette,layout:d.layout,responsive:d.responsive,pages:d.pages.map(p=>({slug:p.slug,nav:p.nav,title:p.title,description:p.description,headline:p.headline,lead:p.lead,sections:p.sections.map((s,i)=>({index:i,heading:s.heading,body:s.body}))}))};
}
export function validateWebsiteAIRevision(context:WebsiteRevisionContext,raw:unknown){
 const p=WebsiteRevisionProposal.parse(raw);
 const checked=prepareWebsiteRevisionContext({siteId:context.siteId,version:context.version,design:context.design});
 if(checked.baseHash!==context.baseHash)throw Error("design_context_changed");
 const r=applyWebsiteRevision(checked.design,checked.version,p);
 if(Buffer.byteLength(JSON.stringify(r.design),"utf8")>45000)throw Error("design_size_limit");
 return {siteId:checked.siteId,baseHash:checked.baseHash,expectedRevision:checked.version,commands:p.commands,resultHash:createHash("sha256").update(JSON.stringify(r.design)).digest("hex"),proposalOnly:true as const};
}
export type WebsiteAIRevision=ReturnType<typeof validateWebsiteAIRevision>;
