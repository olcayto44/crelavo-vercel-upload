-- Isolated acceptance candidate; deploy only after review of all live wallet writers.
-- A full refund of an unused, atomically committed top-up can be reversed once.
-- Subscriptions, partial refunds, spent credits, reservations and legacy payments require review.
begin;
create table public.studio_whop_refund_commits(
 payment_id text primary key references public.studio_whop_credit_commits(payment_id),
 user_id uuid not null references public.profiles(id),
 credits integer not null check(credits>0),
 event_id uuid not null unique references public.credit_events(id),
 created_at timestamptz not null default now()
);
alter table public.studio_whop_refund_commits enable row level security;
revoke all on public.studio_whop_refund_commits from public,anon,authenticated;
grant select,insert on public.studio_whop_refund_commits to service_role;
create function public.studio_whop_reverse_unused_topup(p_payment text,p_user uuid,p_credits integer,p_product text)
returns text language plpgsql security invoker set search_path=pg_catalog,public as $$
declare c public.studio_whop_credit_commits%rowtype; w public.credit_balances%rowtype;
 e public.credit_events%rowtype; prior public.studio_whop_refund_commits%rowtype; eid uuid;
begin
 if coalesce(p_payment,'') !~ '^pay_[A-Za-z0-9_-]{3,156}$' or p_user is null or p_credits is null or p_credits<=0 or coalesce(p_product,'') !~ '^[A-Za-z0-9_-]{1,100}$' then return 'review_required';end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-whop:'||p_payment,0));
 select * into prior from public.studio_whop_refund_commits where payment_id=p_payment;
 if found then return case when prior.user_id=p_user and prior.credits=p_credits then 'already_reversed' else 'review_required' end;end if;
 select * into c from public.studio_whop_credit_commits where payment_id=p_payment;
 if not found or c.user_id<>p_user or c.credits<>p_credits then return 'review_required';end if;
 select * into e from public.credit_events where id=c.event_id;
 if not found or e.user_id<>p_user or e.type<>'purchase' or e.amount<>p_credits or
 split_part(e.note,' | ',1) is distinct from 'whop:payment:'||p_payment or
 not coalesce(('billing=one_time'=any(string_to_array(e.note,' | '))) and (('package='||p_product)=any(string_to_array(e.note,' | '))),false) then return 'review_required';end if;
 select * into w from public.credit_balances where user_id=p_user for update;
 if not found or w.reserved<>0 or w.topup_credits<p_credits or w.balance<p_credits or
 w.balance<>w.current_subscription_credits::bigint+w.rolled_over_credits+w.topup_credits+w.bonus_credits or
 least(w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0 or
 exists(select 1 from public.credit_events where user_id=p_user and id<>e.id and created_at>=e.created_at)
 then return 'review_required';end if;
 update public.credit_balances set balance=balance-p_credits,topup_credits=topup_credits-p_credits,updated_at=now() where user_id=p_user;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'adjustment',-p_credits,'whop:refund:'||p_payment) returning id into eid;
 insert into public.studio_whop_refund_commits(payment_id,user_id,credits,event_id) values(p_payment,p_user,p_credits,eid);
 return 'reversed';
end $$;
revoke all on function public.studio_whop_reverse_unused_topup(text,uuid,integer,text) from public,anon,authenticated;
grant execute on function public.studio_whop_reverse_unused_topup(text,uuid,integer,text) to service_role;
commit;
