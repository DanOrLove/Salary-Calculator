// scripts/health.mjs — быстрая проверка живого контура SalaryCalculator.
// Запуск: npm run health
// Проверяет прод-маршруты, таблицы и колонки Supabase, переменные окружения.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const PROD = process.env.PROD_URL || "https://salary-calculator-sable.vercel.app";

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split(String.fromCharCode(10))) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.slice(0, 1) === "#") continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!env[key]) env[key] = value;
    }
  } catch {
    // .env.local нет — работаем на переменных окружения
  }
  return env;
}

const env = loadEnv();
const SUPABASE = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const rows = [];
const add = (group, name, ok, detail) => rows.push({ group, name, ok, detail });

async function head(url) {
  try {
    const res = await fetch(url, { redirect: "manual" });
    return res.status;
  } catch {
    return 0;
  }
}

async function rest(path) {
  try {
    const res = await fetch(SUPABASE + "/rest/v1/" + path, {
      headers: { apikey: ANON, Authorization: "Bearer " + ANON },
    });
    return res.status;
  } catch {
    return 0;
  }
}

// 1. Прод
for (const route of ["/", "/register", "/login"]) {
  const status = await head(PROD + route);
  add("Прод", route, status === 200, "HTTP " + status);
}
for (const route of ["/dashboard", "/reports", "/setup"]) {
  const status = await head(PROD + route);
  add("Прод", route + " без сессии", status === 307, "HTTP " + status + " (ожидается редирект)");
}

// 2. Supabase
if (!SUPABASE || !ANON) {
  add("Supabase", "переменные окружения", false, "нет NEXT_PUBLIC_SUPABASE_URL или ANON_KEY");
} else {
  for (const table of ["employees", "day_overrides", "sales"]) {
    const status = await rest(table + "?select=*&limit=1");
    add("Supabase", "таблица " + table, status === 200, "HTTP " + status);
  }
  for (const column of ["salary_days", "pin_hash", "pin_salt"]) {
    const status = await rest("employees?select=" + column + "&limit=1");
    add("Supabase", "колонка " + column, status === 200, status === 200 ? "есть" : "НЕТ — выполни supabase/migrate.sql");
  }
}

// Вывод
let failed = 0;
let group = "";
for (const row of rows) {
  if (row.group !== group) {
    group = row.group;
    console.log("");
    console.log(group);
  }
  if (!row.ok) failed += 1;
  console.log("  " + (row.ok ? "[ok]  " : "[!!]  ") + row.name.padEnd(28) + row.detail);
}

console.log("");
console.log(failed === 0 ? "Всё в порядке: " + rows.length + " проверок пройдено." : "Проблем: " + failed + " из " + rows.length + ".");
process.exit(failed === 0 ? 0 : 1);
