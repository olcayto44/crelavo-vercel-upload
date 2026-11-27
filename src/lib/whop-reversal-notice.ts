import "server-only";
import {supabaseAdmin} from "@/lib/supabase";
export async function recordWhopReversalNotice(eventId:string,event:"refund.created"|"dispute.created",originalPaymentId:string|null){
 const {error}=await supabaseAdmin().from("payment_provider_events").upsert({
  provider:"whop",event_id:"reversal-review:"+eventId,event_type:"credit_reversal_review",user_id:null,
  payload:{event,originalPaymentId,reviewRequired:true}
 },{onConflict:"provider,event_id"});
 if(error)throw Error("whop_reversal_notice_unconfirmed");
}
export async function whopReversalNoticeExists(paymentId:string){
 const {count,error}=await supabaseAdmin().from("payment_provider_events").select("event_id",{head:true,count:"exact"})
 .eq("provider","whop").eq("event_type","credit_reversal_review").eq("payload->>originalPaymentId",paymentId);
 if(error||typeof count!=="number")throw Error("whop_reversal_review_unavailable");
 return count>0;
}
