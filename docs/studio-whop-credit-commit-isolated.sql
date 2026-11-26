-- DISPOSABLE DATABASE TEST DRAFT; not a live migration.
-- Shared commit boundary for verified Whop webhook + checkout reconciliation.
-- Existing pricing, mapping, paid-event verification and bucket policy remain upstream.
begin;
create table public.studio_whop_credit_commits (
 payment_id text primary key check(payment_id ~ '^[A-Za-z0-9_-]{3,160}$'),
 user_id uuid not null references public.profiles(id),
 credits integer not null check(credits between 1 and 10000000),
 event_id uuid not null unique references public.credit_events(id),
 committed_at timestamptz not null default now()
);
alter table public.studio_whop_credit_commits enable row level security;
revoke all on public.studio_whop_credit_commits from public,anon,authenticated;
grant select,insert on public.studio_whop_credit_commits to service_role;

create function public.studio_whop_commit_credits(
 p_user uuid,p_payment text,p_credits integer,p_expected jsonb,p_update jsonb,p_note text
) returns text language plpgsql security invoker set search_path=pg_catalog,public as $$
declare w public.credit_balances%rowtype; expected public.credit_balances%rowtype;
 next_w public.credit_balances%rowtype; prior public.studio_whop_credit_commits%rowtype;
 prior_count bigint; prior_match bigint; event_uuid uuid; fresh boolean;
begin
 if p_user is null or coalesce(p_payment,'') !~ '^[A-Za-z0-9_-]{3,160}$'
 or p_credits is null or p_credits not between 1 and 10000000
 or p_note is null or length(p_note)>2000
 or split_part(p_note,' | ',1) is distinct from 'whop:payment:'||p_payment
 or p_update is null or jsonb_typeof(p_update)<>'object'
 or exists(select 1 from jsonb_object_keys(p_update) k where k not in
 ('balance','reserved','current_subscription_credits','rolled_over_credits','topup_credits','bonus_credits',
 'rollover_cap','subscription_status','billing_cycle_ends_at','active_subscription_package','active_subscription_billing',
 'last_rollover_at','topup_expires_at','updated_at'))
 then return 'denied'; end if;
 -- Serialize the same verified provider payment across both entry points and owners.
 perform pg_advisory_xact_lock(hashtextextended('studio-whop:'||p_payment,0));
 select * into prior from public.studio_whop_credit_commits where payment_id=p_payment;
 if found then
  return case when prior.user_id=p_user and prior.credits=p_credits then 'already_processed' else 'payment_conflict' end;
 end if;
 -- Exact legacy key, not wildcard matching. Historical duplicates or owner conflicts
 -- require review. This cannot protect against unconverted concurrent legacy writers.
 select count(*),count(*) filter(where user_id=p_user and amount=p_credits and type='purchase')
 into prior_count,prior_match from public.credit_events where split_part(note,' | ',1)='whop:payment:'||p_payment;
 if prior_count>0 then
  return case when prior_count=1 and prior_match=1 then 'already_processed' else 'payment_conflict' end;
 end if;
 if not exists(select 1 from public.profiles where id=p_user) then return 'denied'; end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 fresh=not found;
 if fresh then
  if p_expected is not null then return 'wallet_changed'; end if;
  insert into public.credit_balances(user_id) values(p_user) on conflict(user_id) do nothing returning * into w;
  if not found then return 'wallet_changed'; end if;
 else
  if p_expected is null or jsonb_typeof(p_expected)<>'object' then return 'wallet_changed'; end if;
  expected=jsonb_populate_record(null::public.credit_balances,p_expected);
  if w is distinct from expected then return 'wallet_changed'; end if;
 end if;
 next_w=jsonb_populate_record(w,p_update);
 -- A verified purchase cannot silently overwrite any active reservation.
 -- Inconsistent old wallets or changes of period with active holds require review.
 if w.balance<0 or w.reserved<0 or w.balance<w.reserved
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 or next_w.reserved is distinct from w.reserved
 or next_w.balance is null or next_w.balance<next_w.reserved
 or next_w.balance>w.balance::bigint+p_credits
 or next_w.current_subscription_credits is null or next_w.rolled_over_credits is null
 or next_w.topup_credits is null or next_w.bonus_credits is null
 or least(next_w.current_subscription_credits,next_w.rolled_over_credits,next_w.topup_credits,next_w.bonus_credits)<0
 or next_w.balance<>next_w.current_subscription_credits::bigint+next_w.rolled_over_credits+next_w.topup_credits+next_w.bonus_credits
 or (w.reserved>0 and (next_w.billing_cycle_ends_at is distinct from w.billing_cycle_ends_at
 or next_w.last_rollover_at is distinct from w.last_rollover_at or next_w.topup_expires_at is distinct from w.topup_expires_at))
 then
  if fresh then raise exception 'whop_new_wallet_invalid_update'; end if;
  return 'reconcile_required';
 end if;
 update public.credit_balances set balance=next_w.balance,
 current_subscription_credits=next_w.current_subscription_credits,rolled_over_credits=next_w.rolled_over_credits,
 topup_credits=next_w.topup_credits,bonus_credits=next_w.bonus_credits,rollover_cap=next_w.rollover_cap,
 subscription_status=next_w.subscription_status,billing_cycle_ends_at=next_w.billing_cycle_ends_at,
 active_subscription_package=next_w.active_subscription_package,active_subscription_billing=next_w.active_subscription_billing,
 last_rollover_at=next_w.last_rollover_at,topup_expires_at=next_w.topup_expires_at,updated_at=now()
 where user_id=p_user;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'purchase',p_credits,p_note) returning id into event_uuid;
 insert into public.studio_whop_credit_commits(payment_id,user_id,credits,event_id) values(p_payment,p_user,p_credits,event_uuid);
 return 'credited';
end $$;
revoke all on function public.studio_whop_commit_credits(uuid,text,integer,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.studio_whop_commit_credits(uuid,text,integer,jsonb,jsonb,text) to service_role;
commit;
