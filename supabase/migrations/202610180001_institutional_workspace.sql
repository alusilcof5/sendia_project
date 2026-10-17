-- Espacios institucionales SendIA: membresías, invitaciones por rol y planes compartidos.
-- No almacenar información identificativa de estudiantes.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sendia_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  owner_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.sendia_org_members (
  organization_id uuid not null references public.sendia_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 80),
  role text not null check (role in ('admin', 'coordinator', 'teacher', 'family', 'guidance')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.sendia_org_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.sendia_organizations(id) on delete cascade,
  code_hash text not null unique,
  role text not null check (role in ('coordinator', 'teacher', 'family', 'guidance')),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  revoked_at timestamptz,
  max_uses integer not null default 20 check (max_uses between 1 and 100),
  use_count integer not null default 0 check (use_count >= 0)
);

create table if not exists public.sendia_team_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.sendia_organizations(id) on delete cascade,
  source_plan_id text not null,
  title text not null check (char_length(trim(title)) between 3 and 160),
  objective text not null check (char_length(trim(objective)) between 3 and 1000),
  plan_data jsonb not null check (jsonb_typeof(plan_data) = 'object' and octet_length(plan_data::text) <= 50000),
  team_status text not null default 'active' check (team_status in ('active', 'review', 'completed')),
  shared_with_family_id uuid,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, source_plan_id),
  foreign key (shared_with_family_id) references auth.users(id) on delete set null
);

create table if not exists public.sendia_team_plan_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.sendia_organizations(id) on delete cascade,
  plan_id uuid not null references public.sendia_team_plans(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete restrict,
  update_type text not null check (update_type in ('perspective', 'action', 'observation', 'review')),
  body text not null check (char_length(trim(body)) between 2 and 1600),
  created_at timestamptz not null default now()
);

create index if not exists sendia_org_members_user_idx on public.sendia_org_members(user_id, organization_id);
create index if not exists sendia_team_plans_org_updated_idx on public.sendia_team_plans(organization_id, updated_at desc);
create index if not exists sendia_team_plan_updates_plan_idx on public.sendia_team_plan_updates(plan_id, created_at desc);

create or replace function public.sendia_is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.sendia_org_members m where m.organization_id = p_org_id and m.user_id = auth.uid()) $$;

create or replace function public.sendia_is_org_staff(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.sendia_org_members m where m.organization_id = p_org_id and m.user_id = auth.uid() and m.role <> 'family') $$;

create or replace function public.sendia_is_org_admin(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.sendia_org_members m where m.organization_id = p_org_id and m.user_id = auth.uid() and m.role = 'admin') $$;

create or replace function public.sendia_can_read_team_plan(p_plan_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.sendia_team_plans p
    join public.sendia_org_members m on m.organization_id = p.organization_id and m.user_id = auth.uid()
    where p.id = p_plan_id and (m.role <> 'family' or p.shared_with_family_id = auth.uid() or p.created_by = auth.uid())
  )
$$;

create or replace function public.sendia_plan_belongs_to_org(p_plan_id uuid, p_org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.sendia_team_plans p where p.id = p_plan_id and p.organization_id = p_org_id) $$;

create or replace function public.sendia_valid_family_target(p_org_id uuid, p_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select p_user_id is null or exists (select 1 from public.sendia_org_members m where m.organization_id = p_org_id and m.user_id = p_user_id and m.role = 'family') $$;

create or replace function public.sendia_create_organization(p_name text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_id uuid;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'Inicia sesión con un correo verificado para crear un espacio.'; end if;
  if char_length(trim(p_name)) not between 2 and 120 or char_length(trim(p_display_name)) not between 2 and 80 then raise exception 'Revisa el nombre del centro y tu nombre visible.'; end if;
  insert into public.sendia_organizations(name, owner_id) values (trim(p_name), auth.uid()) returning id into v_id;
  insert into public.sendia_org_members(organization_id, user_id, display_name, role) values (v_id, auth.uid(), trim(p_display_name), 'admin');
  return v_id;
end $$;

create or replace function public.sendia_create_org_invite(p_org_id uuid, p_role text)
returns table(invite_code text, invite_expires_at timestamptz) language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_code text; v_exp timestamptz;
begin
  if not public.sendia_is_org_admin(p_org_id) then raise exception 'Solo una persona administradora puede crear invitaciones.'; end if;
  if p_role not in ('coordinator', 'teacher', 'family', 'guidance') then raise exception 'El rol de invitación no es válido.'; end if;
  v_code := upper(substr(encode(extensions.gen_random_bytes(12), 'hex'), 1, 16));
  v_exp := now() + interval '14 days';
  insert into public.sendia_org_invites(organization_id, code_hash, role, created_by, expires_at)
    values (p_org_id, encode(extensions.digest(v_code, 'sha256'), 'hex'), p_role, auth.uid(), v_exp);
  invite_code := v_code; invite_expires_at := v_exp; return next;
end $$;

create or replace function public.sendia_join_organization(p_code text, p_display_name text)
returns uuid language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_invite public.sendia_org_invites%rowtype; v_inserted integer;
begin
  if auth.uid() is null or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'Accede con un enlace enviado a tu correo antes de unirte.'; end if;
  if char_length(trim(p_display_name)) not between 2 and 80 or char_length(trim(p_code)) not between 12 and 20 then raise exception 'Revisa tu nombre visible y el código.'; end if;
  select * into v_invite from public.sendia_org_invites i
    where i.code_hash = encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex')
    and i.revoked_at is null and i.expires_at > now() and i.use_count < i.max_uses
    for update;
  if v_invite.id is null then raise exception 'El código no es válido, ha caducado o fue revocado.'; end if;
  insert into public.sendia_org_members(organization_id, user_id, display_name, role)
    values (v_invite.organization_id, auth.uid(), trim(p_display_name), v_invite.role)
    on conflict (organization_id, user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then update public.sendia_org_invites set use_count = use_count + 1 where id = v_invite.id; end if;
  return v_invite.organization_id;
end $$;

create or replace function public.sendia_remove_org_member(p_org_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.sendia_is_org_admin(p_org_id) then raise exception 'Solo una persona administradora puede gestionar miembros.'; end if;
  if p_user_id = auth.uid() then raise exception 'No puedes quitarte como administradora. Transfiere primero la administración.'; end if;
  if exists (select 1 from public.sendia_organizations o where o.id = p_org_id and o.owner_id = p_user_id) then raise exception 'No se puede quitar a quien creó el espacio institucional.'; end if;
  delete from public.sendia_org_members where organization_id = p_org_id and user_id = p_user_id;
end $$;

create or replace function public.sendia_touch_team_plan()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists sendia_team_plan_updated_at on public.sendia_team_plans;
create trigger sendia_team_plan_updated_at before update on public.sendia_team_plans for each row execute function public.sendia_touch_team_plan();

alter table public.sendia_organizations enable row level security;
alter table public.sendia_org_members enable row level security;
alter table public.sendia_org_invites enable row level security;
alter table public.sendia_team_plans enable row level security;
alter table public.sendia_team_plan_updates enable row level security;

drop policy if exists "org members can read their organizations" on public.sendia_organizations;
create policy "org members can read their organizations" on public.sendia_organizations for select to authenticated using (public.sendia_is_org_member(id));
drop policy if exists "members can read their institution roster" on public.sendia_org_members;
create policy "members can read their institution roster" on public.sendia_org_members for select to authenticated using (public.sendia_is_org_member(organization_id));
drop policy if exists "admins can read institution invites" on public.sendia_org_invites;
create policy "admins can read institution invites" on public.sendia_org_invites for select to authenticated using (public.sendia_is_org_admin(organization_id));
drop policy if exists "admins can revoke institution invites" on public.sendia_org_invites;
create policy "admins can revoke institution invites" on public.sendia_org_invites for update to authenticated using (public.sendia_is_org_admin(organization_id)) with check (public.sendia_is_org_admin(organization_id));
drop policy if exists "team can read permitted plans" on public.sendia_team_plans;
create policy "team can read permitted plans" on public.sendia_team_plans for select to authenticated using (public.sendia_can_read_team_plan(id));
drop policy if exists "staff can share plans" on public.sendia_team_plans;
create policy "staff can share plans" on public.sendia_team_plans for insert to authenticated with check (
  created_by = auth.uid() and public.sendia_is_org_staff(organization_id) and public.sendia_valid_family_target(organization_id, shared_with_family_id)
);
drop policy if exists "staff can update shared plans" on public.sendia_team_plans;
create policy "staff can update shared plans" on public.sendia_team_plans for update to authenticated using (public.sendia_is_org_staff(organization_id)) with check (
  public.sendia_is_org_staff(organization_id) and public.sendia_valid_family_target(organization_id, shared_with_family_id)
);
drop policy if exists "team can read permitted plan updates" on public.sendia_team_plan_updates;
create policy "team can read permitted plan updates" on public.sendia_team_plan_updates for select to authenticated using (public.sendia_can_read_team_plan(plan_id));
drop policy if exists "permitted members can add plan updates" on public.sendia_team_plan_updates;
create policy "permitted members can add plan updates" on public.sendia_team_plan_updates for insert to authenticated with check (
  author_id = auth.uid() and public.sendia_is_org_member(organization_id)
  and public.sendia_can_read_team_plan(plan_id)
  and public.sendia_plan_belongs_to_org(plan_id, organization_id)
);

revoke all on public.sendia_organizations, public.sendia_org_members, public.sendia_org_invites, public.sendia_team_plans, public.sendia_team_plan_updates from anon;
grant select on public.sendia_organizations, public.sendia_org_members, public.sendia_org_invites, public.sendia_team_plans, public.sendia_team_plan_updates to authenticated;
grant update (revoked_at) on public.sendia_org_invites to authenticated;
grant insert, update on public.sendia_team_plans to authenticated;
grant insert on public.sendia_team_plan_updates to authenticated;

revoke all on function public.sendia_is_org_member(uuid) from public;
revoke all on function public.sendia_is_org_staff(uuid) from public;
revoke all on function public.sendia_is_org_admin(uuid) from public;
revoke all on function public.sendia_can_read_team_plan(uuid) from public;
revoke all on function public.sendia_plan_belongs_to_org(uuid, uuid) from public;
revoke all on function public.sendia_valid_family_target(uuid, uuid) from public;
revoke all on function public.sendia_create_organization(text, text) from public;
revoke all on function public.sendia_create_org_invite(uuid, text) from public;
revoke all on function public.sendia_join_organization(text, text) from public;
revoke all on function public.sendia_remove_org_member(uuid, uuid) from public;
grant execute on function public.sendia_is_org_member(uuid) to authenticated;
grant execute on function public.sendia_is_org_staff(uuid) to authenticated;
grant execute on function public.sendia_is_org_admin(uuid) to authenticated;
grant execute on function public.sendia_can_read_team_plan(uuid) to authenticated;
grant execute on function public.sendia_plan_belongs_to_org(uuid, uuid) to authenticated;
grant execute on function public.sendia_valid_family_target(uuid, uuid) to authenticated;
grant execute on function public.sendia_create_organization(text, text) to authenticated;
grant execute on function public.sendia_create_org_invite(uuid, text) to authenticated;
grant execute on function public.sendia_join_organization(text, text) to authenticated;
grant execute on function public.sendia_remove_org_member(uuid, uuid) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.sendia_org_members;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.sendia_team_plans;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.sendia_team_plan_updates;
exception when duplicate_object then null;
end $$;
