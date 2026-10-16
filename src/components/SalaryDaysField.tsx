"use client";

import { useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, Coins, X } from "lucide-react";
import {
  MAX_SALARY_DAYS,
  nextPayday,
  ordinalDay,
  parseSalaryDays,
  paydayCountdownLabel,
  paydayDateLabel,
  serializeSalaryDays,
} from "@/lib/salary";
import { cn } from "@/lib/utils";

const SEPARATORS = [",", ";", " "];

function splitTokens(value: string): { tokens: string[]; trailing: string } {
  const tokens: string[] = [];
  let buffer = "";
  for (const char of value) {
    if (SEPARATORS.includes(char)) {
      if (buffer.trim()) tokens.push(buffer.trim());
      buffer = "";
    } else {
      buffer += char;
    }
  }
  return { tokens, trailing: buffer };
}

export function SalaryDaysField({
  value,
  onChange,
  label = "Даты зарплаты",
  hint = "Введи день месяца и нажми Enter. Например 5 и 20 — аванс и зарплата.",
  showPreview = true,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  hint?: string;
  showPreview?: boolean;
  className?: string;
}) {
  const days = parseSalaryDays(value);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const info = nextPayday(days);

  const commit = (tokens: string[]) => {
    const next = [...days];
    let rejected = false;

    for (const token of tokens) {
      const parsed = Number(token.trim());
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 31) {
        rejected = true;
        continue;
      }
      if (next.includes(parsed)) continue;
      if (next.length >= MAX_SALARY_DAYS) {
        rejected = true;
        continue;
      }
      next.push(parsed);
    }

    setError(rejected ? "Нужен день месяца от 1 до 31, максимум " + MAX_SALARY_DAYS + " даты" : null);
    setDraft("");
    const serialized = serializeSalaryDays(next);
    if (serialized !== serializeSalaryDays(days)) onChange(serialized);
  };

  const remove = (day: number) => {
    setError(null);
    onChange(serializeSalaryDays(days.filter((item) => item !== day)));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === "Tab") {
      if (draft.trim()) {
        event.preventDefault();
        commit([draft]);
      }
      return;
    }
    if (SEPARATORS.includes(event.key)) {
      if (draft.trim()) {
        event.preventDefault();
        commit([draft]);
      }
      return;
    }
    if (event.key === "Backspace" && !draft && days.length) {
      event.preventDefault();
      remove(days[days.length - 1]);
    }
  };

  const handleChange = (raw: string) => {
    const { tokens, trailing } = splitTokens(raw);
    if (tokens.length) {
      commit(tokens);
      setDraft(trailing);
      return;
    }
    setDraft(trailing);
  };

  return (
    <div className={cn("block", className)}>
      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
        <CalendarPlus className="size-3.5" />
        {label}
      </span>

      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-ink-700 bg-ink-900/70 px-2.5 py-2 transition-colors focus-within:border-brand-400/80">
        <AnimatePresence initial={false}>
          {days.map((day) => (
            <motion.span
              key={day}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="inline-flex items-center gap-1 rounded-xl border border-brand-500/30 bg-brand-500/12 py-1 pl-2.5 pr-1.5 text-xs font-semibold text-brand-200"
            >
              {ordinalDay(day)}
              <button
                type="button"
                onClick={() => remove(day)}
                aria-label={"Убрать " + ordinalDay(day)}
                className="grid size-4 place-items-center rounded-full text-brand-300/70 transition-colors hover:bg-brand-500/25 hover:text-brand-100"
              >
                <X className="size-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        <input
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) commit([draft]);
          }}
          inputMode="numeric"
          placeholder={days.length ? "ещё" : "5"}
          aria-label={label}
          className="min-w-[52px] flex-1 bg-transparent py-1 text-[15px] font-medium text-mist-100 outline-none placeholder:text-mist-600"
        />
      </div>

      {error ? (
        <span className="mt-2 block text-xs text-danger">{error}</span>
      ) : days.length && info && showPreview ? (
        <span className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-mist-500">
          <Coins className="size-3 text-gold-400" />
          Ближайшая — <span className="font-medium text-mist-200">{paydayDateLabel(info.date)}</span>,
          <span className="font-medium text-brand-300">{paydayCountdownLabel(info)}</span>
        </span>
      ) : (
        <span className="mt-2 block text-xs leading-relaxed text-mist-600">{hint}</span>
      )}
    </div>
  );
}
