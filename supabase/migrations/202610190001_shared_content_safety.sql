-- Defensa adicional en Supabase para contenido compartido.
-- Los patrones detectan algunos identificadores directos; no garantizan anonimato.

do $$
declare
  v_missing text[] := array[]::text[];
begin
  if to_regclass('public.idea_boards') is null or to_regclass('public.idea_notes') is null then
    v_missing := array_append(v_missing, 'supabase/migrations/202610160001_idea_boards.sql');
  end if;
  if to_regclass('public.sendia_team_plans') is null or to_regclass('public.sendia_team_plan_updates') is null then
    v_missing := array_append(v_missing, 'supabase/migrations/202610180001_institutional_workspace.sql');
  end if;
  if cardinality(v_missing) > 0 then
    raise exception 'Antes de aplicar esta protección, ejecuta en este mismo proyecto Supabase las migraciones base que faltan: %', array_to_string(v_missing, ' y ')
      using errcode = '42P01';
  end if;
end;
$$;

create or replace function public.sendia_text_has_direct_identifier(p_text text)
returns boolean
language plpgsql
immutable
security invoker
set search_path = public, pg_temp
as $$
declare
  v_text text := coalesce(p_text, '');
begin
  if v_text ~* '[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}' then return true; end if;
  if v_text ~* '(^|[^0-9])(\+598[[:space:].-]*)?0?9[0-9][[:space:].-]*[0-9]{3}[[:space:].-]*[0-9]{3}([^0-9]|$)' then return true; end if;
  if v_text ~* '(^|[^0-9])(\+598[[:space:].-]*)?0?2[0-9]{2,3}[[:space:].-]*[0-9]{4}([^0-9]|$)' then return true; end if;
  if v_text ~* '\m(ci|cédula|cedula|documento|dni)\M[[:space:]#°n.º:-]*[0-9][0-9. -]{5,}[0-9]' then return true; end if;
  if v_text ~* '"(student(name)?|child(name)?|case(name)?|nombre(estudiante|alumno|alumna|menor))"[[:space:]]*:' then return true; end if;
  if v_text ~* '\m(nombre|estudiante|alumno|alumna|niño|niña|hijo|hija|menor)\M[[:space:]]*(del|de la|de)?[[:space:]]*(estudiante|alumno|alumna|niño|niña|hijo|hija)?[[:space:]]*[:=]' then return true; end if;
  if v_text ~* '\m(fecha de nacimiento|nació el|nacida el|nacido el|domicilio|dirección|direccion|teléfono|telefono)\M[[:space:]:=]' then return true; end if;
  if v_text ~* '\m(escuela|colegio|liceo|centro educativo)\M[[:space:]]*[:=]' then return true; end if;
  return false;
end;
$$;

create or replace function public.sendia_reject_identifying_shared_text()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_content text;
begin
  if tg_table_name = 'idea_boards' then
    v_content := new.title;
  elsif tg_table_name = 'idea_notes' then
    v_content := new.body;
  elsif tg_table_name = 'sendia_team_plans' then
    v_content := concat_ws(E'\n', new.title, new.objective, new.plan_data::text);
  elsif tg_table_name = 'sendia_team_plan_updates' then
    v_content := new.body;
  else
    raise exception 'Tabla no admitida por la validación de privacidad.';
  end if;

  if public.sendia_text_has_direct_identifier(v_content) then
    raise exception 'No se guardó el contenido: quitá nombres, contactos, documentos, direcciones y datos que puedan identificar a un estudiante. Usá un alias.'
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists sendia_idea_board_privacy_check on public.idea_boards;
create trigger sendia_idea_board_privacy_check
before insert or update of title on public.idea_boards
for each row execute function public.sendia_reject_identifying_shared_text();

drop trigger if exists sendia_idea_note_privacy_check on public.idea_notes;
create trigger sendia_idea_note_privacy_check
before insert or update of body on public.idea_notes
for each row execute function public.sendia_reject_identifying_shared_text();

drop trigger if exists sendia_team_plan_privacy_check on public.sendia_team_plans;
create trigger sendia_team_plan_privacy_check
before insert or update of title, objective, plan_data on public.sendia_team_plans
for each row execute function public.sendia_reject_identifying_shared_text();

drop trigger if exists sendia_team_update_privacy_check on public.sendia_team_plan_updates;
create trigger sendia_team_update_privacy_check
before insert or update of body on public.sendia_team_plan_updates
for each row execute function public.sendia_reject_identifying_shared_text();

-- Evita que una persona profesional reasigne la autoría o mueva un plan entre centros
-- para alterar quién puede verlo. El destino familiar sigue siendo modificable
-- únicamente dentro de la política RLS y debe ser miembro familiar del mismo equipo.
create or replace function public.sendia_keep_team_plan_authorization_fields()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.created_by is distinct from old.created_by
    or new.source_plan_id is distinct from old.source_plan_id then
    raise exception 'No se puede cambiar el equipo, el origen ni la autoría de un plan compartido.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists sendia_team_plan_authorization_guard on public.sendia_team_plans;
create trigger sendia_team_plan_authorization_guard
before update on public.sendia_team_plans
for each row execute function public.sendia_keep_team_plan_authorization_fields();

revoke all on function public.sendia_text_has_direct_identifier(text) from public, anon;
grant execute on function public.sendia_text_has_direct_identifier(text) to authenticated;

