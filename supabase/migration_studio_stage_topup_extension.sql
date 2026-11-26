-- A verified top-up may extend expiry without invalidating a claimed stage. Subscription and rollover changes remain fenced.
create or replace function public.studio_stage_finish(p_user uuid,p_job uuid,p_ordinal integer,p_token uuid,p_outcome text,p_receipt jsonb,p_artifact text,p_code text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j studio_stage_jobs%rowtype;s studio_stage_steps%rowtype;w credit_balances%rowtype;leftover integer;r integer;c integer;b integer;t integer;take integer;next_cost integer;available integer;next_state text;
begin
 select * into j from studio_stage_jobs where id=p_job and user_id=p_user for update;
 if not found then raise exception 'stage_job_not_found';end if;
 select * into s from studio_stage_steps where job_id=p_job and ordinal=p_ordinal for update;
 if not found or s.claim_token is distinct from p_token or p_token is null then raise exception 'stage_claim_mismatch';end if;
 if s.state='ready' then return jsonb_build_object('state',j.state,'idempotent',true);end if;
 if s.state<>'claimed' or j.state<>'running' then return jsonb_build_object('state',j.state,'idempotent',true);end if;
 if p_outcome not in ('ready','uncertain','not_dispatched') then raise exception 'stage_outcome_invalid';end if;
 if p_outcome='uncertain' then
  update studio_stage_steps set state='reconcile_required',error_code=left(coalesce(p_code,'provider_outcome_unconfirmed'),100) where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=p_job;
  return jsonb_build_object('state','reconcile_required');
 end if;
 select * into w from credit_balances where user_id=p_user for update;
 if not found or w.reserved<s.credits or w.balance<s.credits or (s.credit_period->'billing' is distinct from to_jsonb(w.billing_cycle_ends_at) and not (s.credit_period->>'billing' is null and w.billing_cycle_ends_at is null))
 or (s.credit_period->'rollover' is distinct from to_jsonb(w.last_rollover_at) and not (s.credit_period->>'rollover' is null and w.last_rollover_at is null))
 or (s.credit_period->>'topup' is not null and (w.topup_expires_at is null or w.topup_expires_at<(s.credit_period->>'topup')::timestamptz))
 or w.balance<>w.current_subscription_credits+w.rolled_over_credits+w.topup_credits+w.bonus_credits then
  update studio_stage_steps set state='reconcile_required',error_code='wallet_or_credit_period_changed',receipt=p_receipt,artifact_base64=p_artifact where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='reconcile_required',updated_at=now() where id=p_job;
  return jsonb_build_object('state','reconcile_required');
 end if;
 if p_outcome='not_dispatched' then
  update credit_balances set reserved=reserved-s.credits,updated_at=now() where user_id=p_user;
  update studio_stage_steps set state='pending',claim_token=null,credit_period=null,claimed_at=null,error_code=left(coalesce(p_code,'not_dispatched'),100) where job_id=p_job and ordinal=p_ordinal;
  update studio_stage_jobs set state='queued',auto_resume=false,updated_at=now() where id=p_job;
  return jsonb_build_object('state','queued','released',s.credits);
 end if;
 -- Durable receipt + verified artifact are mandatory; API checks bytes with sharp and hash.
 if p_receipt is null or jsonb_typeof(p_receipt)<>'object' or coalesce(p_receipt->>'sha256','') !~ '^[a-f0-9]{64}$' or coalesce(p_receipt->>'providerRequestId','') !~ '^[A-Za-z0-9_-]{8,160}$' or p_artifact is null or length(p_artifact) not between 16 and 2800000 then raise exception 'stage_verified_artifact_required';end if;
 leftover:=s.credits;r:=w.rolled_over_credits;c:=w.current_subscription_credits;b:=w.bonus_credits;t:=w.topup_credits;
 take:=least(r,leftover);r:=r-take;leftover:=leftover-take;
 take:=least(c,leftover);c:=c-take;leftover:=leftover-take;
 take:=least(b,leftover);b:=b-take;leftover:=leftover-take;
 take:=least(t,leftover);t:=t-take;leftover:=leftover-take;
 if leftover<>0 or least(r,c,b,t)<0 then raise exception 'stage_wallet_bucket_mismatch';end if;
 update credit_balances set balance=balance-s.credits,reserved=reserved-s.credits,rolled_over_credits=r,current_subscription_credits=c,bonus_credits=b,topup_credits=t,updated_at=now() where user_id=p_user;
 update studio_stage_steps set state='ready',receipt=p_receipt,artifact_base64=p_artifact,completed_at=now(),error_code=null where job_id=p_job and ordinal=p_ordinal;
 insert into credit_events(user_id,type,amount,note) values(p_user,'spend',s.credits,'studio-stage:'||p_job::text||':'||p_ordinal::text);
 select credits into next_cost from studio_stage_steps where job_id=p_job and state='pending' order by ordinal limit 1;
 available:=w.balance-w.reserved;
 next_state:=case when next_cost is null then 'ready' when available<next_cost then 'paused_credits' else 'queued' end;
 update studio_stage_jobs set state=next_state,spent_credits=spent_credits+s.credits,updated_at=now() where id=p_job;
 return jsonb_build_object('state',next_state,'available',available,'required',coalesce(next_cost,0),'spent',j.spent_credits+s.credits,'remaining',j.total_credits-j.spent_credits-s.credits);
end $$;

revoke all on function public.studio_stage_finish(uuid,uuid,integer,uuid,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.studio_stage_finish(uuid,uuid,integer,uuid,text,jsonb,text,text) to service_role;
