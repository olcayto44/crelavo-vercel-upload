import "server-only";
import {supabaseAdmin} from "@/lib/supabase";
import {whopLegacyPurchaseState} from "@/lib/whop-payment-state";
export async function findWhopLegacyPurchase(db:ReturnType<typeof supabaseAdmin>,expected:{paymentId:string;userId:string;credits:number}){
 if(!/^pay_[A-Za-z0-9_-]{3,156}$/.test(expected.paymentId))throw Error("whop_payment_identity_invalid");
 const key=("whop:payment:"+expected.paymentId).replace(/_/g,"\\_");
 const {data,error}=await db.from("credit_events").select("user_id,type,amount,note").like("note",key+" | %").limit(2);
 if(error)throw Error("whop_purchase_history_unavailable");
 const state=whopLegacyPurchaseState(data??[],expected);
 if(state==="conflict")throw Error("whop_purchase_history_conflict");
 return state;
}
