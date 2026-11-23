'use strict';
// PostgreSQL 17 multi-session concurrency: every psql invocation is a separate
// network connection and transaction. Never connects to Crelavo/Supabase.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn,spawnSync}=require('node:child_process');
const URL=process.env.WEBSITE_TEST_PG_URL;
if(!URL||!/^(postgres|postgresql):\/\/website_test:/.test(URL)||!/127\.0\.0\.1(:5432)?\//.test(URL)){
  console.error('website-pg-concurrency: a localhost-only disposable PostgreSQL service is required');
  process.exit(1);
}
function sqlQuote(s){return "'"+String(s).replaceAll("'","''")+"'";}
function exec(sql){
 const r=spawnSync('psql',[URL,'-X','-q','-t','-A','-v','ON_ERROR_STOP=1'],{input:sql,encoding:'utf8',timeout:30000});
 if(r.status!==0)throw Error('pg setup/verification error: '+(r.stderr||r.error));
 return r.stdout.trim();
}
function separate(sql){
 return new Promise((resolve,reject)=>{
  const p=spawn('psql',[URL,'-X','-q','-t','-A','-v','ON_ERROR_STOP=1','-c',sql],{env:process.env});
  let stdout='',stderr='';p.stdout.on('data',d=>stdout+=d);p.stderr.on('data',d=>stderr+=d);
  p.on('error',reject);p.on('close',code=>code===0?resolve(stdout.trim()):reject(Error('independent PostgreSQL session: '+stderr.trim())));
 });
}
(async()=>{
 const schema=fs.readFileSync('supabase/schema.sql','utf8');
 const table=name=>{const m=schema.match(new RegExp('create table '+name+' \\([^]*?\\n\\);'));assert(m,'missing '+name);return m[0];};
 exec(`create role anon;create role authenticated;create role service_role;
 create schema auth;create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $fn$select null::uuid$fn$;
 create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text);
 create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
 ${table('profiles')} ${table('credit_balances')} ${table('credit_events')}`);
 const production=fs.readFileSync('supabase/migration_production_requests.sql','utf8');
 exec(production.slice(0,production.indexOf('create table if not exists legal_acceptances')));
 exec(fs.readFileSync('supabase/migration_credit_rollover_policy.sql','utf8'));
 exec(fs.readFileSync('supabase/migration_website_atomic_credits_isolated.sql','utf8'));
 const user='11111111-1111-4111-8111-111111111111',hash='a'.repeat(64),price=10;
 exec(`insert into auth.users(id) values('${user}');
 insert into profiles(id,email) values('${user}','offline@isolated.test');
 insert into credit_balances(user_id,balance,rolled_over_credits,current_subscription_credits,bonus_credits,topup_credits)
 values('${user}',100,10,20,30,40);`);
 const state=JSON.stringify({websiteAssistant:{phase:'approved',approvedHash:hash,planHash:hash,credits:price,brief:{brand:'Offline concurrent'}}});
 function newProject(){
  return exec(`insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,reserved_credits,input_json,output_json)
 values('${user}','website','landing_page','Concurrent','Offline','pending','pending',${price},0,'{}'::jsonb,${sqlQuote(state)}::jsonb) returning id;`).split('\n').find(line=>/^[0-9a-f-]{36}$/.test(line));
 }
 const id=newProject();assert(id,'missing project');
 const rpc=(name,id,...args)=>`select public.${name}('${user}'::uuid,'${id}'::uuid,'${hash}'${args.length?','+args.join(','):''});`;
 // At least 12 independent PostgreSQL sessions race for one reservation.
 const reserveResults=await Promise.all(Array.from({length:12},()=>separate(rpc('website_credit_reserve',id,price))));
 assert.equal(reserveResults.filter(v=>v.includes('"fresh": true')||v.includes('"fresh":true')).length,1,'exactly one fresh reservation');
 assert.equal(exec(`select reserved from credit_balances where user_id='${user}'`),'10','one hold after concurrent reserve');
 assert.equal(exec(`select count(*) from credit_events where type='reserve'`),'1','one reserve event');
 const claims=await Promise.all(Array.from({length:12},()=>separate(rpc('website_credit_claim',id))));
 assert.equal(claims.filter(v=>v==='t').length,1,'exactly one generation claim');
 assert.equal(claims.filter(v=>v==='f').length,11,'all other claims fenced');
 // One durable artifact, then concurrent finalization must spend exactly once.
 const result=JSON.stringify({files:[{path:'index.html',content:'<!doctype html><html><body>Concurrent safe</body></html>'}],pageManifest:[{path:'index.html'}],websiteContent:{}});
 exec(`select website_credit_record('${user}'::uuid,'${id}'::uuid,'${hash}','ready',${sqlQuote(result)}::jsonb);`);
 const settled=await Promise.all(Array.from({length:12},()=>separate(rpc('website_credit_finalize',id,"'ready'"))));
 assert.equal(settled.filter(v=>v.includes('"idempotent": false')||v.includes('"idempotent":false')||(!v.includes('"idempotent":')&&v.includes('"state": "settled"'))).length,1,'one settlement');
 assert.equal(exec(`select count(*) from credit_events where type='spend'`),'1','one spend event');
 assert.equal(exec(`select balance||':'||reserved from credit_balances where user_id='${user}'`),'90:0');
 assert.equal(exec(`select status from production_requests where id='${id}'`),'ready');
 // Different Website projects competing for a limited wallet cannot overspend.
 exec(`update credit_balances set balance=20,topup_credits=0,current_subscription_credits=0,rolled_over_credits=0,bonus_credits=20 where user_id='${user}';`);
 const projects=Array.from({length:6},()=>newProject());
 const burst=await Promise.allSettled(projects.map(p=>separate(rpc('website_credit_reserve',p,price))));
 const ok=burst.filter(x=>x.status==='fulfilled'),failed=burst.filter(x=>x.status==='rejected');
 assert.equal(ok.length,2,'only available credits may be held by two projects');
 assert.equal(failed.length,4,'other projects must fail instead of overdrawing');
 assert.equal(exec(`select balance||':'||reserved from credit_balances where user_id='${user}'`),'20:20');
 assert.equal(exec(`select count(*) from credit_events where type='reserve'`),'3','no duplicate reserve events');
 console.log('website-pg-concurrency ok: PostgreSQL 17 independent sessions, single claim, exactly-once settlement and constrained-wallet race; disposable localhost only');
})().catch(e=>{console.error(e);process.exitCode=1;});
