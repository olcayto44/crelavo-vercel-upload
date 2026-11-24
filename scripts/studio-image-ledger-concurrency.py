"""Disposable CI-only PostgreSQL concurrency checks. No provider, customer or live DB."""
import os, re, subprocess, json, uuid, hashlib, base64, struct, zlib
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from pathlib import Path

assert os.environ.get("STUDIO_LEDGER_DISPOSABLE_CI") == "true"
assert os.environ.get("PGHOST") == "127.0.0.1"
assert os.environ.get("PGDATABASE") == os.environ.get("PGUSER") == "studio_test"
assert os.environ.get("PGPASSWORD") == "disposable-ci-only"

def sql(stmt, service=False):
    if service:
        stmt = "set role service_role;\n" + stmt
    result = subprocess.run(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1"],
                            input=stmt, text=True, capture_output=True, timeout=20)
    if result.returncode:
        raise RuntimeError(result.stderr)
    return [line for line in result.stdout.splitlines() if line.strip()]

def literal(s):
    return "'" + str(s).replace("'", "''") + "'"

def one(stmt, service=False):
    rows = sql(stmt, service)
    assert len(rows) == 1, rows
    return rows[0]

def race(*statements):
    barrier = Barrier(len(statements))
    def run(stmt):
        barrier.wait(timeout=5)
        # The winning transaction retains its row lock briefly, forcing real overlap.
        return sql("begin;\n" + stmt + ";\nselect pg_sleep(0.25);\ncommit;", True)[0]
    with ThreadPoolExecutor(max_workers=len(statements)) as pool:
        return list(pool.map(run, statements))

def plan(owner, credits=70, project=None):
    project = project or str(uuid.uuid4())
    request = str(uuid.uuid4())
    p = dict(requestId=request,userId=owner,projectId=project,categoryId="image",operation="image_generate",
             provider="minimax",model="image-01",request=dict(prompt="CI fixture",aspect="1:1"),
             tariffVersion="ci",reservedCredits=credits,maximumProviderMicroUSD=10000)
    digest = hashlib.sha256(json.dumps(p,separators=(",",":")).encode()).hexdigest()
    sql("insert into production_requests values ("+literal(project)+","+literal(owner)+",'image') on conflict do nothing;")
    sql("insert into studio_image_operations(request_id,user_id,project_id,plan_hash,plan,tariff_version,credits,max_micro_usd,approved_at) values ("+
        ",".join([literal(request),literal(owner),literal(project),literal(digest),literal(json.dumps(p))+"::jsonb","'ci'",str(credits),"10000","now()"])+");")
    args=",".join([literal(owner),literal(request),literal(digest),literal(json.dumps(p))+"::jsonb"])
    return request,args

def call(fn,args,extra=""):
    return "select public.studio_image_"+fn+"("+args+extra+")"

def wallet(owner):
    return one("select balance||':'||reserved from credit_balances where user_id="+literal(owner)+";")

def events(owner,kind):
    return int(one("select count(*) from credit_events where user_id="+literal(owner)+" and type="+literal(kind)+";"))

def user():
    owner=str(uuid.uuid4())
    sql("insert into auth.users values("+literal(owner)+");insert into profiles(id,email) values("+literal(owner)+",'fixture@example.test');insert into credit_balances(user_id,balance,current_subscription_credits) values("+literal(owner)+",100,100);")
    return owner

def png():
    def chunk(name,data):
        return struct.pack(">I",len(data))+name+data+struct.pack(">I",zlib.crc32(name+data)&0xffffffff)
    return b"\x89PNG\r\n\x1a\n"+chunk(b"IHDR",struct.pack(">IIBBBBB",1024,1024,8,2,0,0,0))+chunk(b"IDAT",zlib.compress((b"\x00"+b"\x20\x40\x60"*1024)*1024))+chunk(b"IEND",b"")

def record(request,args):
    b=png()
    receipt=dict(provider="minimax",model="image-01",providerRequestId="ci_"+request.replace("-",""),imageCount=1,
                 sha256=hashlib.sha256(b).hexdigest(),width=1024,height=1024,mime="image/png",costState="pending_reconciliation")
    assert one(call("record",args,","+literal(json.dumps(receipt))+"::jsonb,"+literal(base64.b64encode(b).decode()))+";",True)=="t"
    sql("insert into studio_image_cost_evidence(request_id,provider_request_id,evidence_ref,actual_micro_usd,source) values("+literal(request)+","+literal(receipt["providerRequestId"])+","+literal("invoice_"+request)+",5000,'reviewed_provider_invoice');")

schema=Path("supabase/schema.sql").read_text()
tables="".join(re.search(r"create table "+name+r" \([\s\S]*?\n\);",schema).group(0) for name in ("profiles","credit_balances","credit_events"))
sql("create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create type credit_event_type as enum ('purchase','reserve','spend','refund','adjustment');"+tables+"create table production_requests(id uuid primary key,user_id uuid references profiles(id),production_type text);grant select on profiles,production_requests to service_role;grant select,insert,update on credit_balances to service_role;grant select,insert on credit_events to service_role;")
sql(Path("docs/studio-image-production-ledger-isolated.sql").read_text())
sql("insert into studio_image_tariffs values('ci',70,10000,true);")

owner=user()
request,args=plan(owner)
assert sorted(race(call("reserve",args),call("reserve",args)))==["already_reserved_or_finished","reserved"]
assert wallet(owner)=="100:70" and events(owner,"reserve")==1
assert sorted(race(call("claim",args),call("claim",args)))==["already_claimed","claimed"]
record(request,args)
settle=call("finalize",args,", 'settle'")
assert sorted(race(settle,settle))==["already_settled","settled"]
assert wallet(owner)=="30:0" and events(owner,"spend")==1
print("PASS same request: two sessions, one reserve, one claim, one spend",flush=True)

owner=user()
_,a=plan(owner);_,b=plan(owner)
assert sorted(race(call("reserve",a),call("reserve",b)))==["denied","reserved"]
assert wallet(owner)=="100:70" and events(owner,"reserve")==1
print("PASS two projects: wallet lock prevents overspending",flush=True)

owner=user()
_,args=plan(owner)
assert one(call("reserve",args)+";",True)=="reserved"
res=race(call("claim",args),call("finalize",args,", 'release_unclaimed'"))
assert res in (["claimed","denied"],["denied","released"]),res
assert wallet(owner)==("100:70" if res[0]=="claimed" else "100:0")
assert events(owner,"refund")==(0 if res[0]=="claimed" else 1)
print("PASS claim versus cancellation: only one transition wins",flush=True)

owner=user()
request,args=plan(owner)
assert one(call("reserve",args)+";",True)=="reserved"
assert one(call("claim",args)+";",True)=="claimed"
record(request,args)
sql("update credit_balances set last_rollover_at=now() where user_id="+literal(owner)+";")
assert one(call("finalize",args,", 'settle'")+";",True)=="reconcile_required"
assert wallet(owner)=="100:70" and events(owner,"spend")==0
print("PASS changed billing period: no debit, reservation held",flush=True)

# Active Whop payment path: synthetic verified payment inputs, no network calls.
sql(Path("docs/studio-whop-credit-commit-isolated.sql").read_text())

def snapshot(owner):
    return one("select to_jsonb(w)::text from credit_balances w where user_id="+literal(owner)+";")

def whop(owner,payment,expected,update,credits=50):
    return "select public.studio_whop_commit_credits("+",".join([
        literal(owner),literal(payment),str(credits),
        "null" if expected is None else literal(expected)+"::jsonb",
        literal(json.dumps(update))+"::jsonb",literal("whop:payment:"+payment+" | package=fixture")
    ])+")"

owner=user()
payment="ci_whop_duplicate"
expected=snapshot(owner)
update=dict(balance=150,reserved=0,topup_credits=50)
stmt=whop(owner,payment,expected,update)
assert sorted(race(stmt,stmt))==["already_processed","credited"]
assert wallet(owner)=="150:0" and events(owner,"purchase")==1
other=user()
assert one(whop(other,payment,snapshot(other),update)+";",True)=="payment_conflict"
assert wallet(other)=="100:0"
print("PASS Whop webhook vs checkout: one payment, one purchase, cross-owner conflict blocked",flush=True)

owner=user()
expected=snapshot(owner)
_,args=plan(owner)
assert one(call("reserve",args)+";",True)=="reserved"
assert one(whop(owner,"ci_whop_stale",expected,update)+";",True)=="wallet_changed"
assert wallet(owner)=="100:70" and events(owner,"purchase")==0
# Existing top-up policy changes expiry, so an active reservation requires review.
period_update=dict(balance=150,reserved=70,topup_credits=50,topup_expires_at="2030-01-01T00:00:00Z")
assert one(whop(owner,"ci_whop_stale",snapshot(owner),period_update)+";",True)=="reconcile_required"
assert wallet(owner)=="100:70" and events(owner,"purchase")==0
assert one(call("finalize",args,", 'release_unclaimed'")+";",True)=="released"
period_update["reserved"]=0
assert one(whop(owner,"ci_whop_stale",snapshot(owner),period_update)+";",True)=="credited"
assert wallet(owner)=="150:0" and events(owner,"purchase")==1
print("PASS Whop stale snapshot and expiry change cannot overwrite active production reservation",flush=True)

owner=user()
sql("insert into credit_events(user_id,type,amount,note) values("+literal(owner)+",'purchase',50,'whop:payment:ci_whop_legacy | package=fixture');")
assert one(whop(owner,"ci_whop_legacy",snapshot(owner),update)+";",True)=="already_processed"
assert wallet(owner)=="100:0" and events(owner,"purchase")==1
# Different key with same prefix is not a duplicate.
assert one(whop(owner,"ci_whop_legacy_extra",snapshot(owner),update)+";",True)=="credited"
assert wallet(owner)=="150:0"
print("PASS exact legacy Whop payment key; prefix collision does not block a distinct purchase",flush=True)

owner=str(uuid.uuid4())
sql("insert into auth.users values("+literal(owner)+");insert into profiles(id,email) values("+literal(owner)+",'fresh@example.test');")
assert one(whop(owner,"ci_whop_fresh",None,dict(balance=50,reserved=0,topup_credits=50))+";",True)=="credited"
assert wallet(owner)=="50:0" and events(owner,"purchase")==1
print("PASS initial wallet creation and payment credit in one transaction",flush=True)
