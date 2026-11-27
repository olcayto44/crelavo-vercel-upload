const assert=require("node:assert/strict"),fs=require("node:fs"),{load}=require("./studio-agent-test-loader.cjs");
const {commitVerifiedWhopPurchase,whopAtomicPurchaseEnabled}=load("src/lib/studio-agent/whop-atomic-purchase.ts",{"server-only":{},"@/lib/supabase":{}});
const {findPaymentProduct}=load("src/lib/data.ts");
const env={VERCEL_ENV:"production",STUDIO_WHOP_ATOMIC_PURCHASE_ENABLED:"true"};
assert(whopAtomicPurchaseEnabled(env));
assert(!whopAtomicPurchaseEnabled({...env,VERCEL_ENV:"preview"}));
assert(!whopAtomicPurchaseEnabled({...env,STUDIO_WHOP_ATOMIC_PURCHASE_ENABLED:"false"}));
assert(!whopAtomicPurchaseEnabled({...env,STUDIO_AGENT_ISOLATED_PREVIEW:"true"}));
const user="11111111-1111-4111-8111-111111111111",profile={id:user,email:"fixture@example.test"},product=findPaymentProduct("topup_starter");
const wallet={user_id:user,balance:100,reserved:0,topup_credits:0,bonus_credits:0,current_subscription_credits:100,rolled_over_credits:0};
const input={profile,product,billing:"one_time",credits:product.credits,paymentId:"pay_offline_atomic",membershipId:"",source:"webhook"};
let calls=0,owner=profile.email,outcome="credited",rpcError=null,readError=null;
const db={auth:{admin:{getUserById:async id=>({data:{user:{id,email:owner}},error:null})}},from(table){const chain={select:()=>chain,eq:()=>chain,maybeSingle:async()=>({data:wallet,error:readError}),single:async()=>table==="credit_balances"?{data:{...wallet,balance:wallet.balance+product.credits},error:null}:{data:{event_id:"fixture-event"},error:null}};return chain;},rpc:async(name,args)=>{calls++;assert.equal(name,"studio_whop_commit_credits");assert.equal(args.p_user,user);assert.equal(args.p_expected,wallet);assert.equal(args.p_update.balance,100+product.credits);assert.equal(args.p_note.split(" | ")[0],"whop:payment:"+input.paymentId);return {data:outcome,error:rpcError};}};
(async()=>{
 const before={...process.env};try{
 Object.assign(process.env,env);delete process.env.STUDIO_AGENT_ISOLATED_PREVIEW;
 assert.equal((await commitVerifiedWhopPurchase(db,input)).activated,true);assert.equal(calls,1);
 outcome="already_processed";assert.equal((await commitVerifiedWhopPurchase(db,{...input,source:"checkout_complete_fallback"})).reason,"already_processed");assert.equal(calls,2);
 outcome="wallet_changed";await assert.rejects(()=>commitVerifiedWhopPurchase(db,input),/reconciliation_required/);assert.equal(calls,3);
 rpcError={message:"synthetic timeout"};await assert.rejects(()=>commitVerifiedWhopPurchase(db,input),/outcome_unconfirmed/);assert.equal(calls,4);rpcError=null;
 owner="other@example.test";await assert.rejects(()=>commitVerifiedWhopPurchase(db,input),/owner_review_required/);assert.equal(calls,4);owner=profile.email;
 await assert.rejects(()=>commitVerifiedWhopPurchase(db,{...input,credits:1}),/terms_review_required/);assert.equal(calls,4);
 process.env.STUDIO_WHOP_ATOMIC_PURCHASE_ENABLED="false";await assert.rejects(()=>commitVerifiedWhopPurchase(db,input),/disabled/);assert.equal(calls,4);
 for(const p of ["src/app/api/webhooks/whop/route.ts","src/app/api/whop/reconcile-payment/route.ts"]){
 const src=fs.readFileSync(p,"utf8"),branch=/if\s*\(\s*whopAtomicPurchaseEnabled\(\)\s*\)\s*\{\s*return\s+commitVerifiedWhopPurchase\(/.exec(src);
 assert(branch,"atomic purchase must return directly from the verified entry point");
 assert(branch.index<src.indexOf('.from("credit_events")'),"atomic purchase must precede legacy writes");
}
 console.log("Whop atomic candidate: same entry boundary, canonical owner, exact terms, no fallback on uncertain RPC (offline)");
 }finally{for(const k of Object.keys(process.env))if(!(k in before))delete process.env[k];Object.assign(process.env,before);}
})().catch(e=>{console.error(e);process.exitCode=1;});
