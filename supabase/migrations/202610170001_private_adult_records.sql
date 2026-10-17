-- Registros de acompañamiento privados por cuenta adulta.
-- No usar para datos identificativos de menores ni como sustituto de una revisión legal.
create table if not exists public.sendia_private_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  context text not null check (context in ('aula', 'centro', 'familia')),
  alias text not null check (char_length(alias) between 2 and 40),
  title text not null check (char_length(title) between 3 and 100),
  next_step text not null check (char_length(next_step) between 3 and 1200),
  review_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sendia_private_records_owner_updated_idx
  on public.sendia_private_records (owner_id, updated_at desc);

alter table public.sendia_private_records enable row level security;

drop policy if exists "adults can read own SendIA records" on public.sendia_private_records;
create policy "adults can read own SendIA records"
  on public.sendia_private_records for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "adults can create own SendIA records" on public.sendia_private_records;
create policy "adults can create own SendIA records"
  on public.sendia_private_records for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "adults can update own SendIA records" on public.sendia_private_records;
create policy "adults can update own SendIA records"
  on public.sendia_private_records for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "adults can delete own SendIA records" on public.sendia_private_records;
create policy "adults can delete own SendIA records"
  on public.sendia_private_records for delete to authenticated
  using (owner_id = auth.uid());

grant select, insert, update, delete on public.sendia_private_records to authenticated;
revoke all on public.sendia_private_records from anon;
