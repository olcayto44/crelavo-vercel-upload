-- Isolated test project only. A durable, non-replayable internal trial claim.
begin;
create table public.kie_internal_trial(
 trial_id text primary key check(trial_id='magi2-internal-4s-v1'),
 state text not null check(state in ('claimed','submitted','reconcile_required')),
 provider_task_id text unique check(provider_task_id is null or provider_task_id ~ '^[A-Za-z0-9_-]{1,200}$'),
 balance_before numeric(16,4) not null check(balance_before>=70.4 and balance_before<=80),
 max_estimated_credits numeric(16,4) not null default 70.4 check(max_estimated_credits=70.4),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(state<>'submitted' or provider_task_id is not null)
);
alter table public.kie_internal_trial enable row level security;
revoke all on public.kie_internal_trial from public,anon,authenticated,service_role;
grant select,insert,update on public.kie_internal_trial to service_role;
create function public.kie_claim_internal_trial(p_balance numeric)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
 if p_balance is null or p_balance<70.4 or p_balance>80 then return false;end if;
 insert into public.kie_internal_trial(trial_id,state,balance_before) values('magi2-internal-4s-v1','claimed',p_balance) on conflict do nothing;
 return found;
end $$;
revoke all on function public.kie_claim_internal_trial(numeric) from public,anon,authenticated,service_role;
grant execute on function public.kie_claim_internal_trial(numeric) to service_role;
commit;