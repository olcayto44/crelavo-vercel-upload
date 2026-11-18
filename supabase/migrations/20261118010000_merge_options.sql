begin;
alter table public.merge_jobs add column if not exists options jsonb not null default '{"aspect":"9:16","fit":"contain","transition":"cut"}'::jsonb;
create or replace function public.enqueue_merge_job_with_options(p_user uuid,p_project uuid,p_ids uuid[],p_hash text,p_options jsonb) returns public.merge_jobs
language plpgsql security definer set search_path=public as $$
declare j merge_jobs;
begin
 if p_options is null or not (p_options ?& array['aspect','fit','transition']) or p_options->>'aspect' not in ('9:16','16:9') or p_options->>'fit' not in ('contain','cover') or p_options->>'transition' not in ('cut','fade') then raise exception 'invalid_merge_options'; end if;
 j := public.enqueue_merge_job(p_user,p_project,p_ids,p_hash);
 if j.status='queued' and j.attempt=0 then
  update merge_jobs set options=p_options where id=j.id returning * into j;
 end if;
 return j;
end $$;
revoke all on function public.enqueue_merge_job_with_options(uuid,uuid,uuid[],text,jsonb) from public,anon,authenticated;
grant execute on function public.enqueue_merge_job_with_options(uuid,uuid,uuid[],text,jsonb) to service_role;
commit;
