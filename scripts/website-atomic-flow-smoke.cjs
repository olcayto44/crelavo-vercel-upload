// End-to-end isolated Website runner/ledger/preview regression. No network or customer accounts.
// Single embedded PostgreSQL connection: concurrency and live delivery remain separate gates.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {PGlite}=require('@electric-sql/pglite');
const {load}=require('./studio-agent-test-loader.cjs');
(async()=>{
 const db=new PGlite();
 const owner='11111111-1111-4111-8111-111111111111';
 const hashBrief={brand:'Offline Brand',brief:'A carefully described offline business website for service clients.',audience:'Small business',siteType:'Landing Page',style:'Minimal',pages:['Home','Contact'],features:[],locale:'en'};
 const packId='landing_page', credits=30;
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
  await db.query('insert into auth.users(id) values($1)',[owner]);
  await db.query("insert into profiles(id,email) values($1,'offline@example.test')",[owner]);
  await db.query('insert into credit_balances(user_id,balance,current_subscription_credits,topup_credits) values($1,100,60,40)',[owner]);
  const {rows}=await db.query(`insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,input_json,output_json)
     values($1,'website',$2,'Offline Brand','This is isolated','pending','pending',$3,'{}'::jsonb,$4::jsonb) returning id`,
    [owner,packId,credits,JSON.stringify({websiteAssistant:{phase:'approved',approvedHash:planHash,planHash,packId,credits,brief:hashBrief}})]);
  const productionId=rows[0].id;
  const rpc=async(name,args)=>{
   const params=Object.values(args);
   try{return{data:(await db.query('select public.'+name+'('+params.map((_,i)=>'$'+(i+1)).join(',')+') as value',params)).rows[0].value,error:null};}
   catch(error){return{data:null,error:{message:String(error.message)}};}
  };
  const mocks={
   '../website-engine':{generateWebsiteArtifact:()=>{throw Error('unexpected fallback generator');}},
   './website-brief':{
    normalizeAssistantWebsiteBrief:value=>({brand:value.brand,brief:value.brief,audience:value.audience,siteType:value.siteType,style:value.style,pages:value.pages,features:value.features,locale:value.locale}),
    websiteEngineInput:brief=>({...brief,scope:'marketing_website'}),
    websitePlanHash:(brief,pack)=>pack===packId?hash(brief):'mismatch',
    missingWebsiteBrief:brief=>brief.brand&&brief.brief&&brief.pages?.length?[]:['brief'],
    unsupportedWebsiteScope:()=>[],
   },
   '@/lib/crelavo/categoryCatalog':{getCategory:()=>({packs:[{id:packId,label:'Landing Page',credits}]})},
  };
  const {createWebsiteCreditLedger}=load('src/lib/assistant-work/website-credit-ledger.ts',mocks);
  const {runIsolatedWebsiteGeneration}=load('src/lib/assistant-work/website-atomic-runner.ts',mocks);
  const ledger=createWebsiteCreditLedger(rpc);
  let generated=0;
  async function loadReserved(id,user){
   const {rows}=await db.query('select user_id,id,output_json from production_requests where id=$1 and user_id=$2',[id,user]);
   if(!rows.length)throw Error('not_owner');
   const w=rows[0].output_json.websiteAssistant;
   return {userId:rows[0].user_id,productionId:rows[0].id,phase:w.phase,planHash:w.planHash,approvedHash:w.approvedHash,credits:w.credits,packId:w.packId,brief:w.brief};
  }
  const generate=async(brief,id)=>{
   assert.equal(id,productionId);assert.equal(brief.brand,'Offline Brand');
   generated++;
   return{files:[{path:'index.html',content:'<!doctype html><html><body><h1>Offline Brand</h1></body></html>'},{path:'styles.css',content:'body{margin:0}'}],websiteContent:{siteTitle:'Offline Brand'},pageManifest:[{path:'index.html',title:'Home'}]};
  };
  const result=await runIsolatedWebsiteGeneration({userId:owner,productionId,planHash,credits},{ledger,loadReserved,generate});
  assert.equal(result.state,'ready');assert.equal(result.charged,true);assert.equal(generated,1);
  const replay=await runIsolatedWebsiteGeneration({userId:owner,productionId,planHash,credits},{ledger,loadReserved,generate});
  assert.equal(replay.state,'already_reserved_or_finished');assert.equal(generated,1);
  const wallet=(await db.query('select balance,reserved from credit_balances where user_id=$1',[owner])).rows[0];
  assert.equal(wallet.balance,70);assert.equal(wallet.reserved,0);
  const delivered=(await db.query('select * from production_requests where id=$1',[productionId])).rows[0];
  assert.equal(delivered.status,'ready');assert.equal(delivered.delivery_zip_url,'/api/productions/'+productionId+'/delivery?file=zip');
  assert.equal(delivered.output_json.websiteAssistant.phase,'ready');
  assert.equal(delivered.output_json.websiteFiles.length,2);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  // The minimal branch does not yet contain Studio V2's separate preview API.
  // Assert its existing delivery route uses the settled-ledger proof.
  const deliverySource=fs.readFileSync('src/app/api/productions/[id]/delivery/route.ts','utf8');
  assert.match(deliverySource,/websiteCreditDeliveryProof\\(data,\\s*proof\\.data\\)/);
  const {websiteCreditDeliveryProof}=load('src/lib/assistant-work/website-paid-delivery.ts');
  const reservation=(await db.query('select state,credits from website_credit_reservations where production_id=$1',[productionId])).rows[0];
  assert.equal(websiteCreditDeliveryProof(delivered,reservation),true);
  console.log('website-atomic-flow-smoke ok: isolated owner-scoped approved brief -> atomic reserve -> one claim -> persisted files -> one spend -> verified preview and delivery links. No real provider, multi-session DB or browser payment.');
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
