import {z} from "zod";
import {WebsiteDesignSpec} from "./website-design-schema";
import {WebsiteHeroMedia,WebsiteHeroMediaList} from "./website-hero-media";
import {verifyWebsiteHeroMedia} from "./website-hero-media-verify";
import {paidDesignRevision} from "./website-paid-design";
const common={version:z.number().int().positive(),pageSlug:z.string().regex(/^[a-z][a-z0-9-]{0,48}$/),alt:z.string().trim().min(1).max(160)};
export const WebsiteMediaChange=z.discriminatedUnion("action",[
 z.strictObject({...common,action:z.literal("alt")}),
 z.strictObject({...common,action:z.literal("replace"),imageData:z.string().max(180000),width:z.number().int().positive().max(1440),height:z.number().int().positive().max(1440),rightsConfirmed:z.literal(true)})
]);
export async function changeSavedWebsiteMedia(output:Record<string,any>,raw:unknown,limit:number,now:string){
 const p=WebsiteMediaChange.parse(raw),design=WebsiteDesignSpec.parse(output.plan.editableDesign),items=WebsiteHeroMediaList.parse(output.plan.websiteHeroMedia??[]);
 if(p.version!==Number(output.websiteDesignVersion??1))throw Error("version_conflict");
 if(!design.pages.some(v=>v.slug===p.pageSlug))throw Error("page_not_found");
 const current=items.find(m=>m.page_slug===p.pageSlug);
 if(p.action==="alt"&&!current)throw Error("image_not_found");
 const next=WebsiteHeroMedia.parse(p.action==="alt"?{...current!,alt:p.alt,version:current!.version+1}:{page_slug:p.pageSlug,alt:p.alt,image_data:p.imageData,width:p.width,height:p.height,version:(current?.version??0)+1,provenance:"owner_uploaded_rights_attested"});
 await verifyWebsiteHeroMedia([next]);
 const media=WebsiteHeroMediaList.parse([...items.filter(m=>m.page_slug!==p.pageSlug),next]);
 const updated=paidDesignRevision({...output,plan:{...output.plan,websiteHeroMedia:media}},design,limit,now);
 // Original paid receipts and journal remain immutable; the owner-supplied asset is never a new paid AI result.
 return {...updated,websiteOriginalMedia:output.websiteOriginalMedia??items,websiteMediaUpdatedAt:now};
}
