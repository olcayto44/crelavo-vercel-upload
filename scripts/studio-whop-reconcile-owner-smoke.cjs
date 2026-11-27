const assert=require("node:assert/strict"),{load}=require("./studio-agent-test-loader.cjs");
let authCalls=0,providerCalls=0,sideEffects=0;
const owner={id:"11111111-1111-4111-8111-111111111111",email:"owner@example.test",email_confirmed_at:"2026-01-01"};
let user=owner,paymentEmail="owner@example.test";
const db={auth:{getUser:async token=>{authCalls++;return token==="fixture"?{data:{user},error:null}:{data:{user:null},error:{}};}},from:()=>{sideEffects++;throw Error("unexpected profile access");}};
const blocked=()=>{sideEffects++;throw Error("unexpected mutation");};
const {POST}=load("src/app/api/whop/reconcile-payment/route.ts",{
 "@/lib/supabase":{supabaseAdmin:()=>db,bearerTokenFromRequest:r=>r.headers.get("authorization")?.replace(/^Bearer /,"")||""},
 "@/lib/studio-agent/whop-atomic-purchase":{whopAtomicPurchaseEnabled:()=>false,commitVerifiedWhopPurchase:blocked},
 "@/lib/whop-legacy-purchase":{findWhopLegacyPurchase:blocked},
 "@/lib/credit-rollover":{}, "@/lib/whop-payment-state":{whopLookupPaymentSucceeded:()=>false},
 "@/lib/whop-reversal-notice":{whopReversalNoticeExists:async()=>false},
 "@/lib/admin-operations":{recordCreditLedger:blocked,recordPaymentFulfillment:blocked},
 "@/lib/data":{}, "@/lib/payment-email":{}, "@/lib/whop":{}, "@/lib/whop-analytics":{recordWhopAnalytics:blocked}
});
(async()=>{
 const original=global.fetch,key=process.env.WHOP_API_KEY;process.env.WHOP_API_KEY="synthetic";
 global.fetch=async()=>{providerCalls++;return Response.json({id:"pay_fixture",user:{email:paymentEmail},status:"open"});};
 try{
 const run=async token=>{const res=await POST(new Request("https://example.test/api/whop/reconcile-payment",{method:"POST",headers:token?{Authorization:"Bearer "+token}:{},body:JSON.stringify({payment_id:"pay_fixture"})}));return [res.status,(await res.json()).reason];};
 assert.deepEqual(await run(),[401,"authentication_required"]);assert.equal(authCalls,0);
 assert.deepEqual(await run("bad"),[401,"authentication_required"]);assert.equal(providerCalls,0);
 user={...owner,email_confirmed_at:null};assert.deepEqual(await run("fixture"),[403,"verified_email_required"]);assert.equal(providerCalls,0);
 user=owner;paymentEmail="other@example.test";assert.deepEqual(await run("fixture"),[403,"payment_owner_mismatch"]);assert.equal(providerCalls,1);
 paymentEmail="OWNER@example.test";assert.deepEqual(await run("fixture"),[200,"payment_not_succeeded"]);assert.equal(providerCalls,2);
 assert.equal(sideEffects,0);console.log("PASS: anonymous, invalid, unverified and cross-account payment reconciliation blocked; verified owner pending payment no mutations.");
 }finally{global.fetch=original;if(key===undefined)delete process.env.WHOP_API_KEY;else process.env.WHOP_API_KEY=key;}
})().catch(e=>{console.error(e);process.exitCode=1;});
