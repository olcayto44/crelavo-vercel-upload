begin;
create table public.model_catalog_drafts (
 model_id text primary key check(model_id ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
 name text not null check(length(name) between 1 and 100),
 developer text not null check(length(developer) between 1 and 100),
 family text not null check(family in ('video','image','audio')),
 provider text not null check(provider in ('higgsfield','kie','unassigned')),
 proposed_credits integer check(proposed_credits between 1 and 100000),
 pricing_unit text not null check(pricing_unit in ('second','output')),
 proposed_micro_usd bigint check(proposed_micro_usd between 0 and 100000000),
 revision integer not null default 1 check(revision>0),
 production_enabled boolean not null default false check(not production_enabled),
 updated_at timestamptz not null default now()
);
create table public.model_catalog_draft_history (
 model_id text not null references public.model_catalog_drafts(model_id),
 revision integer not null,
 snapshot jsonb not null,
 created_at timestamptz not null default now(),
 primary key(model_id,revision)
);
alter table public.model_catalog_drafts enable row level security;
alter table public.model_catalog_draft_history enable row level security;
revoke all on public.model_catalog_drafts,public.model_catalog_draft_history from public,anon,authenticated;
grant select,insert,update on public.model_catalog_drafts to service_role;
grant select,insert on public.model_catalog_draft_history to service_role;
create function public.model_catalog_save_draft(p_id text,p_name text,p_developer text,p_family text,p_provider text,p_credits integer,p_unit text,p_cost bigint,p_revision integer)
returns public.model_catalog_drafts language plpgsql security invoker set search_path='' as $$
declare d public.model_catalog_drafts;
begin
 perform pg_advisory_xact_lock(hashtextextended('model-catalog:'||p_id,0));
 select * into d from public.model_catalog_drafts where model_id=p_id for update;
 if found then
 if d.revision is distinct from p_revision then raise exception 'revision_conflict';end if;
 update public.model_catalog_drafts set name=p_name,developer=p_developer,family=p_family,provider=p_provider,proposed_credits=p_credits,pricing_unit=p_unit,proposed_micro_usd=p_cost,revision=revision+1,updated_at=now() where model_id=p_id returning * into d;
 else
 if p_revision is distinct from 0 then raise exception 'revision_conflict';end if;
 insert into public.model_catalog_drafts(model_id,name,developer,family,provider,proposed_credits,pricing_unit,proposed_micro_usd) values(p_id,p_name,p_developer,p_family,p_provider,p_credits,p_unit,p_cost) returning * into d;
 end if;
 insert into public.model_catalog_draft_history(model_id,revision,snapshot) values(d.model_id,d.revision,to_jsonb(d));
 return d;
end $$;
revoke all on function public.model_catalog_save_draft(text,text,text,text,text,integer,text,bigint,integer) from public,anon,authenticated;
grant execute on function public.model_catalog_save_draft(text,text,text,text,text,integer,text,bigint,integer) to service_role;
commit;