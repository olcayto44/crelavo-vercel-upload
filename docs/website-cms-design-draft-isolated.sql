-- Isolated crelavo-test only. Untrusted private draft storage, never a published artifact.
create table public.website_cms_design_drafts (
 site_id uuid primary key references public.website_cms_sites(id) on delete cascade,
 design jsonb not null check(case when jsonb_typeof(design)='object' and jsonb_typeof(design->'pages')='array' then design->'version'='2'::jsonb and jsonb_array_length(design->'pages') between 1 and 12 and octet_length(design::text)<=120000 else false end),
 version integer not null check(version>0),
 updated_at timestamptz not null default now()
);
create table public.website_cms_design_revisions (
 site_id uuid not null references public.website_cms_design_drafts(site_id) on delete cascade,
 version integer not null check(version>0),
 design jsonb not null,
 changed_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 primary key(site_id,version)
);
alter table public.website_cms_design_drafts enable row level security;
alter table public.website_cms_design_revisions enable row level security;
revoke all on public.website_cms_design_drafts,public.website_cms_design_revisions from public,anon,authenticated;
grant select on public.website_cms_design_drafts,public.website_cms_design_revisions to authenticated;
create policy website_design_read on public.website_cms_design_drafts for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_design_drafts.site_id and m.user_id=(select auth.uid())));
create policy website_design_revision_read on public.website_cms_design_revisions for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_design_revisions.site_id and m.user_id=(select auth.uid())));
create function website_cms_private.save_design(p_site uuid,p_version integer,p_design jsonb) returns integer
language plpgsql security definer set search_path='' as $fn$
declare actor uuid:=auth.uid();v integer;
begin
 if actor is null or p_version is null or p_version<0 or p_design is null then return null;end if;
 perform 1 from public.website_cms_members m where m.site_id=p_site and m.user_id=actor and m.role in ('owner','editor') for share;
 if not found then return null;end if;
 if p_version=0 then
 insert into public.website_cms_design_drafts(site_id,design,version) values(p_site,p_design,1) on conflict(site_id) do nothing returning version into v;
 else
 update public.website_cms_design_drafts set design=p_design,version=version+1,updated_at=now() where site_id=p_site and version=p_version returning version into v;
 end if;
 if v is not null then insert into public.website_cms_design_revisions(site_id,version,design,changed_by) values(p_site,v,p_design,actor);end if;
 return v;
end $fn$;
revoke all on function website_cms_private.save_design(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function website_cms_private.save_design(uuid,integer,jsonb) to authenticated;
create function public.website_cms_save_design(p_site uuid,p_version integer,p_design jsonb) returns integer
language sql security invoker set search_path='' as $wrapper$
select website_cms_private.save_design(p_site,p_version,p_design)
$wrapper$;
revoke all on function public.website_cms_save_design(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.website_cms_save_design(uuid,integer,jsonb) to authenticated;
