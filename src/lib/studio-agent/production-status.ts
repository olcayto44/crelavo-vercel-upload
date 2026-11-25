import {z} from "zod";
import {websiteCreditDeliveryProof} from "../assistant-work/website-paid-delivery";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const binding=z.object({id:uuid,user_id:uuid,category_id:z.literal("website"),production_id:uuid});
const row=z.object({id:uuid,user_id:uuid,production_type:z.literal("website"),status:z.string(),generation_status:z.string(),reserved_credits:z.number().int().nonnegative(),estimated_credits:z.number().int().positive(),updated_at:z.string(),output_json:z.object({websiteAssistant:z.object({phase:z.string(),planHash:hash,approvedHash:hash.nullable().optional()}),websiteBillingMode:z.unknown().optional(),websiteBillingPending:z.unknown().optional(),charged:z.unknown().optional(),websiteFiles:z.unknown().optional()})});
const hold=z.object({production_id:uuid,user_id:uuid,plan_hash:hash,credits:z.number().int().positive(),state:z.enum(["reserved","settled","released","reconcile_required"])});
type Deps={authenticate:()=>Promise<string|null>;loadBinding:(user:string,project:string)=>Promise<unknown>;loadProduction:(user:string,id:string)=>Promise<unknown>;loadReservation:(user:string,id:string)=>Promise<unknown>;now?:()=>number};
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
const fail=(status:number,code:string)=>json({ok:false,code,safeToRetryAutomatically:false},status);
export async function handleProductionStatus(request:Request,d:Deps){
 if(request.method!=="GET")return fail(405,"method_not_allowed");
 let user:string|null;try{user=await d.authenticate();}catch{return fail(503,"authentication_unavailable");}
 if(!user||!uuid.safeParse(user).success)return fail(401,"sign_in");
 const q=new URL(request.url).searchParams;
 if(q.getAll("projectId").length!==1||Array.from(q.keys()).some(k=>k!=="projectId"))return fail(400,"invalid_request");
 const id=uuid.safeParse(q.get("projectId"));if(!id.success)return fail(400,"invalid_request");
 try{
 const b=binding.safeParse(await d.loadBinding(user,id.data));
 if(!b.success||b.data.id!==id.data||b.data.user_id!==user)return fail(404,"project_not_found");
 const p=row.safeParse(await d.loadProduction(user,b.data.production_id));
 if(!p.success||p.data.id!==b.data.production_id||p.data.user_id!==user)return fail(404,"production_not_found");
 const r=p.data,a=r.output_json.websiteAssistant;
 const raw=await d.loadReservation(user,r.id),h=hold.safeParse(raw);
 let stage="reconciliation_required",creditState="unconfirmed",deliveryAvailable=false;
 const valid=h.success&&h.data.production_id===r.id&&h.data.user_id===user&&h.data.plan_hash===a.planHash&&h.data.credits===r.estimated_credits;
 const approved=a.approvedHash===a.planHash;
 const stale=!Number.isFinite(Date.parse(r.updated_at))||(d.now??Date.now)()-Date.parse(r.updated_at)>5*60*1000;
 if(raw===null&&r.reserved_credits===0&&r.status==="pending"&&a.phase==="approved"&&approved){stage="approved";creditState="not_reserved";}
 else if(valid&&h.data.state==="reserved"&&r.reserved_credits===h.data.credits&&approved&&!stale){
   if(a.phase==="reserved"&&r.status==="pending"){stage="credits_reserved";creditState="reserved";}
   else if(a.phase==="generating"&&r.status==="in_production"&&r.generation_status==="provider_generating"){stage="generating";creditState="reserved";}
   else if(a.phase==="awaiting_payment"&&r.generation_status==="completed"){stage="settlement_pending";creditState="reserved";}
 }
 else if(valid&&approved&&a.phase==="ready"&&r.generation_status==="completed"&&websiteCreditDeliveryProof(r,h.data)){
   const files=r.output_json.websiteFiles;
   if(Array.isArray(files)&&files.some(f=>f&&f.path==="index.html"&&typeof f.content==="string"&&f.content.trim())){stage="ready";creditState="settled";deliveryAvailable=true;}
 }
 else if(valid&&approved&&h.data.state==="released"&&r.reserved_credits===0&&r.status==="failed"&&a.phase==="generation_failed"&&r.generation_status==="failed"){stage="failed_released";creditState="released";}
 // The existing execution is synchronous. These are observed milestones, never
 // percentages, estimated completion times, a claimed worker lease or a retry instruction.
 return json({ok:true,projectId:id.data,productionId:r.id,stage,creditState,deliveryAvailable,updatedAt:r.updated_at,queueMode:"synchronous",safeToRetryAutomatically:false,...(deliveryAvailable?{previewUrl:"/api/productions/"+r.id+"/delivery?file=preview",deliveryZipUrl:"/api/productions/"+r.id+"/delivery?file=zip"}:{})});
 }catch{return fail(503,"production_status_unavailable");}
}
