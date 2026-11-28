import {createHash} from "node:crypto";
import {requireAdminPermission} from "@/lib/admin-guard";
import {supabaseAdmin} from "@/lib/supabase";
export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store"};
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers});
const prefix=(email:string)=>"inbox_read_v1_"+createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0,32)+"_";
const validId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export async function GET(request:Request){
 const access=await requireAdminPermission(request,"owner");if(!access.ok)return access.response;
 try{
 const db=supabaseAdmin(),base=prefix(access.context.email);
 const leads=await db.from("lead_captures").select("id").order("created_at",{ascending:false}).order("id",{ascending:false}).limit(300);
 if(leads.error)throw leads.error;
 const ids=(leads.data??[]).map(r=>String(r.id)),readIds:string[]=[];
 for(let i=0;i<ids.length;i+=50){
 const read=await db.from("platform_configs").select("key").in("key",ids.slice(i,i+50).map(id=>base+id));
 if(read.error)throw read.error;
 readIds.push(...(read.data??[]).map(r=>String(r.key).slice(base.length)));
 }
 const unreadIds=ids.filter(id=>!readIds.includes(id));return reply({unread:unreadIds.length,unreadIds,ids,window:300});
 }catch{return reply({error:"Inbox notification data unavailable"},503)}
}
export async function POST(request:Request){
 const access=await requireAdminPermission(request,"owner");if(!access.ok)return access.response;
 const body=await request.json().catch(()=>null),id=String(body?.id??"");
 if(!validId(id)||!["read","unread"].includes(body?.action))return reply({error:"Invalid message or action"},400);
 try{
 const db=supabaseAdmin(),key=prefix(access.context.email)+id;
 const lead=await db.from("lead_captures").select("id").eq("id",id).maybeSingle();
 if(lead.error)throw lead.error;if(!lead.data)return reply({error:"Message not found"},404);
 const result=body.action==="read"?await db.from("platform_configs").upsert({key,value:{read:true},description:"Private owner inbox read marker",updated_at:new Date().toISOString()},{onConflict:"key"}):await db.from("platform_configs").delete().eq("key",key);
 if(result.error)throw result.error;return reply({ok:true});
 }catch{return reply({error:"Read state could not be saved"},503)}
}
