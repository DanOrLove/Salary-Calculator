import { differenceInCalendarDays, parseISO } from "date-fns";
import type { ScheduleType } from "./types";

export const SCHEDULE_TYPES: ScheduleType[] = ["2/2", "3/3"];

export const CYCLE_LENGTH: Record<ScheduleType, number> = {
  "2/2": 4,
  "3/3": 6,
};

export const DEFAULT_PATTERN: Record<ScheduleType, string> = {
  "2/2": "1100",
  "3/3": "111000",
};

export const SCHEDULE_TITLE: Record<ScheduleType, string> = {
  "2/2": "2 через 2",
  "3/3": "3 через 3",
};

export const SCHEDULE_HINT: Record<ScheduleType, string> = {
  "2/2": "Две смены подряд, два выходных",
  "3/3": "Три смены подряд, три выходных",
};

export function normalizePattern(pattern: string | null | undefined, type: ScheduleType): string {
  const length = CYCLE_LENGTH[type];
  const base = (pattern ?? "").slice(0, length);
  return base.padEnd(length, "0");
}

export function cycleIndex(anchorIso: string, dateIso: string, length: number): number {
  const diff = differenceInCalendarDays(parseISO(dateIso), parseISO(anchorIso));
  return ((diff % length) + length) % length;
}

export function isWorkByPattern(
  anchorIso: string,
  pattern: string | null | undefined,
  type: ScheduleType,
  dateIso: string,
): boolean {
  const normalized = normalizePattern(pattern, type);
  return normalized[cycleIndex(anchorIso, dateIso, CYCLE_LENGTH[type])] === "1";
}

export function countWorkDays(pattern: string): number {
  let total = 0;
  for (const char of pattern) {
    if (char === "1") total += 1;
  }
  return total;
}

export function shiftPattern(pattern: string, steps: number): string {
  if (!pattern.length) return pattern;
  const offset = ((steps % pattern.length) + pattern.length) % pattern.length;
  return pattern.slice(offset) + pattern.slice(0, offset);
}

export function indexToIso(anchorIso: string, index: number): string {
  const anchor = parseISO(anchorIso);
  const next = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + index);
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return String(next.getFullYear()) + "-" + month + "-" + day;
}
