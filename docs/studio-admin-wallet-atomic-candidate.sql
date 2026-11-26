-- Candidate only: do not apply to live until all legacy wallet writers are fenced.
-- Service-only wallet adjustment; no reconciliation, no payment or entitlement changes.
begin;
create function public.studio_admin_adjust_bonus(p_user uuid,p_delta integer,p_note text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare w public.credit_balances%rowtype;
begin
 if p_user is null or p_delta is null or p_delta=0 or abs(p_delta::bigint)>10000000
 or p_note is null or length(p_note)>2000 then raise exception 'invalid_credit_adjustment'; end if;
 if not exists(select 1 from public.profiles where id=p_user) then raise exception 'wallet_owner_missing'; end if;
 insert into public.credit_balances(user_id) values(p_user) on conflict(user_id) do nothing;
 select * into strict w from public.credit_balances where user_id=p_user for update;
 if least(w.balance,w.reserved,w.current_subscription_credits,w.rolled_over_credits,w.topup_credits,w.bonus_credits)<0
 or w.reserved>w.balance
 or w.balance::bigint<>w.current_subscription_credits::bigint+w.rolled_over_credits+w.topup_credits+w.bonus_credits
 then raise exception 'wallet_reconciliation_required'; end if;
 -- Existing admin additions are bonus credits. Never silently remove purchased credits.
 if w.bonus_credits::bigint+p_delta<0 or w.balance::bigint+p_delta<w.reserved
 then raise exception 'insufficient_unreserved_bonus'; end if;
 if w.balance::bigint+p_delta>2147483647 then raise exception 'credit_balance_overflow'; end if;
 update public.credit_balances set balance=balance+p_delta,bonus_credits=bonus_credits+p_delta,updated_at=now()
 where user_id=p_user returning * into w;
 insert into public.credit_events(user_id,type,amount,note) values(p_user,'adjustment',p_delta,p_note);
 return jsonb_build_object('balance',w.balance,'reserved',w.reserved,'bonus_credits',w.bonus_credits,'updated_at',w.updated_at);
end $$;
revoke all on function public.studio_admin_adjust_bonus(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.studio_admin_adjust_bonus(uuid,integer,text) to service_role;
commit;
