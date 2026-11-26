import {z} from "zod";
import {resolveWebsiteIndustryScope} from "./website-industry-scope";
import type {WebsiteDesignSpecInput} from "./website-design-schema";
const Article=z.strictObject({slug:z.string().regex(/^[a-z][a-z0-9-]{0,48}$/),title:z.string().trim().min(1).max(70),description:z.string().trim().min(1).max(160),body:z.string().trim().min(1).max(12000),state:z.enum(["draft","reviewed","archived"])});
const Product=z.strictObject({sku:z.string().regex(/^[A-Za-z0-9_-]{1,48}$/),name:z.string().trim().min(1).max(120),description:z.string().max(2000),price_minor:z.number().int().min(0).max(100000000),currency:z.enum(["TRY","USD","EUR","GBP"]),stock:z.number().int().min(0).max(1000000),visible:z.boolean()});
export const WebsitePaidCMS=z.strictObject({articles:z.array(Article).max(40),catalog:z.array(Product).max(80)}).superRefine((v,ctx)=>{if(new Set(v.articles.map(a=>a.slug)).size!==v.articles.length)ctx.addIssue({code:"custom",message:"duplicate_article_slug"});if(new Set(v.catalog.map(p=>p.sku)).size!==v.catalog.length)ctx.addIssue({code:"custom",message:"duplicate_catalog_sku"});});
export type WebsitePaidCMSInput=z.infer<typeof WebsitePaidCMS>;
export function websitePaidCMSModules(scope:WebsiteDesignSpecInput["industryScope"]){return scope?resolveWebsiteIndustryScope(scope.sector,scope.extraModules).modules.map(m=>m.id):[];}
export function parsePaidCMS(raw:unknown,scope:WebsiteDesignSpecInput["industryScope"]){
 const data=WebsitePaidCMS.parse(raw),modules=websitePaidCMSModules(scope);
 if(!modules.includes("cms")&&data.articles.length||!modules.includes("catalog")&&data.catalog.length)throw Error("cms_scope_not_purchased");
 if(JSON.stringify(data).length>600000)throw Error("cms_size_limit");
 return data;
}
