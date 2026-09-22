create table public.assistant_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index assistant_usage_user_time_idx on public.assistant_usage(user_id, created_at desc);

alter table public.assistant_usage enable row level security;

create policy "users can read their own assistant usage" on public.assistant_usage
  for select using (auth.uid() = user_id);

create policy "users can log their own assistant usage" on public.assistant_usage
  for insert to authenticated with check (auth.uid() = user_id);
