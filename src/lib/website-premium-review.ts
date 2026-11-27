import {WebsiteDesignSpec} from "./website-design-schema";
import {paidDesignRevision,renderPaidWebsiteDesign} from "./website-paid-design";
import {WebsiteHeroMediaList} from "./website-hero-media";
// Editing an already settled premium artifact must never drop a purchased page image.
export function renderPremiumReview(output:Record<string,any>,raw:unknown){
 const previous=WebsiteDesignSpec.parse(output.plan?.editableDesign),next=WebsiteDesignSpec.parse(raw);
 const media=WebsiteHeroMediaList.parse(output.plan?.websiteHeroMedia);
 if(media.length!==output.plan?.websitePageMediaCoverage?.required||media.length!==output.plan?.websitePageMediaCoverage?.delivered||next.pages.length!==previous.pages.length||next.pages.some(p=>!previous.pages.some(v=>v.slug===p.slug)))throw Error("premium_routes_locked");
 return renderPaidWebsiteDesign(next,previous.pages.length,media,output.plan?.approvedIndustryScope??undefined);
}
export function savePremiumReview(output:Record<string,any>,raw:unknown,now:string){
 const rendered=renderPremiumReview(output,raw);
 return paidDesignRevision(output,rendered.design,rendered.design.pages.length,now);
}
