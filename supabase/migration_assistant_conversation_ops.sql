alter table assistant_conversations
  add column if not exists admin_status text not null default 'new',
  add column if not exists admin_notes text;

create index if not exists assistant_conversations_admin_status_idx on assistant_conversations (admin_status, updated_at desc);
