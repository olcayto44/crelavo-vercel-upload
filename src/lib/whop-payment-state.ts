// Provider reversal evidence must never be treated as a new paid credit purchase.
// Missing reversal fields on older signed webhooks are not a proof of reversal.
export function whopPaymentHasReversal(payment:Record<string,unknown>){
 const statuses=[payment.status,payment.substatus].map(v=>String(v??"").trim().toLowerCase());
 const reversal=["refunded","partially_refunded","disputed","chargeback","reversed","refund_pending"];
 return statuses.some(v=>reversal.includes(v))||payment.auto_refunded===true||
 Boolean(payment.refunded_at)||Boolean(payment.dispute_alerted_at)||
 Number(payment.refunded_amount??0)>0||
 [payment.refunds,payment.disputes,payment.resolutions].some(v=>Array.isArray(v)&&v.length>0);
}
export function whopLookupPaymentSucceeded(payment:Record<string,unknown>){
 if(whopPaymentHasReversal(payment))return false;
 const status=String(payment.status??"").trim().toLowerCase(),substatus=String(payment.substatus??"").trim().toLowerCase();
 return status==="paid"&&(!substatus||substatus==="succeeded");
}
export function whopCreditFulfillment(activated:boolean,reason?:string){
 const fulfilled=activated||reason==="already_processed";
 return {fulfilled,status:fulfilled?"fulfilled" as const:"pending_user" as const};
}
