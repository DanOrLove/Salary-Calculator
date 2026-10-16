import { addMonths, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { plural } from "./format";

export const MAX_SALARY_DAYS = 4;

/** "5,20" -> [5, 20] */
export function parseSalaryDays(raw: string | null | undefined): number[] {
  if (!raw) return [];
  const days: number[] = [];
  for (const token of String(raw).split(",")) {
    const value = Number(token.trim());
    if (Number.isInteger(value) && value >= 1 && value <= 31 && !days.includes(value)) {
      days.push(value);
    }
  }
  return days.sort((a, b) => a - b);
}

export function serializeSalaryDays(days: number[]): string {
  const unique: number[] = [];
  for (const day of days) {
    if (Number.isInteger(day) && day >= 1 && day <= 31 && !unique.includes(day)) unique.push(day);
  }
  return unique
    .sort((a, b) => a - b)
    .slice(0, MAX_SALARY_DAYS)
    .join(",");
}

/** Строит дату внутри месяца, подрезая день под его длину (31 -> 28/30). */
export function clampDayToMonth(year: number, monthIndex: number, day: number): Date {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return new Date(year, monthIndex, Math.min(day, lastDay));
}

export interface PaydayInfo {
  date: Date;
  daysLeft: number;
  isToday: boolean;
}

export function nextPayday(days: number[], from: Date = new Date()): PaydayInfo | null {
  if (!days.length) return null;
  const today = startOfDay(from);
  let best: Date | null = null;

  for (const day of days) {
    let candidate = clampDayToMonth(today.getFullYear(), today.getMonth(), day);
    if (differenceInCalendarDays(candidate, today) < 0) {
      const next = addMonths(today, 1);
      candidate = clampDayToMonth(next.getFullYear(), next.getMonth(), day);
    }
    if (!best || candidate.getTime() < best.getTime()) best = candidate;
  }

  if (!best) return null;
  const daysLeft = differenceInCalendarDays(best, today);
  return { date: best, daysLeft, isToday: daysLeft === 0 };
}

export function paydayCountdownLabel(info: PaydayInfo): string {
  if (info.daysLeft === 0) return "сегодня";
  if (info.daysLeft === 1) return "завтра";
  return "через " + info.daysLeft + " " + plural(info.daysLeft, "день", "дня", "дней");
}

export function paydayDateLabel(date: Date): string {
  return format(date, "d MMMM", { locale: ru });
}

export function ordinalDay(day: number): string {
  return day + "-е";
}
