import {WebsiteDesignSpec,defaultWebsitePageSeo,defaultWebsiteSeoSettings,WebsiteRedirectPath,type WebsiteDesignSpecInput} from "./website-design-schema";
import {buildWebsiteSeoDraft} from "./website-seo-draft";
import type {WebsiteSectorId} from "./website-industry-scope";
const sectorTypes:Partial<Record<WebsiteSectorId,string>>={restaurant:"Restaurant",hotel:"Hotel",healthcare:"MedicalClinic",dental:"Dentist",beauty:"BeautySalon",fitness:"ExerciseGym",real_estate:"RealEstateAgent",legal:"LegalService",accounting:"AccountingService",travel:"TravelAgency",automotive:"AutomotiveBusiness",retail:"Store"};
export function buildWebsiteTechnicalPlan(raw:WebsiteDesignSpecInput){
 const s=raw.seoSettings??defaultWebsiteSeoSettings(),draft=buildWebsiteSeoDraft(raw),origin=draft.proposedOrigin;
 const occupied=new Set(draft.pages.map(p=>p.path));occupied.add("/");
 const normalize=(path:string)=>path.replace(/\/$/,"")||"/";
 const used=new Set<string>(),redirects=(s.redirects??[]).map(r=>{
 const problems:string[]=[];const from=normalize(r.from),target=draft.pages.find(p=>p.slug===r.toSlug);
 if(!WebsiteRedirectPath.safeParse(r.from).success)problems.push("Invalid source path");
 if(occupied.has(from)||occupied.has(from+".html"))problems.push("Source conflicts with a current page");
 if(used.has(from))problems.push("Duplicate source");used.add(from);
 if(!target)problems.push("Destination page missing");
 if(target&&from===target.path)problems.push("Redirect to self");
 return {...r,from,to:target?.path??"",valid:problems.length===0,problems};
 });
 const alternateGroups=raw.pages.map((p,i)=>{
 const seen=new Set<string>(),self=draft.pages[i],entries=(p.seo??defaultWebsitePageSeo()).alternates??[];
 return {slug:p.slug,alternates:entries.map(a=>{
 const problems:string[]=[];
 try{const u=new URL(a.url);if(!origin||u.origin!==origin||u.protocol!=="https:"||u.username||u.password||u.search||u.hash)problems.push("Requires same proposed HTTPS domain and clean URL");}catch{problems.push("Invalid URL");}
 if(seen.has(a.locale))problems.push("Duplicate language");seen.add(a.locale);
 if(a.locale===raw.language&&a.url!==self.url)problems.push("Self-language URL must match page URL");
 if(!self.index||self.canonical!==self.url)problems.push("Source page is not an indexable canonical");
 return {...a,problems,verified:false};
 }),reciprocityVerified:false};
 });
 const b=s.businessIdentity,contact=raw.siteSettings?.contact,sector=raw.industryScope?.sector??"custom",schemaType=sectorTypes[sector]??"Organization";
 const businessSchema=b?.enabled?{"@context":"https://schema.org","@type":schemaType,name:raw.brand,...(b.legalName?{legalName:b.legalName}:{}),...(b.description?{description:b.description}:{}),...(origin?{url:origin}:{}),...(contact?.enabled&&contact.phone?{telephone:contact.phone}:{}),...(contact?.enabled&&contact.email?{email:contact.email}:{}),...(b.streetAddress||b.city||b.region||b.country||b.postalCode?{address:{"@type":"PostalAddress",...(b.streetAddress?{streetAddress:b.streetAddress}:{}),...(b.city?{addressLocality:b.city}:{}),...(b.region?{addressRegion:b.region}:{}),...(b.country?{addressCountry:b.country}:{}),...(b.postalCode?{postalCode:b.postalCode}:{})}}:{}),...(raw.siteSettings?.socials.some(x=>x.url)?{sameAs:raw.siteSettings.socials.filter(x=>x.url).map(x=>x.url)}:{})}:null;
 const validDesign=WebsiteDesignSpec.safeParse(raw).success;
 const warnings=[...draft.pages.flatMap(p=>p.warnings.map(w=>({page:p.slug,message:w}))),...redirects.flatMap(r=>r.problems.map(message=>({page:r.from,message}))),...alternateGroups.flatMap(g=>g.alternates.flatMap(a=>a.problems.map(message=>({page:g.slug,message}))))];
 return {mode:"private-technical-seo-plan",validDesign,publicationReady:false,domainVerified:false,redirects,alternateGroups,businessSchema,businessFactsVerified:false,warnings,releaseBlockers:["Verify customer domain and deployment","Verify translated content, reciprocal hreflang and canonical URLs","Verify business identity and public content","Verify actual routes, redirects and sitemap against deployment"],previewRobots:"noindex,nofollow"};
}
