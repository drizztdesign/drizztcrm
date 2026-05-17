-- Async mockup generation support.
-- Adds: status (pending/done/error), prompt (for watcher), error_msg.
-- Makes html nullable so we can queue a pending request before the HTML exists.

alter table public.deal_mockups
  add column if not exists status text not null default 'done',
  add column if not exists prompt text,
  add column if not exists error_msg text;

alter table public.deal_mockups
  alter column html drop not null;

create index if not exists deal_mockups_status_idx on public.deal_mockups(status);
