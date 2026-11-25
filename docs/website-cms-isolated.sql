-- Isolated CMS foundation. Do not apply to live production.
create schema if not exists website_cms_private;
revoke all on schema website_cms_private from public,anon,authenticated;
create table public.website_cms_sites(
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 1 and 100),
 locale text not null check(locale in ('en','tr','de','fr','zh-Hans')),
 created_at timestamptz not null default now()
);
create table public.website_cms_members(
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('owner','editor','viewer')),
 primary key(site_id,user_id)
);
create index website_cms_member_user on public.website_cms_members(user_id,site_id);
create table public.website_cms_pages(
 id uuid primary key default gen_random_uuid(),
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 slug text not null check(slug ~ '^[a-z][a-z0-9-]{0,48}$' and slug not in ('admin','api','preview','index')),
 title text not null check(length(trim(title)) between 1 and 70),
 description text not null check(length(trim(description)) between 1 and 160),
 headline text not null check(length(trim(headline)) between 1 and 100),
 body text not null check(length(trim(body)) between 1 and 10000),
 version integer not null default 1 check(version>0),
 updated_at timestamptz not null default now(),
 unique(site_id,slug)
);
create table public.website_cms_revisions(
 page_id uuid not null references public.website_cms_pages(id) on delete cascade,
 site_id uuid not null references public.website_cms_sites(id) on delete cascade,
 version integer not null,
 changed_by uuid not null references auth.users(id),
 previous_content jsonb not null,
 new_content jsonb not null,
 created_at timestamptz not null default now(),
 primary key(page_id,version)
);
alter table public.website_cms_sites enable row level security;
alter table public.website_cms_members enable row level security;
alter table public.website_cms_pages enable row level security;
alter table public.website_cms_revisions enable row level security;
revoke all on public.website_cms_sites,public.website_cms_members,public.website_cms_pages,public.website_cms_revisions from public,anon,authenticated;
grant select on public.website_cms_sites,public.website_cms_members,public.website_cms_pages,public.website_cms_revisions to authenticated;
grant update(title,description,headline,body) on public.website_cms_pages to authenticated;
grant select,insert,update,delete on public.website_cms_sites,public.website_cms_members,public.website_cms_pages,public.website_cms_revisions to service_role;
create policy cms_member_self on public.website_cms_members for select to authenticated using(user_id=(select auth.uid()));
create policy cms_site_read on public.website_cms_sites for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_sites.id and m.user_id=(select auth.uid())));
create policy cms_page_read on public.website_cms_pages for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_pages.site_id and m.user_id=(select auth.uid())));
create policy cms_page_edit on public.website_cms_pages for update to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_pages.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor'))) with check(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_pages.site_id and m.user_id=(select auth.uid()) and m.role in ('owner','editor')));
create policy cms_revision_read on public.website_cms_revisions for select to authenticated using(exists(select 1 from public.website_cms_members m where m.site_id=website_cms_revisions.site_id and m.user_id=(select auth.uid())));
create function website_cms_private.audit_edit() returns trigger language plpgsql security definer set search_path='' as $audit$
declare actor uuid:=auth.uid();
begin
 if actor is null or not exists(select 1 from public.website_cms_members m where m.site_id=old.site_id and m.user_id=actor and m.role in ('owner','editor')) then raise exception 'cms_edit_denied'; end if;
 if new.id is distinct from old.id or new.site_id is distinct from old.site_id or new.slug is distinct from old.slug then raise exception 'cms_identity_immutable';end if;
 new.version:=old.version+1;new.updated_at:=now();
 insert into public.website_cms_revisions(page_id,site_id,version,changed_by,previous_content,new_content) values(old.id,old.site_id,new.version,actor,jsonb_build_object('title',old.title,'description',old.description,'headline',old.headline,'body',old.body),jsonb_build_object('title',new.title,'description',new.description,'headline',new.headline,'body',new.body));
 return new;
end $audit$;
revoke all on function website_cms_private.audit_edit() from public,anon,authenticated;
create trigger website_cms_audit before update on public.website_cms_pages for each row execute function website_cms_private.audit_edit();
-- Explicit version condition; RLS applies, client cannot change identity or versions.
create function public.website_cms_save_page(p_site uuid,p_page uuid,p_version integer,p_title text,p_description text,p_headline text,p_body text) returns integer
language plpgsql security invoker set search_path='' as $save$
declare v integer;
begin
 if auth.uid() is null then return null;end if;
 update public.website_cms_pages set title=p_title,description=p_description,headline=p_headline,body=p_body where site_id=p_site and id=p_page and version=p_version returning version into v;
 return v;
end $save$;
revoke all on function public.website_cms_save_page(uuid,uuid,integer,text,text,text,text) from public,anon;
grant execute on function public.website_cms_save_page(uuid,uuid,integer,text,text,text,text) to authenticated;
