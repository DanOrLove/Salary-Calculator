import { getSupabase } from "./supabase";
import type { Employee, Sale } from "./types";

const KEYS = {
  employees: "salarycalc.employees.v1",
  overrides: "salarycalc.overrides.v1",
  sales: "salarycalc.sales.v1",
};

export type BackendKind = "supabase" | "local";

function canStore(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readTable<T>(key: string, fallback: T): T {
  if (!canStore()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeTable(key: string, value: unknown): void {
  if (!canStore()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .split(" ")
    .filter(Boolean)
    .join(" ");
}

export function fullNameKey(firstName: string, lastName: string): string {
  return normalizeName(firstName) + "|" + normalizeName(lastName);
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function toEmployee(row: Record<string, unknown>): Employee {
  const type = row.schedule_type;
  return {
    id: String(row.id),
    first_name: String(row.first_name ?? ""),
    last_name: String(row.last_name ?? ""),
    full_name_key: String(row.full_name_key ?? ""),
    sales_percent: Number(row.sales_percent ?? 0),
    base_payout: Number(row.base_payout ?? 0),
    schedule_type: type === "2/2" || type === "3/3" ? type : null,
    schedule_anchor: row.schedule_anchor ? String(row.schedule_anchor) : null,
    schedule_pattern: row.schedule_pattern ? String(row.schedule_pattern) : null,
    salary_days: row.salary_days ? String(row.salary_days) : "",
    pin_hash: row.pin_hash ? String(row.pin_hash) : "",
    pin_salt: row.pin_salt ? String(row.pin_salt) : "",
    onboarded: Boolean(row.onboarded),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function toSale(row: Record<string, unknown>): Sale {
  return {
    id: String(row.id),
    employee_id: String(row.employee_id),
    sale_date: String(row.sale_date).slice(0, 10),
    total_amount: Number(row.total_amount ?? 0),
    payout: Number(row.payout ?? 0),
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
}

function localEmployees(): Employee[] {
  return readTable<Employee[]>(KEYS.employees, []);
}

function localSales(): Sale[] {
  return readTable<Sale[]>(KEYS.sales, []);
}

function localOverrides(): Record<string, Record<string, boolean>> {
  return readTable<Record<string, Record<string, boolean>>>(KEYS.overrides, {});
}

type Supabase = NonNullable<ReturnType<typeof getSupabase>>;

const warnedColumns = new Set<string>();

/** Достаёт имя колонки из ответа PostgREST: "Could not find the 'x' column of ..." */
function missingColumnName(error: { message?: string } | null | undefined): string | null {
  const message = error?.message ?? "";
  const marker = "Could not find the '";
  const start = message.indexOf(marker);
  if (start === -1) return null;
  const rest = message.slice(start + marker.length);
  const end = rest.indexOf("'");
  if (end === -1) return null;
  return rest.slice(0, end);
}

function warnMissingColumn(column: string): void {
  if (warnedColumns.has(column)) return;
  warnedColumns.add(column);
  console.warn(
    "В таблице employees нет колонки " + column + " — эти данные не сохранятся. Выполни в Supabase: " +
      "alter table public.employees add column if not exists " + column + " text not null default '';",
  );
}

/** Пишет строку, на ходу выбрасывая колонки, которых нет в старой схеме. */
async function insertTolerant(sb: Supabase, table: string, payload: Record<string, unknown>) {
  const current = { ...payload };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const res = await sb.from(table).insert(current).select("*").single();
    if (!res.error) return res;

    const column = missingColumnName(res.error);
    if (!column || !(column in current)) return res;

    warnMissingColumn(column);
    delete current[column];
  }

  return sb.from(table).insert(current).select("*").single();
}

async function updateTolerant(sb: Supabase, table: string, id: string, patch: Record<string, unknown>) {
  const current = { ...patch };

  for (let attempt = 0; attempt < 5; attempt += 1) {
    // все поля оказались неизвестны схеме — обновлять нечего
    if (Object.keys(current).length === 0) break;

    const res = await sb.from(table).update(current).eq("id", id).select("*").single();
    if (!res.error) return res;

    const column = missingColumnName(res.error);
    if (!column || !(column in current)) return res;

    warnMissingColumn(column);
    delete current[column];
  }

  return sb.from(table).select("*").eq("id", id).single();
}

function fail(message: string): never {
  const text = message || "";
  if (text.includes("schema cache") || text.includes("Could not find the table") || text.includes("PGRST205")) {
    throw new Error(
      "База Supabase ещё не настроена: выполни файл supabase/schema.sql в Supabase -> SQL Editor -> Run.",
    );
  }
  if (text.includes("Invalid API key") || text.includes("JWT") || text.includes("401")) {
    throw new Error("Supabase не принял ключ. Проверь NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local.");
  }
  if (text.includes("Failed to fetch") || text.includes("fetch failed") || text.includes("ENOTFOUND")) {
    throw new Error("Не удалось связаться с Supabase. Проверь NEXT_PUBLIC_SUPABASE_URL и подключение к интернету.");
  }
  if (text.includes("duplicate key") || text.includes("unique")) {
    throw new Error("Сотрудник с таким именем и фамилией уже зарегистрирован.");
  }
  throw new Error(text || "Неизвестная ошибка базы данных");
}

export const db = {
  kind(): BackendKind {
    return getSupabase() ? "supabase" : "local";
  },

  async findEmployeeByName(firstName: string, lastName: string): Promise<Employee | null> {
    const key = fullNameKey(firstName, lastName);
    const sb = getSupabase();
    if (sb) {
      const res = await sb.from("employees").select("*").eq("full_name_key", key).limit(1).maybeSingle();
      if (res.error) fail(res.error.message);
      return res.data ? toEmployee(res.data as Record<string, unknown>) : null;
    }
    return localEmployees().find((item) => item.full_name_key === key) ?? null;
  },

  async createEmployee(input: {
    firstName: string;
    lastName: string;
    pinHash?: string;
    pinSalt?: string;
  }): Promise<Employee> {
    const first = input.firstName.trim();
    const last = input.lastName.trim();
    if (!first || !last) fail("Укажите имя и фамилию");
    const key = fullNameKey(first, last);
    const pinHash = input.pinHash ?? "";
    const pinSalt = input.pinSalt ?? "";
    const sb = getSupabase();
    if (sb) {
      const res = await insertTolerant(sb, "employees", {
        first_name: first,
        last_name: last,
        full_name_key: key,
        sales_percent: 0,
        base_payout: 0,
        schedule_type: null,
        schedule_anchor: null,
        schedule_pattern: null,
        salary_days: "",
        pin_hash: pinHash,
        pin_salt: pinSalt,
        onboarded: false,
      });
      if (res.error) fail(res.error.message);
      return toEmployee(res.data as Record<string, unknown>);
    }
    const employee: Employee = {
      id: newId(),
      first_name: first,
      last_name: last,
      full_name_key: key,
      sales_percent: 0,
      base_payout: 0,
      schedule_type: null,
      schedule_anchor: null,
      schedule_pattern: null,
      salary_days: "",
      pin_hash: pinHash,
      pin_salt: pinSalt,
      onboarded: false,
      created_at: new Date().toISOString(),
    };
    writeTable(KEYS.employees, [...localEmployees(), employee]);
    return employee;
  },

  async getEmployee(id: string): Promise<Employee | null> {
    const sb = getSupabase();
    if (sb) {
      const res = await sb.from("employees").select("*").eq("id", id).limit(1).maybeSingle();
      if (res.error) fail(res.error.message);
      return res.data ? toEmployee(res.data as Record<string, unknown>) : null;
    }
    return localEmployees().find((item) => item.id === id) ?? null;
  },

  async updateEmployee(id: string, patch: Partial<Employee>): Promise<Employee> {
    const sb = getSupabase();
    if (sb) {
      const res = await updateTolerant(sb, "employees", id, patch as Record<string, unknown>);
      if (res.error) fail(res.error.message);
      if (!res.data) fail("Не удалось обновить запись сотрудника");
      return toEmployee(res.data as Record<string, unknown>);
    }
    const next = localEmployees().map((item) => (item.id === id ? { ...item, ...patch } : item));
    writeTable(KEYS.employees, next);
    const found = next.find((item) => item.id === id);
    if (!found) fail("Сотрудник не найден");
    return found;
  },

  async listOverrides(employeeId: string): Promise<Record<string, boolean>> {
    const sb = getSupabase();
    if (sb) {
      const res = await sb.from("day_overrides").select("work_date,is_work").eq("employee_id", employeeId);
      if (res.error) fail(res.error.message);
      const map: Record<string, boolean> = {};
      for (const row of (res.data ?? []) as Array<Record<string, unknown>>) {
        map[String(row.work_date).slice(0, 10)] = Boolean(row.is_work);
      }
      return map;
    }
    return localOverrides()[employeeId] ?? {};
  },

  async setOverride(employeeId: string, date: string, isWork: boolean | null): Promise<Record<string, boolean>> {
    const sb = getSupabase();
    if (sb) {
      if (isWork === null) {
        const res = await sb.from("day_overrides").delete().eq("employee_id", employeeId).eq("work_date", date);
        if (res.error) fail(res.error.message);
      } else {
        const res = await sb
          .from("day_overrides")
          .upsert(
            { employee_id: employeeId, work_date: date, is_work: isWork },
            { onConflict: "employee_id,work_date" },
          );
        if (res.error) fail(res.error.message);
      }
      const readBack = await sb
        .from("day_overrides")
        .select("work_date,is_work")
        .eq("employee_id", employeeId);
      if (readBack.error) fail(readBack.error.message);
      const next: Record<string, boolean> = {};
      for (const row of (readBack.data ?? []) as Array<Record<string, unknown>>) {
        next[String(row.work_date).slice(0, 10)] = Boolean(row.is_work);
      }
      return next;
    }
    const all = localOverrides();
    const current = { ...(all[employeeId] ?? {}) };
    if (isWork === null) {
      delete current[date];
    } else {
      current[date] = isWork;
    }
    all[employeeId] = current;
    writeTable(KEYS.overrides, all);
    return current;
  },

  async listSales(employeeId: string): Promise<Sale[]> {
    const sb = getSupabase();
    if (sb) {
      const res = await sb.from("sales").select("*").eq("employee_id", employeeId).order("sale_date", { ascending: true });
      if (res.error) fail(res.error.message);
      return ((res.data ?? []) as Array<Record<string, unknown>>).map(toSale);
    }
    return localSales()
      .filter((item) => item.employee_id === employeeId)
      .sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  },

  async upsertSale(input: {
    employeeId: string;
    date: string;
    totalAmount: number;
    payout: number;
  }): Promise<Sale> {
    const sb = getSupabase();
    if (sb) {
      const res = await sb
        .from("sales")
        .upsert(
          {
            employee_id: input.employeeId,
            sale_date: input.date,
            total_amount: input.totalAmount,
            payout: input.payout,
          },
          { onConflict: "employee_id,sale_date" },
        )
        .select("*")
        .single();
      if (res.error) fail(res.error.message);
      return toSale(res.data as Record<string, unknown>);
    }
    const all = localSales();
    const existing = all.find((item) => item.employee_id === input.employeeId && item.sale_date === input.date);
    const record: Sale = {
      id: existing ? existing.id : newId(),
      employee_id: input.employeeId,
      sale_date: input.date,
      total_amount: input.totalAmount,
      payout: input.payout,
      created_at: existing ? existing.created_at : new Date().toISOString(),
    };
    writeTable(KEYS.sales, [...all.filter((item) => item.id !== record.id), record]);
    return record;
  },

  async deleteSale(employeeId: string, date: string): Promise<void> {
    const sb = getSupabase();
    if (sb) {
      const res = await sb.from("sales").delete().eq("employee_id", employeeId).eq("sale_date", date);
      if (res.error) fail(res.error.message);
      return;
    }
    const next = localSales().filter((item) => !(item.employee_id === employeeId && item.sale_date === date));
    writeTable(KEYS.sales, next);
  },
};
