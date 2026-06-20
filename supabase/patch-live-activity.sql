-- Suivi temps réel de l'activité enfant pour l'espace parent.
-- Une seule ligne est conservée par enfant et devient inactive après expiration du heartbeat.

create table if not exists public.child_live_activity (
  child_id uuid primary key references public.children(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  module_slug text not null,
  activity_label text,
  activity_ar text,
  view_name text,
  is_active boolean not null default true,
  progress_percent integer check (progress_percent between 0 and 100),
  updated_at timestamptz not null default now()
);

create index if not exists child_live_activity_parent_id_idx
  on public.child_live_activity(parent_id);

alter table public.child_live_activity enable row level security;

drop policy if exists "Parents can read own child activity" on public.child_live_activity;
create policy "Parents can read own child activity"
  on public.child_live_activity
  for select
  using (parent_id = auth.uid());

drop policy if exists "Parents can insert own child activity" on public.child_live_activity;
create policy "Parents can insert own child activity"
  on public.child_live_activity
  for insert
  with check (
    parent_id = auth.uid()
    and exists (
      select 1
      from public.children
      where children.id = child_live_activity.child_id
        and children.parent_id = auth.uid()
    )
  );

drop policy if exists "Parents can update own child activity" on public.child_live_activity;
create policy "Parents can update own child activity"
  on public.child_live_activity
  for update
  using (parent_id = auth.uid())
  with check (
    parent_id = auth.uid()
    and exists (
      select 1
      from public.children
      where children.id = child_live_activity.child_id
        and children.parent_id = auth.uid()
    )
  );

do $$
begin
  alter publication supabase_realtime add table public.child_live_activity;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.progress;
exception
  when duplicate_object then null;
end $$;
