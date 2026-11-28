-- Run only in the intended Supabase project after reviewing existing Storage RLS policies.
-- The API refuses public buckets. No anon/authenticated policies are added.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('model-private-drafts','model-private-drafts',false,2800000,array['application/json'])
on conflict(id) do nothing;
