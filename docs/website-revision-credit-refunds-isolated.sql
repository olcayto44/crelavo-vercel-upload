-- Isolated pilot: immutable credit adjustment for known settled Website revision failures.
-- Provider usage and original debit remain in the original request; this is not a provider refund.
begin;
create table if not exists public.studio_website_revision_refunds(
 user_id uuid not null,request_id uuid not null,site_id uuid not null,
 units integer not null check(units>0),
 reason text not null check(reason='no_valid_website_revision'),
 created_at timestamptz not null default now(),
 primary key(user_id,request_id),
 foreign key(user_id,request_id) references public.studio_agent_requests(user_id,request_id)
);
alter table public.studio_website_revision_refunds enable row level security;
revoke all on public.studio_website_revision_refunds from public,anon,authenticated,service_role;
grant select,insert on public.studio_website_revision_refunds to service_role;
create or replace function public.studio_website_revision_refund(p_user uuid,p_site uuid,p_request uuid) returns jsonb
language plpgsql security invoker set search_path='' as $f$
declare j public.studio_agent_requests%rowtype; existing public.studio_website_revision_refunds%rowtype; v_units integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('studio-agent-accounting-v1',0));
 select r.* into j from public.studio_agent_requests r
 join public.studio_agent_website_bindings b on b.user_id=r.user_id and b.project_id=r.project_id and b.site_id=p_site
 join public.website_cms_members m on m.user_id=r.user_id and m.site_id=b.site_id and m.role in ('owner','editor')
 where r.user_id=p_user and r.request_id=p_request and r.category_id='website' for update of r;
 if not found then return jsonb_build_object('state','denied');end if;
 if j.state<>'settled' or j.response is null or j.result is null or j.response ? 'websiteRevisionProposal' or j.result ? 'websiteRevisionProposal' or j.charged_units is null or j.charged_units<0 or j.response->'chargedCredits' is distinct from to_jsonb(j.charged_units) or j.actual_micro_usd is null or coalesce(j.provider_request_id,'') !~ '^chatcmpl-[a-zA-Z0-9_-]{1,180}$' then return jsonb_build_object('state','denied');end if;
 if j.response->'blockedTools' is distinct from '["website_revision_no_proposal"]'::jsonb and j.response->'blockedTools' is distinct from '["invalid_model_output"]'::jsonb then return jsonb_build_object('state','denied');end if;
 select * into existing from public.studio_website_revision_refunds where user_id=p_user and request_id=p_request;
 if found then
 if existing.site_id<>p_site or existing.units<>j.charged_units then raise exception 'refund_evidence_conflict';end if;
 return jsonb_build_object('state','already_refunded','refundedCredits',existing.units,'netCredits',0);
 end if;
 v_units=j.charged_units;
 if v_units=0 then return jsonb_build_object('state','no_charge','refundedCredits',0,'netCredits',0);end if;
 insert into public.studio_website_revision_refunds(user_id,request_id,site_id,units,reason) values(p_user,p_request,p_site,v_units,'no_valid_website_revision');
 update public.studio_agent_wallets_private set balance=balance+v_units where user_id=p_user;
 if not found then raise exception 'refund_wallet_missing';end if;
 return jsonb_build_object('state','refunded','refundedCredits',v_units,'netCredits',0);
end $f$;
revoke all on function public.studio_website_revision_refund(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.studio_website_revision_refund(uuid,uuid,uuid) to service_role;
commit;
