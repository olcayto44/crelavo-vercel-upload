import {createHash} from "node:crypto";
import {z} from "zod";
import sharp from "sharp";
import {WebsiteHeroMedia} from "../website-hero-media";
const Id=z.string().uuid();
const Source=z.object({request_id:Id,user_id:Id,state:z.literal("settled"),plan:z.object({categoryId:z.literal("image"),operation:z.literal("image_generate"),provider:z.literal("minimax"),model:z.literal("image-01")}),receipt:z.object({provider:z.literal("minimax"),model:z.literal("image-01"),sha256:z.string().regex(/^[a-f0-9]{64}$/),mime:z.literal("image/png"),width:z.number().int().positive(),height:z.number().int().positive()}),actual_micro_usd:z.number().int().nonnegative(),max_micro_usd:z.number().int().positive(),artifact:z.string().regex(/^\\x[0-9a-f]+$/i).max(25165826)});
export async function optimizeSettledImageForWebsite(raw:unknown,userId:string,requestId:string,pageSlug:string,alt:string){
 const s=Source.parse(raw);
 if(s.user_id!==userId||s.request_id!==requestId||s.actual_micro_usd>s.max_micro_usd)throw Error("image_not_settled_for_owner");
 const bytes=Buffer.from(s.artifact.slice(2),"hex");
 if(bytes.length<16||bytes.length>12*1024*1024||createHash("sha256").update(bytes).digest("hex")!==s.receipt.sha256)throw Error("image_integrity_invalid");
 const image=sharp(bytes,{limitInputPixels:4194304,failOn:"error"}),meta=await image.metadata();
 if(meta.format!=="png"||meta.width!==s.receipt.width||meta.height!==s.receipt.height||(meta.pages??1)!==1)throw Error("image_integrity_invalid");
 for(const size of [1440,1200,960,720,480])for(const quality of [85,75,65,55]){
  const {data,info}=await image.clone().resize({width:size,height:size,fit:"inside",withoutEnlargement:true}).webp({quality}).toBuffer({resolveWithObject:true});
  if(data.length>135000)continue;
  const media=WebsiteHeroMedia.parse({page_slug:pageSlug,image_data:data.toString("base64"),alt,width:info.width,height:info.height,provenance:"owner_uploaded_rights_attested",version:1});
  // This is an import candidate, not a persisted image or an attestation of rights.
  return {media,sourceRequestId:s.request_id,sourceSha256:s.receipt.sha256,source:"settled_image_production" as const,requiresOwnerRightsConfirmation:true as const};
 }
 throw Error("image_optimization_limit");
}

const Metadata=Source.omit({artifact:true}).extend({updated_at:z.string().datetime({offset:true})});
/** Only narrow metadata for eligible owner-scoped settled productions. No prompts or image bytes. */
export function listSettledWebsiteImages(raw:unknown,actor:string){
 if(!Id.safeParse(actor).success||!Array.isArray(raw)||raw.length>30)throw Error("invalid_image_list");
 return raw.flatMap(item=>{const p=Metadata.safeParse(item);if(!p.success)return [];const s=p.data;if(s.user_id!==actor||s.actual_micro_usd>s.max_micro_usd||s.receipt.width*s.receipt.height>4194304)return [];
 return [{requestId:s.request_id,width:s.receipt.width,height:s.receipt.height,updatedAt:s.updated_at,model:s.receipt.model}];});
}
