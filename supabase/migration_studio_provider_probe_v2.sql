-- Fixed bounded visual acceptance suite; no client-selected operations.
alter table public.studio_provider_probes drop constraint if exists studio_provider_probes_kind_check;
alter table public.studio_provider_probes add constraint studio_provider_probes_kind_check check(kind in ('minimax_image','minimax_brand','minimax_model','minimax_character','stability_remove_background','stability_erase_object','stability_inpaint','stability_outpaint','stability_replace_object','stability_replace_background','stability_upscale','stability_product_reference'));
create or replace function public.studio_provider_probe_claim(p_suite text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p studio_provider_probes%rowtype;
begin
 update studio_provider_probes set state='expired' where suite=p_suite and state='pending' and expires_at<=now();
 select * into p from studio_provider_probes q where q.suite=p_suite and q.state='pending' and q.expires_at>now()
 and (q.kind<>'minimax_character' or exists(select 1 from studio_provider_probes m where m.suite=q.suite and m.kind='minimax_model' and m.state='ready'))
 order by case q.kind when 'minimax_image' then 0 when 'minimax_model' then 1 when 'minimax_character' then 2 when 'minimax_brand' then 3 else 4 end,q.kind
 for update skip locked limit 1;
 if not found then return null;end if;
 update studio_provider_probes set state='claimed',claimed_at=now() where id=p.id;
 return jsonb_build_object('id',p.id,'kind',p.kind);
end $$;
revoke all on function public.studio_provider_probe_claim(text) from public,anon,authenticated;
grant execute on function public.studio_provider_probe_claim(text) to service_role;
