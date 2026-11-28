-- Test-only shared-wallet integration rehearsal. No API role can invoke these routines.
-- Do not apply to production. No successful paid settlement until receipt provenance is verified.
begin;
create table public.model_shared_wallet_reservation_test(
 job_id uuid primary key references public.model_production_jobs(id),
 user_id uuid not null references auth.users(id),
 plan_hash text not null check(plan_hash ~ '^[0-9a-f]{64}$'),
 credits integer not null check(credits between 1 and 100000),
 credit_period jsonb not null,
 state text not null default 'reserved' check(state in ('reserved','released','reconcile_required')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.model_shared_wallet_reservation_test enable row level security;
revoke all on public.model_shared_wallet_reservation_test from public,anon,authenticated,service_role;
create function public.model_shared_wallet_reserve_test(p_user uuid,p_job uuid,p_hash text,p_credits integer)
returns text language plpgsql security invoker set search_path='' as $$
declare j public.model_production_jobs; w public.credit_balances; r public.model_shared_wallet_reservation_test;
begin
 if p_credits is null or p_credits not between 1 and 100000 then raise exception 'invalid_quote';end if;
 select * into j from public.model_production_jobs where id=p_job and user_id=p_user and plan_hash=p_hash and state='blocked' for update;
 if not found then raise exception 'invalid_plan';end if;
 select * into r from public.model_shared_wallet_reservation_test where job_id=p_job for update;
 if found then
 if r.user_id<>p_user or r.plan_hash<>p_hash or r.credits<>p_credits then raise exception 'reservation_conflict';end if;
 return r.state;
 end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.balance-w.reserved<p_credits or w.reserved<0 then raise exception 'insufficient_credits';end if;
 if w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits then raise exception 'wallet_reconciliation_required';end if;
 update public.credit_balances set reserved=reserved+p_credits,updated_at=now() where user_id=p_user;
 insert into public.model_shared_wallet_reservation_test(job_id,user_id,plan_hash,credits,credit_period)
 values(p_job,p_user,p_hash,p_credits,jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at));
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'reserve',p_credits,'model-test:'||p_job::text);
 return 'reserved';
end $$;
create function public.model_shared_wallet_release_test(p_user uuid,p_job uuid,p_hash text)
returns text language plpgsql security invoker set search_path='' as $$
declare j public.model_production_jobs; w public.credit_balances; r public.model_shared_wallet_reservation_test;
begin
 select * into j from public.model_production_jobs where id=p_job and user_id=p_user and plan_hash=p_hash for update;
 if not found then raise exception 'invalid_plan';end if;
 select * into r from public.model_shared_wallet_reservation_test where job_id=p_job and user_id=p_user and plan_hash=p_hash for update;
 if not found then raise exception 'reservation_required';end if;
 if r.state<>'reserved' then return r.state;end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<r.credits then raise exception 'wallet_reconciliation_required';end if;
 if r.credit_period<>jsonb_build_object('billing',w.billing_cycle_ends_at,'topup',w.topup_expires_at,'rollover',w.last_rollover_at) then
 update public.model_shared_wallet_reservation_test set state='reconcile_required',updated_at=now() where job_id=p_job;return 'reconcile_required';end if;
 update public.credit_balances set reserved=reserved-r.credits,updated_at=now() where user_id=p_user;
 update public.model_shared_wallet_reservation_test set state='released',updated_at=now() where job_id=p_job;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'refund',r.credits,'model-test:'||p_job::text);
 return 'released';
end $$;
revoke all on function public.model_shared_wallet_reserve_test(uuid,uuid,text,integer),public.model_shared_wallet_release_test(uuid,uuid,text) from public,anon,authenticated,service_role;
commit;