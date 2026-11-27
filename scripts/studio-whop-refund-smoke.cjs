const assert=require("node:assert/strict"),fs=require("node:fs"),{PGlite}=require("@electric-sql/pglite"),{load}=require("./studio-agent-test-loader.cjs");
const {whopFullTopupRefund}=load("src/lib/whop-payment-state.ts");
const expected={paymentId:"pay_fixture",planId:"plan_fixture",email:"fixture@example.test",priceUsd:10};
const p={id:expected.paymentId,plan:{id:expected.planId},user:{email:expected.email},status:"paid",substatus:"refunded",billing_reason:"one_time",currency:"usd",subtotal:10,total:10,refunded_amount:10,refunded_at:"2026-11-28T00:00:00Z",disputes:[],dispute_alerted_at:null,promo_code:null};
assert(whopFullTopupRefund(p,expected));
for(const v of [{refunded_amount:5},{substatus:"succeeded"},{currency:"eur"},{billing_reason:"subscription_cycle"},{disputes:[{}]},{user:{email:"other@example.test"}},{refunded_at:null}])assert(!whopFullTopupRefund({...p,...v},expected));
(async()=>{
 const db=new PGlite();try{
 const schema=fs.readFileSync("supabase/schema.sql","utf8");
 const table=name=>{const m=schema.match(new RegExp("create table "+name+" \\([^]*?\\n\\);"));assert(m);return m[0];};
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');${table("profiles")}${table("credit_balances")}${table("credit_events")}`);
 await db.exec(fs.readFileSync("docs/studio-whop-credit-commit-isolated.sql","utf8"));
 await db.exec(fs.readFileSync("docs/studio-whop-refund-isolated.sql","utf8"));
 const user="11111111-1111-4111-8111-111111111111",other="22222222-2222-4222-8222-222222222222";
 await db.query("insert into auth.users(id) values($1),($2)",[user,other]);
 await db.query("insert into profiles(id,email) values($1,'a@example.test'),($2,'b@example.test')",[user,other]);
 await db.query("insert into credit_balances(user_id,balance,topup_credits,bonus_credits) values($1,110,100,10)",[user]);
 const event=(await db.query("insert into credit_events(user_id,type,amount,note) values($1,'purchase',100,'whop:payment:pay_fixture | package=topup_starter | billing=one_time') returning id",[user])).rows[0].id;
 await db.query("insert into studio_whop_credit_commits(payment_id,user_id,credits,event_id) values('pay_fixture',$1,100,$2)",[user,event]);
 const call=async(id=user,n=100)=>(await db.query("select studio_whop_reverse_unused_topup('pay_fixture',$1,$2,'topup_starter') as result",[id,n])).rows[0].result;
 const wallet=async()=>(await db.query("select balance,topup_credits,bonus_credits,reserved from credit_balances where user_id=$1",[user])).rows[0];
 assert.equal(await call(other),"review_required");assert.equal(await call(user,99),"review_required");
 await db.query("update credit_balances set reserved=1 where user_id=$1",[user]);assert.equal(await call(),"review_required");
 await db.query("update credit_balances set reserved=0 where user_id=$1",[user]);
 await db.query("insert into credit_events(user_id,type,amount,note,created_at) values($1,'spend',1,'fixture spend',now()+interval '1 second')",[user]);assert.equal(await call(),"review_required");
 await db.query("delete from credit_events where note='fixture spend'");
 assert.equal(await call(),"reversed");assert.equal(await call(),"already_reversed");assert.deepEqual(await wallet(),{balance:10,topup_credits:0,bonus_credits:10,reserved:0});
 for(const role of ["anon","authenticated","service_role"]){const {rows}=await db.query("select has_function_privilege($1,'public.studio_whop_reverse_unused_topup(text,uuid,integer,text)','EXECUTE') as ok",[role]);assert.equal(rows[0].ok,role==="service_role");}
 console.log("Whop full unused top-up refund: provider evidence, owner, amount, reservation, spend, one-time debit and role checks passed (isolated).");
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
