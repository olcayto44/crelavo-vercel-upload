import {z} from "zod";
import {dispatchWebsiteAdapter} from "./production-adapter";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const input=z.strictObject({categoryId:z.literal("website"),projectId:uuid,planHash:hash,confirmProduction:z.literal(true)});
const studio=z.object({id:uuid,user_id:uuid,category_id:z.literal("website"),production_id:uuid});
const website=z.object({id:uuid,user_id:uuid,production_type:z.literal("website"),status:z.string(),output_json:z.object({websiteAssistant:z.object({phase:z.string(),planHash:hash,approvedHash:hash})})});
type Deps={authenticate:()=>Promise<string|null>;loadStudio:(userId:string,projectId:string)=>Promise<unknown>;loadWebsite:(userId:string,productionId:string)=>Promise<unknown>;adapter:Parameters<typeof dispatchWebsiteAdapter>[3]};
const fail=(status:number,code:string)=>Response.json({ok:false,code,executionReady:false,safeToRetryAutomatically:false},{status,headers:{"Cache-Control":"no-store"}});
// Explicit user request only. Never invoke from generated assistant tool calls.
export async function handleProductionDispatch(request:Request,d:Deps){
 if(request.method!=="POST")return fail(405,"method_not_allowed");
 let userId:string|null;try{userId=await d.authenticate();}catch{return fail(503,"authentication_unavailable");}
 if(!userId||!uuid.safeParse(userId).success)return fail(401,"sign_in");
 if(!d.adapter.enabled())return fail(503,"central_website_production_disabled");
 if(Number(request.headers.get("content-length")||0)>4096)return fail(413,"request_too_large");
 let raw:unknown;try{const s=await request.text();if(Buffer.byteLength(s)>4096)return fail(413,"request_too_large");raw=JSON.parse(s);}catch{return fail(400,"invalid_json");}
 const q=input.safeParse(raw);if(!q.success)return fail(400,"explicit_production_confirmation_required");
 let b:unknown,w:unknown;try{b=await d.loadStudio(userId,q.data.projectId);}catch{return fail(503,"production_storage_unavailable");}
 const p=studio.safeParse(b);if(!p.success||p.data.id!==q.data.projectId||p.data.user_id!==userId)return fail(404,"project_not_found");
 try{w=await d.loadWebsite(userId,p.data.production_id);}catch{return fail(503,"production_storage_unavailable");}
 const r=website.safeParse(w);if(!r.success||r.data.user_id!==userId||r.data.id!==p.data.production_id)return fail(404,"website_project_not_found");
 const a=r.data.output_json.websiteAssistant;
 if(a.planHash!==q.data.planHash||a.approvedHash!==q.data.planHash||!(a.phase==="approved"||(a.phase==="ready"&&r.data.status==="ready")))return fail(409,"website_current_approval_required");
 const context={source:"verified_server",userId,categoryId:"website",projectId:p.data.id,ownerUserId:userId,scopes:["produce"],creditAccount:"production",currentPlanHash:a.planHash,approval:{projectId:p.data.id,categoryId:"website",planHash:a.approvedHash,account:"production",source:"explicit_user_confirmation"},confirmedRestoreRevision:null,ownedMaterialIds:[]};
 const binding={userId,studioProjectId:p.data.id,productionId:p.data.production_id,categoryId:"website",planHash:a.planHash,approvalSource:"persisted_website_approval"};
 const result=await dispatchWebsiteAdapter({tool:"generate_website",args:{planHash:q.data.planHash}},context,binding,d.adapter);
 const ok=result.state==="ready"||result.state==="already_ready";
 return Response.json({ok,...result,executionReady:false},{status:ok?200:result.state==="failed_released"?502:result.state==="reconciliation_required"?409:403,headers:{"Cache-Control":"no-store"}});
}
