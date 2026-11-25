import {z} from "zod";
import {moduleIds,websiteSectorIds} from "./website-industry-scope";
// The model may propose only structured text, layout and palette. No arbitrary code or URLs.
const text=(n:number)=>z.string().trim().min(1).max(n).refine(s=>!/[<>\u0000-\u001f\u007f]/.test(s)&&!/https?:\/\/|javascript:|lorem ipsum/i.test(s),"plain text only");
// Per-device settings are deliberately bounded, not arbitrary customer CSS.
const device=z.strictObject({columns:z.number().int().min(1).max(3),gutter:z.number().int().min(12).max(64),sectionGap:z.number().int().min(12).max(64),headingSize:z.number().int().min(24).max(96),bodySize:z.number().int().min(14).max(24)});
export const WebsiteResponsiveSettings=z.strictObject({mobile:device.extend({columns:z.literal(1),headingSize:z.number().int().min(24).max(48),gutter:z.number().int().min(12).max(28)}),tablet:device.extend({columns:z.number().int().min(1).max(2),headingSize:z.number().int().min(28).max(72)}),desktop:device});
export const defaultWebsiteResponsiveSettings={mobile:{columns:1,gutter:16,sectionGap:20,headingSize:36,bodySize:16},tablet:{columns:2,gutter:28,sectionGap:24,headingSize:48,bodySize:17},desktop:{columns:3,gutter:48,sectionGap:28,headingSize:64,bodySize:18}} as const;
export function responsiveStyles(raw:unknown){
 const s=WebsiteResponsiveSettings.parse(raw);
 const rules=(v:z.infer<typeof device>)=>`header,main,footer{padding-inline:${v.gutter}px}.sections{gap:${v.sectionGap}px}body[class] .sections{grid-template-columns:repeat(${v.columns},minmax(0,1fr))}h1{font-size:${v.headingSize}px}body{font-size:${v.bodySize}px}.hero p{font-size:${Math.min(28,v.bodySize+3)}px}`;
 return rules(s.desktop)+"@media(max-width:1023px){"+rules(s.tablet)+"}@media(max-width:639px){"+rules(s.mobile)+"}";
}

const slug=z.string().regex(/^[a-z][a-z0-9-]{0,48}$/);
const hiddenOn=z.array(z.enum(["mobile","tablet","desktop"])).max(2).refine(v=>new Set(v).size===v.length,"duplicate device").optional();
const page=z.strictObject({slug,nav:text(40),title:text(70),description:text(160),headline:text(100),lead:text(320),sections:z.array(z.strictObject({heading:text(80),body:text(700),hiddenOn})).min(1).max(5),faq:z.array(z.strictObject({question:text(120),answer:text(500)})).max(5)});
export const WebsiteDesignSpec=z.strictObject({version:z.literal(2),brand:text(80),language:z.enum(["en","tr","de","fr","zh-Hans"]),layout:z.enum(["editorial","gallery","service"]),palette:z.enum(["ink","sand","forest"]),responsive:WebsiteResponsiveSettings.optional(),industryScope:z.strictObject({sector:z.enum(websiteSectorIds),extraModules:z.array(z.enum(moduleIds)).max(moduleIds.length).refine(ids=>new Set(ids).size===ids.length,"duplicate module")}).optional(),pages:z.array(page).min(1).max(12)}).superRefine((s,ctx)=>{const p=s.pages;if(p[0]?.slug!=="home")ctx.addIssue({code:"custom",message:"home must be first"});for(const key of ["slug","title","description"] as const){if(new Set(p.map(x=>x[key].toLowerCase())).size!==p.length)ctx.addIssue({code:"custom",message:"duplicate "+key});}if(p.some(x=>["admin","api","preview","index"].includes(x.slug)))ctx.addIssue({code:"custom",message:"reserved slug"});});
export type WebsiteDesignSpecInput=z.infer<typeof WebsiteDesignSpec>;
