-- NoteFlow: sessions + notes tables with Row Level Security
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Untitled Session',
  full_transcript text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  topic text not null,
  summary text not null,
  key_points text[] not null default '{}',
  created_at timestamptz not null default now(),
  transcript_chunk text
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index sessions_user_id_idx on public.sessions (user_id);
create index sessions_created_at_idx on public.sessions (created_at desc);
create index notes_session_id_idx on public.notes (session_id);
create index notes_created_at_idx on public.notes (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger (sessions)
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sessions_set_updated_at
  before update on public.sessions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.sessions enable row level security;
alter table public.notes enable row level security;

-- Sessions: users can only access their own rows
create policy "sessions_select_own"
  on public.sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "sessions_insert_own"
  on public.sessions
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "sessions_update_own"
  on public.sessions
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions_delete_own"
  on public.sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Notes: access via owning session
create policy "notes_select_own"
  on public.notes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "notes_insert_own"
  on public.notes
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "notes_update_own"
  on public.notes
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = auth.uid()
    )
  );

create policy "notes_delete_own"
  on public.notes
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.sessions s
      where s.id = notes.session_id
        and s.user_id = auth.uid()
    )
  );
