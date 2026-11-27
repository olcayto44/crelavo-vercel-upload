import {z} from "zod";
const slug=z.string().regex(/^[a-z][a-z0-9-]{0,48}$/),hash=z.string().regex(/^[a-f0-9]{64}$/);
export type WebsiteMediaJournal=(pageSlug:string,action:"start"|"validated"|"uncertain",payload:Record<string,unknown>)=>Promise<void>;
export function createWebsiteMediaJournal(identity:{userId:string;productionId:string;planHash:string},rpc:(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>):WebsiteMediaJournal{
 const who=z.strictObject({userId:z.string().uuid(),productionId:z.string().uuid(),planHash:hash}).parse(identity);
 return async(pageSlug,action,payload)=>{
  const result=await rpc("website_media_journal_v1",{p_user:who.userId,p_production:who.productionId,p_hash:who.planHash,p_slug:slug.parse(pageSlug),p_action:action,p_payload:payload});
  if(result.error||result.data!==true)throw Error("website_media_journal_unconfirmed");
 };
}
