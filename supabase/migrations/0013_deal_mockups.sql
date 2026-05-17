-- Per-deal generated web mockups (HTML).
-- One mockup per deal, stored as text. Generated locally with Claude Code +
-- crear-web-premium skill, then pasted into the CRM via the LeadDrawer.

create table if not exists public.deal_mockups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  html text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists deal_mockups_deal_idx on public.deal_mockups(deal_id);
create index if not exists deal_mockups_owner_idx on public.deal_mockups(owner_id);

alter table public.deal_mockups enable row level security;

drop policy if exists "deal_mockups owner full access" on public.deal_mockups;
create policy "deal_mockups owner full access"
  on public.deal_mockups for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Reuse the auto-owner trigger from 0004_auto_owner.sql
drop trigger if exists deal_mockups_set_owner on public.deal_mockups;
create trigger deal_mockups_set_owner
  before insert on public.deal_mockups
  for each row execute function public.set_owner_id_default();

-- updated_at touch
create or replace function public.touch_deal_mockups_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists deal_mockups_touch on public.deal_mockups;
create trigger deal_mockups_touch
  before update on public.deal_mockups
  for each row execute function public.touch_deal_mockups_updated_at();
