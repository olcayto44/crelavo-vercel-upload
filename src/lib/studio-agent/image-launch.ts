import {z} from "zod";
import {ImagePlanSchema,imagePlanDigest,orchestrateSingleImage,type ImageProductionPlan} from "./image-production-orchestrator";
import {ImageRequestSchema,type ImageProviderResult,type ImageRequest} from "./image-provider";
import {createImageProductionStore} from "./image-production-store";
const uuid=z.string().uuid(),hash=z.string().regex(/^[a-f0-9]{64}$/);
const Base={projectId:uuid,requestId:uuid};
const Input=z.discriminatedUnion("action",[
 z.strictObject({...Base,action:z.literal("status")}),
 z.strictObject({...Base,action:z.literal("quote"),request:ImageRequestSchema}),
 z.strictObject({...Base,action:z.literal("submit"),request:ImageRequestSchema,quoteHash:hash,approvedCredits:z.number().int().positive(),confirmProduction:z.literal(true)})
]);
const Project=z.object({id:uuid,user_id:uuid,production_type:z.literal("image")});
const Tariff=z.object({version:z.string(),credits:z.number().int().positive(),max_micro_usd:z.number().int().positive(),enabled:z.literal(true)});
const Journal=z.object({request_id:uuid,user_id:uuid,project_id:uuid,state:z.enum(["approved","reserved","claimed","artifact_cost_pending","reconcile_required","released","settled"])});
type RPC=Parameters<typeof createImageProductionStore>[0];
type Deps={route?:{provider:"openai"|"minimax";model:"gpt-image-2.6-flare"|"image-01"};userId:string;canaryId:string;enabled:()=>boolean;loadProject:(user:string,project:string)=>Promise<unknown>;loadOperation:(user:string,request:string)=>Promise<unknown>;loadTariff:()=>Promise<unknown>;rpc:RPC;generate:(request:ImageRequest)=>Promise<ImageProviderResult>};
export async function handleImageLaunch(request:Request,d:Deps){
 const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store","X-Robots-Tag":"noindex,nofollow"}});
 const fail=(status:number,code:string)=>json({ok:false,code,safeToRetryAutomatically:false},status);
 if(!uuid.safeParse(d.userId).success||d.userId!==d.canaryId)return fail(403,"image_canary_required");
 try{
 const raw=await request.text();if(Buffer.byteLength(raw)>6000)return fail(413,"request_too_large");
 const parsed=Input.safeParse(JSON.parse(raw));if(!parsed.success)return fail(400,"invalid_request");const v=parsed.data;
 const p=Project.safeParse(await d.loadProject(d.userId,v.projectId));
 if(!p.success||p.data.id!==v.projectId||p.data.user_id!==d.userId)return fail(404,"project_not_found");
 const rawJournal=await d.loadOperation(d.userId,v.requestId),j=Journal.safeParse(rawJournal);
 if(rawJournal!==null&&(!j.success||j.data.user_id!==d.userId||j.data.project_id!==v.projectId||j.data.request_id!==v.requestId))return fail(409,"image_request_conflict");
 if(v.action==="status")return json({ok:true,state:j.success?j.data.state:"not_found",requestId:v.requestId,safeToRetryAutomatically:false});
 if(rawJournal!==null)return fail(409,"image_request_exists_check_status");
 if(!d.enabled())return fail(503,"image_production_disabled");
 const tariff=Tariff.safeParse(await d.loadTariff());if(!tariff.success)return fail(503,"image_tariff_unavailable");
 const plan:ImageProductionPlan=ImagePlanSchema.parse({requestId:v.requestId,userId:d.userId,projectId:v.projectId,categoryId:"image",operation:"image_generate",provider:d.route?.provider??"minimax",model:d.route?.model??"image-01",request:v.request,tariffVersion:tariff.data.version,reservedCredits:tariff.data.credits,maximumProviderMicroUSD:tariff.data.max_micro_usd});
 const quoteHash=imagePlanDigest(plan);
 if(v.action==="quote")return json({ok:true,requestId:v.requestId,projectId:v.projectId,quoteHash,credits:plan.reservedCredits,provider:plan.provider,model:plan.model,scope:"single_image",requiresReviewedProviderCost:true});
 if(v.quoteHash!==quoteHash||v.approvedCredits!==plan.reservedCredits)return fail(409,"quote_changed_reload");
 const reserved=await d.rpc("studio_image_approve_reserve",{p_user:d.userId,p_request:v.requestId,p_hash:quoteHash,p_plan:plan});
 if(reserved.error)return fail(503,"reservation_unconfirmed_check_status");
 if(reserved.data!=="reserved")return fail(409,typeof reserved.data==="string"?reserved.data:"reservation_unconfirmed");
 if(!d.enabled())return json({ok:true,state:"reserved",requestId:v.requestId,safeToRetryAutomatically:false});
 const result=await orchestrateSingleImage({plan,planHash:quoteHash,approvalSource:"persisted_explicit_user_approval",reservationState:"reserved",account:"production",costPolicySource:"reviewed_server_tariff"},d.userId,{enabled:d.enabled,store:createImageProductionStore(d.rpc),generate:d.generate});
 return json({ok:result.state==="artifact_recorded_cost_pending",requestId:v.requestId,...result},result.state==="artifact_recorded_cost_pending"?200:409);
 }catch{return fail(503,"image_outcome_unconfirmed");}
}
