-- Require optimistic version checks on every browser write, not just cooperative clients.
revoke update(title,description,headline,body) on public.website_cms_pages from authenticated;
grant usage on schema website_cms_private to authenticated;
create function website_cms_private.save_page(p_site uuid,p_page uuid,p_version integer,p_title text,p_description text,p_headline text,p_body text) returns integer
language plpgsql security definer set search_path='' as $private$
declare v integer; actor uuid:=auth.uid();
begin
 if actor is null or p_version is null or p_version<1 then return null;end if;
 perform 1 from public.website_cms_members where site_id=p_site and user_id=actor and role in ('owner','editor') for share;
 if not found then return null;end if;
 update public.website_cms_pages set title=p_title,description=p_description,headline=p_headline,body=p_body where site_id=p_site and id=p_page and version=p_version returning version into v;
 return v;
end $private$;
revoke all on function website_cms_private.save_page(uuid,uuid,integer,text,text,text,text) from public,anon,authenticated;
grant execute on function website_cms_private.save_page(uuid,uuid,integer,text,text,text,text) to authenticated;
create or replace function public.website_cms_save_page(p_site uuid,p_page uuid,p_version integer,p_title text,p_description text,p_headline text,p_body text) returns integer
language sql security invoker set search_path='' as $wrapper$
select website_cms_private.save_page(p_site,p_page,p_version,p_title,p_description,p_headline,p_body)
$wrapper$;
revoke all on function public.website_cms_save_page(uuid,uuid,integer,text,text,text,text) from public,anon;
grant execute on function public.website_cms_save_page(uuid,uuid,integer,text,text,text,text) to authenticated;
