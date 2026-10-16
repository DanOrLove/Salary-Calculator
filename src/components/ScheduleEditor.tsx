"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CalendarRange, Check, Moon, Sun, Wand2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CYCLE_LENGTH,
  DEFAULT_PATTERN,
  SCHEDULE_HINT,
  SCHEDULE_TITLE,
  SCHEDULE_TYPES,
  countWorkDays,
  indexToIso,
  isWorkByPattern,
  normalizePattern,
} from "@/lib/schedule";
import type { ScheduleType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ScheduleDraft {
  type: ScheduleType;
  anchor: string;
  pattern: string;
}

export function ScheduleEditor({
  value,
  onChange,
  previewDays = 28,
}: {
  value: ScheduleDraft;
  onChange: (next: ScheduleDraft) => void;
  previewDays?: number;
}) {
  const length = CYCLE_LENGTH[value.type];
  const pattern = normalizePattern(value.pattern, value.type);
  const preview = Array.from({ length: previewDays }, (_, index) => indexToIso(value.anchor, index));
  const workCount = countWorkDays(pattern);

  const chooseType = (type: ScheduleType) => {
    onChange({ type, anchor: value.anchor, pattern: DEFAULT_PATTERN[type] });
  };

  const toggleIndex = (index: number) => {
    const chars = pattern.split("");
    chars[index] = chars[index] === "1" ? "0" : "1";
    onChange({ ...value, pattern: chars.join("") });
  };

  const reset = () => onChange({ ...value, pattern: DEFAULT_PATTERN[value.type] });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {SCHEDULE_TYPES.map((type) => {
          const active = type === value.type;
          return (
            <motion.button
              key={type}
              type="button"
              onClick={() => chooseType(type)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative overflow-hidden rounded-3xl border p-4 text-left transition-colors duration-200",
                active
                  ? "border-brand-400/70 bg-brand-500/12"
                  : "border-ink-700 bg-ink-850/60 hover:border-ink-600",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold tracking-tight text-mist-50">{SCHEDULE_TITLE[type]}</span>
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border transition-colors",
                    active ? "border-brand-400 bg-brand-500 text-mist-50" : "border-ink-600 text-transparent",
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </div>
              <p className="mt-1 text-xs text-mist-500">{SCHEDULE_HINT[type]}</p>
              <div className="mt-4 flex gap-1.5">
                {DEFAULT_PATTERN[type].split("").map((char, index) => (
                  <span
                    key={index}
                    className={cn(
                      "h-6 flex-1 rounded-lg",
                      char === "1" ? "bg-brand-500/70" : "bg-ink-700/70",
                    )}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      <label className="flex flex-col gap-2">
        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
          <CalendarRange className="size-3.5" />
          Первый день цикла
        </span>
        <span className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-900/70 px-3.5 focus-within:border-brand-400/80">
          <input
            type="date"
            value={value.anchor}
            onChange={(event) => onChange({ ...value, anchor: event.target.value || value.anchor })}
            className="h-12 w-full bg-transparent text-[15px] font-medium text-mist-100 outline-none"
          />
          <span className="shrink-0 text-xs text-mist-600">
            {format(parseISO(value.anchor), "d MMMM", { locale: ru })}
          </span>
        </span>
      </label>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
            <Wand2 className="size-3.5" />
            Рабочие дни в цикле
          </span>
          <button
            type="button"
            onClick={reset}
            className="text-xs font-medium text-brand-300 transition-colors hover:text-brand-200"
          >
            Сбросить
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {Array.from({ length }, (_, index) => {
            const iso = indexToIso(value.anchor, index);
            const isWork = pattern[index] === "1";
            return (
              <motion.button
                key={value.type + "-" + index}
                type="button"
                onClick={() => toggleIndex(index)}
                whileTap={{ scale: 0.94 }}
                className={cn(
                  "flex w-16 flex-col items-center gap-1 rounded-2xl border py-2.5 transition-colors duration-200",
                  isWork
                    ? "border-brand-400/70 bg-brand-500/15 text-mist-50"
                    : "border-ink-700 bg-ink-900/70 text-mist-500 hover:border-ink-600",
                )}
              >
                {isWork ? <Sun className="size-3.5 text-brand-300" /> : <Moon className="size-3.5" />}
                <span className="text-sm font-semibold">{format(parseISO(iso), "d")}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  {format(parseISO(iso), "EEEEEE", { locale: ru })}
                </span>
              </motion.button>
            );
          })}
        </div>

        <p className="mt-3 text-xs text-mist-600">
          В цикле {length} дней, рабочих — {workCount}. Календарь продлит этот ритм на все месяцы вперёд.
        </p>
      </div>

      <div className="rounded-3xl border border-ink-700/70 bg-ink-900/50 p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
          Как ляжет график
        </p>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence mode="popLayout">
            {preview.map((iso, index) => {
              const isWork = isWorkByPattern(value.anchor, pattern, value.type, iso);
              return (
                <motion.span
                  key={iso + "-" + index}
                  layout
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ delay: index * 0.012, type: "spring", stiffness: 420, damping: 30 }}
                  title={format(parseISO(iso), "d MMMM", { locale: ru }) + (isWork ? " — смена" : " — выходной")}
                  className={cn(
                    "size-7 rounded-xl",
                    isWork ? "bg-brand-500 shadow-[var(--sc-shadow)]" : "bg-ink-750",
                  )}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
