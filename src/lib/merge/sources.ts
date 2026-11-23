import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET } from "./config.ts";
import { MergeError } from "./errors.ts";
export interface SourceRow { id:string; storagePath:string|null; url:string|null; }
export interface LoadedSources { rows:SourceRow[]; invalidIds:string[]; }
export async function loadReadyProductions(admin:SupabaseClient,q:{userId:string;projectId:string;ids:string[]}):Promise<LoadedSources>{
 const project=await admin.from("assistant_media_projects").select("id").eq("id",q.projectId).eq("user_id",q.userId).maybeSingle();
 if(project.error)throw new MergeError("SOURCE_LOOKUP_FAILED","Proje okunamad?",true);
 if(!project.data)return {rows:[],invalidIds:q.ids};
 const {data,error}=await admin.from("production_requests").select("id,output_json,preview_url,delivery_link").in("id",q.ids).eq("user_id",q.userId).eq("input_json->>projectId",q.projectId).eq("status","ready");
 if(error)throw new MergeError("SOURCE_LOOKUP_FAILED","Kaynaklar okunamad?",true);
 const byId=new Map<string,SourceRow>();
 for(const r of data??[]){ const m=r.output_json?.media; if(m?.kind!=="video")continue;
 const url=m.url||r.preview_url||r.delivery_link;const storagePath=m.storagePath||null;
 if(storagePath||typeof url==="string"&&url.startsWith("https://"))byId.set(r.id,{id:r.id,storagePath,url:url||null}); }
 return {rows:q.ids.flatMap(id=>byId.has(id)?[byId.get(id)!]:[]),invalidIds:q.ids.filter(id=>!byId.has(id))};
}
export async function resolveDownloadUrl(admin:SupabaseClient,row:SourceRow):Promise<string>{
 if(row.storagePath){const {data,error}=await admin.storage.from(BUCKET).createSignedUrl(row.storagePath,900);if(error||!data?.signedUrl)throw new MergeError("SOURCE_SIGN_FAILED","Kaynak a??lamad?",true);return data.signedUrl;}
 if(row.url)return row.url;throw new MergeError("SOURCE_MISSING","Kaynak yok",false);
}
