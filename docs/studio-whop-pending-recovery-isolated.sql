-- Disposable CI draft, NOT a live migration or a payment-provider API.
-- Both payment verification entry points must stage after server verification
-- and mapped-product approval, then commit in a separate transaction.
-- Replays require freshly reverified terms, not stale credit calculation.
begin;
create table public.studio_whop_pending_credits (
 payment_id text primary key check(payment_id ~ '^pay_[A-Za-z0-9_-]{3,156}$'),
 user_id uuid not null references public.profiles(id),
 plan_id text not null check(plan_id ~ '^[A-Za-z0-9_-]{3,160}$'),
 product_id text not null check(product_id ~ '^[A-Za-z0-9._-]{1,100}$'),
 billing text not null check(billing in ('monthly','yearly','one_time')),
 credits integer not null check(credits between 1 and 10000000),
 state text not null default 'pending' check(state in ('pending','fulfilled','review_required')),
 attempt_count integer not null default 0 check(attempt_count>=0),
 last_result text,
 first_verified_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 fulfilled_at timestamptz,
 check((state='fulfilled')=(fulfilled_at is not null))
);
create index studio_whop_pending_queue on public.studio_whop_pending_credits(state,updated_at);
alter table public.studio_whop_pending_credits enable row level security;
revoke all on public.studio_whop_pending_credits from public,anon,authenticated;
grant select,insert,update on public.studio_whop_pending_credits to service_role;
create function public.studio_whop_stage_verified(p_user uuid,p_payment text,p_plan text,p_product text,p_billing text,p_credits integer)
 returns text language plpgsql security invoker set search_path=pg_catalog,public as $$
declare j public.studio_whop_pending_credits%rowtype;
begin
 if p_user is null or coalesce(p_payment,'') !~ '^pay_[A-Za-z0-9_-]{3,156}$'
 or coalesce(p_plan,'') !~ '^[A-Za-z0-9_-]{3,160}$'
 or coalesce(p_product,'') !~ '^[A-Za-z0-9._-]{1,100}$'
 or p_billing is null or p_billing not in ('monthly','yearly','one_time')
 or p_credits is null or p_credits not between 1 and 10000000
 or not exists(select 1 from public.profiles where id=p_user) then return 'denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-whop:'||p_payment,0));
 select * into j from public.studio_whop_pending_credits where payment_id=p_payment;
 if found then
  if j.user_id is distinct from p_user or j.plan_id is distinct from p_plan
  or j.product_id is distinct from p_product or j.billing is distinct from p_billing
  or j.credits is distinct from p_credits then return 'payment_conflict'; end if;
  return j.state;
 end if;
 insert into public.studio_whop_pending_credits(payment_id,user_id,plan_id,product_id,billing,credits)
 values(p_payment,p_user,p_plan,p_product,p_billing,p_credits);
 return 'pending';
end $$;
-- Service-only: freshly verified payment identity and terms must match the journal.
-- No stored wallet patch is replayed; caller recomputes existing bucket policy.
-- Unknown SQL/network outcome leaves the previously committed journal recoverable.
-- Review-required is intentionally not automatically retryable.
create function public.studio_whop_recover_verified(
 p_user uuid,p_payment text,p_plan text,p_product text,p_billing text,p_credits integer,p_expected jsonb,p_update jsonb
) returns text language plpgsql security invoker set search_path=pg_catalog,public as $$
declare j public.studio_whop_pending_credits%rowtype; outcome text; note text;
begin
 if p_payment is null or p_payment !~ '^pay_[A-Za-z0-9_-]{3,156}$' then return 'denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-whop:'||p_payment,0));
 select * into j from public.studio_whop_pending_credits where payment_id=p_payment for update;
 if not found then return 'stage_required'; end if;
 if j.user_id is distinct from p_user or j.plan_id is distinct from p_plan
 or j.product_id is distinct from p_product or j.billing is distinct from p_billing
 or j.credits is distinct from p_credits then return 'payment_conflict'; end if;
 if j.state='fulfilled' then return 'already_processed'; end if;
 if j.state='review_required' then return 'review_required'; end if;
 note='whop:payment:'||j.payment_id||' | package='||j.product_id||' | billing='||j.billing||' | source=studio_recovery';
 outcome=public.studio_whop_commit_credits(j.user_id,j.payment_id,j.credits,p_expected,p_update,note);
 if outcome in ('credited','already_processed') then
  update public.studio_whop_pending_credits set state='fulfilled',attempt_count=attempt_count+1,last_result=outcome,updated_at=now(),fulfilled_at=now() where payment_id=p_payment;
 elsif outcome='wallet_changed' then
  update public.studio_whop_pending_credits set attempt_count=attempt_count+1,last_result=outcome,updated_at=now() where payment_id=p_payment;
 else
  update public.studio_whop_pending_credits set state='review_required',attempt_count=attempt_count+1,last_result=outcome,updated_at=now() where payment_id=p_payment;
 end if;
 return outcome;
end $$;
-- Verified reversal/dispute or mismatched current provider state must stop replay.
-- This does not reverse money or debit already fulfilled credits.
create function public.studio_whop_hold_pending(p_payment text,p_reason text) returns text
language plpgsql security invoker set search_path=pg_catalog,public as $$
declare j public.studio_whop_pending_credits%rowtype;
begin
 if p_payment is null or p_payment !~ '^pay_[A-Za-z0-9_-]{3,156}$'
 or p_reason is null or p_reason not in ('provider_refund','provider_dispute','provider_not_paid','provider_terms_changed','operator_review') then return 'denied'; end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-whop:'||p_payment,0));
 select * into j from public.studio_whop_pending_credits where payment_id=p_payment for update;
 if not found then return 'not_found'; end if;
 if j.state='fulfilled' then return 'fulfilled_review_required'; end if;
 update public.studio_whop_pending_credits set state='review_required',last_result=p_reason,updated_at=now() where payment_id=p_payment;
 return 'review_required';
end $$;
revoke all on function public.studio_whop_stage_verified(uuid,text,text,text,text,integer),public.studio_whop_recover_verified(uuid,text,text,text,text,integer,jsonb,jsonb),public.studio_whop_hold_pending(text,text) from public,anon,authenticated;
grant execute on function public.studio_whop_stage_verified(uuid,text,text,text,text,integer),public.studio_whop_recover_verified(uuid,text,text,text,text,integer,jsonb,jsonb),public.studio_whop_hold_pending(text,text) to service_role;
commit;
