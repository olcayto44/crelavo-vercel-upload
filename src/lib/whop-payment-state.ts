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

export function whopLegacyPurchaseState(rows:{user_id?:unknown;type?:unknown;amount?:unknown;note?:unknown}[],expected:{paymentId:string;userId:string;credits:number}){
 const key="whop:payment:"+expected.paymentId;
 if(!/^pay_[A-Za-z0-9_-]{3,156}$/.test(expected.paymentId)||!Number.isSafeInteger(expected.credits)||expected.credits<=0)return "conflict";
 if(!rows.length)return "new";
 return rows.length===1&&rows[0].user_id===expected.userId&&rows[0].type==="purchase"&&rows[0].amount===expected.credits&&String(rows[0].note??"").split(" | ")[0]===key?"already_processed":"conflict";
}

// Strict first-release refund policy: only a verified full one-time USD refund.
export function whopFullTopupRefund(payment:Record<string,unknown>,expected:{paymentId:string;planId:string;email:string;priceUsd:number}){
 const obj=(v:unknown)=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
 const cents=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>0?Math.round(v*100):null;
 const total=cents(payment.total),refunded=cents(payment.refunded_amount),subtotal=cents(payment.subtotal),price=cents(expected.priceUsd);
 return payment.id===expected.paymentId&&obj(payment.plan).id===expected.planId&&String(obj(payment.user).email??"").trim().toLowerCase()===expected.email.trim().toLowerCase()&&
 payment.status==="paid"&&["refunded","auto_refunded"].includes(String(payment.substatus))&&payment.billing_reason==="one_time"&&payment.currency==="usd"&&
 price!==null&&subtotal===price&&total!==null&&total>=price&&refunded===total&&typeof payment.refunded_at==="string"&&Number.isFinite(Date.parse(payment.refunded_at))&&
 Array.isArray(payment.disputes)&&payment.disputes.length===0&&payment.dispute_alerted_at===null&&payment.promo_code===null;
}
