do $$ begin
  alter type credit_event_type add value if not exists 'subscription_payment';
exception when duplicate_object then null;
end $$;

alter table profiles add column if not exists normalized_email text;
alter table profiles add column if not exists normalized_phone text;
alter table profiles add column if not exists payment_provider_customer_id text;
alter table profiles add column if not exists billing_status text not null default 'active';
alter table profiles add column if not exists billing_restricted_at timestamptz;
alter table profiles add column if not exists billing_failed_at timestamptz;
alter table profiles add column if not exists billing_update_url text;

update profiles set normalized_email = lower(trim(email)) where normalized_email is null;
create unique index if not exists profiles_normalized_email_key on profiles(normalized_email);
create unique index if not exists profiles_payment_customer_key on profiles(payment_provider_customer_id) where payment_provider_customer_id is not null;

alter table welcome_credit_claims add column if not exists normalized_email text;
update welcome_credit_claims set normalized_email = lower(trim(email)) where normalized_email is null;
create unique index if not exists welcome_credit_claims_normalized_email_key on welcome_credit_claims(normalized_email);

create table if not exists payment_provider_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  user_id uuid references profiles(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key (provider, event_id)
);
alter table payment_provider_events enable row level security;

create table if not exists preview_entitlements (
  user_id uuid primary key references profiles(id) on delete cascade,
  plan_id text,
  preview_limit integer not null default 0,
  preview_used integer not null default 0,
  trial_preview_limit integer not null default 0,
  trial_preview_used integer not null default 0,
  business_trial_used boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table preview_entitlements enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='preview_entitlements' and policyname='preview entitlements own read') then
    create policy "preview entitlements own read" on preview_entitlements for select using (auth.uid() = user_id);
  end if;
end $$;

create or replace function claim_preview_entitlement(p_user_id uuid, p_plan_id text, p_is_trial boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r preview_entitlements;
begin
  if p_user_id is null or not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('ok', false, 'reason', 'authenticated_user_required');
  end if;
  insert into preview_entitlements(user_id, plan_id) values (p_user_id, p_plan_id)
    on conflict (user_id) do nothing;
  select * into r from preview_entitlements where user_id = p_user_id for update;
  if lower(coalesce(p_plan_id, '')) = 'business' and (r.business_trial_used or r.preview_used > 0 or r.trial_preview_used > 0) then
    return jsonb_build_object('ok', false, 'reason', 'business_trial_already_used', 'remaining', greatest(r.preview_limit-r.preview_used,0));
  end if;
  if p_is_trial then
    if r.trial_preview_used >= r.trial_preview_limit or (lower(coalesce(p_plan_id,'')) = 'business' and r.business_trial_used) then
      return jsonb_build_object('ok', false, 'reason', 'trial_preview_already_used', 'remaining', greatest(r.trial_preview_limit-r.trial_preview_used,0));
    end if;
    update preview_entitlements set trial_preview_used = trial_preview_used + 1, business_trial_used = business_trial_used or lower(coalesce(p_plan_id,'')) = 'business', updated_at = now() where user_id = p_user_id returning * into r;
  else
    if r.preview_used >= r.preview_limit then
      return jsonb_build_object('ok', false, 'reason', 'preview_limit_reached', 'remaining', greatest(r.preview_limit-r.preview_used,0));
    end if;
    update preview_entitlements set preview_used = preview_used + 1, updated_at = now() where user_id = p_user_id returning * into r;
  end if;
  return jsonb_build_object('ok', true, 'remaining', greatest(case when p_is_trial then r.trial_preview_limit-r.trial_preview_used else r.preview_limit-r.preview_used end,0), 'preview_used', r.preview_used, 'trial_preview_used', r.trial_preview_used);
end $$;
revoke all on function claim_preview_entitlement(uuid,text,boolean) from public, anon, authenticated;
grant execute on function claim_preview_entitlement(uuid,text,boolean) to service_role;

create or replace function grant_welcome_assistant_credits(p_user_id uuid, p_email text, p_ip text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare clean_email text := lower(trim(coalesce(p_email,''))); clean_ip text := nullif(trim(coalesce(p_ip,'')), '');
begin
  if p_user_id is null or clean_email = '' then return jsonb_build_object('granted',false,'credits',0,'reason','missing_user'); end if;
  if exists (select 1 from welcome_credit_claims where user_id=p_user_id or normalized_email=clean_email or ip_address=coalesce(clean_ip,'unknown')) then
    return jsonb_build_object('granted',false,'credits',0,'reason','already_claimed');
  end if;
  insert into profiles(id,email,normalized_email) values(p_user_id,clean_email,clean_email) on conflict(id) do update set normalized_email=excluded.normalized_email;
  insert into assistant_credit_balances(user_id,balance) values(p_user_id,250) on conflict(user_id) do nothing;
  if not exists(select 1 from assistant_credit_balances where user_id=p_user_id and balance >= 250) then raise exception 'welcome credit balance write failed'; end if;
  insert into credit_events(user_id,type,amount,note) values(p_user_id,'adjustment',250,'welcome_assistant_credits_once');
  insert into welcome_credit_claims(user_id,email,normalized_email,ip_address,credits_granted) values(p_user_id,clean_email,clean_email,coalesce(clean_ip,'unknown'),250);
  return jsonb_build_object('granted',true,'credits',250,'assistantBalance',250);
exception when unique_violation then return jsonb_build_object('granted',false,'credits',0,'reason','already_claimed');
end $$;
revoke all on function grant_welcome_assistant_credits(uuid,text,text) from public, anon, authenticated;
grant execute on function grant_welcome_assistant_credits(uuid,text,text) to service_role;

create or replace function set_billing_status(p_user_id uuid, p_status text, p_update_url text default null)
returns void language sql security definer set search_path = public as $$
update profiles set billing_status=p_status, billing_restricted_at=case when p_status in ('payment_past_due','restricted') then coalesce(billing_restricted_at,now()) else null end, billing_update_url=coalesce(nullif(trim(p_update_url),''),billing_update_url) where id=p_user_id;
update credit_balances set subscription_status=p_status, updated_at=now() where user_id=p_user_id;
$$;
revoke all on function set_billing_status(uuid,text,text) from public, anon, authenticated;
grant execute on function set_billing_status(uuid,text,text) to service_role;
