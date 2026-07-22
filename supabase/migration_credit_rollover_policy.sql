-- Credit rollover policy support
-- Monthly subscriptions: unused subscription credits roll over while active, capped at 3x monthly allowance.
-- Yearly subscriptions: annual credits stay available during the active 12-month subscription period.
-- Top-ups: tracked separately and remain available for 12 months from purchase.

alter table credit_balances
  add column if not exists current_subscription_credits integer not null default 0,
  add column if not exists rolled_over_credits integer not null default 0,
  add column if not exists topup_credits integer not null default 0,
  add column if not exists bonus_credits integer not null default 0,
  add column if not exists rollover_cap integer not null default 0,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists billing_cycle_ends_at timestamptz,
  add column if not exists active_subscription_package text,
  add column if not exists active_subscription_billing text,
  add column if not exists last_rollover_at timestamptz,
  add column if not exists topup_expires_at timestamptz;

create index if not exists credit_balances_subscription_rollover_idx
  on credit_balances (subscription_status, billing_cycle_ends_at);

create index if not exists credit_balances_active_subscription_idx
  on credit_balances (active_subscription_package, active_subscription_billing);
