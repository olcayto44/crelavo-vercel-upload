-- ISOLATED DATABASE TEST DRAFT. NOT A PRODUCTION MIGRATION.
-- project_id means existing owner-scoped production_requests.id, not a mock Studio project.
-- No public endpoint, no automatic spend or real-provider dispatch.
begin;
create table public.studio_image_tariffs (
 version text primary key check(version ~ '^[A-Za-z0-9._-]{1,64}$'),
 credits integer not null check(credits between 1 and 100000),
 max_micro_usd integer not null check(max_micro_usd between 1 and 1000000),
 enabled boolean not null default false
);
create table public.studio_image_operations (
 request_id uuid primary key,
 user_id uuid not null references public.profiles(id),
 project_id uuid not null references public.production_requests(id),
 plan_hash text not null check(plan_hash ~ '^[a-f0-9]{64}$'),
 plan jsonb not null check(jsonb_typeof(plan)='object'),
 tariff_version text not null references public.studio_image_tariffs(version),
 credits integer not null check(credits between 1 and 100000),
 max_micro_usd integer not null check(max_micro_usd between 1 and 1000000),
 approved_at timestamptz not null,
 state text not null default 'approved' check(state in ('approved','reserved','claimed','artifact_cost_pending','reconcile_required','released','settled')),
 credit_period jsonb,
 provider_request_id text unique check(provider_request_id ~ '^[A-Za-z0-9_-]{8,160}$'),
 receipt jsonb,
 artifact bytea check(octet_length(artifact) between 16 and 12582912),
 failure_code text,
 actual_micro_usd integer check(actual_micro_usd between 0 and 100000000),
 finalized_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(state not in ('artifact_cost_pending','settled') or (artifact is not null and receipt is not null and provider_request_id is not null))
);
create index studio_image_operations_owner on public.studio_image_operations(user_id,project_id,state);
-- Prevent parallel outstanding requests for one project until explicitly resolved.
create unique index studio_image_one_active on public.studio_image_operations(project_id) where state in ('approved','reserved','claimed','artifact_cost_pending','reconcile_required');
alter table public.studio_image_tariffs enable row level security;
alter table public.studio_image_operations enable row level security;
revoke all on public.studio_image_tariffs,public.studio_image_operations from public,anon,authenticated;
grant select,insert,update on public.studio_image_tariffs,public.studio_image_operations to service_role;

create function public.studio_image_reserve(p_user uuid,p_request uuid,p_hash text,p_plan jsonb) returns text
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; w public.credit_balances%rowtype; t public.studio_image_tariffs%rowtype;
begin
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return 'denied'; end if;
 if o.state <> 'approved' then return 'already_reserved_or_finished'; end if;
 if not exists(select 1 from public.production_requests where id=o.project_id and user_id=p_user and production_type='image') then return 'denied'; end if;
 select * into t from public.studio_image_tariffs where version=o.tariff_version for share;
 if not found or not t.enabled or t.credits<>o.credits or t.max_micro_usd<>o.max_micro_usd then return 'denied'; end if;
 if o.plan->>'requestId' is distinct from p_request::text or o.plan->>'userId' is distinct from p_user::text or o.plan->>'projectId' is distinct from o.project_id::text
 or o.plan->>'categoryId' is distinct from 'image' or o.plan->>'operation' is distinct from 'image_generate'
 or o.plan->>'provider' is distinct from 'minimax' or o.plan->>'model' is distinct from 'image-01'
 or o.plan->>'tariffVersion' is distinct from o.tariff_version
 or o.plan->>'reservedCredits' is distinct from o.credits::text or o.plan->>'maximumProviderMicroUSD' is distinct from o.max_micro_usd::text then return 'denied'; end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<0 or w.balance-w.reserved<o.credits or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits then return 'denied'; end if;
 if least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0 then return 'denied'; end if;
 if (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then return 'denied'; end if;
 update public.credit_balances set reserved=reserved+o.credits,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state='reserved',credit_period=jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'reserve',o.credits,'studio-image:'||p_request::text);
 return 'reserved';
end $$;
create function public.studio_image_claim(p_user uuid,p_request uuid,p_hash text,p_plan jsonb) returns text
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; w public.credit_balances%rowtype; t public.studio_image_tariffs%rowtype;
begin
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return 'denied'; end if;
 if o.state in ('claimed','artifact_cost_pending','reconcile_required','settled') then return 'already_claimed'; end if;
 if o.state<>'reserved' then return 'denied'; end if;
 if not exists(select 1 from public.production_requests where id=o.project_id and user_id=p_user and production_type='image') then return 'denied'; end if;
 select * into t from public.studio_image_tariffs where version=o.tariff_version for share;
 if not found or not t.enabled or t.credits<>o.credits or t.max_micro_usd<>o.max_micro_usd then return 'denied'; end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<o.credits or w.balance<w.reserved or o.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at)
 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now()) or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then
  update public.studio_image_operations set state='reconcile_required',failure_code='wallet_changed',updated_at=now() where request_id=p_request;
  return 'denied';
 end if;
 update public.studio_image_operations set state='claimed',updated_at=now() where request_id=p_request;
 return 'claimed';
end $$;
create function public.studio_image_record(p_user uuid,p_request uuid,p_hash text,p_plan jsonb,p_receipt jsonb,p_base64 text) returns boolean
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; bytes bytea;
begin
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.state<>'claimed' or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return false; end if;
 if p_base64 is null or length(p_base64)>16777216 or p_receipt is null
 or p_receipt->>'provider' is distinct from 'minimax' or p_receipt->>'model' is distinct from 'image-01'
 or p_receipt->>'imageCount' is distinct from '1' or p_receipt->>'mime' is distinct from 'image/png'
 or p_receipt->>'costState' is distinct from 'pending_reconciliation'
 or coalesce(p_receipt->>'providerRequestId','') !~ '^[A-Za-z0-9_-]{8,160}$' then return false; end if;
 bytes=decode(p_base64,'base64');
 if octet_length(bytes) not between 16 and 12582912 or substring(bytes from 1 for 8)<>decode('89504e470d0a1a0a','hex') or encode(sha256(bytes),'hex') is distinct from p_receipt->>'sha256' then return false; end if;
 update public.studio_image_operations set state='artifact_cost_pending',provider_request_id=p_receipt->>'providerRequestId',receipt=p_receipt,artifact=bytes,updated_at=now() where request_id=p_request;
 return true;
end $$;
create function public.studio_image_uncertain(p_user uuid,p_request uuid,p_hash text,p_plan jsonb,p_code text,p_provider_id text) returns boolean
language plpgsql security invoker set search_path=pg_catalog,public as $$
begin
 if p_code is null or p_code !~ '^[a-z0-9_]{1,80}$' or (p_provider_id is not null and p_provider_id !~ '^[A-Za-z0-9_-]{8,160}$') then return false; end if;
 update public.studio_image_operations set state='reconcile_required',failure_code=p_code,provider_request_id=coalesce(p_provider_id,provider_request_id),updated_at=now()
 where request_id=p_request and user_id=p_user and plan_hash=p_hash and plan=p_plan and state='claimed';
 return found;
end $$;
-- Reviewed provider invoice / usage evidence is intentionally independent of
-- the generation receipt. No model-supplied cost or estimated tariff is accepted.
-- A dedicated reconciliation service must verify the invoice externally before
-- inserting this server-only evidence. There is no public ingestion endpoint.
create table public.studio_image_cost_evidence (
 request_id uuid primary key references public.studio_image_operations(request_id),
 provider_request_id text not null unique check(provider_request_id ~ '^[A-Za-z0-9_-]{8,160}$'),
 evidence_ref text not null unique check(evidence_ref ~ '^[A-Za-z0-9._:-]{8,160}$'),
 actual_micro_usd integer not null check(actual_micro_usd between 0 and 100000000),
 source text not null check(source in ('reviewed_provider_invoice','reviewed_provider_usage')),
 reviewed_at timestamptz not null default now()
);
alter table public.studio_image_cost_evidence enable row level security;
revoke all on public.studio_image_cost_evidence from public,anon,authenticated;
grant select,insert on public.studio_image_cost_evidence to service_role;
-- Finalize fixed approved credits, never a price derived from the provider response.
-- An external cost above approved bound requires review and remains held.
-- Only a still-reserved, never-claimed operation may release without provider evidence.
-- This draft has no automated post-dispatch refund or retry.
create function public.studio_image_finalize(p_user uuid,p_request uuid,p_hash text,p_plan jsonb,p_outcome text) returns text
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare o public.studio_image_operations%rowtype; w public.credit_balances%rowtype; e public.studio_image_cost_evidence%rowtype;
 remaining integer; rollover integer; subscription integer; bonus integer; topup integer; taken integer;
begin
 if p_outcome is null or p_outcome not in ('settle','release_unclaimed') then return 'denied'; end if;
 select * into o from public.studio_image_operations where request_id=p_request and user_id=p_user for update;
 if not found or o.plan_hash is distinct from p_hash or o.plan is distinct from p_plan then return 'denied'; end if;
 if o.state='settled' then return case when p_outcome='settle' then 'already_settled' else 'denied' end; end if;
 if o.state='released' then return case when p_outcome='release_unclaimed' then 'already_released' else 'denied' end; end if;
 if o.state='reconcile_required' then return 'reconcile_required'; end if;
 if not exists(select 1 from public.production_requests where id=o.project_id and user_id=p_user and production_type='image') then return 'denied'; end if;
 if p_outcome='settle' then
  if o.state<>'artifact_cost_pending' or o.artifact is null or o.receipt is null or o.provider_request_id is null
   or encode(sha256(o.artifact),'hex') is distinct from o.receipt->>'sha256'
   or o.receipt->>'providerRequestId' is distinct from o.provider_request_id then return 'denied'; end if;
  select * into e from public.studio_image_cost_evidence where request_id=p_request for share;
  if not found or e.provider_request_id is distinct from o.provider_request_id then return 'cost_evidence_required'; end if;
  if e.actual_micro_usd>o.max_micro_usd then
   update public.studio_image_operations set state='reconcile_required',actual_micro_usd=e.actual_micro_usd,failure_code='provider_cost_over_budget',updated_at=now() where request_id=p_request;
   return 'reconcile_required';
  end if;
 else
  if o.state<>'reserved' or o.provider_request_id is not null or o.artifact is not null or o.receipt is not null then return 'denied'; end if;
 end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<o.credits or w.balance<w.reserved or w.reserved<0
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 or least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0
 or o.credit_period is distinct from jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at)
 or (w.billing_cycle_ends_at is not null and w.billing_cycle_ends_at<=now())
 or (w.topup_credits>0 and w.topup_expires_at is not null and w.topup_expires_at<=now()) then
  update public.studio_image_operations set state='reconcile_required',failure_code='wallet_changed',updated_at=now() where request_id=p_request;
  return 'reconcile_required';
 end if;
 remaining=case when p_outcome='settle' then o.credits else 0 end;
 rollover=w.rolled_over_credits; subscription=w.current_subscription_credits; bonus=w.bonus_credits; topup=w.topup_credits;
 taken=least(rollover,remaining);rollover=rollover-taken;remaining=remaining-taken;
 taken=least(subscription,remaining);subscription=subscription-taken;remaining=remaining-taken;
 taken=least(bonus,remaining);bonus=bonus-taken;remaining=remaining-taken;
 taken=least(topup,remaining);topup=topup-taken;remaining=remaining-taken;
 if remaining<>0 then raise exception 'image_wallet_bucket_mismatch'; end if;
 update public.credit_balances set reserved=reserved-o.credits,balance=balance-case when p_outcome='settle' then o.credits else 0 end,
 rolled_over_credits=rollover,current_subscription_credits=subscription,bonus_credits=bonus,topup_credits=topup,updated_at=now() where user_id=p_user;
 update public.studio_image_operations set state=case when p_outcome='settle' then 'settled' else 'released' end,
 actual_micro_usd=case when p_outcome='settle' then e.actual_micro_usd else null end,finalized_at=now(),updated_at=now() where request_id=p_request;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,case when p_outcome='settle' then 'spend'::public.credit_event_type else 'refund'::public.credit_event_type end,o.credits,'studio-image:'||p_request::text);
 return case when p_outcome='settle' then 'settled' else 'released' end;
end $$;
revoke all on function public.studio_image_finalize(uuid,uuid,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.studio_image_finalize(uuid,uuid,text,jsonb,text) to service_role;
revoke all on function public.studio_image_reserve(uuid,uuid,text,jsonb),public.studio_image_claim(uuid,uuid,text,jsonb),public.studio_image_record(uuid,uuid,text,jsonb,jsonb,text),public.studio_image_uncertain(uuid,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.studio_image_reserve(uuid,uuid,text,jsonb),public.studio_image_claim(uuid,uuid,text,jsonb),public.studio_image_record(uuid,uuid,text,jsonb,jsonb,text),public.studio_image_uncertain(uuid,uuid,text,jsonb,text,text) to service_role;
commit;
