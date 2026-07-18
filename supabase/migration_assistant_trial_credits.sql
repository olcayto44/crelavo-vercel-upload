create table if not exists assistant_credit_balances (
  user_id uuid primary key references profiles(id) on delete cascade,
  balance integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists welcome_credit_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  ip_address text not null,
  credits_granted integer not null default 1000,
  created_at timestamptz not null default now()
);

alter table assistant_credit_balances enable row level security;
alter table welcome_credit_claims enable row level security;

create unique index if not exists welcome_credit_claims_user_id_key on welcome_credit_claims(user_id);
create unique index if not exists welcome_credit_claims_email_key on welcome_credit_claims(email);
create unique index if not exists welcome_credit_claims_ip_address_key on welcome_credit_claims(ip_address);

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'assistant_credit_balances' and policyname = 'assistant credits own read'
  ) then
    create policy "assistant credits own read" on assistant_credit_balances for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'welcome_credit_claims' and policyname = 'welcome claims own read'
  ) then
    create policy "welcome claims own read" on welcome_credit_claims for select using (auth.uid() = user_id);
  end if;
end $$;
