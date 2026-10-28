-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
create table if not exists public.tasks (
  id          bigint generated always as identity primary key,
  title       text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  priority    text not null default 'medium' check (priority in ('low','medium','high')),
  due_date    date,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Only the backend (service role key) can access the table
alter table public.tasks enable row level security;
