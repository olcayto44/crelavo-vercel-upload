import {z} from "zod";
import {findPaymentProduct} from "@/lib/data";
import {whopProductForPlanId} from "@/lib/whop";
import {applyCreditPurchaseToBuckets,type CreditBucketRow} from "@/lib/credit-rollover";
// Internal contract: verifier must perform a fresh, server-side provider lookup,
// validate company, payment status, refunds/disputes and canonical Auth owner.
// Never populate this object directly from a browser, model or stored journal.
const VerifiedPayment=z.strictObject({
 paymentId:z.string().regex(/^pay_[A-Za-z0-9_-]{3,156}$/),
 userId:z.string().uuid(),planId:z.string().regex(/^[A-Za-z0-9_-]{3,160}$/),
 source:z.literal("verified_whop_server_lookup"),state:z.literal("paid_unreversed"),
});
const paymentId=z.string().regex(/^pay_[A-Za-z0-9_-]{3,156}$/);
type RPC=(name:string,args:Record<string,unknown>)=>Promise<{data:unknown;error:unknown}>;
type Wallet=CreditBucketRow & Record<string,unknown>;
type Deps={enabled:()=>boolean;verify:(id:string)=>Promise<unknown>;loadWallet:(userId:string)=>Promise<Wallet|null>;rpc:RPC};
type State="disabled"|"verification_required"|"unsupported_plan"|"credited"|"already_processed"|"wallet_changed"|"review_required"|"storage_unconfirmed";
export async function recoverVerifiedWhopTopup(raw:unknown,deps:Deps):Promise<{state:State;safeToRetryAutomatically:false}>{
 const out=(state:State)=>({state,safeToRetryAutomatically:false as const});
 if(!deps.enabled())return out("disabled");
 const id=paymentId.safeParse(raw);if(!id.success)return out("verification_required");
 let verified:unknown;
 try{verified=await deps.verify(id.data);}catch{return out("verification_required");}
 const parsed=VerifiedPayment.safeParse(verified);
 if(!parsed.success||parsed.data.paymentId!==id.data)return out("verification_required");
 const v=parsed.data,mapped=whopProductForPlanId(v.planId),product=mapped&&findPaymentProduct(mapped.productId);
 // Only existing one-time credit packs in this first isolated integration.
 if(!mapped||!product||mapped.billing!=="one_time"||product.planType!=="topup"||!Number.isSafeInteger(product.credits)||product.credits<=0)return out("unsupported_plan");
 const terms={p_user:v.userId,p_payment:v.paymentId,p_plan:v.planId,p_product:product.id,p_billing:"one_time",p_credits:product.credits};
 try{
  const stage=await deps.rpc("studio_whop_stage_verified",terms);
  if(stage.error)return out("storage_unconfirmed");
  if(stage.data==="fulfilled")return out("already_processed");
  if(stage.data==="review_required"||stage.data==="payment_conflict"||stage.data==="denied")return out("review_required");
  if(stage.data!=="pending")return out("storage_unconfirmed");
  const wallet=await deps.loadWallet(v.userId);
  if(wallet&&wallet.user_id!==v.userId)return out("review_required");
  const patch=applyCreditPurchaseToBuckets({row:wallet,product,billing:"one_time",credits:product.credits});
  const result=await deps.rpc("studio_whop_recover_verified",{...terms,p_expected:wallet,p_update:patch});
  if(result.error)return out("storage_unconfirmed");
  if(result.data==="credited"||result.data==="already_processed"||result.data==="wallet_changed")return out(result.data);
  if(result.data==="review_required"||result.data==="reconcile_required"||result.data==="payment_conflict"||result.data==="denied")return out("review_required");
  return out("storage_unconfirmed");
 }catch{return out("storage_unconfirmed");}
}
