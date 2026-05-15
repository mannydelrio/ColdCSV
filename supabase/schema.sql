-- Run this in the Supabase SQL editor

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'scale')),
  credits_used int not null default 0,
  credits_limit int not null default 10,
  credits_reset_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now()
);

-- Auto-create user row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Jobs table
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  row_count int,
  credits_consumed int,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Usage logs table
create table if not exists public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete set null,
  rows_processed int not null,
  created_at timestamptz not null default now()
);

-- Row-level security
alter table public.users enable row level security;
alter table public.jobs enable row level security;
alter table public.usage_logs enable row level security;

-- Users: can only read/update their own row
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- Jobs: can only see their own jobs
create policy "jobs_select_own" on public.jobs
  for select using (auth.uid() = user_id);

create policy "jobs_insert_own" on public.jobs
  for insert with check (auth.uid() = user_id);

-- Usage logs: can only see their own
create policy "usage_logs_select_own" on public.usage_logs
  for select using (auth.uid() = user_id);
