-- Auto-compute deal score from scoring_rules predicates.
-- Predicates are JSON shapes seeded in 0002_user_onboarding.sql, e.g.
--   {"kind":"hasWebsite"}
--   {"kind":"sourceIn","values":["referido","cliente_ant"]}
--   {"kind":"projectTypeIn","values":["premium","ecommerce"]}
--   {"kind":"priceEstimatedMin","min":4000}
--   {"kind":"hasPain","values":["no_contactos","vender_mas"]}
--   {"kind":"sectorIn","values":["Salud","Inmobiliaria","Legal","Finanzas"]}
--   {"kind":"recentTouch","days":7}
--   {"kind":"tagContains","value":"Recurrente"}

create or replace function public.compute_deal_score(d public.deals)
returns int language plpgsql stable as $$
declare
  s int := 40;
  r record;
  k text;
  c_sector text;
  c_website text;
begin
  -- Pull related company once
  select coalesce(co.sector, ''), coalesce(co.website, '')
    into c_sector, c_website
  from public.companies co
  where co.id = d.company_id;

  for r in
    select * from public.scoring_rules
    where owner_id = d.owner_id and enabled = true
  loop
    k := r.predicate->>'kind';

    if k = 'hasWebsite' then
      if c_website <> '' then s := s + r.weight; end if;

    elsif k = 'sourceIn' then
      if d.source::text = any (
        select jsonb_array_elements_text(r.predicate->'values')
      ) then s := s + r.weight; end if;

    elsif k = 'projectTypeIn' then
      if d.project_type::text = any (
        select jsonb_array_elements_text(r.predicate->'values')
      ) then s := s + r.weight; end if;

    elsif k = 'priceEstimatedMin' then
      if coalesce(d.price_estimated, 0) >= (r.predicate->>'min')::numeric
      then s := s + r.weight; end if;

    elsif k = 'hasPain' then
      if d.pain::text = any (
        select jsonb_array_elements_text(r.predicate->'values')
      ) then s := s + r.weight; end if;

    elsif k = 'sectorIn' then
      if c_sector = any (
        select jsonb_array_elements_text(r.predicate->'values')
      ) then s := s + r.weight; end if;

    elsif k = 'recentTouch' then
      if d.last_touch >= now() - ((r.predicate->>'days')::int || ' days')::interval
      then s := s + r.weight; end if;

    elsif k = 'tagContains' then
      if (r.predicate->>'value') = any (d.tags) then
        s := s + r.weight;
      end if;
    end if;
  end loop;

  return greatest(0, least(100, s));
end $$;

grant execute on function public.compute_deal_score(public.deals) to authenticated;

-- Trigger: recompute score on insert/update of relevant fields.
create or replace function public.deals_set_score()
returns trigger language plpgsql as $$
begin
  new.score := public.compute_deal_score(new);
  return new;
end $$;

drop trigger if exists deals_set_score_trg on public.deals;
create trigger deals_set_score_trg
  before insert or update of source, project_type, pain, price_estimated, tags, company_id, last_touch
  on public.deals
  for each row execute function public.deals_set_score();

-- On-demand: recompute scores for all deals owned by the current user.
-- Useful after toggling rules or changing weights.
create or replace function public.recompute_all_scores()
returns int language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  affected int;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  update public.deals d
    set score = public.compute_deal_score(d)
    where d.owner_id = uid;
  get diagnostics affected = row_count;
  return affected;
end $$;

grant execute on function public.recompute_all_scores() to authenticated;
