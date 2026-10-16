import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { DEFAULT_PATTERN, isWorkByPattern } from "./schedule";
import type { Employee } from "./types";

export function toIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export interface CalendarCell {
  date: Date;
  iso: string;
  dayNumber: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isWork: boolean;
  isOverride: boolean;
}

export function buildMonthGrid(
  month: Date,
  employee: Employee,
  overrides: Record<string, boolean>,
): CalendarCell[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const todayIso = toIso(new Date());
  const type = employee.schedule_type;
  const anchor = employee.schedule_anchor;
  const pattern = employee.schedule_pattern ?? (type ? DEFAULT_PATTERN[type] : null);

  const cells: CalendarCell[] = [];
  let cursor = start;

  while (cursor.getTime() <= end.getTime()) {
    const key = format(cursor, "yyyy-MM-dd");
    const override = overrides[key];
    const planned = type && anchor ? isWorkByPattern(anchor, pattern, type, key) : true;
    const weekday = cursor.getDay();

    cells.push({
      date: new Date(cursor),
      iso: key,
      dayNumber: cursor.getDate(),
      inMonth: cursor.getMonth() === month.getMonth() && cursor.getFullYear() === month.getFullYear(),
      isToday: key === todayIso,
      isWeekend: weekday === 0 || weekday === 6,
      isWork: typeof override === "boolean" ? override : planned,
      isOverride: typeof override === "boolean",
    });

    cursor = addDays(cursor, 1);
  }

  return cells;
}

export function workDaysInMonth(
  month: Date,
  employee: Employee,
  overrides: Record<string, boolean>,
): number {
  return buildMonthGrid(month, employee, overrides).filter((cell) => cell.inMonth && cell.isWork).length;
}
