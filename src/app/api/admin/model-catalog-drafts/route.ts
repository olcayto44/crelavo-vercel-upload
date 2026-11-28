import {cookies} from "next/headers";
import {z} from "zod";
import {ADMIN_SESSION_COOKIE,getAdminSessionPayload,getExpectedAdminEmail} from "@/lib/admin-session";
import {supabaseAdmin} from "@/lib/supabase";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"private, no-store"}});
async function allowed(){const jar=await cookies(),owner=getExpectedAdminEmail(),session=getAdminSessionPayload(jar.get(ADMIN_SESSION_COOKIE)?.value??"");return !!owner&&session?.email===owner&&process.env.VERCEL_ENV==="preview"&&process.env.MODEL_CATALOG_DRAFTS_ENABLED==="true"&&(process.env.NEXT_PUBLIC_SUPABASE_URL??process.env.NEXT_PUBLIC_SUPABASE??"").trim().replace(/\/$/,"")==="https://bwzxdxqgrgbsvndinmrv.supabase.co"}
const input=z.object({model_id:z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/),name:z.string().trim().min(1).max(100),developer:z.string().trim().min(1).max(100),family:z.enum(["video","image","audio"]),provider:z.enum(["higgsfield","kie","unassigned"]),proposed_credits:z.number().int().min(1).max(100000).nullable(),pricing_unit:z.enum(["second","output"]),proposed_micro_usd:z.number().int().min(0).max(100000000).nullable(),revision:z.number().int().min(0)}).strict();
export async function GET(){try{if(!await allowed())return reply({enabled:false});const r=await supabaseAdmin().from("model_catalog_drafts").select("*").order("model_id").limit(200);if(r.error)return reply({error:"UNAVAILABLE"},503);return reply({enabled:true,models:r.data})}catch{return reply({error:"UNAVAILABLE"},503)}}
export async function POST(req:Request){try{if(!await allowed())return reply({error:"FORBIDDEN"},403);if(req.headers.get("origin")!==new URL(req.url).origin)return reply({error:"INVALID_ORIGIN"},403);
const reader=req.body?.getReader();if(!reader)return reply({error:"INVALID"},400);const chunks:Uint8Array[]=[];let size=0;try{for(;;){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>4096){await reader.cancel();return reply({error:"INVALID"},400)}chunks.push(v.value)}}finally{reader.releaseLock()}
const p=input.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));if(!p.success)return reply({error:"INVALID"},400);const d=p.data;
const r=await supabaseAdmin().rpc("model_catalog_save_draft",{p_id:d.model_id,p_name:d.name,p_developer:d.developer,p_family:d.family,p_provider:d.provider,p_credits:d.proposed_credits,p_unit:d.pricing_unit,p_cost:d.proposed_micro_usd,p_revision:d.revision});
if(r.error)return reply({error:r.error.message.includes("revision_conflict")?"REVISION_CONFLICT":"UNAVAILABLE"},r.error.message.includes("revision_conflict")?409:503);
return reply({model:r.data})}catch{return reply({error:"INVALID_OR_UNAVAILABLE"},400)}}
