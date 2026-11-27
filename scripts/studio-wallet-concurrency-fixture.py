"""Disposable PostgreSQL fixture, never a production connection."""
import concurrent.futures
import json
import pathlib
import re
import subprocess
import threading
import uuid
import os
assert os.environ.get("PGHOST") == "127.0.0.1"
assert os.environ.get("PGDATABASE") == "crelavo_fixture"
assert os.environ.get("PGUSER") == "postgres"
root = pathlib.Path(__file__).resolve().parents[1]
def query(sql):
    p = subprocess.run(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1"], input=sql, text=True, capture_output=True, timeout=40)
    if p.returncode:
        raise RuntimeError(p.stderr[-3000:])
    return p.stdout.strip()
def result(sql):
    return json.loads(query(sql))
def pair(left,right):
    barrier=threading.Barrier(2)
    def run(sql):
        barrier.wait(timeout=10)
        return json.loads(query("begin; set local lock_timeout='10s'; "+sql+"; select pg_sleep(0.3); commit;").splitlines()[0])
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        a=pool.submit(run,left)
        b=pool.submit(run,right)
        return [a.result(),b.result()]
def user():
    u=str(uuid.uuid4())
    query(f"insert into auth.users(id,email) values('{u}','{u}@example.invalid'); insert into profiles(id,email) values('{u}','{u}@example.invalid'); insert into credit_balances(user_id,balance,reserved,topup_credits) values('{u}',100,0,100);")
    return u
def create(u,credits,fingerprint):
    payload=dict(user_id=u,production_type="image",package_id="image-basic",title="Fixture",prompt="Fixture",status="queued",generation_status="automation_queued",request_metadata=dict(requestFingerprint=fingerprint),input_json={},materials_json=[],estimated_credits=credits,reserved_credits=credits,output_json={},legal_acceptance_snapshot=dict(accepted=True))
    return "select studio_legacy_create('"+u+"','"+json.dumps(payload).replace("'","''")+"'::jsonb)"
def spend(u,amount,key):
    return f"select studio_wallet_spend('{u}',{amount},'{key}','fixture')"
def wallet(u):
    return result(f"select jsonb_build_object('balance',balance,'reserved',reserved,'topup',topup_credits,'holds',(select coalesce(sum(reserved_credits),0) from production_requests where user_id='{u}'),'reserve_events',(select count(*) from credit_events where user_id='{u}' and type='reserve'),'spend_events',(select count(*) from credit_events where user_id='{u}' and type='spend')) from credit_balances where user_id='{u}';")
def states(r):
    return sorted(x["state"] for x in r)
schema=(root/"supabase/schema.sql").read_text()
tables=[]
for name in ("profiles","credit_balances","credit_events","production_requests"):
    m=re.search(r"create table "+name+r" \([\s\S]*?\n\);",schema)
    assert m,name
    tables.append(m.group())
query("""create role anon; create role authenticated; create role service_role bypassrls;
create schema auth; create table auth.users(id uuid primary key,email text);
create schema storage; create table storage.buckets(id text primary key,name text,public boolean);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,metadata jsonb);
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;
grant select on storage.objects to anon,authenticated;
create policy fixture_broad_read on storage.objects for select to anon,authenticated using(true);
create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');
"""+"\n".join(tables))
query((root/"supabase/migration_studio_legacy_atomic_create.sql").read_text())
print(query((root/"supabase/tests/studio_legacy_atomic_create.sql").read_text()),flush=True)
for _ in range(8):
    u=user()
    r=pair(create(u,60,"reserve-race"),spend(u,60,"fixture-reserve-race"))
    assert sum(x["state"]=="insufficient" for x in r)==1,r
    assert sum(x["state"] in ("created","spent") for x in r)==1,r
    w=wallet(u);assert w["balance"]>=w["reserved"]==w["holds"] and w["balance"]==w["topup"],w
    assert w["balance"]-w["reserved"]==40,w
    u=user()
    r=pair(create(u,40,"same-production"),create(u,40,"same-production"))
    assert states(r)==["created","existing"],r
    assert r[0]["production"]["id"]==r[1]["production"]["id"],r
    w=wallet(u);assert w["reserved"]==40 and w["reserve_events"]==1,w
    job=r[0]["production"]["id"]
    query(f"update production_requests set created_at=now()-interval '25 hours' where id='{job}';")
    r=pair(f"select studio_legacy_cancel_unstarted('{u}','{job}')",f"select studio_legacy_expire_unstarted('{job}')")
    assert sum(x["state"] in ("cancelled","expired") for x in r)==1,r
    w=wallet(u);assert w["reserved"]==w["holds"]==0 and w["balance"]==w["topup"] and w["balance"] in (80,100),w
    u=user()
    r=pair(spend(u,30,"fixture-duplicate"),spend(u,30,"fixture-duplicate"))
    assert states(r)==["already_spent","spent"],r
    w=wallet(u);assert w["balance"]==w["topup"]==70 and w["spend_events"]==1,w
print("PASS: 32 concurrent two-session races across 8 rounds",flush=True)
