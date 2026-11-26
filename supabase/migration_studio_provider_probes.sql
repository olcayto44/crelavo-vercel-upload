-- One-shot internal provider acceptance evidence. No customer wallet or production rows.
create table if not exists public.studio_provider_probes(
 id uuid primary key default gen_random_uuid(),
 suite text not null check(length(suite) between 8 and 80),
 kind text not null check(kind in ('minimax_image','stability_remove_background')),
 state text not null default 'pending' check(state in ('pending','claimed','ready','reconcile_required','expired')),
 expires_at timestamptz not null,
 claimed_at timestamptz, completed_at timestamptz,
 receipt jsonb, artifact_base64 text check(artifact_base64 is null or length(artifact_base64)<=2800000),
 error_code text, unique(suite,kind)
);
alter table public.studio_provider_probes enable row level security;
revoke all on public.studio_provider_probes from public,anon,authenticated;
grant select,insert,update on public.studio_provider_probes to service_role;
create or replace function public.studio_provider_probe_claim(p_suite text)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare p studio_provider_probes%rowtype;
begin
 update studio_provider_probes set state='expired' where suite=p_suite and state='pending' and expires_at<=now();
 select * into p from studio_provider_probes where suite=p_suite and state='pending' and expires_at>now() order by kind for update skip locked limit 1;
 if not found then return null;end if;
 update studio_provider_probes set state='claimed',claimed_at=now() where id=p.id;
 return jsonb_build_object('id',p.id,'kind',p.kind);
end $$;
revoke all on function public.studio_provider_probe_claim(text) from public,anon,authenticated;
grant execute on function public.studio_provider_probe_claim(text) to service_role;
