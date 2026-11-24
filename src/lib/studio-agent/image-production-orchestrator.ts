import { z } from "zod";
import { createHash } from "node:crypto";
import { ImageRequestSchema, type ImageProviderResult, type ImageRequest, type ImageReceipt } from "./image-provider";
const hash=z.string().regex(/^[a-f0-9]{64}$/);
const uuid=z.string().uuid();
export const ImagePlanSchema=z.strictObject({
 requestId:uuid,userId:uuid,projectId:uuid,categoryId:z.literal("image"),operation:z.literal("image_generate"),
 provider:z.literal("minimax"),model:z.literal("image-01"),request:ImageRequestSchema,
 tariffVersion:z.string().regex(/^[A-Za-z0-9._-]{1,64}$/),reservedCredits:z.number().int().positive().max(100000),
 maximumProviderMicroUSD:z.number().int().positive().max(1000000),
});
export type ImageProductionPlan=z.infer<typeof ImagePlanSchema>;
type Plan=ImageProductionPlan;
const ApprovedSchema=z.strictObject({plan:ImagePlanSchema,planHash:hash,approvalSource:z.literal("persisted_explicit_user_approval"),reservationState:z.literal("reserved"),account:z.literal("production"),costPolicySource:z.literal("reviewed_server_tariff")});
export function imagePlanDigest(raw:unknown){const p=ImagePlanSchema.parse(raw);return createHash("sha256").update(JSON.stringify(p)).digest("hex");}
type Outcome={state:"not_dispatched"|"already_claimed"|"artifact_recorded_cost_pending"|"reconciliation_required";code?:string;safeToRetryAutomatically:false};
export type ImageProductionStore={
 // Must atomically verify matching stored approval, reservation, tariff and claim
 // before dispatch. Implementing this in durable DB is a separate release gate.
 claim:(plan:Plan,planHash:string)=>Promise<"claimed"|"already_claimed"|"denied">;
 recordArtifact:(plan:Plan,planHash:string,bytes:Buffer,receipt:ImageReceipt)=>Promise<boolean>;
 recordUncertain:(plan:Plan,planHash:string,code:string,providerRequestId?:string)=>Promise<void>;
};
export async function orchestrateSingleImage(raw:unknown,actor:unknown,deps:{enabled:()=>boolean;store:ImageProductionStore;generate:(request:ImageRequest)=>Promise<ImageProviderResult>}):Promise<Outcome>{
 const result=(state:Outcome["state"],code?:string):Outcome=>({state,...(code?{code}:{}),safeToRetryAutomatically:false});
 if(!deps.enabled())return result("not_dispatched","image_production_disabled");
 const approved=ApprovedSchema.safeParse(raw),owner=uuid.safeParse(actor);
 if(!approved.success||!owner.success)return result("not_dispatched","approved_reservation_required");
 const {plan,planHash}=approved.data;
 if(plan.userId!==owner.data||imagePlanDigest(plan)!==planHash)return result("not_dispatched","owner_or_plan_mismatch");
 let claimed:"claimed"|"already_claimed"|"denied";
 try{claimed=await deps.store.claim(plan,planHash);}catch{return result("reconciliation_required","claim_outcome_unconfirmed");}
 if(claimed==="already_claimed")return result("already_claimed");
 if(claimed!=="claimed")return result("not_dispatched","claim_denied");
 let id:string|undefined;
 try{
  const generated=await deps.generate(plan.request);
  if(generated.state==="reconciliation_required"){id=generated.providerRequestId;await deps.store.recordUncertain(plan,planHash,generated.code,id);return result("reconciliation_required",generated.code);}
  id=generated.receipt.providerRequestId;
  if(!await deps.store.recordArtifact(plan,planHash,generated.bytes,generated.receipt))throw Error("artifact_persistence_unconfirmed");
  // Output is recorded, not paid/ready for delivery. Actual provider cost and
  // final credit settlement are deliberately deferred to reconciliation.
  return result("artifact_recorded_cost_pending");
 }catch{
  try{await deps.store.recordUncertain(plan,planHash,"image_outcome_unconfirmed",id);}catch{/* reservation stays held; no retry */}
  return result("reconciliation_required","image_outcome_unconfirmed");
 }
}
