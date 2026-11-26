-- Isolated crelavo-test only. This stores a requested scope, never an entitlement or release flag.
create table public.website_cms_industry_plans (
 site_id uuid primary key references public.website_cms_sites(id) on delete cascade,
 sector text not null check(sector in ('corporate','retail','restaurant','hotel','healthcare','dental','beauty','fitness','real_estate','construction','legal','accounting','education','travel','automotive','logistics','agency','saas','marketplace','events','nonprofit','manufacturing','recruitment','news','professional','custom')),
 extra_modules text[] not null default '{}' check(cardinality(extra_modules)<=30 and array_position(extra_modules,null) is null and extra_modules <@ array['cms','seo','media','accounts','forms','analytics','localization','notifications','catalog','inventory','checkout','orders','booking','crm','memberships','courses','listings','jobs','events','documents','support','quotes','delivery','reviews','locations','billing','accessibility','security','hosting','backup']::text[]),
 version integer not null check(version>0),
 updated_at timestamptz not null default now()
);
create table public.website_cms_industry_plan_revisions (
 site_id uuid not null references public.website_cms_industry_plans(site_id) on delete cascade,
 version integer not null,
 changed_by uuid not null references auth.users(id),
 sector text not null,
 extra_modules text[] not null,
 created_at timestamptz not null default now(),
 primary key(site_id,version)
);
alter table public.website_cms_industry_plans enable row level security;
alter table public.website_cms_industry_plan_revisions enable row level security;
revoke all on public.website_cms_industry_plans,public.website_cms_industry_plan_revisions from public,anon,authenticated;
grant select on public.website_cms_industry_plans,public.website_cms_industry_plan_revisions to authenticated;
create policy industry_plan_read on public.website_cms_industry_plans for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_industry_plans.site_id and m.user_id=(select auth.uid())));
create policy industry_revision_read on public.website_cms_industry_plan_revisions for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_industry_plan_revisions.site_id and m.user_id=(select auth.uid())));
create function website_cms_private.save_industry_plan(p_site uuid,p_version integer,p_sector text,p_extra text[]) returns integer
language plpgsql security definer set search_path='' as $fn$
declare actor uuid:=auth.uid();v integer;
begin
 if actor is null or p_version is null or p_version<0 or p_extra is null then return null;end if;
 perform 1 from public.website_cms_members m where m.site_id=p_site and m.user_id=actor and m.role in ('owner','editor') for share;
 if not found then return null;end if;
 if cardinality(p_extra)<>(select count(distinct x) from unnest(p_extra) x) then raise exception 'invalid_modules';end if;
 if p_version=0 then
 insert into public.website_cms_industry_plans(site_id,sector,extra_modules,version) values(p_site,p_sector,p_extra,1) on conflict(site_id) do nothing returning version into v;
 else
 update public.website_cms_industry_plans set sector=p_sector,extra_modules=p_extra,version=version+1,updated_at=now() where site_id=p_site and version=p_version returning version into v;
 end if;
 if v is not null then insert into public.website_cms_industry_plan_revisions(site_id,version,changed_by,sector,extra_modules) values(p_site,v,actor,p_sector,p_extra);end if;
 return v;
end $fn$;
revoke all on function website_cms_private.save_industry_plan(uuid,integer,text,text[]) from public,anon,authenticated;
grant execute on function website_cms_private.save_industry_plan(uuid,integer,text,text[]) to authenticated;
create function public.website_cms_save_industry_plan(p_site uuid,p_version integer,p_sector text,p_extra text[]) returns integer
language sql security invoker set search_path='' as $wrapper$
select website_cms_private.save_industry_plan(p_site,p_version,p_sector,p_extra)
$wrapper$;
revoke all on function public.website_cms_save_industry_plan(uuid,integer,text,text[]) from public,anon,authenticated;
grant execute on function public.website_cms_save_industry_plan(uuid,integer,text,text[]) to authenticated;
