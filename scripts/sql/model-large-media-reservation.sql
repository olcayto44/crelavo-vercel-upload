begin;
create function public.model_reserve_large_media(p_user uuid,p_id uuid,p_kind text,p_mime text,p_bytes bigint)
returns public.model_media_assets language plpgsql security invoker set search_path='' as $$
declare a public.model_media_assets;
begin
 perform pg_advisory_xact_lock(hashtextextended('model-large-media:'||p_user::text,0));
 if p_bytes is null or p_bytes<=3000000 or p_bytes>50000000 then raise exception 'invalid_size';end if;
 if (select count(*) from public.model_media_assets where user_id=p_user)>=20 or
 coalesce((select sum(bytes) from public.model_media_assets where user_id=p_user),0)+p_bytes>100000000 then raise exception 'media_quota';end if;
 insert into public.model_media_assets(id,user_id,model_id,kind,mime,bytes,object_key,state)
 values(p_id,p_user,'magi-2',p_kind,p_mime,p_bytes,p_user::text||'/'||p_id::text||'/original','quarantined') returning * into a;
 return a;
end $$;
revoke all on function public.model_reserve_large_media(uuid,uuid,text,text,bigint) from public,anon,authenticated;
grant execute on function public.model_reserve_large_media(uuid,uuid,text,text,bigint) to service_role;
commit;