import { z } from "zod";
import { validateToolAction } from "./tool-registry";

// Internal server contract only. No HTTP endpoint, model-call execution, new ledger,
// or automatic fallback. The existing Website service rechecks ownership, approval,
// tariff, canary, reservation and settlement against its own persisted records.
const Identity = z.strictObject({
 userId:z.string().uuid(), studioProjectId:z.string().uuid(), productionId:z.string().uuid(),
 categoryId:z.literal("website"), planHash:z.string().regex(/^[a-f0-9]{64}$/),
 approvalSource:z.literal("persisted_website_approval"),
});
type Identity = z.infer<typeof Identity>;
type WebsiteService = (raw: {productionId:string;planHash:string}, user:{id:string}) => Promise<{status:number;payload:Record<string,unknown>}>;
type AdapterOutcome =
 | {state:"not_dispatched";code:string;safeToRetryAutomatically:false}
 | {state:"ready"|"already_ready";productionId:string;chargedCredits:number;previewUrl:string;deliveryZipUrl:string;safeToRetryAutomatically:false}
 | {state:"failed_released";code:string;safeToRetryAutomatically:false}
 | {state:"reconciliation_required";code:string;safeToRetryAutomatically:false};
const notDispatched=(code:string):AdapterOutcome=>({state:"not_dispatched",code,safeToRetryAutomatically:false});
const uncertain=():AdapterOutcome=>({state:"reconciliation_required",code:"production_outcome_unconfirmed",safeToRetryAutomatically:false});
export function centralWebsiteAdapterEnabled(env:NodeJS.ProcessEnv=process.env){
 return env.VERCEL_ENV==="production" && env.STUDIO_V2_WEBSITE_ADAPTER_ENABLED==="true" && env.STUDIO_AGENT_ISOLATED_PREVIEW!=="true";
}
// A server caller must load the studio-to-production binding and the persisted
// Website approval itself. Do not derive either from model output or browser fields.
export async function dispatchWebsiteAdapter(rawAction:unknown, trustedContext:unknown, trustedBinding:unknown, deps:{enabled:()=>boolean;execute:WebsiteService}):Promise<AdapterOutcome>{
 if(!deps.enabled())return notDispatched("central_website_adapter_disabled");
 let binding:Identity;
 try{
  const {action,context}=validateToolAction(rawAction,trustedContext);
  if(action.tool!=="generate_website")return notDispatched("unsupported_production_operation");
  binding=Identity.parse(trustedBinding);
  if(binding.userId!==context.userId||binding.studioProjectId!==context.projectId||binding.categoryId!==context.categoryId||binding.planHash!==action.args.planHash)return notDispatched("production_binding_mismatch");
 }catch{return notDispatched("production_authorization_required");}
 try{
  const result=await deps.execute({productionId:binding.productionId,planHash:binding.planHash},{id:binding.userId});
  const p=result.payload;
  const previewUrl="/api/productions/"+binding.productionId+"/delivery?file=preview";
  const deliveryZipUrl="/api/productions/"+binding.productionId+"/delivery?file=zip";
  if(result.status===200&&p.ok===true&&p.productionId===binding.productionId){
   if(p.state==="ready"&&typeof p.charged==="number"&&Number.isSafeInteger(p.charged)&&p.charged>0&&p.previewUrl===previewUrl&&p.deliveryZipUrl===deliveryZipUrl)
    return {state:"ready",productionId:binding.productionId,chargedCredits:p.charged,previewUrl,deliveryZipUrl,safeToRetryAutomatically:false};
   if(p.state==="already_ready"&&p.charged===0)return {state:"already_ready",productionId:binding.productionId,chargedCredits:0,previewUrl,deliveryZipUrl,safeToRetryAutomatically:false};
  }
  if(result.status===502&&p.ok===false&&p.state==="generation_failed"&&p.code==="website_generation_failed_credits_released")
   return {state:"failed_released",code:String(p.code),safeToRetryAutomatically:false};
  const preflightCodes=["website_atomic_production_not_enabled","website_render_invalid_request","website_paid_canary_account_not_enabled","website_project_not_found","website_current_approval_required","website_approved_package_or_brief_changed"];
  if(p.ok===false&&typeof p.code==="string"&&preflightCodes.includes(p.code)&&[400,403,404,409,503].includes(result.status))return notDispatched(p.code);
  // All unexpected responses, network exceptions or uncertain settlements require
  // reconciliation. No fallback, refund claim, duplicate request or fake output.
  return uncertain();
 }catch{return uncertain();}
}
