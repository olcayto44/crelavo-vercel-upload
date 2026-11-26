-- Preview-only per-user Website assistant binding. No provider invocation or credit mutation.
begin;
create table public.studio_agent_website_bindings(
 user_id uuid not null references auth.users(id),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 project_id uuid not null unique,
 category_id text not null default 'website' check(category_id='website'),
 created_at timestamptz not null default now(),
 primary key(user_id,site_id),
 foreign key(project_id,user_id,category_id) references public.studio_agent_projects(id,user_id,category_id)
);
alter table public.studio_agent_website_bindings enable row level security;
revoke all on public.studio_agent_website_bindings from public,anon,authenticated,service_role;
grant select,insert on public.studio_agent_website_bindings to service_role;
create function public.studio_agent_website_context(p_user uuid,p_site uuid,p_version integer,p_create boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $f$
declare v_design jsonb;v_revision integer;v_project uuid;v_role text;
begin
 if p_user is null or p_site is null or p_version is null or p_version<1 or p_create is null then raise exception 'invalid_request';end if;
 select role into v_role from public.website_cms_members where site_id=p_site and user_id=p_user;
 if v_role is null or v_role not in ('owner','editor') then raise exception 'project_not_found';end if;
 select design,version into v_design,v_revision from public.website_cms_design_drafts where site_id=p_site;
 if not found or v_revision<>p_version then raise exception 'project_changed_reload';end if;
 perform pg_advisory_xact_lock(hashtextextended('studio-website-binding:'||p_user::text||':'||p_site::text,0));
 select project_id into v_project from public.studio_agent_website_bindings where user_id=p_user and site_id=p_site;
 if not found and p_create then
  v_project=public.studio_agent_create_project(p_user,'website','Private Website revision',null,'{}'::jsonb,'[]'::jsonb);
  insert into public.studio_agent_website_bindings(user_id,site_id,project_id) values(p_user,p_site,v_project);
 end if;
 return jsonb_build_object('siteId',p_site,'version',v_revision,'design',v_design,'projectId',v_project);
end $f$;
revoke all on function public.studio_agent_website_context(uuid,uuid,integer,boolean) from public,anon,authenticated;
grant execute on function public.studio_agent_website_context(uuid,uuid,integer,boolean) to service_role;
commit;
