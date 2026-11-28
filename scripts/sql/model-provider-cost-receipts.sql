-- Actual provider cost ledger foundation. No synthetic rows and no write grants until provider approval.
begin;
create table public.model_provider_cost_receipts (
 id uuid primary key default gen_random_uuid(),
 job_id uuid not null references public.model_production_jobs(id) on delete restrict,
 provider text not null check(provider in ('higgsfield','kie')),
 provider_task_id text not null check(length(provider_task_id) between 1 and 200),
 provider_receipt_id text not null check(length(provider_receipt_id) between 1 and 200),
 source_kind text not null check(source_kind in ('provider_invoice','provider_usage_receipt')),
 receipt_sha256 text not null check(receipt_sha256 ~ '^[0-9a-f]{64}$'),
 currency text not null check(currency='USD'),
 actual_micro_usd bigint not null check(actual_micro_usd>=0 and actual_micro_usd<=1000000000),
 recorded_at timestamptz not null default now(),
 unique(provider,provider_receipt_id)
);
alter table public.model_provider_cost_receipts enable row level security;
revoke all on public.model_provider_cost_receipts from public,anon,authenticated,service_role;
grant select on public.model_provider_cost_receipts to service_role;
comment on table public.model_provider_cost_receipts is 'Read-only foundation: enable verified receipt ingestion in separately reviewed commercial release. No list-price estimates or rehearsal costs.';
commit;
