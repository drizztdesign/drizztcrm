-- Track every outbound + inbound email so we can match replies to deals.
-- Each outbound email gets a "ref token" that we embed in the subject as
-- [#ref-XXXXXX] so when we receive a reply (Re: ... [#ref-XXXXXX]), we can
-- find the original deal even if the contact replies from a different alias.

create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  direction text not null check (direction in ('out','in')),
  ref_token text not null,
  from_addr text not null,
  to_addr text not null,
  subject text not null default '',
  body_text text not null default '',
  body_html text default '',
  message_id text,                        -- RFC 5322 Message-ID for threading
  in_reply_to text,
  template_id uuid references public.templates(id) on delete set null,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists email_messages_owner_idx on public.email_messages(owner_id);
create index if not exists email_messages_deal_idx on public.email_messages(deal_id);
create index if not exists email_messages_ref_idx on public.email_messages(ref_token);
create unique index if not exists email_messages_msgid_idx
  on public.email_messages(owner_id, message_id) where message_id is not null;

alter table public.email_messages enable row level security;

do $$ begin
  create policy email_messages_owner on public.email_messages
    for all using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Add to realtime publication so the UI can react to inbound emails arriving
do $$ begin
  alter publication supabase_realtime add table public.email_messages;
exception when duplicate_object then null; end $$;
