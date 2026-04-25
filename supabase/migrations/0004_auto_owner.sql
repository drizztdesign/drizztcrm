-- Safety net: auto-populate owner_id from auth.uid() on INSERT if the client forgot to.
-- Makes inserts idiomatic (no need to remember owner_id everywhere) and safer.

create or replace function public.set_owner_id_default()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.owner_id is null then
    new.owner_id = auth.uid();
  end if;
  return new;
end $$;

do $$ declare t text;
begin
  for t in select unnest(ARRAY['companies','contacts','deals','timeline_events','tasks','templates','automations','scoring_rules','proposals']) loop
    execute format('drop trigger if exists %I_set_owner on public.%I', t, t);
    execute format('create trigger %I_set_owner before insert on public.%I for each row execute function public.set_owner_id_default()', t, t);
  end loop;
end $$;
