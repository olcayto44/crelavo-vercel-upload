// Disposable in-memory PostgreSQL (PGlite). No network or live credentials.
// PGlite serializes queries: this does not prove multi-session lock scheduling.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { PGlite } = require("@electric-sql/pglite");
(async () => {
 const db = new PGlite();
 try {
  const schema = fs.readFileSync("supabase/schema.sql", "utf8");
  const table = name => {
   const match = schema.match(new RegExp("create table " + name + " \\([^]*?\\n\\);"));
   assert(match); return match[0];
  };
  await db.exec(`create role anon; create role authenticated; create role service_role;
   create schema auth; create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql as $$ select null::uuid $$;
   create schema storage; create table storage.objects(id uuid primary key, bucket_id text, name text, owner_id text);
   create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
   ${table('profiles')} ${table('credit_balances')} ${table('credit_events')}`);
  const production = fs.readFileSync("supabase/migration_production_requests.sql", "utf8");
  await db.exec(production.slice(0, production.indexOf("create table if not exists legal_acceptances")));
  await db.exec(fs.readFileSync("supabase/migration_credit_rollover_policy.sql", "utf8"));
  await db.exec(fs.readFileSync("supabase/migration_assistant_atomic_production.sql", "utf8"));
  const owner = "00000000-0000-0000-0000-000000000001";
  await db.query("insert into auth.users values ($1);", [owner]);
  await db.query("insert into profiles(id,email) values ($1,'offline@example.test')", [owner]);
  await db.query("insert into credit_balances(user_id,balance,rolled_over_credits,current_subscription_credits,bonus_credits,topup_credits) values ($1,100,10,20,30,40)", [owner]);
  async function call(name, args) {
   return (await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as value`, args)).rows[0].value;
  }
  async function wallet() { return (await db.query("select balance,reserved,rolled_over_credits,current_subscription_credits,bonus_credits,topup_credits from credit_balances where user_id=$1",[owner])).rows[0]; }
  async function start(scope, amount) {
   const seq = await call('reserve_assistant_revision_seq', [owner,scope]);
   const signature = 'a'.repeat(64);
   const payload = {userId:owner,scope,revisionSeq:Number(seq),category:'video',credits:amount,input:{},plan:{reply:'Offline',visualDirection:'Offline'}};
   const draft = await call('create_assistant_plan_draft',[owner,scope,seq,JSON.stringify(payload),signature]);
   await assert.rejects(call('begin_assistant_production',[owner,draft.id,signature]), /approved_current_plan_required/);
   await call('approve_assistant_plan_version',[owner,draft.id,signature]);
   const begun = await call('begin_assistant_production',[owner,draft.id,signature]);
   assert(begun.fresh);
   const replay = await call('begin_assistant_production',[owner,draft.id,signature]);
   assert.equal(replay.fresh,false); assert.equal(replay.productionId,begun.productionId);
   const step = await call('start_assistant_provider_step',[owner,begun.productionId,1,begun.workerLease,'offline']);
   await call('record_assistant_provider_step',[owner,begun.productionId,1,begun.workerLease,step,'accepted']);
   return {...begun,step,draft,signature};
  }
  async function finish(job,status,output={media:{url:'https://offline.example/output.mp4'}}) {
   return call('finalize_assistant_production',[owner,job.productionId,1,job.workerLease,job.step,status,JSON.stringify(output),false]);
  }
  const first = await start('video:1',60);
  assert.equal((await wallet()).reserved,60);
  const before = await wallet();
  await assert.rejects(call('finalize_assistant_production',[owner,first.productionId,2,first.workerLease,first.step,'ready','{}',false]),/finalizer_fenced/);
  assert.deepEqual(await wallet(),before);
  // Force a late error AFTER wallet, production and lock updates; all must roll back.
  await db.exec(`create function offline_reject_event() returns trigger language plpgsql as $$ begin raise exception 'offline_event_failure'; end $$;
    create trigger offline_fail before insert on credit_events for each row when (new.type='spend') execute function offline_reject_event();`);
  await assert.rejects(finish(first,'ready'), /offline_event_failure/);
  assert.deepEqual(await wallet(),before);
  assert.equal((await db.query('select finalized from assistant_production_locks where production_id=$1',[first.productionId])).rows[0].finalized,false);
  assert.equal((await db.query('select status from production_requests where id=$1',[first.productionId])).rows[0].status,'in_production');
  await db.exec('drop trigger offline_fail on credit_events;');
  assert.equal((await finish(first,'ready')).status,'ready');
  assert.deepEqual(await wallet(),{balance:40,reserved:0,rolled_over_credits:0,current_subscription_credits:0,bonus_credits:0,topup_credits:40});
  assert.equal((await finish(first,'ready')).idempotent,true);
  assert.equal((await db.query("select count(*)::int as n from credit_events where type='spend'")).rows[0].n,1);
  const second = await start('video:2',15);
  const held = await wallet();
  assert.equal((await finish(second,'failed',{providerTerminal:'failed'})).status,'failed');
  assert.deepEqual(await wallet(),{...held,reserved:0});
  // Two reservations, settle one without releasing the other's credits.
  const third = await start('video:3',10), fourth = await start('video:4',20);
  assert.equal((await wallet()).reserved,30);
  await finish(third,'ready');
  assert.equal((await wallet()).reserved,20); assert.equal((await wallet()).topup_credits,30);
  await finish(fourth,'failed',{providerTerminal:'failed'});
  assert.equal((await wallet()).reserved,0);
  const changed = await start('video:5',5);
  await db.query("update credit_balances set last_rollover_at=now() where user_id=$1",[owner]);
  const periodWallet=await wallet();
  assert.equal((await finish(changed,'ready')).reason,'credit_period_changed');
  assert.deepEqual(await wallet(),periodWallet);
  const stale = await call('reserve_assistant_revision_seq',[owner,'video:6']);
  const staleDraft = await call('create_assistant_plan_draft',[owner,'video:6',stale,JSON.stringify({userId:owner,scope:'video:6',revisionSeq:Number(stale)}),'b'.repeat(64)]);
  await call('reserve_assistant_revision_seq',[owner,'video:6']);
  await assert.rejects(call('approve_assistant_plan_version',[owner,staleDraft.id,'b'.repeat(64)]),/stale_or_invalid_plan/);
  console.log('assistant-atomic-db-regression ok: real PostgreSQL migration/RPC execution, ordered bucket accounting, reservations, idempotency, late-error rollback, generation fencing, refund and period preservation, stale approval. In-memory fixtures only; multi-session concurrency NOT tested.');
 } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
