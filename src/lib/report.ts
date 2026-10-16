import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { buildMonthGrid, toIso } from "./calendar";
import { parseSalaryDays } from "./salary";
import type { CalendarCell } from "./calendar";
import type { Employee, Sale } from "./types";

export interface DayEarning {
  iso: string;
  day: number;
  amount: number;
  isWork: boolean;
  isToday: boolean;
}

export interface MonthReport {
  key: string;
  label: string;
  shortLabel: string;
  accrued: number;
  received: number;
  remaining: number;
  paidRatio: number;
  shifts: number;
  averagePerShift: number;
  firstHalf: number;
  secondHalf: number;
  days: DayEarning[];
  hasData: boolean;
}

function pad(value: number): string {
  return value < 10 ? "0" + value : String(value);
}

function monthKeyOf(date: Date): string {
  return String(date.getFullYear()) + "-" + pad(date.getMonth() + 1);
}

function monthLabel(date: Date): string {
  const raw = format(date, "LLLL yyyy", { locale: ru });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function shortMonthLabel(date: Date): string {
  const raw = format(date, "LLL", { locale: ru });
  return raw.charAt(0).toUpperCase() + raw.slice(1).replace(".", "");
}

function isBeforeMonth(date: Date, today: Date): boolean {
  if (date.getFullYear() !== today.getFullYear()) return date.getFullYear() < today.getFullYear();
  return date.getMonth() < today.getMonth();
}

function isAfterMonth(date: Date, today: Date): boolean {
  if (date.getFullYear() !== today.getFullYear()) return date.getFullYear() > today.getFullYear();
  return date.getMonth() > today.getMonth();
}

/** Последняя прошедшая дата зарплаты внутри месяца, иначе null. */
function lastPaidDayThisMonth(salaryDays: number[], today: Date): number | null {
  let best: number | null = null;
  for (const day of salaryDays) {
    if (day <= today.getDate()) {
      if (best === null || day > best) best = day;
    }
  }
  return best;
}

export function buildMonthReport(
  month: Date,
  employee: Employee,
  salesByDate: Record<string, Sale>,
  overrides: Record<string, boolean>,
  today: Date = new Date(),
): MonthReport {
  const cells: CalendarCell[] = buildMonthGrid(month, employee, overrides);
  const days: DayEarning[] = [];
  let accrued = 0;
  let firstHalf = 0;
  let shifts = 0;

  for (const cell of cells) {
    if (!cell.inMonth) continue;
    const sale = salesByDate[cell.iso];
    const amount = sale ? sale.payout : 0;
    if (sale) {
      accrued += amount;
      shifts += 1;
      if (cell.dayNumber <= 15) firstHalf += amount;
    }
    days.push({
      iso: cell.iso,
      day: cell.dayNumber,
      amount,
      isWork: cell.isWork,
      isToday: cell.isToday,
    });
  }

  const secondHalf = accrued - firstHalf;
  const salaryDays = parseSalaryDays(employee.salary_days);

  let received = 0;
  if (isBeforeMonth(month, today)) {
    received = accrued;
  } else if (!isAfterMonth(month, today)) {
    const paidDay = lastPaidDayThisMonth(salaryDays, today);
    if (paidDay !== null) {
      for (const item of days) {
        if (item.day <= paidDay) received += item.amount;
      }
    }
  }

  const remaining = Math.max(0, accrued - received);

  return {
    key: monthKeyOf(month),
    label: monthLabel(month),
    shortLabel: shortMonthLabel(month),
    accrued,
    received,
    remaining,
    paidRatio: accrued > 0 ? received / accrued : 0,
    shifts,
    averagePerShift: shifts > 0 ? accrued / shifts : 0,
    firstHalf,
    secondHalf,
    days,
    hasData: accrued > 0,
  };
}

export interface AllTimeReport {
  accrued: number;
  received: number;
  remaining: number;
  paidRatio: number;
  shifts: number;
  averagePerShift: number;
  averagePerMonth: number;
  activeMonths: number;
  best: MonthReport | null;
  firstMonth: MonthReport | null;
  lastMonth: MonthReport | null;
}

export function buildAllTimeReport(reports: MonthReport[]): AllTimeReport {
  let accrued = 0;
  let received = 0;
  let shifts = 0;
  let activeMonths = 0;
  let best: MonthReport | null = null;

  for (const report of reports) {
    accrued += report.accrued;
    received += report.received;
    shifts += report.shifts;
    if (report.hasData) {
      activeMonths += 1;
      if (!best || report.accrued > best.accrued) best = report;
    }
  }

  return {
    accrued,
    received,
    remaining: Math.max(0, accrued - received),
    paidRatio: accrued > 0 ? received / accrued : 0,
    shifts,
    averagePerShift: shifts > 0 ? accrued / shifts : 0,
    averagePerMonth: activeMonths > 0 ? accrued / activeMonths : 0,
    activeMonths,
    best,
    firstMonth: reports.find((item) => item.hasData) ?? null,
    lastMonth: [...reports].reverse().find((item) => item.hasData) ?? null,
  };
}

/** Список месяцев от первого месяца с данными до текущего (не больше limit). */
export function monthRange(salesByDate: Record<string, Sale>, today: Date, limit = 12): Date[] {
  const keys = Object.keys(salesByDate).sort();
  const start = keys.length
    ? new Date(Number(keys[0].slice(0, 4)), Number(keys[0].slice(5, 7)) - 1, 1)
    : new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth(), 1);

  const months: Date[] = [];
  let cursor = start;
  while (cursor.getTime() <= end.getTime()) {
    months.push(new Date(cursor));
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }

  if (months.length > limit) return months.slice(months.length - limit);
  return months.length ? months : [end];
}

export function salesIndex(sales: Sale[]): Record<string, Sale> {
  const index: Record<string, Sale> = {};
  for (const sale of sales) index[sale.sale_date] = sale;
  return index;
}

export { toIso };
