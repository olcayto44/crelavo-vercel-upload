// Disposable PostgreSQL only; no production connection. PGlite is serial, not a multi-session concurrency proof.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');const {load}=require('./studio-agent-test-loader.cjs');
(async()=>{
 const db=new PGlite();let tests=0;const test=async(name,fn)=>{await fn();tests++;console.log('GEÇTİ: '+name)};
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema auth;create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table profiles(id uuid primary key,email text);create table assistant_credit_balances(user_id uuid primary key references profiles(id),balance integer not null,updated_at timestamptz default now());
   create table credit_balances(user_id uuid primary key references profiles(id),balance integer not null,reserved integer not null default 0);
   create table production_requests(id uuid primary key,user_id uuid references profiles(id),title text,production_type text,output_json jsonb);
   insert into profiles values('00000000-0000-4000-8000-000000000001','owner@test.invalid'),('00000000-0000-4000-8000-000000000002','other@test.invalid');
   insert into assistant_credit_balances(user_id,balance) select id,1000 from profiles;insert into credit_balances(user_id,balance,reserved) select id,500,10 from profiles;`);
  await db.exec(fs.readFileSync('supabase/migration_studio_agent_b2.sql','utf8'));
  const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
  const call=async(name,args)=>(await db.query('select public.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') as value',args.map(v=>v&&typeof v==='object'?JSON.stringify(v):v))).rows[0].value;
  const project=await call('studio_agent_create_project',[owner,'website','Demo Dijital',null,{},[]]);
  const otherProject=await call('studio_agent_create_project',[other,'website','Başka proje',null,{},[]]);
  const videoProject=await call('studio_agent_create_project',[owner,'video','Video',null,{},[]]);
  const wallets=()=>call('studio_agent_wallets',[owner]);const productionBefore=(await wallets()).production;
  const request='10000000-0000-4000-8000-000000000001',hash='a'.repeat(64);
  await test('Eski iki bakiye korunuyor; grant veya Production tahsilatı yok',async()=>{assert.deepEqual((await wallets()).assistant,{balance:1000,reserved:0,available:1000});assert.deepEqual(productionBefore,{balance:500,reserved:10,available:490});});
  await test('Proje, kullanıcı ve kategori izolasyonu SQL seviyesinde uygulanıyor',async()=>{
   await assert.rejects(call('studio_agent_reserve',[other,project,'website',request,hash,20,'test-v1','Merhaba',0]),/project_not_found/);
   await assert.rejects(call('studio_agent_reserve',[owner,project,'video',request,hash,20,'test-v1','Merhaba',0]),/project_not_found/);
   await assert.rejects(call('studio_agent_create_project',[owner,'unknown','Test',null,{},[]]));
  });
  await test('Atomik rezerv ve idempotency; aynı request farklı payload reddediliyor',async()=>{
   assert.equal((await call('studio_agent_reserve',[owner,project,'website',request,hash,20,'test-v1','Merhaba',0])).state,'fresh');
   assert.equal((await wallets()).assistant.reserved,20);
   assert.equal((await call('studio_agent_reserve',[owner,project,'website',request,hash,99,'new-tariff','Merhaba',0])).state,'pending');
   await assert.rejects(call('studio_agent_reserve',[owner,project,'website',request,'b'.repeat(64),20,'test-v1','Changed',0]),/payload_conflict/);
   assert.equal((await wallets()).assistant.reserved,20);
  });
  await test('Bekleyen projeye ikinci istek ve düşük Assistant bakiye reddediliyor',async()=>{
   await assert.rejects(call('studio_agent_reserve',[owner,project,'website','10000000-0000-4000-8000-000000000002',hash,10,'v1','Yeni',0]),/project_request_pending/);
   await assert.rejects(call('studio_agent_reserve',[owner,videoProject,'video','10000000-0000-4000-8000-000000000003',hash,2000,'v1','Video',0]),/insufficient_assistant_credits/);
  });
  await test('Dispatch yalnızca bir kez claim ediliyor',async()=>{assert.equal(await call('studio_agent_claim',[owner,request]),true);assert.equal(await call('studio_agent_claim',[owner,request]),false);});
  const result={project:{id:project,userId:owner,categoryId:'website',title:'Demo Dijital',productionId:null,snapshot:{categoryId:'website',revision:1,fields:{brief:'Merhaba'}},messages:[{role:'user',content:'Merhaba'},{role:'assistant',content:'Nasıl yardımcı olayım?'}]},reply:'Nasıl yardımcı olayım?',blockedTools:[],nextQuestion:null};
  await test('Sonuç sahipliği ve rezerv üstü tahsilat reddediliyor',async()=>{
   await assert.rejects(call('studio_agent_record',[owner,request,{...result,project:{...result.project,userId:other}},{},4]),/invalid_provider_result/);
   await assert.rejects(call('studio_agent_record',[owner,request,{}, {},4]),/invalid_provider_result/);
   await assert.rejects(call('studio_agent_record',[owner,request,result,{},21]),/invalid_provider_result/);
   await call('studio_agent_record',[owner,request,result,{inputTokens:100,outputTokens:50},4]);
  });
  await test('Ledger yazımı geç hata verirse bakiye/hafıza/istek atomik geri dönüyor',async()=>{
   await db.exec(`create function offline_fail() returns trigger language plpgsql as $$begin raise exception 'offline_ledger_failure';end$$;create trigger offline_fail before insert on studio_agent_credit_ledger for each row when(new.event='settle') execute function offline_fail();`);
   const before=await wallets();await assert.rejects(call('studio_agent_settle',[owner,request,'real']),/offline_ledger_failure/);assert.deepEqual(await wallets(),before);
   assert.equal((await db.query('select count(*)::int n from studio_agent_messages where project_id=$1',[project])).rows[0].n,0);
   assert.equal((await db.query('select state from studio_agent_usage_requests where request_id=$1',[request])).rows[0].state,'result_ready');
   await db.exec('drop trigger offline_fail on studio_agent_credit_ledger;');
  });
  await test('Atomik settlement tek Assistant tahsilatı ve kalıcı konuşma kaydı üretiyor',async()=>{
   const first=await call('studio_agent_settle',[owner,request,'real']);assert.equal(first.chargedCredits,4);assert.equal(first.chargedAccount,'assistant');
   assert.deepEqual((await wallets()).assistant,{balance:996,reserved:0,available:996});assert.deepEqual((await wallets()).production,productionBefore);
   assert.deepEqual(await call('studio_agent_settle',[owner,request,'real']),first);
   assert.equal((await db.query("select count(*)::int n from studio_agent_credit_ledger where event='settle'")).rows[0].n,1);
   assert.equal((await db.query('select count(*)::int n from studio_agent_messages where project_id=$1',[project])).rows[0].n,2);
  });
  await test('Bilinmeyen sağlayıcı sonucu rezervi tutuyor; otomatik refund veya redispatch yok',async()=>{
   const id='10000000-0000-4000-8000-000000000004';await call('studio_agent_reserve',[owner,videoProject,'video',id,hash,10,'v1','Video',0]);await call('studio_agent_claim',[owner,id]);await call('studio_agent_uncertain',[owner,id]);
   await assert.rejects(call('studio_agent_release',[owner,id]),/uncertain_request_cannot_release/);assert.equal(await call('studio_agent_claim',[owner,id]),false);assert.equal((await wallets()).assistant.reserved,10);
  });
  await test('Kesin reddedilen istek yalnız kendi rezervini bir kez serbest bırakıyor',async()=>{
   const id='10000000-0000-4000-8000-000000000005';await call('studio_agent_reserve',[other,otherProject,'website',id,hash,15,'v1','Test',0]);await call('studio_agent_claim',[other,id]);await call('studio_agent_release',[other,id]);await call('studio_agent_release',[other,id]);
   assert.deepEqual((await call('studio_agent_wallets',[other])).assistant,{balance:1000,reserved:0,available:1000});
  });
  await test('Authenticated/anon RPC tahsilatı yok; RLS yalnız kendi projelerini gösteriyor',async()=>{
   assert.equal((await db.query("select has_function_privilege('authenticated','studio_agent_settle(uuid,uuid,text)','execute') allowed")).rows[0].allowed,false);
   assert.equal((await db.query("select has_function_privilege('anon','studio_agent_wallets(uuid)','execute') allowed")).rows[0].allowed,false);
   await db.exec(`set role authenticated;set request.jwt.claim.sub='${other}';`);
   const rows=await db.query('select user_id from studio_agent_projects');assert.equal(rows.rows.length,1);assert.equal(rows.rows[0].user_id,other);
   await assert.rejects(db.query("select studio_agent_settle($1,$2,'real')",[other,request]),/permission denied/);await db.exec('reset role;');
  });
  await test('Gerçek repository adapterı ve konuşma motoru izole PostgreSQL üzerinde birlikte çalışıyor',async()=>{
   const fakeDB={
    rpc:async(name,args)=>{try{return{data:await call(name,Object.values(args)),error:null}}catch(error){return{data:null,error:{message:error.message}}}},
    from(table){
     assert(['studio_agent_projects','studio_agent_messages'].includes(table));let columns='*',filters=[],order='',limit=50;
     const run=async()=>{const rows=await db.query('select '+columns+' from '+table+(filters.length?' where '+filters.map(([key],i)=>key+'=$'+(i+1)).join(' and '):'')+order+' limit '+limit,filters.map(([,value])=>value));return{data:rows.rows,error:null}};
     return{select(value){columns=value;return this},eq(key,value){filters.push([key,value]);return this},order(key,{ascending}){order=' order by '+key+(ascending?' asc':' desc');return this},limit(value){limit=value;return this},async maybeSingle(){const result=await run();return{data:result.data[0]||null,error:null}},then(resolve,reject){return run().then(resolve,reject)}};
    },
   };
   const {createDatabaseConversationStore}=load('src/lib/studio-agent/conversation-store.ts');
   const {runConversation}=load('src/lib/studio-agent/conversation-engine.ts');
   const {createMockConversationProvider}=load('src/lib/studio-agent/mock-conversation.ts');
   const store=createDatabaseConversationStore(fakeDB);const restored=await store.load(owner,project,'website');
   assert.equal(restored.snapshot.fields.brief,'Merhaba');assert.equal(restored.messages.length,2);
   await assert.rejects(store.load(other,project,'website'),/project_not_found/);
   const input={userId:owner,projectId:project,categoryId:'website',requestId:'10000000-0000-4000-8000-000000000006',message:'Demo',uiLanguage:'tr',acceptedDefaults:[]};
   const deps={store,provider:createMockConversationProvider(),tariff:{version:'offline-v1',inputPer1K:1,outputPer1K:1},mode:'real'};
   const result=await runConversation(input,deps);assert.equal(result.chargedAccount,'assistant');assert.equal(result.chargedCredits,2);
   assert.deepEqual(await runConversation(input,deps),result);assert.equal((await store.load(owner,project,'website')).messages.length,4);
   assert.deepEqual((await wallets()).production,productionBefore);assert.equal((await wallets()).assistant.reserved,10);
  });
  console.log('B2 DB: '+tests+' test grubu geçti; gerçek SQL/RPC, izole PGlite. Çok oturumlu eşzamanlılık testi değildir.');
 }finally{await db.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
