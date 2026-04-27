-- Add support for action kind "sendEmail" in the automation engine.
-- The action stores: { kind: "sendEmail", templateId: <uuid> }
-- When the engine fires it, we don't call SMTP from Postgres (impossible).
-- Instead we INSERT a row into a queue table; the Vercel cron drains the
-- queue and actually sends emails via /api/email/send.

create table if not exists public.email_send_queue (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.deals(id) on delete cascade,
  template_id uuid references public.templates(id) on delete set null,
  automation_id uuid references public.automations(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index if not exists email_send_queue_status_idx on public.email_send_queue(status, created_at);
create index if not exists email_send_queue_owner_idx on public.email_send_queue(owner_id);
alter table public.email_send_queue enable row level security;
do $$ begin
  create policy email_send_queue_owner on public.email_send_queue
    for all using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
exception when duplicate_object then null; end $$;


-- Replace _auto_apply_action to handle sendEmail (push to queue)
create or replace function public._auto_apply_action(a public.automations, d_id uuid, owner uuid)
returns void language plpgsql as $$
declare
  ak text := a.action->>'kind';
  task_kind text;
  task_title text;
  new_stage text;
  new_temp text;
  tag_value text;
  tpl_id uuid;
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

  elsif ak = 'sendEmail' then
    tpl_id := nullif(a.action->>'templateId', '')::uuid;
    insert into public.email_send_queue (owner_id, deal_id, template_id, automation_id)
      values (owner, d_id, tpl_id, a.id);
    msg := '🤖 ' || a.name || ' — email encolado';

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
