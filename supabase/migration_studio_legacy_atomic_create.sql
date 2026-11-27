-- Legacy production creation: reserve and persist the job in one transaction.
-- This is a service-only candidate. Enable the route only after legacy settlement writers are migrated.
create or replace function public.studio_legacy_create(p_user uuid,p_payload jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w credit_balances%rowtype; j production_requests%rowtype; a integer; e integer; f text; have_wallet boolean;
begin
 if p_user is null or p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>2000000 or p_payload->>'user_id' is distinct from p_user::text or p_payload->>'status' is distinct from 'queued' then raise exception 'legacy_create_invalid';end if;
 a:=(p_payload->>'reserved_credits')::integer;e:=(p_payload->>'estimated_credits')::integer;f:=lower(regexp_replace(trim(p_payload#>>'{request_metadata,requestFingerprint}'),'[[:space:]]+',' ','g'));
 if a is null or a<0 or a>1000000 or f is null or length(f) not between 1 and 32000 or e is null or e<a or e>1000000 or coalesce(p_payload->>'title','')='' or coalesce(p_payload->>'production_type','')='' or jsonb_typeof(p_payload->'legal_acceptance_snapshot') is distinct from 'object' then raise exception 'legacy_create_terms_invalid';end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-legacy-create:'||p_user::text,0));
 select * into w from credit_balances where user_id=p_user for update;have_wallet:=found;
 select * into j from (select * from production_requests where user_id=p_user and status<>'deleted' order by created_at desc limit 20) q
 where q.status not in ('failed','cancelled') and lower(regexp_replace(trim(q.request_metadata->>'requestFingerprint'),'[[:space:]]+',' ','g'))=f limit 1;
 if found then
  -- Never treat a price, package or initial reservation change as an identical replay.
  -- Older rows without immutable reservation terms require reconciliation, not a new charge.
  if j.production_type is distinct from p_payload->>'production_type' or j.package_id is distinct from p_payload->>'package_id' or j.estimated_credits is distinct from e or j.request_metadata->'atomicCreateReservedCredits' is distinct from to_jsonb(a) then
   return jsonb_build_object('state','reconcile_required','code','idempotency_terms_mismatch');
  end if;
  return jsonb_build_object('state','existing','production',to_jsonb(j));
 end if;
 if a>0 and (not have_wallet or w.balance-w.reserved<a) then return jsonb_build_object('state','insufficient','available',case when have_wallet then greatest(0,w.balance-w.reserved) else 0 end);end if;
 if have_wallet and (least(w.balance,w.reserved,w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits)<0 or w.reserved>w.balance or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits) then return jsonb_build_object('state','reconcile_required');end if;
 insert into production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,request_metadata,input_json,materials_json,estimated_credits,reserved_credits,output_json,admin_notes,legal_acceptance_snapshot)
 values(p_user,p_payload->>'production_type',p_payload->>'package_id',p_payload->>'title',p_payload->>'prompt','queued',p_payload->>'generation_status',jsonb_set(p_payload->'request_metadata','{atomicCreateReservedCredits}',to_jsonb(a),true),p_payload->'input_json',p_payload->'materials_json',e,a,p_payload->'output_json',p_payload->>'admin_notes',p_payload->'legal_acceptance_snapshot') returning * into j;
 if a>0 then
  update credit_balances set reserved=reserved+a,updated_at=now() where user_id=p_user;
  insert into credit_events(user_id,type,amount,note) values(p_user,'reserve',a,'legacy-production:'||j.id::text);
 end if;
 return jsonb_build_object('state','created','production',to_jsonb(j));
end $$;
revoke all on function public.studio_legacy_create(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.studio_legacy_create(uuid,jsonb) to service_role;

-- Bind idempotency to the original amount AND action; reused mismatched terms are not success.
create or replace function public.studio_wallet_spend(p_user uuid,p_amount integer,p_key text,p_note text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w credit_balances%rowtype; remaining integer;r integer;c integer;b integer;t integer;take integer; prior credit_events%rowtype;
begin
 if p_user is null or p_amount is null or p_amount not between 1 and 100000 or p_key is null or length(p_key) not between 8 and 200 or length(coalesce(p_note,''))>200 then raise exception 'invalid_wallet_spend';end if;
 select * into w from credit_balances where user_id=p_user for update;
 if not found then return jsonb_build_object('state','insufficient','available',0,'reserved',0);end if;
 select * into prior from credit_events where user_id=p_user and stripe_session_id=p_key and type='spend' limit 1;
 if found then
  if prior.amount is distinct from p_amount or prior.note is distinct from p_note then return jsonb_build_object('state','reconcile_required','code','idempotency_terms_mismatch');end if;
  return jsonb_build_object('state','already_spent','available',w.balance-w.reserved,'reserved',w.reserved);
 end if;
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

-- Candidate: only an explicitly reviewed failed job with an attributable atomic hold.
-- Keep the route disabled until all competing legacy writers are migrated.
create or replace function public.studio_legacy_refund_reviewed(p_production uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare u uuid; w credit_balances%rowtype; j production_requests%rowtype; a integer; proof_count integer; res jsonb;
begin
 if p_production is null then raise exception 'legacy_refund_invalid';end if;
 select user_id into u from production_requests where id=p_production;
 if not found then return jsonb_build_object('state','not_found');end if;
 select * into w from credit_balances where user_id=u for update;
 if not found then return jsonb_build_object('state','reconcile_required');end if;
 select * into j from production_requests where id=p_production and user_id=u for update;
 if not found then return jsonb_build_object('state','reconcile_required');end if;
 if j.status='failed' and j.reserved_credits=0 and j.output_json#>>'{creditResolution,status}'='refunded_reserved' and j.output_json#>>'{creditResolution,atomicLegacyRefund}'='true' then
  return jsonb_build_object('state','already_refunded','production',to_jsonb(j),'balance',jsonb_build_object('balance',w.balance,'reserved',w.reserved),'refunded_credits',0,'spent_credits',0);
 end if;
 a:=j.reserved_credits;
 if j.status is distinct from 'failed' or j.output_json#>>'{creditResolution,status}' is distinct from 'admin_review_required' or a is null or a<=0 or j.request_metadata->'atomicCreateReservedCredits' is distinct from to_jsonb(a) then
  return jsonb_build_object('state','reconcile_required');
 end if;
 select count(*) into proof_count from credit_events where user_id=u and type='reserve' and note='legacy-production:'||p_production::text and amount=a;
 if proof_count<>1 or exists(select 1 from credit_events where user_id=u and type='refund' and note='legacy-refund:'||p_production::text) or w.reserved<a or w.reserved>w.balance or least(w.balance,w.reserved,w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits)<0 or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then
  return jsonb_build_object('state','reconcile_required');
 end if;
 res:=coalesce(j.output_json->'creditResolution','{}'::jsonb)||jsonb_build_object('status','refunded_reserved','refundedCredits',a,'releasedReservedCredits',a,'spentCredits',0,'resolvedAt',now(),'atomicLegacyRefund',true);
 update credit_balances set reserved=reserved-a,updated_at=now() where user_id=u returning * into w;
 insert into credit_events(user_id,type,amount,note) values(u,'refund',a,'legacy-refund:'||p_production::text);
 update production_requests set reserved_credits=0,output_json=jsonb_set(coalesce(output_json,'{}'::jsonb),'{creditResolution}',res,true),admin_notes='Reserved credits released atomically after admin review.',updated_at=now() where id=p_production returning * into j;
 return jsonb_build_object('state','refunded','production',to_jsonb(j),'balance',jsonb_build_object('balance',w.balance,'reserved',w.reserved),'refunded_credits',a,'spent_credits',0);
end $$;
revoke all on function public.studio_legacy_refund_reviewed(uuid) from public,anon,authenticated;
grant execute on function public.studio_legacy_refund_reviewed(uuid) to service_role;

-- Atomic expiry candidate: only a never-started atomic job with its own hold.
-- Do not enable until provider start/claim and all legacy wallet writers use compatible locks.
create or replace function public.studio_legacy_expire_unstarted(p_production uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare u uuid; w credit_balances%rowtype; j production_requests%rowtype; a integer; n integer; res jsonb; have_wallet boolean;
begin
 if p_production is null then raise exception 'legacy_expiry_invalid';end if;
 select user_id into u from production_requests where id=p_production;
 if not found then return jsonb_build_object('state','not_found');end if;
 select * into w from credit_balances where user_id=u for update;have_wallet:=found;
 select * into j from production_requests where id=p_production and user_id=u for update;
 if not found then return jsonb_build_object('state','reconcile_required');end if;
 if j.status='cancelled' and j.reserved_credits=0 and j.output_json#>>'{creditResolution,atomicLegacyExpiry}'='true' then return jsonb_build_object('state','already_expired','released_credits',0);end if;
 a:=j.reserved_credits;
 if j.status is distinct from 'queued' or j.generation_status is null or j.generation_status not in ('automation_queued','waiting_provider_config') or coalesce(j.automation_status,'queued') not in ('queued','waiting_provider_config') or j.created_at>now()-interval '24 hours' or j.started_at is not null or a is null or a<0 or j.request_metadata->'atomicCreateReservedCredits' is distinct from to_jsonb(a) or coalesce(j.output_json,'{}'::jsonb) ?| array['visualJob','renderJob','providerJob','providerJobId','provider_job_id','providerStartDiagnostic','creditResolution','finalImageUrl','finalVideoUrl'] then
  return jsonb_build_object('state','reconcile_required');
 end if;
 if a>0 then
  if not have_wallet then return jsonb_build_object('state','reconcile_required');end if;
  select count(*) into n from credit_events where user_id=u and type='reserve' and note='legacy-production:'||p_production::text and amount=a;
  if n<>1 or exists(select 1 from credit_events where user_id=u and type='refund' and note='legacy-expire:'||p_production::text) or w.reserved<a or w.reserved>w.balance or least(w.balance,w.reserved,w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits)<0 or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then return jsonb_build_object('state','reconcile_required');end if;
  update credit_balances set reserved=reserved-a,updated_at=now() where user_id=u;
  insert into credit_events(user_id,type,amount,note) values(u,'refund',a,'legacy-expire:'||p_production::text);
 end if;
 res:=jsonb_build_object('status','expired_before_provider_start_refunded','reason','provider_not_started_within_24h','spentCredits',0,'refundedCredits',a,'releasedReservedCredits',a,'resolvedAt',now(),'atomicLegacyExpiry',true);
 update production_requests set status='cancelled',automation_status='expired_before_provider_start',generation_status='expired_no_provider_cost',reserved_credits=0,output_json=coalesce(output_json,'{}'::jsonb)||jsonb_build_object('creditResolution',res,'autoExpiredBeforeProviderStart',true,'autoExpiredAt',now()),admin_notes='Atomically expired unstarted production; no customer spend.',updated_at=now() where id=p_production;
 return jsonb_build_object('state','expired','released_credits',a);
end $$;
revoke all on function public.studio_legacy_expire_unstarted(uuid) from public,anon,authenticated;
grant execute on function public.studio_legacy_expire_unstarted(uuid) to service_role;

-- Member cancellation candidate, before provider start only. Maintain existing 50% fee.
-- Enable only when provider claims and competing legacy writers use compatible locks.
create or replace function public.studio_legacy_cancel_unstarted(p_user uuid,p_production uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w credit_balances%rowtype; j production_requests%rowtype; a integer; fee integer; released integer; n integer; rem integer; r integer;c integer;b integer;t integer; take integer; res jsonb; have_wallet boolean;
begin
 if p_user is null or p_production is null then raise exception 'legacy_cancel_invalid';end if;
 if not exists(select 1 from production_requests where id=p_production and user_id=p_user) then return jsonb_build_object('state','not_found');end if;
 select * into w from credit_balances where user_id=p_user for update;have_wallet:=found;
 select * into j from production_requests where id=p_production and user_id=p_user for update;
 if not found then return jsonb_build_object('state','not_found');end if;
 if j.status='cancelled' and j.reserved_credits=0 and j.output_json#>>'{creditResolution,atomicLegacyCancel}'='true' then
  return jsonb_build_object('state','already_cancelled','production',to_jsonb(j),'cancellation_fee',(j.output_json#>>'{creditResolution,spentCredits}')::int,'refund_amount',(j.output_json#>>'{creditResolution,releasedReservedCredits}')::int);
 end if;
 a:=j.reserved_credits;
 if j.status is distinct from 'queued' or j.generation_status is null or j.generation_status not in ('automation_queued','waiting_provider_config') or coalesce(j.automation_status,'queued') not in ('queued','waiting_provider_config') or j.started_at is not null or a is null or a<0 or j.request_metadata->'atomicCreateReservedCredits' is distinct from to_jsonb(a) or coalesce(j.output_json,'{}'::jsonb) ?| array['visualJob','renderJob','providerJob','providerJobId','provider_job_id','providerStartDiagnostic','creditResolution','finalImageUrl','finalVideoUrl'] then
  return jsonb_build_object('state','reconcile_required');
 end if;
 fee:=(a+1)/2;released:=a-fee;
 if a>0 then
  if not have_wallet then return jsonb_build_object('state','reconcile_required');end if;
  select count(*) into n from credit_events where user_id=p_user and type='reserve' and note='legacy-production:'||p_production::text and amount=a;
  if n<>1 or exists(select 1 from credit_events where user_id=p_user and note in ('legacy-cancel-spend:'||p_production::text,'legacy-cancel-release:'||p_production::text)) or w.reserved<a or w.reserved>w.balance or least(w.balance,w.reserved,w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits)<0 or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then return jsonb_build_object('state','reconcile_required');end if;
  rem:=fee;r:=w.rolled_over_credits;c:=w.current_subscription_credits;b:=w.bonus_credits;t:=w.topup_credits;
  take:=least(r,rem);r:=r-take;rem:=rem-take;
  take:=least(c,rem);c:=c-take;rem:=rem-take;
  take:=least(b,rem);b:=b-take;rem:=rem-take;
  take:=least(t,rem);t:=t-take;rem:=rem-take;
  if rem<>0 then raise exception 'wallet_bucket_mismatch';end if;
  update credit_balances set balance=balance-fee,reserved=reserved-a,rolled_over_credits=r,current_subscription_credits=c,bonus_credits=b,topup_credits=t,updated_at=now() where user_id=p_user;
  if fee>0 then insert into credit_events(user_id,type,amount,note) values(p_user,'spend',fee,'legacy-cancel-spend:'||p_production::text);end if;
  if released>0 then insert into credit_events(user_id,type,amount,note) values(p_user,'refund',released,'legacy-cancel-release:'||p_production::text);end if;
 end if;
 res:=jsonb_build_object('status','cancelled_half_spent','reason','member_cancelled_or_abandoned','spentCredits',fee,'releasedReservedCredits',released,'finalizedAt',now(),'atomicLegacyCancel',true);
 update production_requests set status='cancelled',automation_status='cancelled',generation_status='cancelled_by_member',cancellation_fee_credits=fee,reserved_credits=0,output_json=coalesce(output_json,'{}'::jsonb)||jsonb_build_object('creditResolution',res),error_message='Cancelled by member. Existing 50% reservation fee applied.',updated_at=now() where id=p_production returning * into j;
 return jsonb_build_object('state','cancelled','production',to_jsonb(j),'cancellation_fee',fee,'refund_amount',released);
end $$;
revoke all on function public.studio_legacy_cancel_unstarted(uuid,uuid) from public,anon,authenticated;
grant execute on function public.studio_legacy_cancel_unstarted(uuid,uuid) to service_role;

-- No balance changes on ambiguous failure. Preserve any real provider evidence.
create or replace function public.studio_legacy_hold_failed_start(p_user uuid,p_production uuid,p_reason text,p_known_job boolean)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare j production_requests%rowtype; o jsonb; resolution jsonb; local_block boolean;
begin
 if p_user is null or p_production is null or p_known_job is null or p_reason is null or p_reason not in ('talking_start','ecommerce_pipeline','frame_extraction','missing_reference','image_pipeline','presenter_route_block','video_no_job','unexpected_start_failure') then raise exception 'legacy_failure_review_invalid';end if;
 select * into j from production_requests where id=p_production and user_id=p_user for update;
 if not found then return jsonb_build_object('state','not_found');end if;
 o:=coalesce(j.output_json,'{}'::jsonb);
 if j.status in ('ready','completed','cancelled','deleted') then return jsonb_build_object('state','closed');end if;
 if p_known_job or o ?| array['providerJob','providerJobId','provider_job_id','renderJob','visualJob','finalImageUrl','finalVideoUrl'] then return jsonb_build_object('state','provider_poll_required');end if;
 if o#>>'{creditResolution,status}' in ('provider_outcome_unconfirmed','admin_review_required') then return jsonb_build_object('state','already_in_review');end if;
 if o ? 'creditResolution' then return jsonb_build_object('state','reconcile_required');end if;
 local_block:=p_reason in ('missing_reference','presenter_route_block') and j.started_at is null and j.status='queued' and j.generation_status in ('automation_queued','waiting_provider_config') and coalesce(j.automation_status,'queued') in ('queued','waiting_provider_config');
 resolution:=jsonb_build_object('status',case when local_block then 'admin_review_required' else 'provider_outcome_unconfirmed' end,'reason',p_reason,'reservedCredits',j.reserved_credits,'recordedAt',now(),'automaticRefundAllowed',false);
 update production_requests set status='failed',automation_status='admin_recovery_required',generation_status='provider_outcome_reconciliation_required',output_json=o||jsonb_build_object('creditResolution',resolution),admin_notes='Provider outcome requires verification. Reservation retained; no automated credit mutation.',error_message='Production requires review before settlement.',updated_at=now() where id=p_production;
 return jsonb_build_object('state','review_required');
end $$;
revoke all on function public.studio_legacy_hold_failed_start(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.studio_legacy_hold_failed_start(uuid,uuid,text,boolean) to service_role;

-- Candidate: settle only server-validated, stored video delivery.
create or replace function public.studio_legacy_settle_video(p_user uuid,p_job uuid,p_stamp timestamptz,p_bucket text,p_object text,p_url text,p_output jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w credit_balances%rowtype; j production_requests%rowtype; a int; n int; rem int; r int; c int; b int; t int; take int;
begin
 if p_user is null or p_job is null or p_stamp is null or p_bucket is null or p_object is null or p_url is null or p_output is null then raise exception 'invalid_settlement'; end if;
 if p_bucket !~ '^[a-zA-Z0-9_-]{1,100}$' or p_object !~ ('^'||p_job::text||'/(final-render|provider-visual|character-dialogue-final-render)[.]mp4$') then raise exception 'invalid_object'; end if;
 if p_url !~ '^https://' or right(p_url,length('/storage/v1/object/public/'||p_bucket||'/'||p_object)) <> '/storage/v1/object/public/'||p_bucket||'/'||p_object then raise exception 'invalid_delivery_url'; end if;
 if not exists(select 1 from production_requests where id=p_job and user_id=p_user) then return jsonb_build_object('state','not_found'); end if;
 select * into w from credit_balances where user_id=p_user for update;
 if not found then return jsonb_build_object('state','reconcile_required'); end if;
 select * into j from production_requests where id=p_job and user_id=p_user for update;
 if not found then return jsonb_build_object('state','not_found'); end if;
 if j.status='ready' and j.reserved_credits=0 and j.output_json#>>'{creditResolution,atomicLegacyVideoSettlement}'='true' then
  if j.delivery_link is distinct from p_url then return jsonb_build_object('state','reconcile_required'); end if;
  return jsonb_build_object('state','already_settled','production',to_jsonb(j),'charged',0);
 end if;
 a:=j.reserved_credits;
 if j.updated_at is distinct from p_stamp or j.status not in ('queued','in_production') or coalesce(j.output_json,'{}'::jsonb) ? 'creditResolution' or a is null or a<=0 then return jsonb_build_object('state','reconcile_required'); end if;
 if (j.request_metadata->'atomicCreateReservedCredits') is distinct from to_jsonb(a) then return jsonb_build_object('state','reconcile_required'); end if;
 if (p_output#>>'{readyGate,passed}') is distinct from 'true' or (p_output#>'{readyGate,missing}') is distinct from '[]'::jsonb or (p_output#>>'{qualityGate,status}') is distinct from 'passed' then return jsonb_build_object('state','quality_unverified'); end if;
 if (p_output#>>'{finalAssetMirror,status}') is distinct from 'mirrored_provider_url_primary' or (p_output#>>'{finalAssetMirror,storedUrl}') is distinct from p_url or (p_output->>'finalVideoUrl') is distinct from p_url or coalesce(p_output->>'providerStatus','') !~ '_succeeded$' then return jsonb_build_object('state','artifact_unverified'); end if;
 if not exists(select 1 from storage.objects where bucket_id=p_bucket and name=p_object and metadata->>'mimetype'='video/mp4' and (case when metadata->>'size' ~ '^[0-9]{1,12}$' then (metadata->>'size')::bigint>32 else false end)) then return jsonb_build_object('state','artifact_missing'); end if;
 select count(*) into n from credit_events where user_id=p_user and type='reserve' and note='legacy-production:'||p_job::text and amount=a;
 if n<>1 or exists(select 1 from credit_events where user_id=p_user and note='legacy-video-spend:'||p_job::text) or w.reserved<a or w.reserved>w.balance or least(w.balance,w.reserved,w.rolled_over_credits,w.current_subscription_credits,w.bonus_credits,w.topup_credits)<0 or w.balance<>w.rolled_over_credits+w.current_subscription_credits+w.bonus_credits+w.topup_credits then return jsonb_build_object('state','reconcile_required'); end if;
 rem:=a;r:=w.rolled_over_credits;c:=w.current_subscription_credits;b:=w.bonus_credits;t:=w.topup_credits;
 take:=least(r,rem);r:=r-take;rem:=rem-take;
 take:=least(c,rem);c:=c-take;rem:=rem-take;
 take:=least(b,rem);b:=b-take;rem:=rem-take;
 take:=least(t,rem);t:=t-take;rem:=rem-take;
 if rem<>0 then raise exception 'wallet_bucket_mismatch'; end if;
 update credit_balances set balance=balance-a,reserved=reserved-a,rolled_over_credits=r,current_subscription_credits=c,bonus_credits=b,topup_credits=t,updated_at=now() where user_id=p_user;
 insert into credit_events(user_id,type,amount,note) values(p_user,'spend',a,'legacy-video-spend:'||p_job::text);
 update production_requests set status='ready',automation_status='completed',generation_status='final_video_ready',preview_url=p_url,delivery_link=p_url,delivery_zip_url=null,reserved_credits=0,output_json=p_output||jsonb_build_object('creditResolution',jsonb_build_object('status','spent_reserved','spentCredits',a,'atomicLegacyVideoSettlement',true,'finalizedAt',now()),'finalizedReservedCredits',a),completed_at=now(),updated_at=now() where id=p_job returning * into j;
 return jsonb_build_object('state','settled','production',to_jsonb(j),'charged',a);
end $$;
revoke all on function public.studio_legacy_settle_video(uuid,uuid,timestamptz,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.studio_legacy_settle_video(uuid,uuid,timestamptz,text,text,text,jsonb) to service_role;
