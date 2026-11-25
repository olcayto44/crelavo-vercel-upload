"""Independent PostgreSQL sessions, disposable CI only. No external AI or payments."""
import os, re, subprocess, json, uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from pathlib import Path
assert os.environ.get("STUDIO_LEDGER_DISPOSABLE_CI") == "true"
assert os.environ.get("PGHOST") == "127.0.0.1"
assert os.environ.get("PGDATABASE") == os.environ.get("PGUSER") == "studio_test"
assert os.environ.get("PGPASSWORD") == "disposable-ci-only"

def sql(stmt, role=None):
    result=subprocess.run(["psql","-X","-qAt","-v","ON_ERROR_STOP=1"],
        input=("set role "+role+";\n" if role else "")+stmt,text=True,capture_output=True,timeout=25)
    if result.returncode: raise RuntimeError(result.stderr)
    return [x for x in result.stdout.splitlines() if x.strip()]
def one(stmt,role=None):
    rows=sql(stmt,role)
    assert len(rows)==1,rows
    return rows[0]
def lit(x): return "'"+str(x).replace("'","''")+"'"
def js(x): return lit(json.dumps(x))+"::jsonb"
def race(*statements):
    barrier=Barrier(len(statements))
    def run(stmt):
        barrier.wait(timeout=5)
        try:
            return sql("begin;\n"+stmt+";\nselect pg_sleep(0.25);\ncommit;","service_role")[0]
        except RuntimeError as e:
            if "insufficient_production_credits" in str(e): return "insufficient"
            raise
    with ThreadPoolExecutor(max_workers=len(statements)) as pool:
        return list(pool.map(run,statements))
schema=Path("supabase/schema.sql").read_text()
tables="".join(re.search(r"create table "+n+r" \([\s\S]*?\n\);",schema).group(0) for n in ("profiles","credit_balances","credit_events"))
sql("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql as 'select null::uuid';create schema storage;create table storage.objects(id uuid primary key,bucket_id text,name text,owner_id text);create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');"+tables)
p=Path("supabase/migration_production_requests.sql").read_text()
sql(p[:p.index("create table if not exists legal_acceptances")])
sql(Path("supabase/migration_credit_rollover_policy.sql").read_text())
sql(Path("supabase/migration_website_atomic_credits_isolated.sql").read_text())
sql(Path("docs/website-ai-jobs-isolated.sql").read_text())
H="a"*64; D="b"*64
def user(balance=1000):
    u=str(uuid.uuid4())
    sql("insert into auth.users values("+lit(u)+");insert into profiles(id,email) values("+lit(u)+","+lit(u+"@example.test")+");insert into credit_balances(user_id,balance,current_subscription_credits) values("+lit(u)+","+str(balance)+","+str(balance)+");")
    return u
def project(u):
    p=str(uuid.uuid4())
    approval=dict(planHash=H,policyVersion="ci",policyHash=D,credits=500,maximumMicroUSD=50000,source="persisted_explicit_user_approval")
    output=dict(websiteAssistant=dict(phase="approved",planHash=H,approvedHash=H,credits=500,packId="landing_page"),websiteAIApproval=approval)
    sql("insert into production_requests(id,user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,output_json) values("+",".join([lit(p),lit(u),"'website'","'landing_page'","'CI website'","'CI fixture'","'pending'","'pending'","500",js(output)])+");")
    return p
def identity(u,p): return ",".join(map(lit,[u,p,H]))
def args(u,p): return identity(u,p)+",'ci',"+lit(D)+",500,50000"
def call(fn,a): return "select public.website_ai_"+fn+"("+a+")"
def wallet(u): return one("select balance||':'||reserved from credit_balances where user_id="+lit(u))
def events(u,k): return int(one("select count(*) from credit_events where user_id="+lit(u)+" and type="+lit(k)))
def state(p): return one("select state from website_ai_jobs where production_id="+lit(p))
def record(u,p):
    receipt=dict(provider="openai",model="gpt-6.1-terra",policyVersion="ci",requestId="chatcmpl-"+p,copyHash="c"*64,estimatedMicroUSD=3000)
    artifact=dict(files=[dict(path="index.html",content="<!doctype html><html><body>CI only</body></html>")],websiteContent={},pageManifest=[])
    assert one(call("record",identity(u,p)+","+js(receipt)+","+js(artifact)),"service_role")=="t"
    return dict(source="reviewed_provider_usage",requestId=receipt["requestId"],actualMicroUSD=3000)
u=user(); p=project(u); a=args(u,p)
assert sorted(race(call("enqueue",a),call("enqueue",a)))==["already_enqueued","queued"]
assert wallet(u)=="1000:500" and events(u,"reserve")==1
assert sorted(race(call("claim",a),call("claim",a)))==["already_claimed","claimed"]
e=record(u,p)
assert sorted(race(call("finalize",identity(u,p)+","+js(e)),call("finalize",identity(u,p)+","+js(e))))==["already_settled","settled"]
assert wallet(u)=="500:0" and events(u,"spend")==1 and state(p)=="settled"
print("PASS duplicate enqueue, claim and finalize: one reserve and one spend",flush=True)
u=user(500); p=project(u); q=project(u)
assert sorted(race(call("enqueue",args(u,p)),call("enqueue",args(u,q))))==["insufficient","queued"]
assert wallet(u)=="500:500" and events(u,"reserve")==1
print("PASS competing projects: no wallet overspend",flush=True)
u=user(); p=project(u); a=args(u,p)
assert one(call("enqueue",a),"service_role")=="queued"
assert one(call("claim",a),"service_role")=="claimed"
e=record(u,p)
sql("update credit_balances set last_rollover_at=now() where user_id="+lit(u))
assert one(call("finalize",identity(u,p)+","+js(e)),"service_role")=="reconcile_required"
assert wallet(u)=="1000:500" and events(u,"spend")==0
print("PASS changed credit period: no charge, reservation retained",flush=True)
u=user(); p=project(u); other=user(); a=args(u,p)
assert one(call("enqueue",args(other,p)),"service_role")=="denied"
assert one(call("enqueue",a),"service_role")=="queued"
for stmt in ["select * from website_ai_jobs",call("claim",a)]:
    try: sql(stmt,"authenticated")
    except RuntimeError as e: assert "permission denied" in str(e)
    else: raise AssertionError("browser role obtained privileged AI job access")
assert one(call("claim",a),"service_role")=="claimed"
sql("update website_ai_jobs set updated_at=now()-interval '10 minutes' where production_id="+lit(p))
assert one("select public.website_ai_mark_stale(now()-interval '6 minutes')","service_role")=="1"
assert one(call("claim",a),"service_role")=="already_claimed"
assert wallet(u)=="1000:500" and events(u,"spend")==0 and state(p)=="reconcile_required"
print("PASS cross-owner and browser denial, interrupted job is not replayed",flush=True)
