// Offline PostgreSQL regression for Website production-credit holds. Never connects to Supabase.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
(async () => {
 const db = new PGlite();
 const owner='00000000-0000-0000-0000-000000000001';
 const stranger='00000000-0000-0000-0000-000000000002';
 const hash='a'.repeat(64);
 try {
  const schema=fs.readFileSync('supabase/schema.sql','utf8');
  const table=name=>{const match=schema.match(new RegExp('create table '+name+' \\([^]*?\\n\\);'));assert(match,'missing '+name);return match[0];};
  await db.exec(`create role anon;create role authenticated;create role service_role;
   create schema auth;create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql as $body$ select null::uuid $body$;
   create schema storage; create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text);
   create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
   ${table('profiles')} ${table('credit_balances')} ${table('credit_events')}`);
  const production=fs.readFileSync('supabase/migration_production_requests.sql','utf8');
  await db.exec(production.slice(0,production.indexOf('create table if not exists legal_acceptances')));
  await db.exec(fs.readFileSync('supabase/migration_credit_rollover_policy.sql','utf8'));
  await db.exec(fs.readFileSync('supabase/migration_website_atomic_credits_draft.sql','utf8'));
  for(const id of [owner,stranger]){await db.query('insert into auth.users(id) values($1)',[id]);await db.query('insert into profiles(id,email) values($1,$2)',[id,id+'@offline.test']);}
  await db.query('insert into credit_balances(user_id,balance,rolled_over_credits,current_subscription_credits,bonus_credits,topup_credits) values ($1,100,10,20,30,40)',[owner]);
  const call=async(name,args)=>(await db.query('select public.'+name+'('+args.map((_,i)=>'$'+(i+1)).join(',')+') as value',args)).rows[0].value;
  const wallet=async()=>(await db.query('select balance,reserved,rolled_over_credits,current_subscription_credits,bonus_credits,topup_credits from credit_balances where user_id=$1',[owner])).rows[0];
  async function make(credits) {
   const state={phase:'approved',approvedHash:hash,planHash:hash,credits,brief:{brand:'Offline'}};
   const {rows}=await db.query(`insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,reserved_credits,input_json,output_json)
    values($1,'website','landing_page','Offline test','Offline','pending','pending',$2,0,'{}'::jsonb,$3::jsonb) returning id`,[owner,credits,JSON.stringify({websiteAssistant:state})]);
   return rows[0].id;
  }
  async function generated(id,files=true){await db.query(`update production_requests set generation_status='completed',
   output_json=jsonb_set(jsonb_set(output_json,'{websiteAssistant,phase}','"awaiting_payment"'::jsonb),'{websiteFiles}',$2::jsonb) where id=$1`,
   [id,JSON.stringify(files?[{path:'index.html',content:'<html>Offline</html>'}]:[])]);}
  const first=await make(60);
  await assert.rejects(call('website_credit_reserve',[stranger,first,hash,60]),/website_project_not_found/);
  await assert.rejects(call('website_credit_reserve',[owner,first,'b'.repeat(64),60]),/approved_website_plan_required/);
  assert.equal((await wallet()).reserved,0);
  assert.equal((await call('website_credit_reserve',[owner,first,hash,60])).fresh,true);
  assert.equal((await call('website_credit_reserve',[owner,first,hash,60])).fresh,false);
  assert.equal((await wallet()).reserved,60);
  assert.equal((await db.query('select output_json->\'websiteAssistant\'->>\'phase\' as phase from production_requests where id=$1',[first])).rows[0].phase,'reserved');

  await assert.rejects(call('website_credit_reserve',[owner,first,hash,61]),/website_reservation_conflict/);
  await assert.rejects(call('website_credit_finalize',[owner,first,hash,'ready']),/website_delivery_and_approval_required/);
  await generated(first,false);
  await assert.rejects(call('website_credit_finalize',[owner,first,hash,'ready']),/website_delivery_and_approval_required/);
  await generated(first,true);
  const before=await wallet();
  await db.exec(`create function offline_reject_website_spend() returns trigger language plpgsql as $$begin raise exception 'offline_late_event_failure';end$$;
   create trigger offline_website_failure before insert on credit_events for each row when (new.type='spend') execute function offline_reject_website_spend();`);
  await assert.rejects(call('website_credit_finalize',[owner,first,hash,'ready']),/offline_late_event_failure/);
  assert.deepEqual(await wallet(),before,'all wallet and production writes must roll back');
  await db.exec('drop trigger offline_website_failure on credit_events;');
  assert.equal((await call('website_credit_finalize',[owner,first,hash,'ready'])).state,'settled');
  assert.equal((await call('website_credit_finalize',[owner,first,hash,'ready'])).idempotent,true);
  assert.deepEqual(await wallet(),{balance:40,reserved:0,rolled_over_credits:0,current_subscription_credits:0,bonus_credits:0,topup_credits:40});
  await assert.rejects(call('website_credit_finalize',[owner,first,hash,'failed']),/website_already_finalized/);
  const second=await make(15);
  await call('website_credit_reserve',[owner,second,hash,15]);
  assert.equal((await wallet()).reserved,15);
  await assert.rejects(call('website_credit_finalize',[owner,second,hash,'failed']),/website_confirmed_failure_required/);
  await db.query(`update production_requests set generation_status='failed',output_json=jsonb_set(output_json,'{websiteAssistant,phase}','"generation_failed"'::jsonb) where id=$1`,[second]);
  assert.equal((await call('website_credit_finalize',[owner,second,hash,'failed'])).state,'released');
  assert.equal((await wallet()).reserved,0);
  const third=await make(10);
  await call('website_credit_reserve',[owner,third,hash,10]);
  await generated(third,true);
  await db.query('update credit_balances set last_rollover_at=now() where user_id=$1',[owner]);
  assert.equal((await call('website_credit_finalize',[owner,third,hash,'ready'])).reason,'credit_period_changed');
  assert.equal((await wallet()).reserved,10);
  assert.equal((await db.query('select state from website_credit_reservations where production_id=$1',[third])).rows[0].state,'reconcile_required');
  const fourth=await make(50);
  await assert.rejects(call('website_credit_reserve',[owner,fourth,hash,50]),/insufficient_production_credits/);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  console.log('website-atomic-db-regression ok (offline PGlite; single connection only; NOT a concurrency or production authorization)');
 } finally {await db.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
