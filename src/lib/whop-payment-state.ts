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

// Do not mistake a refund or dispute ID for its original payment ID.
export function whopOriginalPaymentId(data:Record<string,unknown>){
 const payment=data.payment&&typeof data.payment==="object"&&!Array.isArray(data.payment)?data.payment as Record<string,unknown>:{};
 const ids=[payment.id,data.payment_id,data.id].filter((v):v is string=>typeof v==="string"&&/^pay_[A-Za-z0-9_-]{3,156}$/.test(v));
 return ids.length&&new Set(ids).size===1?ids[0]:null;
}
export function whopSubscriptionExpiryAllowed(row:{balance?:number|null;reserved?:number|null;current_subscription_credits?:number|null;rolled_over_credits?:number|null;topup_credits?:number|null;bonus_credits?:number|null}|null){
 if(!row)return false;
 const amounts=[row.balance,row.reserved,row.current_subscription_credits,row.rolled_over_credits,row.topup_credits,row.bonus_credits];
 if(!amounts.every(v=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0))return false;
 return row.reserved===0&&row.balance===Number(row.current_subscription_credits)+Number(row.rolled_over_credits)+Number(row.topup_credits)+Number(row.bonus_credits);
}
