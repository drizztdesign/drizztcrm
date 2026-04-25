-- DRIZZT CRM — initial schema
-- Single-tenant per user: RLS on owner_id = auth.uid()

create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type lead_stage as enum ('lead','contactado','interesado','reunion','propuesta','negociacion','cerrado','lost');
exception when duplicate_object then null; end $$;
do $$ begin
  create type post_stage as enum ('desarrollo','revision','entregada','mantenimiento','finalizado','recurrente');
exception when duplicate_object then null; end $$;
do $$ begin
  create type lead_temp as enum ('superhot','hot','warm','cold','lost');
exception when duplicate_object then null; end $$;
do $$ begin
  create type pay_state as enum ('pendiente','senal','parcial','pagado','impagado');
exception when duplicate_object then null; end $$;
do $$ begin
  create type lead_source as enum ('web','instagram','referido','google','email_frio','llamada','networking','cliente_ant','linkedin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type project_type as enum ('landing','corporativa','premium','redisenio','ecommerce','mantenimiento','seo','ia');
exception when duplicate_object then null; end $$;
do $$ begin
  create type next_action_status as enum ('urgent','ok','missing','none');
exception when duplicate_object then null; end $$;
do $$ begin
  create type loss_reason as enum ('precio','no_responde','proveedor','no_prio','aplazado','no_encaja','presupuesto','otro');
exception when duplicate_object then null; end $$;
do $$ begin
  create type pain_key as enum ('no_web','web_antigua','no_contactos','no_confianza','no_google','mala_imagen','vender_mas','automatizar');
exception when duplicate_object then null; end $$;
do $$ begin
  create type timeline_kind as enum ('whatsapp','email','note','meeting','proposal','linkedin','dm','form','call','payment');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_kind as enum ('call','whatsapp','email','meeting','note','proposal','payment');
exception when duplicate_object then null; end $$;
do $$ begin
  create type template_channel as enum ('whatsapp','email','instagram','linkedin');
exception when duplicate_object then null; end $$;
do $$ begin
  create type task_priority as enum ('urgent','high','normal','low');
exception when duplicate_object then null; end $$;
do $$ begin
  create type proposal_status as enum ('draft','sent','signed','rejected');
exception when duplicate_object then null; end $$;
do $$ begin
  create type proposal_package as enum ('esencial','profesional','premium');
exception when duplicate_object then null; end $$;
do $$ begin
  create type lang_code as enum ('es','en');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text default '',
  sector text default '',
  city text default '',
  phone text default '',
  notes text default '',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists companies_owner_idx  on public.companies(owner_id);
create index if not exists companies_sector_idx on public.companies(sector);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  name text not null,
  role text default '',
  email text default '',
  phone text default '',
  avatar text default '',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_owner_idx    on public.contacts(owner_id);
create index if not exists contacts_company_idx  on public.contacts(company_id);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null,
  company_id uuid references public.companies(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null default '',
  stage lead_stage not null default 'lead',
  post_stage post_stage,
  temp lead_temp not null default 'cold',
  score int not null default 0,
  prob_override int,
  price_estimated numeric default 0,
  price_offered numeric,
  price_closed numeric,
  cost_estimated numeric default 0,
  pay_state pay_state not null default 'pendiente',
  source lead_source not null default 'web',
  project_type project_type not null default 'landing',
  pain pain_key not null default 'no_web',
  problems text[] default '{}',
  notes text default '',
  entered_at timestamptz not null default now(),
  first_contact_at timestamptz,
  last_touch timestamptz not null default now(),
  stage_entered_at timestamptz not null default now(),
  lost_reason loss_reason,
  lost_at timestamptz,
  next_action text,
  next_action_date text,
  next_action_channel text,
  next_action_status next_action_status not null default 'none',
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists deals_owner_code_idx on public.deals(owner_id, code);
create index if not exists deals_owner_idx  on public.deals(owner_id);
create index if not exists deals_stage_idx  on public.deals(stage);
create index if not exists deals_temp_idx   on public.deals(temp);
create index if not exists deals_source_idx on public.deals(source);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete cascade,
  t text not null,
  occurred_at timestamptz not null default now(),
  kind timeline_kind not null,
  who text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists timeline_deal_idx on public.timeline_events(deal_id);
create index if not exists timeline_occurred_idx on public.timeline_events(occurred_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  title text not null,
  kind task_kind not null default 'note',
  due text default '',
  due_at timestamptz,
  done boolean not null default false,
  done_at timestamptz,
  priority task_priority not null default 'normal',
  created_at timestamptz not null default now()
);
create index if not exists tasks_owner_idx on public.tasks(owner_id);
create index if not exists tasks_done_idx  on public.tasks(done);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  stage text not null default 'any',
  channel template_channel not null,
  lang lang_code not null default 'es',
  title text not null,
  subject text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists templates_owner_idx on public.templates(owner_id);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description_es text default '',
  description_en text default '',
  icon text default '⚡',
  enabled boolean not null default true,
  trigger jsonb not null,
  action jsonb not null,
  stats jsonb not null default '{"fires":0,"lastFiredAt":null}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists automations_owner_idx on public.automations(owner_id);

create table if not exists public.scoring_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description_es text default '',
  description_en text default '',
  weight int not null default 10,
  enabled boolean not null default true,
  predicate jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists scoring_owner_idx on public.scoring_rules(owner_id);

create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  package_key proposal_package not null default 'profesional',
  title text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  grand_total numeric not null default 0,
  status proposal_status not null default 'draft',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  signed_at timestamptz
);
create index if not exists proposals_owner_idx on public.proposals(owner_id);
create index if not exists proposals_deal_idx  on public.proposals(deal_id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
drop trigger if exists contacts_updated_at on public.contacts;
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
drop trigger if exists deals_updated_at on public.deals;
create trigger deals_updated_at before update on public.deals for each row execute function public.set_updated_at();
drop trigger if exists templates_updated_at on public.templates;
create trigger templates_updated_at before update on public.templates for each row execute function public.set_updated_at();

-- RLS
alter table public.companies       enable row level security;
alter table public.contacts        enable row level security;
alter table public.deals           enable row level security;
alter table public.timeline_events enable row level security;
alter table public.tasks           enable row level security;
alter table public.templates       enable row level security;
alter table public.automations     enable row level security;
alter table public.scoring_rules   enable row level security;
alter table public.proposals       enable row level security;

do $$ declare t text;
begin
  for t in select unnest(ARRAY['companies','contacts','deals','timeline_events','tasks','templates','automations','scoring_rules','proposals']) loop
    execute format('drop policy if exists "own_all" on public.%I', t);
    execute format('create policy "own_all" on public.%I for all using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
  end loop;
end $$;

-- Realtime
alter publication supabase_realtime add table public.deals;
alter publication supabase_realtime add table public.timeline_events;
alter publication supabase_realtime add table public.tasks;
