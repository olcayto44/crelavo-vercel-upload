import {z} from "zod";
import {whopProductForPlanId} from "@/lib/whop";
import {findPaymentProduct} from "@/lib/data";
// Source contract: https://docs.whop.com/api-reference/payments/retrieve-payment
// Only an independently authenticated checkout/owner mapping from trusted server
// storage may supply Expected. Never accept this mapping from the browser.
const paymentId=z.string().regex(/^pay_[A-Za-z0-9_-]{3,156}$/);
const Expected=z.strictObject({userId:z.string().uuid(),companyId:z.string().regex(/^biz_[A-Za-z0-9_-]{3,156}$/),checkoutId:z.string().regex(/^ch_[A-Za-z0-9_-]{3,156}$/),whopUserId:z.string().regex(/^user_[A-Za-z0-9_-]{3,156}$/),planId:z.string().regex(/^plan_[A-Za-z0-9_-]{3,156}$/),source:z.literal("reviewed_server_checkout_binding")});
const Payment=z.object({id:paymentId,company:z.object({id:z.string()}),checkout_configuration_id:z.string(),user:z.object({id:z.string()}),plan:z.object({id:z.string()}),status:z.literal("paid"),substatus:z.literal("succeeded"),billing_reason:z.literal("one_time"),currency:z.literal("usd"),subtotal:z.number().finite().positive(),total:z.number().finite().positive(),paid_at:z.string().datetime({offset:true}),auto_refunded:z.literal(false),refunded_at:z.null(),refunded_amount:z.union([z.literal(0),z.null()]),refunds:z.array(z.unknown()).length(0),disputes:z.array(z.unknown()).length(0),dispute_alerted_at:z.null(),resolutions:z.union([z.array(z.unknown()).length(0),z.null()]),promo_code:z.null()});
export async function verifyWhopTopupByLookup(rawId:unknown,rawExpected:unknown,deps:{enabled:()=>boolean;apiKey:string;transport?:typeof fetch}){
 if(!deps.enabled()||!deps.apiKey.trim())return null;
 const id=paymentId.safeParse(rawId),expected=Expected.safeParse(rawExpected);if(!id.success||!expected.success)return null;
 const x=expected.data,mapping=whopProductForPlanId(x.planId),product=mapping&&findPaymentProduct(mapping.productId);
 if(!mapping||mapping.billing!=="one_time"||!product||product.planType!=="topup"||!Number.isSafeInteger(product.credits)||product.credits<=0||!Number.isFinite(product.priceUsd)||product.priceUsd<=0)return null;
 try{
 const response=await (deps.transport??fetch)("https://api.whop.com/api/v1/payments/"+encodeURIComponent(id.data),{method:"GET",redirect:"error",cache:"no-store",signal:AbortSignal.timeout(15000),headers:{Authorization:"Bearer "+deps.apiKey,Accept:"application/json"}});
 if(!response.ok)return null;
 const reader=response.body?.getReader();if(!reader)return null;
 let size=0,text="";const decoder=new TextDecoder();
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>262144)return null;text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}finally{await reader.cancel().catch(()=>{});}
 const parsed=Payment.safeParse(JSON.parse(text));if(!parsed.success)return null;const p=parsed.data;
 // Exact USD decimal amount, not ambiguous cents/dollars. Other currencies,
 // discounts, missing fields and reversal indicators require manual review.
 const cents=(v:number)=>Math.round(v*100);
 if(p.id!==id.data||p.company.id!==x.companyId||p.checkout_configuration_id!==x.checkoutId||p.user.id!==x.whopUserId||p.plan.id!==x.planId||cents(p.subtotal)!==cents(product.priceUsd)||p.total<p.subtotal||Date.parse(p.paid_at)>Date.now()+60000)return null;
 return {paymentId:id.data,userId:x.userId,planId:x.planId,source:"verified_whop_server_lookup" as const,state:"paid_unreversed" as const};
 }catch{return null;}
}
