"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { addMonths, format, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildMonthGrid, monthTotals, type CalendarCell } from "@/lib/calendar";
import { money, moneyCompact, moneyShort } from "@/lib/format";
import type { Employee, Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 26 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -26 }),
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
  const totals = useMemo(() => monthTotals(cells, salesByDate), [cells, salesByDate]);
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
    <section className="sm:rounded-4xl sm:border sm:border-ink-700/70 sm:bg-ink-850/60 sm:p-5 lg:p-6">
      <header className="mb-3 flex items-center justify-between gap-3 sm:mb-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-mist-500 sm:text-[11px]">
            Календарь смен
          </p>
          <div className="relative h-7 overflow-hidden sm:h-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.h2
                key={monthKey}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="text-lg font-semibold tracking-tight text-mist-50 sm:text-xl"
              >
                {titlePretty}
              </motion.h2>
            </AnimatePresence>
          </div>
          <p className="mt-0.5 text-[11px] text-mist-500 lg:hidden">
            {totals.workDays} смен · выплата{" "}
            <span className="font-semibold text-brand-300">{money(totals.payout)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
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
      </header>

      <div className="-mx-4 overflow-hidden border-y border-ink-700/60 bg-ink-700/60 sm:mx-0 sm:rounded-2xl sm:border">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((day, index) => (
            <span
              key={day}
              className={cn(
                "bg-ink-850 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide sm:py-2 sm:text-[11px]",
                index >= 5 ? "text-mist-600" : "text-mist-500",
              )}
            >
              {day}
            </span>
          ))}
        </div>

        <div className="relative mt-px overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={monthKey}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-7 gap-px"
            >
              {cells.map((cell, index) => (
                <DayCell
                  key={cell.iso}
                  cell={cell}
                  index={index}
                  sale={salesByDate[cell.iso]}
                  selected={selectedDate === cell.iso}
                  onSelect={onSelectDate}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-mist-500 sm:mt-4">
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-[3px] rounded-full bg-gold-400" />
          продажи и выплата
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-[3px] rounded-full bg-brand-400/45" />
          смена
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-4 rounded-full bg-brand-400" />
          сегодня
        </span>
        <span className="ml-auto hidden text-mist-600 sm:block">Нажми на день, чтобы внести продажи</span>
      </div>
    </section>
  );
}

function DayCell({
  cell,
  index,
  sale,
  selected,
  onSelect,
}: {
  cell: CalendarCell;
  index: number;
  sale: Sale | undefined;
  selected: boolean;
  onSelect: (iso: string) => void;
}) {
  return (
    <motion.button
      type="button"
      data-day={cell.iso}
      data-work={cell.isWork ? "1" : "0"}
      onClick={() => onSelect(cell.iso)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.006, 0.18), duration: 0.22, ease: "easeOut" }}
      whileTap={{ scale: 0.96 }}
      title={format(cell.date, "d MMMM yyyy", { locale: ru }) + (cell.isWork ? " — смена" : " — выходной")}
      className={cn(
        "relative flex min-h-[64px] flex-col justify-between p-1.5 text-left transition-colors duration-200 sm:min-h-[92px] sm:p-2.5",
        cell.isWork ? "bg-moss-950 hover:bg-moss-900" : "bg-ink-900 hover:bg-ink-850",
        !cell.inMonth && "opacity-35",
        selected && "ring-2 ring-inset ring-brand-400",
      )}
    >
      <span className="flex items-start justify-between gap-1">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full text-[13px] font-semibold sm:size-8 sm:text-sm",
            cell.isToday
              ? "bg-brand-400 font-bold text-ink-950"
              : cell.isWork
                ? "text-mist-100"
                : "text-mist-500",
          )}
        >
          {cell.dayNumber}
        </span>
        {cell.isOverride ? <span className="mt-1 size-1.5 rounded-full bg-gold-300/80" /> : null}
      </span>

      <span className="flex items-center gap-1">
        {sale ? (
          <>
            <span className="h-3.5 w-[3px] shrink-0 rounded-full bg-gold-400" />
            <span className="truncate text-[11px] font-semibold leading-none text-mist-50 sm:hidden">
              {moneyCompact(sale.payout)}
            </span>
            <span className="hidden truncate text-xs font-semibold leading-none text-mist-50 sm:block">
              {moneyShort(sale.payout)}
            </span>
          </>
        ) : cell.isWork ? (
          <span className="h-3.5 w-[3px] rounded-full bg-brand-400/45" />
        ) : null}
      </span>
    </motion.button>
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
  const totals = useMemo(() => monthTotals(cells, salesByDate), [cells, salesByDate]);

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-2">
      <StatTile label="Смен в месяце" value={String(totals.workDays)} />
      <StatTile label="Дней с продажами" value={String(totals.shiftsWithSales)} />
      <StatTile label="Продажи" value={money(totals.revenue)} />
      <StatTile label="Выплата" value={money(totals.payout)} accent="brand" />
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
  accent?: "brand";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3 sm:rounded-3xl sm:p-4",
        accent === "brand" ? "border-brand-500/40 bg-brand-500/10" : "border-ink-700/70 bg-ink-850/60",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-mist-500 sm:text-[11px]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-semibold tracking-tight sm:mt-1.5 sm:text-lg",
          accent === "brand" ? "text-brand-200" : "text-mist-50",
        )}
      >
        {value}
      </p>
    </div>
  );
}
