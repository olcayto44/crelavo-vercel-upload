const assert=require("node:assert/strict");
const fs=require("node:fs");
const {PGlite}=require("@electric-sql/pglite");
(async()=>{
 const db=new PGlite();
 const user="11111111-1111-4111-8111-111111111111";
 const bad="22222222-2222-4222-8222-222222222222";
 try{
  const schema=fs.readFileSync("supabase/schema.sql","utf8");
  const table=name=>{const match=schema.match(new RegExp("create table "+name+" \\([^]*?\\n\\);"));assert(match);return match[0];};
  await db.exec(`create role anon;create role authenticated;create role service_role;
    create schema auth;create table auth.users(id uuid primary key);
    create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
    ${table("profiles")} ${table("credit_balances")} ${table("credit_events")}`);
  for(const id of [user,bad]){
   await db.query("insert into auth.users(id) values($1)",[id]);
   await db.query("insert into profiles(id,email) values($1,$2)",[id,id+"@example.test"]);
  }
  await db.query("insert into credit_balances(user_id,balance,reserved,bonus_credits,topup_credits) values($1,100,30,40,60),($2,100,0,90,0)",[user,bad]);
  await db.exec(fs.readFileSync("docs/studio-admin-wallet-atomic-candidate.sql","utf8"));
  const signature="public.studio_admin_adjust_bonus(uuid,integer,text)";
  for(const role of ["anon","authenticated","service_role"]){
   const {rows}=await db.query("select has_function_privilege($1,$2,'EXECUTE') as allowed",[role,signature]);
   assert.equal(rows[0].allowed,role==="service_role");
  }
  const call=(id,delta,note="test")=>db.query("select public.studio_admin_adjust_bonus($1,$2,$3) as result",[id,delta,note]);
  const wallet=async id=>(await db.query("select balance,reserved,bonus_credits,topup_credits from credit_balances where user_id=$1",[id])).rows[0];
  const events=async()=>Number((await db.query("select count(*) as n from credit_events")).rows[0].n);
  await call(user,10);assert.deepEqual(await wallet(user),{balance:110,reserved:30,bonus_credits:50,topup_credits:60});
  await call(user,-20);assert.deepEqual(await wallet(user),{balance:90,reserved:30,bonus_credits:30,topup_credits:60});
  await assert.rejects(call(user,-31),/insufficient_unreserved_bonus/);
  await assert.rejects(call(bad,10),/wallet_reconciliation_required/);
  await assert.rejects(call(user,0),/invalid_credit_adjustment/);
  await assert.rejects(call(user,10000001),/invalid_credit_adjustment/);
  assert.equal(await events(),2);
  await db.exec("alter table credit_events add constraint fixture_fail_event check(note <> 'force_event_failure')");
  await assert.rejects(call(user,5,"force_event_failure"),/fixture_fail_event/);
  assert.deepEqual(await wallet(user),{balance:90,reserved:30,bonus_credits:30,topup_credits:60});
  assert.equal(await events(),2);
  await db.query("update credit_balances set reserved=80 where user_id=$1",[user]);
  await assert.rejects(call(user,-11),/insufficient_unreserved_bonus/);
  assert.deepEqual(await wallet(user),{balance:90,reserved:80,bonus_credits:30,topup_credits:60});
  assert.equal(await events(),2);
  console.log("Atomic admin bonus candidate: privilege, bucket invariant, reservation, invalid input and rollback checks passed (embedded database only).");
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
