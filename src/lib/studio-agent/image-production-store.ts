import type { ImageProductionPlan, ImageProductionStore } from "./image-production-orchestrator";
import { imagePlanDigest } from "./image-production-orchestrator";
export type ImageSettlementResult="settled"|"already_settled"|"released"|"already_released"|"denied"|"cost_evidence_required"|"reconcile_required";
type RPC=(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>;
export function createImageProductionStore(rpc:RPC):ImageProductionStore & {reserve:(plan:ImageProductionPlan,hash:string)=>Promise<"reserved"|"already_reserved_or_finished"|"denied">;finalize:(plan:ImageProductionPlan,hash:string,outcome:"settle"|"release_unclaimed")=>Promise<ImageSettlementResult>}{
 const args=(plan:ImageProductionPlan,hash:string)=>{
  if(imagePlanDigest(plan)!==hash)throw Error("image_plan_hash_mismatch");
  return {p_user:plan.userId,p_request:plan.requestId,p_hash:hash,p_plan:plan};
 };
 async function call(name:string,input:Record<string,unknown>){const {data,error}=await rpc(name,input);if(error)throw Error("image_storage_unconfirmed");return data;}
 return {
  async finalize(plan,hash,outcome){const result=await call("studio_image_finalize",{...args(plan,hash),p_outcome:outcome});if(result!=="settled"&&result!=="already_settled"&&result!=="released"&&result!=="already_released"&&result!=="denied"&&result!=="cost_evidence_required"&&result!=="reconcile_required")throw Error("image_settlement_unconfirmed");return result;},
  async reserve(plan,hash){const result=await call("studio_image_reserve",args(plan,hash));if(result!=="reserved"&&result!=="already_reserved_or_finished"&&result!=="denied")throw Error("image_reservation_unconfirmed");return result;},
  async claim(plan,hash){const result=await call("studio_image_claim",args(plan,hash));if(result!=="claimed"&&result!=="already_claimed"&&result!=="denied")throw Error("image_claim_unconfirmed");return result;},
  async recordArtifact(plan,hash,bytes,receipt){return await call("studio_image_record",{...args(plan,hash),p_receipt:receipt,p_base64:bytes.toString("base64")})===true;},
  async recordUncertain(plan,hash,code,providerRequestId){if(await call("studio_image_uncertain",{...args(plan,hash),p_code:code,p_provider_id:providerRequestId??null})!==true)throw Error("image_reconciliation_record_unconfirmed");}
 };
}
