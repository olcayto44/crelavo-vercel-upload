import {bearerTokenFromRequest,supabaseAdmin} from "@/lib/supabase";
import {rateLimit} from "@/lib/security";
import {WebsiteDraftSave,readBoundedWebsiteJson,productionWebsiteDraftScope} from "@/lib/website-production-draft";
import {WebsiteDesignSpec} from "@/lib/website-design-schema";
import {renderWebsiteDesignCandidate} from "@/lib/website-design-candidate";
export const runtime="nodejs";export const dynamic="force-dynamic";
const headers={"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"};
const out=(body:unknown,status=200)=>Response.json(body,{status,headers});
async function auth(request:Request){
 if(!productionWebsiteDraftScope())return {response:out({ok:false,code:"not_available"},503)} as const;
 const token=bearerTokenFromRequest(request);if(!token)return {response:out({ok:false,code:"sign_in"},401)} as const;
 const db=supabaseAdmin();const {data,error}=await db.auth.getUser(token);
 if(error||!data.user||!(data.user.email_confirmed_at||data.user.confirmed_at))return {response:out({ok:false,code:"sign_in"},401)} as const;
 if(!rateLimit({key:"website-private-draft:"+data.user.id,limit:90,windowMs:60000}).allowed)return {response:out({ok:false,code:"rate_limit"},429)} as const;
 return {db,actor:data.user.id} as const;
}
export async function GET(request:Request){
 try{const a=await auth(request);if("response" in a)return a.response;
 const {data,error}=await a.db.from("studio_website_drafts").select("design,version").eq("user_id",a.actor).maybeSingle();
 if(error)return out({ok:false,code:"storage_unavailable"},503);
 return out({ok:true,version:data?.version??0,design:data?WebsiteDesignSpec.parse(data.design):null});
 }catch{return out({ok:false,code:"draft_unavailable"},503);}
}
export async function PUT(request:Request){
 try{const a=await auth(request);if("response" in a)return a.response;
 const p=WebsiteDraftSave.safeParse(await readBoundedWebsiteJson(request,50000));if(!p.success)return out({ok:false,code:"invalid_design"},400);
 const {version,design}=p.data;if(Buffer.byteLength(JSON.stringify(design))>46000)return out({ok:false,code:"body_too_large"},413);
 const q=version===0?a.db.from("studio_website_drafts").insert({user_id:a.actor,design,version:1}):a.db.from("studio_website_drafts").update({design,version:version+1,updated_at:new Date().toISOString()}).eq("user_id",a.actor).eq("version",version);
 const {data,error}=await q.select("version").maybeSingle();
 if(error?.code==="23505"||(!error&&!data))return out({ok:false,code:"version_conflict"},409);
 if(error)return out({ok:false,code:"storage_unavailable"},503);
 return out({ok:true,version:data.version});
 }catch{return out({ok:false,code:"invalid_or_unavailable_draft"},400);}
}
export async function POST(request:Request){
 try{const a=await auth(request);if("response" in a)return a.response;
 // Commercial source delivery remains bound to the existing settled-payment route.
 if(new URL(request.url).searchParams.has("format"))return out({ok:false,code:"paid_delivery_required"},403);
 const design=WebsiteDesignSpec.parse(await readBoundedWebsiteJson(request,48000));
 const result=renderWebsiteDesignCandidate(design);
 const css=result.files.find(f=>f.path==="styles.css")!.content;
 return out({ok:true,pages:result.files.filter(f=>f.path.endsWith(".html")).map(f=>({path:f.path,content:f.content.replace('<link rel="stylesheet" href="./styles.css">',()=>"<style>"+css+"</style>")})),manifest:result.manifest});
 }catch{return out({ok:false,code:"invalid_design"},400);}
}
