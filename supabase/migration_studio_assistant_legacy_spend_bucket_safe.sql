-- Preserve the legacy assistant RPC shape while using the same row-locked bucket ledger.
create or replace function public.assistant_work_spend(p_user_id uuid,p_amount integer,p_note text default null)
returns table(ok boolean,code text,balance integer,reserved integer,available integer)
language plpgsql security invoker set search_path=public,pg_temp as $$
declare r jsonb;a integer;h integer;
begin
 if p_user_id is null or p_amount is null or p_amount not between 1 and 100000 then return query select false,'invalid_amount'::text,null::integer,null::integer,null::integer;return;end if;
 r:=public.studio_wallet_spend(p_user_id,p_amount,'assistant-work:'||gen_random_uuid()::text,left(coalesce(p_note,'assistant-work'),200));
 a:=coalesce((r->>'available')::int,0);h:=coalesce((r->>'reserved')::int,0);
 if r->>'state'='spent' then return query select true,'ok'::text,a+h,h,a;
 elsif r->>'state'='insufficient' then return query select false,'insufficient'::text,a+h,h,a;
 else return query select false,'schema'::text,null::integer,null::integer,null::integer;end if;
end $$;
revoke all on function public.assistant_work_spend(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.assistant_work_spend(uuid,integer,text) to service_role;
