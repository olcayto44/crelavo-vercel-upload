import {resolveWebsiteIndustryScope,type WebsiteSectorId,type WebsiteModuleId} from "./website-industry-scope";
const names:Record<WebsiteSectorId,string>={corporate:"Company",retail:"Retail store",restaurant:"Restaurant",hotel:"Hotel",healthcare:"Clinic",dental:"Dental clinic",beauty:"Beauty studio",fitness:"Fitness studio",real_estate:"Real estate",construction:"Construction",legal:"Legal practice",accounting:"Accounting",education:"Learning center",travel:"Travel agency",automotive:"Automotive",logistics:"Logistics",agency:"Creative agency",saas:"Software service",marketplace:"Marketplace",events:"Events",nonprofit:"Nonprofit",manufacturing:"Manufacturing",recruitment:"Recruitment",news:"Publication",professional:"Professional services",custom:"Custom business"};
const layouts:Partial<Record<WebsiteSectorId,"editorial"|"gallery"|"service">>={retail:"gallery",restaurant:"gallery",hotel:"gallery",real_estate:"gallery",beauty:"gallery",agency:"gallery",construction:"gallery",news:"editorial",legal:"editorial"};
const palette:Partial<Record<WebsiteSectorId,"sand"|"ink"|"forest">>={retail:"ink",saas:"ink",news:"ink",healthcare:"forest",dental:"forest",fitness:"forest",nonprofit:"forest"};
// Explicitly replaces only the unpublished design draft. No operational controls or invented business facts.
export function buildWebsiteSectorDraft(sector:WebsiteSectorId,extra:readonly WebsiteModuleId[]=[]){
 const scope=resolveWebsiteIndustryScope(sector,extra),name=names[sector],brand=name+" demo";
 const pages=scope.pages.map((label,index)=>{
  const slug=index===0?"home":label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const heading=index===0?name+" website concept":label;
  const description="Unpublished "+name.toLowerCase()+" concept: "+label.toLowerCase()+". Business content requires owner review.";
  const base={slug,nav:label,title:label+" | "+brand,description,headline:heading,lead:index===0?"Explore the proposed site structure. All business information and interactive services require verification.":"This draft identifies the "+label.toLowerCase()+" page. Verified content and working features will be added before delivery.",sections:[{heading:"Content requirements",body:"Add the approved business content for this page.",hiddenOn:[] as ("mobile"|"tablet"|"desktop")[]}],faq:[] as {question:string;answer:string}[]};
  if(index===0){base.sections=scope.modules.filter(m=>!["cms","seo","media","forms","analytics","localization","accessibility","security","hosting","backup"].includes(m.id)).slice(0,3).map(m=>({heading:m.title,body:"Planned visitor experience: "+m.visitor+". Implementation and verification required.",hiddenOn:[]}));if(!base.sections.length)base.sections=[{heading:"Project scope",body:"Business-specific functions will be added after scope approval.",hiddenOn:[]}];}
  return base;
 });
 if(pages.length>12)throw new Error("Scope exceeds the current preview page limit");
 return {brand,language:"en",layout:layouts[sector]??"service",palette:palette[sector]??"sand",pages};
}
