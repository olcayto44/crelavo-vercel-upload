-- Restrict the timestamp trigger to the trusted built-in schema.
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog;
