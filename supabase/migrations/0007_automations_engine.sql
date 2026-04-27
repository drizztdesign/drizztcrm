-- Real automation engine: evaluates each enabled automation against the user's
-- deals every hour and applies the corresponding action.
--
-- Trigger kinds supported (time-based, evaluated by cron):
--   noTouchFor   {days, stage?}     deals.last_touch < now() - days, opt. in stage
--   daysInStage  {stage, days}      deals in given stage for >= days
--   stageAge     {days}             deals in any active stage for >= days
--   postStageEnter {postStage, days?}  post_stage matches, optionally aged
--
-- (event-based triggers like leadOpened/stageEnter are NOT handled here — they
-- would need application-level hooks)
--
-- Action kinds supported:
--   markUrgent                     deals.next_action_status = 'urgent'
--   moveStage    {stage}           deals.stage = stage
--   createTask   {taskKind, taskTitle}  insert a task
--   suggestTemplate                append timeline note
--   appendTimeline                 append timeline note
--   adjustProbability              set prob_override based on stage prob

alter table public.automations add column if not exists last_run_at timestamptz;

-- Each automation gets a per-deal cooldown to avoid firing the same rule on the
-- same deal repeatedly. We track this in a simple table.
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  ran_at timestamptz not null default now(),
  unique (automation_id, deal_id)
);
create index if not exists automation_runs_automation_idx on public.automation_runs(automation_id);
create index if not exists automation_runs_deal_idx on public.automation_runs(deal_id);
alter table public.automation_runs enable row level security;
do $$ begin
  create policy automation_runs_owner on public.automation_runs
    for all using (
      exists (select 1 from public.automations a where a.id = automation_id and a.owner_id = auth.uid())
    );
exception when duplicate_object then null; end $$;


create or replace function public._auto_apply_action(a public.automations, d_id uuid, owner uuid)
returns void language plpgsql as $$
declare
  ak text := a.action->>'kind';
  task_kind text;
  task_title text;
  new_stage text;
  msg text;
begin
  if ak = 'markUrgent' then
    update public.deals set next_action_status = 'urgent', last_touch = now()
      where id = d_id and (next_action_status is distinct from 'urgent');
    msg := '🤖 ' || a.name || ' — marcado urgente';

  elsif ak = 'moveStage' then
    new_stage := coalesce(a.action->>'stage', 'lost');
    update public.deals set stage = new_stage::lead_stage,
                            stage_entered_at = now(),
                            last_touch = now()
      where id = d_id and stage::text <> new_stage;
    msg := '🤖 ' || a.name || ' — movido a ' || new_stage;

  elsif ak = 'createTask' then
    task_kind  := coalesce(a.action->>'taskKind', 'note');
    task_title := coalesce(a.action->>'taskTitle', a.name);
    insert into public.tasks (owner_id, deal_id, kind, title, due, priority, done)
      values (owner, d_id, task_kind::task_kind, task_title, 'Hoy', 'normal', false);
    msg := '🤖 ' || a.name || ' — tarea creada: ' || task_title;

  elsif ak = 'suggestTemplate' or ak = 'appendTimeline' then
    msg := '🤖 ' || a.name;

  elsif ak = 'adjustProbability' then
    -- Set prob_override to NULL so it falls back to stage default; effectively
    -- "reset" — useful when user changes stage.
    update public.deals set prob_override = null where id = d_id;
    msg := '🤖 ' || a.name || ' — probabilidad ajustada';
  else
    msg := '🤖 ' || a.name;
  end if;

  -- Always log to timeline so the user sees automation activity on the lead
  insert into public.timeline_events (owner_id, deal_id, kind, who, body, t, occurred_at)
    values (owner, d_id, 'note', 'Automatización', msg, 'Automático', now());

  -- Track per-deal run + bump aggregate stats
  insert into public.automation_runs (automation_id, deal_id) values (a.id, d_id)
    on conflict (automation_id, deal_id) do update set ran_at = now();

  update public.automations
     set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{fires}',
                           to_jsonb(coalesce((stats->>'fires')::int, 0) + 1))
   where id = a.id;
end $$;


create or replace function public.run_automations()
returns int language plpgsql security definer set search_path = public as $$
declare
  a public.automations%rowtype;
  tk text;
  filter_stage text;
  days int;
  d_id uuid;
  fired_total int := 0;
begin
  for a in select * from public.automations where enabled = true loop
    tk := a.trigger->>'kind';

    if tk = 'noTouchFor' then
      days := coalesce((a.trigger->>'days')::int, 2);
      filter_stage := a.trigger->>'stage';
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r
          on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.last_touch < now() - (days || ' days')::interval
          and (filter_stage is null or d.stage::text = filter_stage)
          -- avoid re-firing within 7 days for the same deal
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop
        perform public._auto_apply_action(a, d_id, a.owner_id);
        fired_total := fired_total + 1;
      end loop;

    elsif tk = 'daysInStage' then
      days := coalesce((a.trigger->>'days')::int, 3);
      filter_stage := coalesce(a.trigger->>'stage', 'propuesta');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r
          on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage::text = filter_stage
          and d.stage_entered_at < now() - (days || ' days')::interval
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop
        perform public._auto_apply_action(a, d_id, a.owner_id);
        fired_total := fired_total + 1;
      end loop;

    elsif tk = 'stageAge' then
      days := coalesce((a.trigger->>'days')::int, 10);
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r
          on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.stage_entered_at < now() - (days || ' days')::interval
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop
        perform public._auto_apply_action(a, d_id, a.owner_id);
        fired_total := fired_total + 1;
      end loop;

    elsif tk = 'postStageEnter' then
      days := coalesce((a.trigger->>'days')::int, 0);
      filter_stage := coalesce(a.trigger->>'postStage', 'entregada');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r
          on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.post_stage::text = filter_stage
          and (days = 0 or d.stage_entered_at < now() - (days || ' days')::interval)
          and (r.ran_at is null or r.ran_at < now() - interval '14 days')
      loop
        perform public._auto_apply_action(a, d_id, a.owner_id);
        fired_total := fired_total + 1;
      end loop;
    end if;

    update public.automations set last_run_at = now() where id = a.id;
  end loop;

  return fired_total;
end $$;

grant execute on function public.run_automations() to authenticated;


-- Manual trigger: lets the UI fire all automations on demand for the current user
-- (useful for testing). Restricted by RLS via owner_id check inside.
create or replace function public.run_my_automations()
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a public.automations%rowtype;
  tk text;
  filter_stage text;
  days int;
  d_id uuid;
  fired_total int := 0;
begin
  if uid is null then raise exception 'not authenticated'; end if;

  for a in select * from public.automations where enabled = true and owner_id = uid loop
    tk := a.trigger->>'kind';

    if tk = 'noTouchFor' then
      days := coalesce((a.trigger->>'days')::int, 2);
      filter_stage := a.trigger->>'stage';
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.last_touch < now() - (days || ' days')::interval
          and (filter_stage is null or d.stage::text = filter_stage)
          and not exists (
            select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id
              and r.ran_at >= now() - interval '7 days'
          )
      loop
        perform public._auto_apply_action(a, d_id, uid);
        fired_total := fired_total + 1;
      end loop;

    elsif tk = 'daysInStage' then
      days := coalesce((a.trigger->>'days')::int, 3);
      filter_stage := coalesce(a.trigger->>'stage', 'propuesta');
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage::text = filter_stage
          and d.stage_entered_at < now() - (days || ' days')::interval
          and not exists (
            select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id
              and r.ran_at >= now() - interval '7 days'
          )
      loop
        perform public._auto_apply_action(a, d_id, uid);
        fired_total := fired_total + 1;
      end loop;

    elsif tk = 'stageAge' then
      days := coalesce((a.trigger->>'days')::int, 10);
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.stage_entered_at < now() - (days || ' days')::interval
          and not exists (
            select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id
              and r.ran_at >= now() - interval '7 days'
          )
      loop
        perform public._auto_apply_action(a, d_id, uid);
        fired_total := fired_total + 1;
      end loop;
    end if;

    update public.automations set last_run_at = now() where id = a.id;
  end loop;

  return fired_total;
end $$;

grant execute on function public.run_my_automations() to authenticated;


-- Schedule cron: runs every hour, evaluates all users' automations.
-- pg_cron is enabled by default on Supabase (extension lives in 'extensions' schema).
create extension if not exists pg_cron with schema extensions;

-- Remove any prior schedule then re-create it
do $$ begin
  perform cron.unschedule('drizzt-automations-hourly');
exception when others then null; end $$;

select cron.schedule(
  'drizzt-automations-hourly',
  '5 * * * *',  -- :05 every hour
  $$ select public.run_automations(); $$
);
