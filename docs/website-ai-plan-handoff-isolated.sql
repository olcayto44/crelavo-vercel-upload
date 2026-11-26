-- Isolated-only handoff. A free, explicit review/approval of an existing saved
-- assistant brief. Does not reserve or spend credits, or call a provider.
begin;
create function public.website_ai_handoff_approved_plan(p_user uuid,p_project uuid,p_revision integer,p_snapshot jsonb,p_brief jsonb,p_hash text,p_pack text,p_credits integer)
returns jsonb language plpgsql security definer set search_path='' as $f$
declare a public.studio_agent_projects%rowtype; p public.production_requests%rowtype; new_id uuid; expected integer;
begin
 if p_user is null or p_project is null or p_revision is null or p_revision<1 or p_snapshot is null or jsonb_typeof(p_snapshot)<>'object' or p_brief is null or jsonb_typeof(p_brief)<>'object' or octet_length(p_brief::text)>20000 or coalesce(p_hash,'') !~ '^[a-f0-9]{64}$' then return jsonb_build_object('state','denied');end if;
 expected=case p_pack when 'landing_page' then 500 when 'business_website' then 1500 else null end;
 if expected is null or p_credits is distinct from expected or p_brief->>'locale' is distinct from 'en' or length(coalesce(p_brief->>'brand','')) not between 1 and 160 or length(coalesce(p_brief->>'brief','')) not between 20 and 6000 then return jsonb_build_object('state','denied');end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('website-ai-handoff:'||p_user::text,0));
 select * into a from public.studio_agent_projects where id=p_project and user_id=p_user and category_id='website' for update;
 if not found or a.revision<>p_revision or a.brief is distinct from p_snapshot then return jsonb_build_object('state','stale_or_missing');end if;
 if exists(select 1 from public.studio_agent_website_bindings where project_id=p_project) or exists(select 1 from public.studio_agent_requests where project_id=p_project and state in ('reserved','dispatched','uncertain','result_ready')) then return jsonb_build_object('state','project_not_available');end if;
 if a.production_id is not null then
  select * into p from public.production_requests where id=a.production_id and user_id=p_user and production_type='website';
  if found and p.output_json->'websiteAssistant'->>'planHash'=p_hash and p.output_json->'websiteAssistant'->'brief'=p_brief and p.output_json->'websiteAssistant'->>'approvedHash'=p_hash then return jsonb_build_object('state','already_bound','productionId',p.id);end if;
  return jsonb_build_object('state','project_already_bound');
 end if;
 if (select count(*) from public.production_requests where user_id=p_user and request_metadata->>'source'='studio_ai_handoff_test' and created_at>now()-interval '1 day')>=10 then return jsonb_build_object('state','rate_limited');end if;
 insert into public.production_requests(user_id,production_type,package_id,title,prompt,status,generation_status,estimated_credits,reserved_credits,input_json,request_metadata,output_json)
 values(p_user,'website',p_pack,left(p_brief->>'brand'||' website',160),p_brief->>'brief','pending','pending',p_credits,0,jsonb_build_object('websiteBrief',p_brief),jsonb_build_object('source','studio_ai_handoff_test','assistantProjectId',p_project,'assistantRevision',p_revision),jsonb_build_object('websiteAssistant',jsonb_build_object('brief',p_brief,'phase','approved','planHash',p_hash,'approvedHash',p_hash,'packId',p_pack,'credits',p_credits,'messages','[]'::jsonb))) returning id into new_id;
 update public.studio_agent_projects set production_id=new_id,updated_at=now() where id=p_project and user_id=p_user and production_id is null;
 if not found then raise exception 'handoff_conflict';end if;
 return jsonb_build_object('state','approved','productionId',new_id);
end $f$;
revoke all on function public.website_ai_handoff_approved_plan(uuid,uuid,integer,jsonb,jsonb,text,text,integer) from public,anon,authenticated,service_role;
grant execute on function public.website_ai_handoff_approved_plan(uuid,uuid,integer,jsonb,jsonb,text,text,integer) to service_role;
commit;
