-- SalaryCalculator — миграция для базы, созданной ранней версией схемы
--
-- Как выполнить:
--   1. Открой Supabase -> SQL Editor -> New query
--   2. Вставь весь этот файл
--   3. Нажми Run (или Cmd+Enter)
--
-- Скрипт безопасен для повторного запуска: все операции идут с if not exists.
-- В конце он покажет таблицу с колонками employees — по ней видно, что применилось.

alter table public.employees add column if not exists salary_days text not null default '';
alter table public.employees add column if not exists pin_hash text not null default '';
alter table public.employees add column if not exists pin_salt text not null default '';

-- Проверка. В результате должны быть salary_days, pin_hash и pin_salt.
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'employees'
order by ordinal_position;
