-- Reject absent versions (a SQL CHECK alone permits NULL). Match preview transport size.
alter table public.website_cms_design_drafts add constraint website_design_required_shape check(coalesce(design->'version'='2'::jsonb,false) and coalesce(jsonb_typeof(design->'pages')='array',false) and octet_length(design::text)<=48000);
