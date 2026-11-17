-- OFFLINE ONLY: requires schema.sql + production_requests + credit rollover migrations.
-- Do not apply to a live database without isolated transaction/concurrency tests.
begin;
create table public.assistant_revision_counters (
 user_id uuid not null references public.profiles(id), scope text not null,
 revision_seq bigint not null default 0, primary key(user_id,scope)
);
create table public.assistant_plan_versions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 scope text not null, revision_seq bigint not null, payload jsonb not null, signature text not null,
 approved_at timestamptz, created_at timestamptz not null default now(), unique(user_id,scope,revision_seq)
);
alter table public.production_requests add column if not exists task_generation bigint not null default 1;
alter table public.production_requests add column if not exists provider_job_id text;
create table public.assistant_production_locks (
 production_id uuid primary key references public.production_requests(id),
 plan_version_id uuid not null unique references public.assistant_plan_versions(id),
 user_id uuid not null references public.profiles(id), task_generation bigint not null,
 worker_lease uuid not null, lease_expires_at timestamptz not null, step_token uuid,
 steps jsonb not null default '[]'::jsonb, provider_state text not null default 'not_started',
 reserved_credits integer not null check(reserved_credits >= 0),
 credit_period jsonb not null, finalized boolean not null default false, terminal_status text,
 updated_at timestamptz not null default now()
);
alter table public.assistant_revision_counters enable row level security;
alter table public.assistant_plan_versions enable row level security;
alter table public.assistant_production_locks enable row level security;
revoke all on public.assistant_revision_counters, public.assistant_plan_versions, public.assistant_production_locks from public, anon, authenticated;
grant all on public.assistant_revision_counters, public.assistant_plan_versions, public.assistant_production_locks to service_role;

create or replace function public.reserve_assistant_revision_seq(p_user_id uuid,p_scope text) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare seq bigint;
begin
 if length(p_scope) not between 1 and 200 then raise exception 'invalid_scope'; end if;
 insert into assistant_revision_counters(user_id,scope,revision_seq) values(p_user_id,p_scope,1)
 on conflict(user_id,scope) do update set revision_seq=assistant_revision_counters.revision_seq+1
 returning revision_seq into seq;
 return seq;
end $$;
create or replace function public.create_assistant_plan_draft(p_user_id uuid,p_scope text,p_revision_seq bigint,p_payload jsonb,p_signature text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare counter bigint; plan assistant_plan_versions;
begin
 select revision_seq into strict counter from assistant_revision_counters where user_id=p_user_id and scope=p_scope for update;
 if p_payload is null or p_signature is null or p_revision_seq is null or counter is distinct from p_revision_seq or p_payload->>'userId' is distinct from p_user_id::text or (p_payload->>'revisionSeq')::bigint is distinct from p_revision_seq or p_payload->>'scope' is distinct from p_scope or p_signature !~ '^[a-f0-9]{64}$' then raise exception 'stale_or_invalid_plan'; end if;
 insert into assistant_plan_versions(user_id,scope,revision_seq,payload,signature) values(p_user_id,p_scope,p_revision_seq,p_payload,p_signature) returning * into plan;
 return jsonb_build_object('id',plan.id,'revisionSeq',plan.revision_seq,'payload',plan.payload,'signature',plan.signature);
end $$;
create or replace function public.approve_assistant_plan_version(p_user_id uuid,p_plan_version_id uuid,p_signature text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare plan assistant_plan_versions; seq bigint;
begin
 -- Read scope without a row lock, then always lock counter -> plan (also used by draft creation).
 select * into strict plan from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id;
 select revision_seq into strict seq from assistant_revision_counters where user_id=p_user_id and scope=plan.scope for update;
 select * into strict plan from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id for update;
 if p_signature is null or seq is distinct from plan.revision_seq or plan.signature is distinct from p_signature then raise exception 'stale_or_invalid_plan'; end if;
 update assistant_plan_versions set approved_at=coalesce(approved_at,now()) where id=plan.id and user_id=p_user_id returning * into plan;
 return jsonb_build_object('id',plan.id,'approved',true);
end $$;
create or replace function public.begin_assistant_production(p_user_id uuid,p_plan_version_id uuid,p_signature text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare plan assistant_plan_versions; seq bigint; wallet credit_balances; lockrow assistant_production_locks; pid uuid; amount integer; n integer;
begin
 -- Read scope without a row lock, then always lock counter -> plan (also used by draft creation).
 select * into strict plan from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id;
 select revision_seq into strict seq from assistant_revision_counters where user_id=p_user_id and scope=plan.scope for update;
 select * into strict plan from assistant_plan_versions where id=p_plan_version_id and user_id=p_user_id for update;
 if p_signature is null or plan.approved_at is null or plan.signature is distinct from p_signature or plan.revision_seq is distinct from seq then raise exception 'approved_current_plan_required'; end if;
 select * into lockrow from assistant_production_locks where plan_version_id=plan.id;
 if found then return jsonb_build_object('fresh',false,'productionId',lockrow.production_id); end if;
 if exists(select 1 from assistant_production_locks l join assistant_plan_versions v on v.id=l.plan_version_id where l.user_id=p_user_id and v.scope=plan.scope and not l.finalized) then raise exception 'active_production_requires_reconciliation'; end if;
 amount=(plan.payload->>'credits')::integer;
 if amount is null or amount < 0 or amount > 100000 then raise exception 'invalid_credits'; end if;
 select * into strict wallet from credit_balances where user_id=p_user_id for update;
 if wallet.balance-wallet.reserved < amount then raise exception 'insufficient_credits'; end if;
 update credit_balances set reserved=reserved+amount,updated_at=now() where user_id=p_user_id;
 get diagnostics n=row_count; if n<>1 then raise exception 'wallet_row_count'; end if;
 insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,reserved_credits,input_json,output_json,request_metadata,task_generation,automation_status)
 values(p_user_id,plan.payload->>'category',nullif(plan.payload->'input'->>'packId',''),left(plan.payload->'plan'->>'reply',120),plan.payload->'plan'->>'visualDirection','in_production','queued',amount,amount,plan.payload->'input',
 jsonb_build_object('assistant',true,'planVersionId',plan.id),jsonb_build_object('source','cinema_assistant','manager','single_ai_production_manager'),1,'assistant_managed') returning id into pid;
 get diagnostics n=row_count; if n<>1 then raise exception 'production_row_count'; end if;
 insert into assistant_production_locks(production_id,plan_version_id,user_id,task_generation,worker_lease,lease_expires_at,reserved_credits,credit_period)
 values(pid,plan.id,p_user_id,1,gen_random_uuid(),now()+interval '120 seconds',amount,jsonb_build_object('billing',wallet.billing_cycle_ends_at,'topup',wallet.topup_expires_at,'rollover',wallet.last_rollover_at)) returning * into lockrow;
 get diagnostics n=row_count; if n<>1 then raise exception 'lock_row_count'; end if;
 insert into credit_events(user_id,type,amount,note) values(p_user_id,'reserve',amount,'assistant:'||pid::text);
 return jsonb_build_object('fresh',true,'productionId',pid,'taskGeneration',1,'workerLease',lockrow.worker_lease);
end $$;

create or replace function public.start_assistant_provider_step(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid,p_endpoint text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare l assistant_production_locks; token uuid=gen_random_uuid();
begin
 select * into strict l from assistant_production_locks where production_id=p_production_id and user_id=p_user_id for update;
 perform 1 from production_requests where id=p_production_id and user_id=p_user_id and task_generation=l.task_generation for update;
 if not found then raise exception 'production_generation_fenced'; end if;
 if l.finalized or l.task_generation is distinct from p_generation or l.worker_lease is distinct from p_lease or l.lease_expires_at<=now() or l.provider_state in ('started','uncertain','rejected') then raise exception 'provider_step_fenced'; end if;
 update assistant_production_locks set step_token=token,provider_state='started',
 steps=steps||jsonb_build_array(jsonb_build_object('token',token,'endpoint',p_endpoint,'state','started')),updated_at=now() where production_id=p_production_id;
 return token;
end $$;
create or replace function public.record_assistant_provider_step(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid,p_step_token uuid,p_state text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare l assistant_production_locks;
begin
 if p_state not in ('accepted','rejected','uncertain') then raise exception 'invalid_provider_state'; end if;
 select * into strict l from assistant_production_locks where production_id=p_production_id and user_id=p_user_id for update;
 perform 1 from production_requests where id=p_production_id and user_id=p_user_id and task_generation=l.task_generation for update;
 if not found then raise exception 'production_generation_fenced'; end if;
 if l.finalized or l.task_generation is distinct from p_generation or l.worker_lease is distinct from p_lease or l.lease_expires_at<=now() or l.step_token is distinct from p_step_token or l.provider_state<>'started' then raise exception 'provider_result_fenced'; end if;
 update assistant_production_locks set provider_state=p_state,steps=jsonb_set(steps,array[(jsonb_array_length(steps)-1)::text,'state'],to_jsonb(p_state)),updated_at=now() where production_id=p_production_id;
 return true;
end $$;
create or replace function public.save_assistant_provider_result(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid,p_result jsonb) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare l assistant_production_locks; state text;
begin
 select * into strict l from assistant_production_locks where production_id=p_production_id and user_id=p_user_id for update;
 perform 1 from production_requests where id=p_production_id and user_id=p_user_id and task_generation=l.task_generation for update;
 if not found then raise exception 'production_generation_fenced'; end if;
 if l.finalized or l.task_generation is distinct from p_generation or l.worker_lease is distinct from p_lease or l.lease_expires_at<=now() then raise exception 'provider_result_fenced'; end if;
 state=case when p_result->>'providerOutcome'='uncertain' or l.provider_state in ('started','uncertain') then 'uncertain' else l.provider_state end;
 update assistant_production_locks set provider_state=state,updated_at=now() where production_id=p_production_id;
 update production_requests set output_json=output_json||p_result,provider_job_id=p_result->>'taskId',generation_status=case when state='uncertain' then 'reconcile_required' else 'queued' end,updated_at=now() where id=p_production_id and task_generation=p_generation;
 return true;
end $$;
create or replace function public.claim_assistant_production_lease(p_user_id uuid,p_production_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare l assistant_production_locks; token uuid=gen_random_uuid();
begin
 select * into strict l from assistant_production_locks where production_id=p_production_id and user_id=p_user_id for update;
 perform 1 from production_requests where id=p_production_id and user_id=p_user_id and task_generation=l.task_generation for update;
 if not found then raise exception 'production_generation_fenced'; end if;
 if l.finalized then return jsonb_build_object('finalized',true,'status',l.terminal_status); end if;
 if l.provider_state in ('started','uncertain','not_started') then return jsonb_build_object('reconcileRequired',true); end if;
 if l.lease_expires_at>now() then return jsonb_build_object('busy',true); end if;
 update assistant_production_locks set worker_lease=token,lease_expires_at=now()+interval '60 seconds' where production_id=p_production_id;
 return jsonb_build_object('workerLease',token,'taskGeneration',l.task_generation,'stepToken',l.step_token);
end $$;
create or replace function public.release_assistant_production_lease(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 update assistant_production_locks set lease_expires_at=now() where production_id=p_production_id and user_id=p_user_id and task_generation=p_generation and worker_lease=p_lease and not finalized;
 return found;
end $$;

create or replace function public.finalize_assistant_production(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid,p_step_token uuid,p_status text,p_output jsonb,p_recovery boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare l assistant_production_locks; wallet credit_balances; n integer; has_started boolean; has_accepted boolean;
 remaining integer; rolled_over integer; subscription integer; bonus integer; topup integer; spent integer;
begin
 if p_status not in ('ready','failed') then raise exception 'invalid_terminal_status'; end if;
 select * into strict l from assistant_production_locks where production_id=p_production_id and user_id=p_user_id for update;
 perform 1 from production_requests where id=p_production_id and user_id=p_user_id and task_generation=l.task_generation for update;
 if not found then raise exception 'production_generation_fenced'; end if;
 if l.task_generation is distinct from p_generation or l.worker_lease is distinct from p_lease or l.step_token is distinct from p_step_token then raise exception 'finalizer_fenced'; end if;
 if l.finalized then return jsonb_build_object('idempotent',true,'status',l.terminal_status); end if;
 if (p_recovery is not true and l.lease_expires_at<=now()) or (p_recovery and l.lease_expires_at>now()) then raise exception 'lease_fenced'; end if;
 select exists(select 1 from jsonb_array_elements(l.steps) s where s->>'state' in ('started','uncertain')),exists(select 1 from jsonb_array_elements(l.steps) s where s->>'state'='accepted') into has_started,has_accepted;
 if has_started or l.provider_state in ('started','uncertain') or (jsonb_array_length(l.steps)>0 and p_step_token is null) then return jsonb_build_object('reconcileRequired',true); end if;
 if p_status='failed' and has_accepted and coalesce(p_output->>'providerTerminal','')<>'failed' then return jsonb_build_object('reconcileRequired',true); end if;
 if p_status='ready' and not (p_output->'media'->>'url' is not null or jsonb_array_length(coalesce(p_output->'files','[]'::jsonb))>0) then raise exception 'delivery_required'; end if;
 select * into strict wallet from credit_balances where user_id=p_user_id for update;
 -- Never refund/spend an old reservation into a new credit period. Manual reconciliation is required.
 if l.credit_period<>jsonb_build_object('billing',wallet.billing_cycle_ends_at,'topup',wallet.topup_expires_at,'rollover',wallet.last_rollover_at) then
 update assistant_production_locks set provider_state='uncertain',updated_at=now() where production_id=p_production_id;
 update production_requests set generation_status='reconcile_required',updated_at=now() where id=p_production_id and user_id=p_user_id;
 return jsonb_build_object('reconcileRequired',true,'reason','credit_period_changed'); end if;
 if wallet.reserved<l.reserved_credits or (p_status='ready' and wallet.balance<l.reserved_credits) then raise exception 'credit_reservation_mismatch'; end if;
 -- Match spendCreditBuckets: rollover -> subscription -> bonus -> top-up.
 -- Compute from the locked wallet; failed productions only release the reservation.
 rolled_over=greatest(0,coalesce(wallet.rolled_over_credits,0));
 subscription=greatest(0,coalesce(wallet.current_subscription_credits,0));
 bonus=greatest(0,coalesce(wallet.bonus_credits,0));
 topup=greatest(0,coalesce(wallet.topup_credits,0));
 remaining=case when p_status='ready' then l.reserved_credits else 0 end;
 spent=least(rolled_over,remaining); rolled_over=rolled_over-spent; remaining=remaining-spent;
 spent=least(subscription,remaining); subscription=subscription-spent; remaining=remaining-spent;
 spent=least(bonus,remaining); bonus=bonus-spent; remaining=remaining-spent;
 spent=least(topup,remaining); topup=topup-spent; remaining=remaining-spent;
 update credit_balances set reserved=reserved-l.reserved_credits,
 balance=balance-case when p_status='ready' then l.reserved_credits else 0 end,
 rolled_over_credits=case when p_status='ready' then rolled_over else wallet.rolled_over_credits end,
 current_subscription_credits=case when p_status='ready' then subscription else wallet.current_subscription_credits end,
 bonus_credits=case when p_status='ready' then bonus else wallet.bonus_credits end,
 topup_credits=case when p_status='ready' then topup else wallet.topup_credits end,
 updated_at=now() where user_id=p_user_id;
 get diagnostics n=row_count; if n<>1 then raise exception 'wallet_row_count'; end if;
 update production_requests set status=p_status,generation_status=p_status,reserved_credits=0,output_json=output_json||p_output,preview_url=p_output->'media'->>'url',completed_at=now(),updated_at=now() where id=p_production_id and user_id=p_user_id and task_generation=p_generation;
 get diagnostics n=row_count; if n<>1 then raise exception 'production_row_count'; end if;
 update assistant_production_locks set finalized=true,terminal_status=p_status,reserved_credits=0,updated_at=now() where production_id=p_production_id and user_id=p_user_id and task_generation=p_generation and worker_lease=p_lease and step_token is not distinct from p_step_token;
 get diagnostics n=row_count; if n<>1 then raise exception 'lock_row_count'; end if;
 insert into credit_events(user_id,type,amount,note) values(p_user_id,case when p_status='ready' then 'spend'::credit_event_type else 'refund'::credit_event_type end,l.reserved_credits,'assistant:'||p_production_id::text);
 return jsonb_build_object('status',p_status,'available',wallet.balance-wallet.reserved+case when p_status='failed' then l.reserved_credits else 0 end);
end $$;
create or replace function public.recover_assistant_production(p_user_id uuid,p_production_id uuid,p_generation bigint,p_lease uuid,p_step_token uuid,p_status text,p_output jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 -- The called body checks generation, expired lease, exact step token, all started steps,
 -- period and exactly one wallet/production/lock row. Any exception rolls everything back.
 return finalize_assistant_production(p_user_id,p_production_id,p_generation,p_lease,p_step_token,p_status,p_output,true);
end $$;
create table public.assistant_material_owners (
 object_id uuid primary key references storage.objects(id) on delete cascade,
 user_id uuid not null references public.profiles(id), bucket text not null, path text not null, unique(bucket,path)
);
alter table public.assistant_material_owners enable row level security;
revoke all on public.assistant_material_owners from public,anon,authenticated;
grant all on public.assistant_material_owners to service_role;
create or replace function public.register_assistant_material_owner(p_user_id uuid,p_bucket text,p_path text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare object_id uuid;
begin
 select id into strict object_id from storage.objects where bucket_id=p_bucket and name=p_path;
 insert into assistant_material_owners(object_id,user_id,bucket,path) values(object_id,p_user_id,p_bucket,p_path);
 return true;
end $$;
create or replace function public.verify_assistant_storage_owner(p_user_id uuid,p_bucket text,p_path text) returns boolean
language sql security definer set search_path=public,pg_temp as $$
 select exists(select 1 from storage.objects o left join assistant_material_owners m on m.object_id=o.id where o.bucket_id=p_bucket and o.name=p_path and (o.owner_id=p_user_id::text or m.user_id=p_user_id));
$$;
-- All application RPCs are service-only. No browser-callable SECURITY DEFINER backdoor.
do $$ declare fn regprocedure; begin
 for fn in select oid::regprocedure from pg_proc where pronamespace='public'::regnamespace and proname=any(array[
 'reserve_assistant_revision_seq','create_assistant_plan_draft','approve_assistant_plan_version','begin_assistant_production',
 'start_assistant_provider_step','record_assistant_provider_step','save_assistant_provider_result','claim_assistant_production_lease',
 'release_assistant_production_lease','finalize_assistant_production','recover_assistant_production','verify_assistant_storage_owner','register_assistant_material_owner']) loop
 execute format('revoke all on function %s from PUBLIC, anon, authenticated',fn);
 execute format('grant execute on function %s to service_role',fn);
 end loop;
end $$;
commit;
