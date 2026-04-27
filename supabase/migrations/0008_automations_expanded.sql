-- Expand the automation engine with more triggers and actions.
--
-- New triggers (5):
--   tempIs            {temp}                 deal.temp = temp
--   tagContains       {tag}                  deal.tags @> [tag]
--   sourceIn          {values[]}             deal.source in (values)
--   priceMin          {min}                  deal.price_estimated >= min
--   daysSinceCreated  {days, stage?}         deal.created_at older than N days
--
-- New actions (3):
--   setTemp     {temp}                       deal.temp = temp
--   addTag      {tag}                        append tag to deal.tags
--   removeTag   {tag}                        remove tag from deal.tags

-- Replace _auto_apply_action with the expanded version
create or replace function public._auto_apply_action(a public.automations, d_id uuid, owner uuid)
returns void language plpgsql as $$
declare
  ak text := a.action->>'kind';
  task_kind text;
  task_title text;
  new_stage text;
  new_temp text;
  tag_value text;
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
    update public.deals set prob_override = null where id = d_id;
    msg := '🤖 ' || a.name || ' — probabilidad ajustada';

  elsif ak = 'setTemp' then
    new_temp := coalesce(a.action->>'temp', 'warm');
    update public.deals set temp = new_temp::lead_temp, last_touch = now()
      where id = d_id and temp::text <> new_temp;
    msg := '🤖 ' || a.name || ' — temperatura → ' || new_temp;

  elsif ak = 'addTag' then
    tag_value := coalesce(a.action->>'tag', '');
    if tag_value <> '' then
      update public.deals set tags = (
        case when tag_value = any(tags) then tags
             else array_append(tags, tag_value) end
      ), last_touch = now()
      where id = d_id;
      msg := '🤖 ' || a.name || ' — tag añadido: ' || tag_value;
    else
      msg := '🤖 ' || a.name;
    end if;

  elsif ak = 'removeTag' then
    tag_value := coalesce(a.action->>'tag', '');
    if tag_value <> '' then
      update public.deals set tags = array_remove(tags, tag_value),
                              last_touch = now()
        where id = d_id;
      msg := '🤖 ' || a.name || ' — tag quitado: ' || tag_value;
    else
      msg := '🤖 ' || a.name;
    end if;

  else
    msg := '🤖 ' || a.name;
  end if;

  insert into public.timeline_events (owner_id, deal_id, kind, who, body, t, occurred_at)
    values (owner, d_id, 'note', 'Automatización', msg, 'Automático', now());

  insert into public.automation_runs (automation_id, deal_id) values (a.id, d_id)
    on conflict (automation_id, deal_id) do update set ran_at = now();

  update public.automations
     set stats = jsonb_set(coalesce(stats, '{}'::jsonb), '{fires}',
                           to_jsonb(coalesce((stats->>'fires')::int, 0) + 1))
   where id = a.id;
end $$;


-- Helper: returns the SQL fragment WHERE clause matching deals for a given trigger spec.
-- We inline the logic in run_automations / run_my_automations because Postgres
-- can't easily parameterize where-clauses without dynamic SQL. So we just add
-- new branches.

create or replace function public.run_automations()
returns int language plpgsql security definer set search_path = public as $$
declare
  a public.automations%rowtype;
  tk text;
  filter_stage text;
  days int;
  d_id uuid;
  trig_temp text;
  trig_tag text;
  trig_min numeric;
  fired_total int := 0;
begin
  for a in select * from public.automations where enabled = true loop
    tk := a.trigger->>'kind';

    if tk = 'noTouchFor' then
      days := coalesce((a.trigger->>'days')::int, 2);
      filter_stage := a.trigger->>'stage';
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.last_touch < now() - (days || ' days')::interval
          and (filter_stage is null or d.stage::text = filter_stage)
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'daysInStage' then
      days := coalesce((a.trigger->>'days')::int, 3);
      filter_stage := coalesce(a.trigger->>'stage', 'propuesta');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage::text = filter_stage
          and d.stage_entered_at < now() - (days || ' days')::interval
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'stageAge' then
      days := coalesce((a.trigger->>'days')::int, 10);
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.stage_entered_at < now() - (days || ' days')::interval
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'postStageEnter' then
      days := coalesce((a.trigger->>'days')::int, 0);
      filter_stage := coalesce(a.trigger->>'postStage', 'entregada');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.post_stage::text = filter_stage
          and (days = 0 or d.stage_entered_at < now() - (days || ' days')::interval)
          and (r.ran_at is null or r.ran_at < now() - interval '14 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'tempIs' then
      trig_temp := coalesce(a.trigger->>'temp', 'hot');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.temp::text = trig_temp
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'tagContains' then
      trig_tag := coalesce(a.trigger->>'tag', '');
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and trig_tag = any(d.tags)
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'sourceIn' then
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.source::text in (select jsonb_array_elements_text(a.trigger->'values'))
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'priceMin' then
      trig_min := coalesce((a.trigger->>'min')::numeric, 0);
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and coalesce(d.price_estimated, 0) >= trig_min
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;

    elsif tk = 'daysSinceCreated' then
      days := coalesce((a.trigger->>'days')::int, 30);
      filter_stage := a.trigger->>'stage';
      for d_id in
        select d.id from public.deals d
        left join public.automation_runs r on r.automation_id = a.id and r.deal_id = d.id
        where d.owner_id = a.owner_id
          and d.stage not in ('cerrado','lost')
          and d.created_at < now() - (days || ' days')::interval
          and (filter_stage is null or d.stage::text = filter_stage)
          and (r.ran_at is null or r.ran_at < now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, a.owner_id); fired_total := fired_total + 1; end loop;
    end if;

    update public.automations set last_run_at = now() where id = a.id;
  end loop;

  return fired_total;
end $$;


create or replace function public.run_my_automations()
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  a public.automations%rowtype;
  tk text;
  filter_stage text;
  days int;
  d_id uuid;
  trig_temp text;
  trig_tag text;
  trig_min numeric;
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
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'daysInStage' then
      days := coalesce((a.trigger->>'days')::int, 3);
      filter_stage := coalesce(a.trigger->>'stage', 'propuesta');
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage::text = filter_stage
          and d.stage_entered_at < now() - (days || ' days')::interval
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'stageAge' then
      days := coalesce((a.trigger->>'days')::int, 10);
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.stage_entered_at < now() - (days || ' days')::interval
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'postStageEnter' then
      days := coalesce((a.trigger->>'days')::int, 0);
      filter_stage := coalesce(a.trigger->>'postStage', 'entregada');
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.post_stage::text = filter_stage
          and (days = 0 or d.stage_entered_at < now() - (days || ' days')::interval)
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '14 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'tempIs' then
      trig_temp := coalesce(a.trigger->>'temp', 'hot');
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.temp::text = trig_temp
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'tagContains' then
      trig_tag := coalesce(a.trigger->>'tag', '');
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and trig_tag = any(d.tags)
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'sourceIn' then
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.source::text in (select jsonb_array_elements_text(a.trigger->'values'))
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'priceMin' then
      trig_min := coalesce((a.trigger->>'min')::numeric, 0);
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and coalesce(d.price_estimated, 0) >= trig_min
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;

    elsif tk = 'daysSinceCreated' then
      days := coalesce((a.trigger->>'days')::int, 30);
      filter_stage := a.trigger->>'stage';
      for d_id in
        select d.id from public.deals d
        where d.owner_id = uid
          and d.stage not in ('cerrado','lost')
          and d.created_at < now() - (days || ' days')::interval
          and (filter_stage is null or d.stage::text = filter_stage)
          and not exists (select 1 from public.automation_runs r
            where r.automation_id = a.id and r.deal_id = d.id and r.ran_at >= now() - interval '7 days')
      loop perform public._auto_apply_action(a, d_id, uid); fired_total := fired_total + 1; end loop;
    end if;

    update public.automations set last_run_at = now() where id = a.id;
  end loop;

  return fired_total;
end $$;
