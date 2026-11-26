import {z} from "zod";
import {WebsiteDesignSpec} from "./website-design-schema";
export const WebsiteDraftSave=z.strictObject({version:z.number().int().min(0).max(2147483645),design:WebsiteDesignSpec});
export type WebsiteDraftSaveInput=z.infer<typeof WebsiteDraftSave>;
export async function readBoundedWebsiteJson(request:Request,limit=48000){
 if(!request.headers.get("content-type")?.includes("application/json"))throw Error("invalid_content_type");
 const reader=request.body?.getReader();if(!reader)throw Error("invalid_body");
 const decoder=new TextDecoder();let size=0,raw="";
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit)throw Error("body_too_large");raw+=decoder.decode(value,{stream:true});}raw+=decoder.decode();return JSON.parse(raw);}
 finally{await reader.cancel().catch(()=>{});}
}
export function productionWebsiteDraftScope(env:NodeJS.ProcessEnv=process.env){
 const origin=(env.NEXT_PUBLIC_SUPABASE_URL??env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"");
 return env.VERCEL_ENV==="production"&&origin==="https://yahegfagwxvixjnybkaw.supabase.co"&&!!env.SUPABASE_SERVICE_ROLE_KEY;
}
