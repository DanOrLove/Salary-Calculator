"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addMonths, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid } from "@/lib/calendar";
import { money, moneyShort } from "@/lib/format";
import type { Employee, Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
};

export function CalendarGrid({
  month,
  onMonthChange,
  employee,
  overrides,
  salesByDate,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  onMonthChange: (next: Date) => void;
  employee: Employee;
  overrides: Record<string, boolean>;
  salesByDate: Record<string, Sale>;
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}) {
  const [direction, setDirection] = useState(1);
  const cells = useMemo(() => buildMonthGrid(month, employee, overrides), [month, employee, overrides]);
  const monthKey = format(month, "yyyy-MM");

  const move = (delta: number) => {
    setDirection(delta);
    onMonthChange(addMonths(month, delta));
  };

  const jumpToday = () => {
    setDirection(1);
    onMonthChange(startOfMonth(new Date()));
  };

  const title = format(month, "LLLL yyyy", { locale: ru });
  const titlePretty = title.charAt(0).toUpperCase() + title.slice(1);

  return (
    <div className="rounded-4xl border border-ink-700/70 bg-ink-850/60 p-4 backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">Календарь смен</p>
          <div className="relative h-8 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={monthKey}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="text-xl font-semibold tracking-tight text-mist-50"
              >
                {titlePretty}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={jumpToday}
            className="hidden h-9 rounded-xl border border-ink-700 px-3 text-xs font-semibold text-mist-400 transition-colors hover:border-brand-500/60 hover:text-mist-100 sm:block"
          >
            Сегодня
          </button>
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => move(-1)}
            className="grid size-9 place-items-center rounded-xl border border-ink-700 text-mist-400 transition-colors hover:border-brand-500/60 hover:text-mist-100"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => move(1)}
            className="grid size-9 place-items-center rounded-xl border border-ink-700 text-mist-400 transition-colors hover:border-brand-500/60 hover:text-mist-100"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day, index) => (
          <span
            key={day}
            className={cn(
              "text-center text-[11px] font-semibold uppercase tracking-wide",
              index >= 5 ? "text-mist-600" : "text-mist-500",
            )}
          >
            {day}
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={monthKey}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-7 gap-1.5"
          >
            {cells.map((cell, index) => {
              const sale = salesByDate[cell.iso];
              const selected = selectedDate === cell.iso;
              return (
                <motion.button
                  key={cell.iso}
                  type="button"
                  data-day={cell.iso}
                  data-work={cell.isWork ? "1" : "0"}
                  onClick={() => onSelectDate(cell.iso)}
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: Math.min(index * 0.008, 0.24), type: "spring", stiffness: 420, damping: 32 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  title={format(cell.date, "d MMMM yyyy", { locale: ru }) + (cell.isWork ? " — смена" : " — выходной")}
                  className={cn(
                    "relative flex h-[62px] flex-col justify-between rounded-2xl border p-2 text-left transition-colors duration-200 sm:h-[86px] sm:p-2.5",
                    cell.isWork
                      ? "border-brand-500/35 bg-brand-500/12 hover:border-brand-400/70"
                      : "border-ink-700/70 bg-ink-900/40 hover:border-ink-600",
                    !cell.inMonth && "opacity-35",
                    selected && "ring-2 ring-brand-400 ring-offset-2 ring-offset-ink-950",
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] font-semibold sm:text-sm",
                      cell.isWork ? "text-mist-100" : "text-mist-500",
                    )}
                  >
                    {cell.dayNumber}
                  </span>

                  {sale ? (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-[10px] font-semibold text-brand-200 sm:text-[11px]"
                    >
                      {moneyShort(sale.payout)}
                    </motion.span>
                  ) : cell.isWork ? (
                    <span className="hidden text-[9px] font-semibold uppercase tracking-wider text-brand-300/60 sm:block sm:text-[10px]">
                      смена
                    </span>
                  ) : null}

                  {cell.isToday ? (
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand-300" />
                  ) : null}
                  {cell.isOverride ? (
                    <span className="absolute bottom-1.5 right-2 size-1.5 rounded-full bg-amber-300/80" />
                  ) : null}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-mist-500">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-md bg-brand-500" />
          смена
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-md bg-ink-750" />
          выходной
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-amber-300/80" />
          ручная правка
        </span>
        <span className="ml-auto hidden items-center gap-2 sm:flex">
          Нажми на день, чтобы внести продажи
        </span>
      </div>
    </div>
  );
}

export function MonthSummary({
  month,
  employee,
  overrides,
  salesByDate,
}: {
  month: Date;
  employee: Employee;
  overrides: Record<string, boolean>;
  salesByDate: Record<string, Sale>;
}) {
  const cells = useMemo(() => buildMonthGrid(month, employee, overrides), [month, employee, overrides]);
  const stats = useMemo(() => {
    let workDays = 0;
    let revenue = 0;
    let payout = 0;
    let shiftsWithSales = 0;
    for (const cell of cells) {
      if (!cell.inMonth) continue;
      if (cell.isWork) workDays += 1;
      const sale = salesByDate[cell.iso];
      if (sale) {
        revenue += sale.total_amount;
        payout += sale.payout;
        shiftsWithSales += 1;
      }
    }
    return { workDays, revenue, payout, shiftsWithSales };
  }, [cells, salesByDate]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
      <StatTile label="Смен в месяце" value={String(stats.workDays)} accent="neutral" />
      <StatTile label="Дней с продажами" value={String(stats.shiftsWithSales)} accent="neutral" />
      <StatTile label="Продажи" value={money(stats.revenue)} accent="neutral" />
      <StatTile label="Выплата" value={money(stats.payout)} accent="brand" />
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "neutral" | "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border p-4",
        accent === "brand" ? "border-brand-500/40 bg-brand-500/10" : "border-ink-700/70 bg-ink-850/60",
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mist-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-lg font-semibold tracking-tight",
          accent === "brand" ? "text-brand-200" : "text-mist-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
