-- Service-only atomic immediate debit; no fallback to a stale wallet snapshot.
create or replace function public.studio_wallet_spend(p_user uuid,p_amount integer,p_key text,p_note text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w credit_balances%rowtype; remaining integer;r integer;c integer;b integer;t integer;take integer;
begin
 if p_user is null or p_amount not between 1 and 100000 or p_key is null or length(p_key) not between 8 and 200 or length(coalesce(p_note,''))>200 then raise exception 'invalid_wallet_spend';end if;
 select * into w from credit_balances where user_id=p_user for update;
 if not found then return jsonb_build_object('state','insufficient','available',0,'reserved',0);end if;
 if exists(select 1 from credit_events where user_id=p_user and stripe_session_id=p_key and type='spend') then return jsonb_build_object('state','already_spent','available',w.balance-w.reserved,'reserved',w.reserved);end if;
 if w.balance-w.reserved<p_amount then return jsonb_build_object('state','insufficient','available',greatest(0,w.balance-w.reserved),'reserved',w.reserved);end if;
 if least(w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits,w.reserved)<0 or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then return jsonb_build_object('state','reconcile_required');end if;
 remaining:=p_amount;r:=w.rolled_over_credits;c:=w.current_subscription_credits;b:=w.bonus_credits;t:=w.topup_credits;
 take:=least(r,remaining);r:=r-take;remaining:=remaining-take;
 take:=least(c,remaining);c:=c-take;remaining:=remaining-take;
 take:=least(b,remaining);b:=b-take;remaining:=remaining-take;
 take:=least(t,remaining);t:=t-take;remaining:=remaining-take;
 if remaining<>0 then raise exception 'wallet_bucket_mismatch';end if;
 update credit_balances set balance=balance-p_amount,rolled_over_credits=r,current_subscription_credits=c,bonus_credits=b,topup_credits=t,updated_at=now() where user_id=p_user;
 insert into credit_events(user_id,type,amount,note,stripe_session_id) values(p_user,'spend',p_amount,left(p_note,200),p_key);
 return jsonb_build_object('state','spent','available',w.balance-w.reserved-p_amount,'reserved',w.reserved);
end $$;
revoke all on function public.studio_wallet_spend(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.studio_wallet_spend(uuid,integer,text,text) to service_role;
-- Queue lookup is read-only; skip unfunded jobs instead of starving newer funded jobs.
create or replace function public.studio_stage_funded_queue(p_user uuid,p_limit integer)
returns table(id uuid,user_id uuid) language sql stable security invoker set search_path=public,pg_temp as $$
 select j.id,j.user_id from studio_stage_jobs j
 join credit_balances w on w.user_id=j.user_id
 join lateral(select s.credits from studio_stage_steps s where s.job_id=j.id and s.state='pending' order by s.ordinal limit 1) n on true
 where j.user_id=p_user and j.auto_resume and j.state in ('queued','paused_credits') and w.balance-w.reserved>=n.credits
 order by j.updated_at asc,j.id limit greatest(1,least(coalesce(p_limit,1),20))
$$;
revoke all on function public.studio_stage_funded_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.studio_stage_funded_queue(uuid,integer) to service_role;
-- Stale claimed steps are not retried, only marked for operator reconciliation.
create or replace function public.studio_stage_mark_stale(p_user uuid)
returns integer language plpgsql security invoker set search_path=public,pg_temp as $$
declare j studio_stage_jobs%rowtype;n integer:=0;
begin
 for j in select * from studio_stage_jobs where user_id=p_user and state='running' and updated_at<now()-interval '5 minutes' for update skip locked loop
  update studio_stage_steps set state='reconcile_required',error_code='worker_lease_expired' where job_id=j.id and state='claimed';
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=j.id;
  n:=n+1;
 end loop; return n;
end $$;
revoke all on function public.studio_stage_mark_stale(uuid) from public,anon,authenticated;
grant execute on function public.studio_stage_mark_stale(uuid) to service_role;