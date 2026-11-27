-- Isolated candidate. Apply only after acceptance and review. No automatic retry.
begin;
create or replace function public.website_media_journal_ready() returns boolean
language sql stable security invoker set search_path='' as $$select true$$;
create or replace function public.website_media_journal_v1(p_user uuid,p_production uuid,p_hash text,p_slug text,p_action text,p_payload jsonb) returns boolean
language plpgsql security invoker set search_path='' as $$
declare project public.production_requests%rowtype; held public.website_credit_reservations%rowtype; journal jsonb; item jsonb; evidence jsonb; estimated integer;
begin
 if p_hash is null or p_hash !~ '^[a-f0-9]{64}$' or p_slug is null or p_slug !~ '^[a-z][a-z0-9-]{0,48}$'
 or p_action is null or p_action not in ('start','validated','uncertain') or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>210000 then return false;end if;
 select * into project from public.production_requests where id=p_production and user_id=p_user and production_type='website' for update;
 if not found or project.output_json->'websiteAssistant'->>'phase' is distinct from 'generating'
 or project.output_json->'websiteAssistant'->>'planHash' is distinct from p_hash
 or project.output_json->'websiteAssistant'->>'approvedHash' is distinct from p_hash
 or not exists(select 1 from jsonb_array_elements_text(coalesce(project.output_json->'websiteAssistant'->'brief'->'features','[]'::jsonb)) f where lower(trim(f))='ai page images') then return false;end if;
 select * into held from public.website_credit_reservations where production_id=p_production and user_id=p_user for update;
 if not found or held.plan_hash is distinct from p_hash or held.state is distinct from 'reserved' then return false;end if;
 journal=coalesce(project.output_json->'websitePageMediaJournal','{}'::jsonb);item=journal->p_slug;
 if jsonb_typeof(journal) is distinct from 'object' then return false;end if;
 if p_action='start' then
  if item is not null or (select count(*) from jsonb_object_keys(journal))>=5
  or coalesce(p_payload->>'promptHash','') !~ '^[a-f0-9]{64}$' then return false;end if;
  item=jsonb_build_object('state','dispatch_claimed','promptHash',p_payload->>'promptHash','maximumMicroUSD',40000,'startedAt',now());
 else
  if item->>'state' is distinct from 'dispatch_claimed' then return false;end if;
  evidence=p_payload->'receipt';
  if p_action='validated' then
   if evidence->>'provider' is distinct from 'openai' or evidence->>'model' is distinct from 'gpt-image-2.6-flare'
   or evidence->>'costState' is distinct from 'pending_reconciliation'
   or coalesce(evidence->>'providerRequestId','') !~ '^[A-Za-z0-9_-]{8,160}$'
   or coalesce(evidence->>'sha256','') !~ '^[a-f0-9]{64}$'
   or coalesce(p_payload->>'webpHash','') !~ '^[a-f0-9]{64}$'
   or coalesce(evidence->'usage'->>'textTokens','') !~ '^[0-9]{1,5}$'
   or coalesce(evidence->'usage'->>'outputTokens','') !~ '^[0-9]{1,5}$'
   or coalesce(p_payload->>'estimatedMicroUSD','') !~ '^[0-9]{1,5}$'
   or p_payload->'media'->>'page_slug' is distinct from p_slug
   or p_payload->'media'->>'provenance' is distinct from 'ai_generated_verified'
   or length(coalesce(p_payload->'media'->>'image_data','')) not between 24 and 180000
   or exists(select 1 from jsonb_each(journal) j where j.key<>p_slug and j.value->'receipt'->>'providerRequestId'=evidence->>'providerRequestId') then return false;end if;
   estimated=(evidence->'usage'->>'textTokens')::integer*5+(evidence->'usage'->>'outputTokens')::integer*30;
   if estimated not between 1 and 40000 or estimated is distinct from (p_payload->>'estimatedMicroUSD')::integer then return false;end if;
  end if;
  item=item||p_payload||jsonb_build_object('state',p_action,'invoicePending',true,'finishedAt',now());
 end if;
 update public.production_requests set output_json=jsonb_set(output_json,'{websitePageMediaJournal}',jsonb_set(journal,array[p_slug],item,true),true),updated_at=now() where id=p_production and user_id=p_user;
 return true;
end $$;
revoke all on function public.website_media_journal_ready() from public,anon,authenticated;
revoke all on function public.website_media_journal_v1(uuid,uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.website_media_journal_ready() to service_role;
grant execute on function public.website_media_journal_v1(uuid,uuid,text,text,text,jsonb) to service_role;
commit;
