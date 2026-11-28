-- Read-only commercial readiness audit. Run against explicitly selected test environment.
-- Never uses, exposes or modifies individual customer balances.
select
 count(*) as wallet_count,
 count(*) filter(where balance is null or reserved is null or balance<0 or reserved<0 or reserved>balance) as invalid_reservations,
 count(*) filter(where balance is distinct from coalesce(current_subscription_credits,0)+coalesce(rolled_over_credits,0)+coalesce(topup_credits,0)+coalesce(bonus_credits,0)) as inconsistent_credit_buckets
from public.credit_balances;
select
 (select count(*) from public.model_production_jobs where reserved_credits<>0 or spent_credits<>0) as real_model_debits,
 (select count(*) from public.model_provider_cost_receipts) as actual_receipts,
 (select count(*) from public.model_catalog_drafts where production_enabled) as published_models,
 (select count(*) from storage.buckets where id in ('model-original-quarantine','model-rehearsal-delivery') and public) as public_model_buckets;
-- A zero count is a safety check, not approval to enable commercial production.
