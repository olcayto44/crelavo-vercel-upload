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
// Shared site-wide settings. Only safe links and small raster logos, never executable advertising code.
const optionalText=(n:number)=>z.union([z.literal(""),text(n)]);
const safeHttps=z.union([z.literal(""),z.string().max(500).refine(value=>{try{const u=new URL(value);return u.protocol==="https:"&&!!u.hostname&&!u.username&&!u.password&&!/[\s<>"'\\]/.test(value);}catch{return false;}},"HTTPS URL required")]);
const logoData=z.union([z.literal(""),z.string().max(16000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/)]);
const social=z.strictObject({platform:z.enum(["Instagram","Facebook","YouTube","TikTok","LinkedIn","X","Pinterest","WhatsApp","Other"]),url:safeHttps});
const ad=z.strictObject({enabled:z.boolean(),title:optionalText(80),body:optionalText(180),url:safeHttps,linkLabel:optionalText(40)}).refine(a=>!a.enabled||!!a.title,"Enabled ad needs a title");
const membershipPlan=z.strictObject({name:text(60),description:optionalText(180),interval:z.enum(["free","monthly","yearly"]),currency:z.enum(["TRY","USD","EUR","GBP","CAD","AUD","AED","SAR","JPY","CNY"]),priceMinor:z.number().int().min(0).max(100000000),features:z.array(text(100)).max(8)}).refine(p=>p.interval==="free"?p.priceMinor===0:p.priceMinor>0,"Free plan must cost zero; paid plan needs a positive price");
export const WebsiteSiteSettings=z.strictObject({
 logo:logoData,logoAlt:optionalText(80),showBrandName:z.boolean(),headerNotice:optionalText(180),
 footer:z.strictObject({enabled:z.boolean(),description:optionalText(320),copyright:optionalText(180),showNavigation:z.boolean(),showContact:z.boolean(),showSocial:z.boolean()}),
 contact:z.strictObject({enabled:z.boolean(),email:z.union([z.literal(""),z.email().max(150)]),phone:z.string().max(32).regex(/^[0-9+(). -]*$/),address:optionalText(250),hours:optionalText(150),mapUrl:safeHttps}),
 socials:z.array(social).max(9),
 ads:z.strictObject({header:ad,content:ad,footer:ad}),
 membership:z.strictObject({showPlanPreview:z.boolean(),plans:z.array(membershipPlan).max(6)}).optional(),
});
export type WebsiteSiteSettingsInput=z.infer<typeof WebsiteSiteSettings>;
export function defaultWebsiteSiteSettings():WebsiteSiteSettingsInput{const slot=()=>({enabled:false,title:"",body:"",url:"",linkLabel:""});return {logo:"",logoAlt:"",showBrandName:true,headerNotice:"",footer:{enabled:true,description:"",copyright:"",showNavigation:true,showContact:true,showSocial:true},contact:{enabled:false,email:"",phone:"",address:"",hours:"",mapUrl:""},socials:[],ads:{header:slot(),content:slot(),footer:slot()},membership:{showPlanPreview:false,plans:[]}};}
export const WebsiteDesignSpec=z.strictObject({version:z.literal(2),brand:text(80),language:z.enum(["en","tr","de","fr","zh-Hans"]),layout:z.enum(["editorial","gallery","service"]),palette:z.enum(["ink","sand","forest"]),responsive:WebsiteResponsiveSettings.optional(),siteSettings:WebsiteSiteSettings.optional(),industryScope:z.strictObject({sector:z.enum(websiteSectorIds),extraModules:z.array(z.enum(moduleIds)).max(moduleIds.length).refine(ids=>new Set(ids).size===ids.length,"duplicate module")}).optional(),pages:z.array(page).min(1).max(12)}).superRefine((s,ctx)=>{const p=s.pages;if(p[0]?.slug!=="home")ctx.addIssue({code:"custom",message:"home must be first"});for(const key of ["slug","title","description"] as const){if(new Set(p.map(x=>x[key].toLowerCase())).size!==p.length)ctx.addIssue({code:"custom",message:"duplicate "+key});}if(p.some(x=>["admin","api","preview","index"].includes(x.slug)))ctx.addIssue({code:"custom",message:"reserved slug"});});
export type WebsiteDesignSpecInput=z.infer<typeof WebsiteDesignSpec>;
