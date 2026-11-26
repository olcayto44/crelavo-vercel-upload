import "server-only";
import {supabaseAdmin} from "@/lib/supabase";
import {applyCreditPurchaseToBuckets,creditsForBilling,type BillingMode} from "@/lib/credit-rollover";
import {findPaymentProduct} from "@/lib/data";
type Product=NonNullable<ReturnType<typeof findPaymentProduct>>;
type DB=ReturnType<typeof supabaseAdmin>;
type Profile={id:string;email:string};
type Input={profile:Profile;product:Product;billing:string;credits:number;paymentId:string;membershipId:string;source:"webhook"|"checkout_complete_fallback"};
// Do not activate until all wallet writers are fenced and the SQL candidate has
// been reviewed in a production-compatible database. Both entry points use this switch.
export function whopAtomicPurchaseEnabled(env:NodeJS.ProcessEnv=process.env){
 return env.VERCEL_ENV==="production"&&env.STUDIO_WHOP_ATOMIC_PURCHASE_ENABLED==="true"&&env.STUDIO_AGENT_ISOLATED_PREVIEW!=="true";
}
export async function commitVerifiedWhopPurchase(db:DB,input:Input){
 const {profile,product,credits,paymentId,membershipId,source}=input;
 if(!whopAtomicPurchaseEnabled())throw Error("whop_atomic_purchase_disabled");
 const billing=input.billing as BillingMode;
 if(!/^pay_[A-Za-z0-9_-]{3,156}$/.test(paymentId)||!["monthly","yearly","one_time"].includes(billing)||!Number.isSafeInteger(credits)||credits<=0||credits!==creditsForBilling(product,billing))throw Error("whop_purchase_terms_review_required");
 // Recheck canonical Auth ownership. Never credit a stale profile or a browser-supplied owner.
 const auth=await db.auth.admin.getUserById(profile.id);
 if(auth.error||!auth.data.user?.email||auth.data.user.email.trim().toLowerCase()!==profile.email.trim().toLowerCase())throw Error("whop_purchase_owner_review_required");
 const {data:wallet,error:walletError}=await db.from("credit_balances").select("*").eq("user_id",profile.id).maybeSingle();
 if(walletError)throw Error("whop_wallet_unavailable");
 const update=applyCreditPurchaseToBuckets({row:wallet,product,billing,credits});
 const note=["whop:payment:"+paymentId,"package="+product.id,"billing="+billing,"whop_payment="+paymentId,membershipId?"membership="+membershipId:"","source="+source].filter(Boolean).join(" | ");
 const r=await db.rpc("studio_whop_commit_credits",{p_user:profile.id,p_payment:paymentId,p_credits:credits,p_expected:wallet,p_update:update,p_note:note});
 if(r.error)throw Error("whop_purchase_outcome_unconfirmed");
 if(r.data==="already_processed")return {activated:false as const,reason:"already_processed" as const,profile};
 if(r.data!=="credited")throw Error("whop_purchase_reconciliation_required");
 const [balance,event]=await Promise.all([
  db.from("credit_balances").select("balance,reserved,current_subscription_credits,rolled_over_credits,topup_credits,bonus_credits,rollover_cap,billing_cycle_ends_at,updated_at").eq("user_id",profile.id).single(),
  db.from("studio_whop_credit_commits").select("event_id").eq("payment_id",paymentId).eq("user_id",profile.id).eq("credits",credits).single()
 ]);
 if(balance.error||event.error||!balance.data||!event.data?.event_id)throw Error("whop_purchase_outcome_unconfirmed");
 return {activated:true as const,profile,balance:balance.data,event:{id:event.data.event_id,type:"purchase",amount:credits},creditsAdded:credits};
}
