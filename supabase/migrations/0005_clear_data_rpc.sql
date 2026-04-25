-- RPC to wipe a user's CRM data (deals, companies, contacts, tasks, timeline, proposals)
-- without touching the onboarding-seeded config (templates, automations, scoring_rules).
-- The function runs as `security definer` but checks auth.uid() inside, so users can only
-- delete their own rows.

create or replace function public.clear_user_data()
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  -- timeline_events and proposals cascade from deals via FK; deleting deals first is fine.
  delete from public.timeline_events where owner_id = uid;
  delete from public.tasks            where owner_id = uid;
  delete from public.proposals        where owner_id = uid;
  delete from public.deals            where owner_id = uid;
  delete from public.contacts         where owner_id = uid;
  delete from public.companies        where owner_id = uid;
end $$;

grant execute on function public.clear_user_data() to authenticated;
