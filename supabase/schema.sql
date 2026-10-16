-- SalaryCalculator — схема Supabase
-- Выполни этот файл в Supabase -> SQL Editor -> New query -> Run

create extension if not exists "pgcrypto";

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  full_name_key text not null unique,
  sales_percent numeric(6,2) not null default 0,
  base_payout numeric(12,2) not null default 0,
  schedule_type text,
  schedule_anchor date,
  schedule_pattern text,
  salary_days text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- на случай, если таблица уже была создана раньше
alter table public.employees add column if not exists salary_days text not null default '';

create table if not exists public.day_overrides (
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null,
  is_work boolean not null default true,
  primary key (employee_id, work_date)
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  sale_date date not null,
  total_amount numeric(14,2) not null default 0,
  payout numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (employee_id, sale_date)
);

create index if not exists sales_employee_date_idx on public.sales (employee_id, sale_date);
create index if not exists overrides_employee_idx on public.day_overrides (employee_id);

alter table public.employees enable row level security;
alter table public.day_overrides enable row level security;
alter table public.sales enable row level security;

-- Вход без пароля: клиент работает с anon-ключом, поэтому политики открытые.
-- Если позже добавишь реальную аутентификацию — замени политики на auth.uid().
drop policy if exists employees_open on public.employees;
create policy employees_open on public.employees
  for all to anon, authenticated using (true) with check (true);

drop policy if exists day_overrides_open on public.day_overrides;
create policy day_overrides_open on public.day_overrides
  for all to anon, authenticated using (true) with check (true);

drop policy if exists sales_open on public.sales;
create policy sales_open on public.sales
  for all to anon, authenticated using (true) with check (true);
