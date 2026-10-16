-- Tableros de ideas con membresía por código. No incluir datos identificativos de estudiantes.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.idea_boards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invite_hash text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.idea_board_members (
  board_id uuid not null references public.idea_boards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Docente', 'Familia', 'Orientación')),
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

create table if not exists public.idea_notes (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.idea_boards(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  author_role text not null check (author_role in ('Docente', 'Familia', 'Orientación')),
  column_key text not null check (column_key in ('observar', 'preguntar', 'probar')),
  body text not null check (char_length(body) between 1 and 500),
  color text not null check (color in ('yellow', 'lilac', 'lime', 'coral')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, board_id)
);

create table if not exists public.idea_note_votes (
  board_id uuid not null,
  note_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (note_id, user_id),
  foreign key (note_id, board_id) references public.idea_notes(id, board_id) on delete cascade
);

create or replace function public.is_idea_board_member(p_board_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.idea_board_members where board_id = p_board_id and user_id = auth.uid()) $$;

create or replace function public.create_idea_board(p_title text, p_role text)
returns table(board_id uuid, board_title text, invite_code text, owner_id uuid)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_id uuid; v_code text;
begin
  if auth.uid() is null then raise exception 'Debes iniciar una sesión anónima.'; end if;
  if char_length(trim(p_title)) not between 3 and 80 then raise exception 'El título debe tener entre 3 y 80 caracteres.'; end if;
  if p_role not in ('Docente', 'Familia', 'Orientación') then raise exception 'Perfil no válido.'; end if;
  v_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
  insert into public.idea_boards(title, owner_id, invite_hash)
    values (trim(p_title), auth.uid(), encode(extensions.digest(v_code, 'sha256'), 'hex'))
    returning id, title into v_id, board_title;
  insert into public.idea_board_members(board_id, user_id, role) values (v_id, auth.uid(), p_role);
  board_id := v_id; invite_code := v_code; owner_id := auth.uid();
  return next;
end $$;

create or replace function public.join_idea_board(p_invite_code text, p_role text)
returns table(board_id uuid, board_title text, owner_id uuid)
language plpgsql security definer set search_path = public, extensions, pg_temp
as $$
declare v_id uuid; v_title text; v_owner uuid;
begin
  if auth.uid() is null then raise exception 'Debes iniciar una sesión anónima.'; end if;
  if p_role not in ('Docente', 'Familia', 'Orientación') then raise exception 'Perfil no válido.'; end if;
  select b.id, b.title, b.owner_id into v_id, v_title, v_owner from public.idea_boards b
    where b.invite_hash = encode(extensions.digest(upper(trim(p_invite_code)), 'sha256'), 'hex');
  if v_id is null then raise exception 'Código de sala no válido.'; end if;
  insert into public.idea_board_members(board_id, user_id, role) values (v_id, auth.uid(), p_role)
    on conflict (board_id, user_id) do update set role = excluded.role;
  board_id := v_id; board_title := v_title; owner_id := v_owner;
  return next;
end $$;

alter table public.idea_boards enable row level security;
alter table public.idea_board_members enable row level security;
alter table public.idea_notes enable row level security;
alter table public.idea_note_votes enable row level security;

create policy "members can read boards" on public.idea_boards for select to authenticated using (public.is_idea_board_member(id));
create policy "owners can delete boards" on public.idea_boards for delete to authenticated using (owner_id = auth.uid());
create policy "members can read membership" on public.idea_board_members for select to authenticated using (public.is_idea_board_member(board_id));
create policy "members can read notes" on public.idea_notes for select to authenticated using (public.is_idea_board_member(board_id));
create policy "members can add notes as themselves" on public.idea_notes for insert to authenticated with check (public.is_idea_board_member(board_id) and author_id = auth.uid());
create policy "authors can edit their notes" on public.idea_notes for update to authenticated using (public.is_idea_board_member(board_id) and author_id = auth.uid()) with check (public.is_idea_board_member(board_id) and author_id = auth.uid());
create policy "authors can remove their notes" on public.idea_notes for delete to authenticated using (public.is_idea_board_member(board_id) and author_id = auth.uid());
create policy "members can read votes" on public.idea_note_votes for select to authenticated using (public.is_idea_board_member(board_id));
create policy "members can vote once" on public.idea_note_votes for insert to authenticated with check (public.is_idea_board_member(board_id) and user_id = auth.uid());
create policy "members can remove their votes" on public.idea_note_votes for delete to authenticated using (public.is_idea_board_member(board_id) and user_id = auth.uid());

revoke all on function public.create_idea_board(text, text) from public;
revoke all on function public.join_idea_board(text, text) from public;
grant execute on function public.create_idea_board(text, text) to authenticated;
grant execute on function public.join_idea_board(text, text) to authenticated;
grant execute on function public.is_idea_board_member(uuid) to authenticated;
grant select on public.idea_boards, public.idea_board_members, public.idea_notes, public.idea_note_votes to authenticated;
grant delete on public.idea_boards to authenticated;
grant insert, update, delete on public.idea_notes to authenticated;
grant insert, delete on public.idea_note_votes to authenticated;

alter publication supabase_realtime add table public.idea_boards;
alter publication supabase_realtime add table public.idea_board_members;
alter publication supabase_realtime add table public.idea_notes;
alter publication supabase_realtime add table public.idea_note_votes;
