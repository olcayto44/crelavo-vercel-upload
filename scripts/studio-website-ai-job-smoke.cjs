const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {load}=require('./studio-agent-test-loader.cjs');
(async()=>{
 const db=new PGlite();
 const owner='11111111-1111-4111-8111-111111111111';
 const hashBrief={brand:'Offline Brand',brief:'A carefully described offline business website for service clients.',audience:'Small business',siteType:'Landing Page',style:'Minimal',pages:['Home','Contact'],features:[],locale:'en'};
 const packId='landing_page', credits=500;
 const hash=b=>createHash('sha256').update(JSON.stringify({version:1,brief:b,packId})).digest('hex');
 const planHash=hash(hashBrief);
 try{
  const schema=fs.readFileSync('supabase/schema.sql','utf8');
  const table=name=>{const match=schema.match(new RegExp('create table '+name+' \\([^]*?\\n\\);'));assert(match,'missing '+name);return match[0];};
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $tag$ select null::uuid $tag$;
    create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text);
    create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
    ${table('profiles')} ${table('credit_balances')} ${table('credit_events')}`);
  const production=fs.readFileSync('supabase/migration_production_requests.sql','utf8');
  await db.exec(production.slice(0,production.indexOf('create table if not exists legal_acceptances')));
  await db.exec(fs.readFileSync('supabase/migration_credit_rollover_policy.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migration_website_atomic_credits_isolated.sql','utf8'));
  await db.exec(fs.readFileSync('docs/website-ai-jobs-isolated.sql','utf8'));
  await db.query('insert into auth.users(id) values($1)',[owner]);
  await db.query("insert into profiles(id,email) values($1,'offline@example.test')",[owner]);
  await db.query('insert into credit_balances(user_id,balance,current_subscription_credits,topup_credits) values($1,1000,600,400)',[owner]);
  const {rows}=await db.query(`insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,input_json,output_json)
     values($1,'website',$2,'Offline Brand','This is isolated','pending','pending',$3,'{}'::jsonb,$4::jsonb) returning id`,
    [owner,packId,credits,JSON.stringify({websiteAssistant:{phase:'approved',approvedHash:planHash,planHash,packId,credits,brief:hashBrief}})]);
  const productionId=rows[0].id;
  const rpc=async(name,args)=>{
   const params=Object.values(args);
   try{return{data:(await db.query('select public.'+name+'('+params.map((_,i)=>'$'+(i+1)).join(',')+') as value',params)).rows[0].value,error:null};}
   catch(error){return{data:null,error:{message:String(error.message)}};}
  };
  const {runIsolatedWebsiteAI,websiteAIPolicyDigest}=load('src/lib/studio-agent/website-ai-orchestrator.ts');
  const policy={version:'offline-v1',model:'gpt-6.1-terra',inputLimit:16000,outputLimit:1200,requestMicroUSD:50000,totalMicroUSD:1000000,userRPM:2,systemRPM:5,inputRate:3000000,outputRate:5000000};
  const approval={userId:owner,productionId,planHash,packId,credits,policyVersion:policy.version,policyHash:websiteAIPolicyDigest(policy),maximumMicroUSD:policy.requestMicroUSD,source:'persisted_explicit_user_approval',brief:hashBrief};
  const tuple={planHash,policyVersion:policy.version,policyHash:approval.policyHash,credits,maximumMicroUSD:approval.maximumMicroUSD,source:approval.source};
  await db.query("update production_requests set output_json=output_json||jsonb_build_object('websiteAIApproval',$2::jsonb) where id=$1",[productionId,JSON.stringify(tuple)]);
  const copy={eyebrow:'Business websites',headline:'A clearer website for your business',intro:'Plan your site around your services and audience.',features:[1,2,3].map(i=>({title:'Planning step '+i,body:'Review your business goals before publishing.'})),faq:[1,2,3].map(i=>({question:'Planning question '+i+'?',answer:'Review your supplied requirements with the team.'}))};
  let calls=0;
  const deps={enabled:()=>true,policy,apiKey:'offline-test',rpc,transport:async()=>{calls++;return Response.json({id:'chatcmpl-offline-job',model:policy.model,usage:{prompt_tokens:500,completion_tokens:300},choices:[{finish_reason:'stop',message:{content:JSON.stringify(copy)}}]});}};
  assert.equal((await runIsolatedWebsiteAI({...approval,policyHash:'b'.repeat(64)},owner,deps)).state,'not_dispatched');assert.equal(calls,0);
  const result=await runIsolatedWebsiteAI(approval,owner,deps);assert.equal(result.state,'artifact_cost_pending');assert.equal(calls,1);
  assert.equal((await runIsolatedWebsiteAI(approval,owner,deps)).state,'already_claimed');assert.equal(calls,1);
  const before=(await db.query('select balance,reserved from credit_balances where user_id=$1',[owner])).rows[0];assert.equal(before.balance,1000);assert.equal(before.reserved,500);
  const job=(await db.query('select state,receipt,artifact from website_ai_jobs where production_id=$1',[productionId])).rows[0];assert.equal(job.state,'artifact_cost_pending');assert(job.artifact.files.find(f=>f.path==='index.html').content.includes(copy.headline));assert.equal(job.receipt.requestId,'chatcmpl-offline-job');
  const identity={p_user:owner,p_production:productionId,p_hash:planHash};
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:{source:'reviewed_provider_usage',requestId:'wrong',actualMicroUSD:3000}})).data,'cost_evidence_required');
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:{source:'reviewed_provider_usage',requestId:'chatcmpl-offline-job',actualMicroUSD:60000}})).data,'cost_evidence_required');
  const evidence={source:'reviewed_provider_usage',requestId:'chatcmpl-offline-job',actualMicroUSD:3000};
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:evidence})).data,'settled');
  assert.equal((await rpc('website_ai_finalize',{...identity,p_evidence:evidence})).data,'already_settled');
  const wallet=(await db.query('select balance,reserved from credit_balances where user_id=$1',[owner])).rows[0];assert.equal(wallet.balance,500);assert.equal(wallet.reserved,0);
  const delivered=(await db.query('select * from production_requests where id=$1',[productionId])).rows[0];const reservation=(await db.query('select state,credits from website_credit_reservations where production_id=$1',[productionId])).rows[0];
  assert.equal(load('src/lib/assistant-work/website-paid-delivery.ts').websiteCreditDeliveryProof(delivered,reservation),true);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  console.log('studio-website-ai-job-smoke ok: isolated DB, one AI dispatch, durable files and receipt, pending costs, one settlement and delivery proof (synthetic provider evidence)');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
