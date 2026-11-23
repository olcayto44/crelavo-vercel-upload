-- OFFLINE / ISOLATED DATABASE ONLY. Do not apply to Production until
-- multi-session race, rollover boundary, failure rollback and delivery tests pass.
-- This is not wired to live Website rendering; the render deny remains in place.
begin;
create table public.website_credit_reservations (
 production_id uuid primary key references public.production_requests(id),
 user_id uuid not null references public.profiles(id),
 plan_hash text not null check(plan_hash ~ '^[a-f0-9]{64}$'),
 credits integer not null check(credits > 0 and credits <= 100000),
 state text not null default 'reserved' check(state in ('reserved','settled','released','reconcile_required')),
 credit_period jsonb not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 finalized_at timestamptz
);
create index website_credit_reservations_owner on public.website_credit_reservations(user_id,state);
alter table public.website_credit_reservations enable row level security;
revoke all on public.website_credit_reservations from public,anon,authenticated;
grant all on public.website_credit_reservations to service_role;

create function public.website_credit_reserve(p_user uuid,p_production uuid,p_hash text,p_credits integer) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare project production_requests%rowtype; wallet credit_balances%rowtype; reservation website_credit_reservations%rowtype;
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_credits is null or p_credits not between 1 and 100000 then raise exception 'invalid_website_reservation'; end if;
 select * into project from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then raise exception 'website_project_not_found'; end if;
 select * into reservation from website_credit_reservations where production_id=p_production for update;
 if found then
  if reservation.user_id<>p_user or reservation.plan_hash<>p_hash or reservation.credits<>p_credits then raise exception 'website_reservation_conflict'; end if;
  return jsonb_build_object('fresh',false,'state',reservation.state,'productionId',p_production);
 end if;
 if project.output_json->'websiteAssistant'->>'phase'<>'approved'
 or project.output_json->'websiteAssistant'->>'approvedHash' is distinct from p_hash
 or project.output_json->'websiteAssistant'->>'planHash' is distinct from p_hash
 or (project.output_json->'websiteAssistant'->>'credits')::integer is distinct from p_credits
 or project.estimated_credits is distinct from p_credits
 then raise exception 'approved_website_plan_required'; end if;
 select * into wallet from credit_balances where user_id=p_user for update;
 if not found or wallet.balance-wallet.reserved < p_credits then raise exception 'insufficient_production_credits'; end if;
 update credit_balances set reserved=reserved+p_credits,updated_at=now() where user_id=p_user;
 update production_requests set reserved_credits=p_credits,updated_at=now() where id=p_production and user_id=p_user;
 insert into website_credit_reservations(production_id,user_id,plan_hash,credits,credit_period)
 values(p_production,p_user,p_hash,p_credits,
 jsonb_build_object('billing',wallet.billing_cycle_ends_at,'topup',wallet.topup_expires_at,'rollover',wallet.last_rollover_at));
 insert into credit_events(user_id,type,amount,note) values(p_user,'reserve',p_credits,'website:'||p_production::text);
 return jsonb_build_object('fresh',true,'state','reserved','productionId',p_production,'credits',p_credits);
end $$;

create function public.website_credit_finalize(p_user uuid,p_production uuid,p_hash text,p_outcome text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare project production_requests%rowtype; wallet credit_balances%rowtype; reservation website_credit_reservations%rowtype;
 remaining integer; rollover integer; subscription integer; bonus integer; topup integer; taken integer;
begin
 if p_outcome not in ('ready','failed') then raise exception 'invalid_website_outcome'; end if;
 select * into project from production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found then raise exception 'website_project_not_found'; end if;
 select * into reservation from website_credit_reservations where production_id=p_production and user_id=p_user for update;
 if not found then raise exception 'website_reservation_required'; end if;
 if reservation.plan_hash is distinct from p_hash then raise exception 'website_plan_hash_mismatch'; end if;
 if reservation.state in ('settled','released') then
  if (reservation.state='settled' and p_outcome='ready') or (reservation.state='released' and p_outcome='failed') then
   return jsonb_build_object('idempotent',true,'state',reservation.state);
  end if;
  raise exception 'website_already_finalized';
 end if;
 if reservation.state<>'reserved' then raise exception 'website_reconciliation_required'; end if;
 -- Never charge without durable generated website files and a completed generation record.
 if p_outcome='ready' and (project.output_json->'websiteAssistant'->>'phase'<>'awaiting_payment'
    or project.generation_status<>'completed'
    or jsonb_typeof(project.output_json->'websiteFiles')<>'object'
    or (select count(*) from jsonb_each(project.output_json->'websiteFiles'))=0
    or project.output_json->'websiteAssistant'->>'planHash' is distinct from p_hash
    or project.output_json->'websiteAssistant'->>'approvedHash' is distinct from p_hash)
 then raise exception 'website_delivery_and_approval_required'; end if;
 -- A failed or uncertain provider call must be reconciled before releasing credits.
 if p_outcome='failed' and (project.output_json->'websiteAssistant'->>'phase'<>'generation_failed'
    or project.generation_status<>'failed') then raise exception 'website_confirmed_failure_required'; end if;
 select * into wallet from credit_balances where user_id=p_user for update;
 if not found then raise exception 'production_wallet_not_found'; end if;
 if reservation.credit_period<>jsonb_build_object('billing',wallet.billing_cycle_ends_at,'topup',wallet.topup_expires_at,'rollover',wallet.last_rollover_at) then
   update website_credit_reservations set state='reconcile_required',updated_at=now() where production_id=p_production;
   return jsonb_build_object('reconcileRequired',true,'reason','credit_period_changed');
 end if;
 if wallet.reserved<reservation.credits or (p_outcome='ready' and wallet.balance<reservation.credits) then raise exception 'website_reservation_balance_mismatch'; end if;
 remaining=case when p_outcome='ready' then reservation.credits else 0 end;
 rollover=greatest(0,coalesce(wallet.rolled_over_credits,0));
 subscription=greatest(0,coalesce(wallet.current_subscription_credits,0));
 bonus=greatest(0,coalesce(wallet.bonus_credits,0));
 topup=greatest(0,coalesce(wallet.topup_credits,0));
 taken=least(rollover,remaining);rollover=rollover-taken;remaining=remaining-taken;
 taken=least(subscription,remaining);subscription=subscription-taken;remaining=remaining-taken;
 taken=least(bonus,remaining);bonus=bonus-taken;remaining=remaining-taken;
 taken=least(topup,remaining);topup=topup-taken;remaining=remaining-taken;
 if p_outcome='ready' and remaining<>0 then raise exception 'website_credit_buckets_inconsistent'; end if;
 update credit_balances set reserved=reserved-reservation.credits,
 balance=balance-case when p_outcome='ready' then reservation.credits else 0 end,
 rolled_over_credits=case when p_outcome='ready' then rollover else wallet.rolled_over_credits end,
 current_subscription_credits=case when p_outcome='ready' then subscription else wallet.current_subscription_credits end,
 bonus_credits=case when p_outcome='ready' then bonus else wallet.bonus_credits end,
 topup_credits=case when p_outcome='ready' then topup else wallet.topup_credits end,
 updated_at=now() where user_id=p_user;
 update production_requests set reserved_credits=0,
 status=case when p_outcome='ready' then 'ready' else 'failed' end,
 generation_status=case when p_outcome='ready' then 'completed' else 'failed' end,
 output_json=jsonb_set(output_json,'{websiteAssistant,phase}',to_jsonb(case when p_outcome='ready' then 'ready' else 'generation_failed' end)),
 completed_at=case when p_outcome='ready' then now() else completed_at end,
 updated_at=now() where id=p_production and user_id=p_user;
 update website_credit_reservations set state=case when p_outcome='ready' then 'settled' else 'released' end,
 finalized_at=now(),updated_at=now() where production_id=p_production;
 insert into credit_events(user_id,type,amount,note)
 values(p_user,case when p_outcome='ready' then 'spend'::credit_event_type else 'refund'::credit_event_type end,reservation.credits,'website:'||p_production::text);
 return jsonb_build_object('state',case when p_outcome='ready' then 'settled' else 'released' end,'credits',reservation.credits);
end $$;
revoke all on function public.website_credit_reserve(uuid,uuid,text,integer) from public,anon,authenticated;
revoke all on function public.website_credit_finalize(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.website_credit_reserve(uuid,uuid,text,integer) to service_role;
grant execute on function public.website_credit_finalize(uuid,uuid,text,text) to service_role;
commit;
