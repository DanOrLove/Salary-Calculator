"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { Check, Trash2 } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";
import { Button, Callout, Segmented, TextField } from "./ui";
import { formatAmountInput, parseAmount } from "@/lib/amount";
import { money, number, percent as fmtPercent } from "@/lib/format";
import { calcBonus, calcPayout } from "@/lib/payout";
import type { Employee, Sale } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DayEditor({
  dateIso,
  employee,
  sale,
  isWork,
  segmentedId,
  onToggleWork,
  onSave,
  onDelete,
}: {
  dateIso: string;
  employee: Employee;
  sale: Sale | null;
  isWork: boolean;
  segmentedId: string;
  onToggleWork: (next: boolean) => void;
  onSave: (totalAmount: number) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAmount(sale ? formatAmountInput(sale.total_amount) : "");
    setError(null);
  }, [dateIso, sale]);

  const total = useMemo(() => parseAmount(amount), [amount]);
  const bonus = useMemo(() => calcBonus(employee.sales_percent, total), [employee.sales_percent, total]);
  const payout = useMemo(
    () => calcPayout(employee.base_payout, employee.sales_percent, total),
    [employee.base_payout, employee.sales_percent, total],
  );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await onDelete();
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить");
    } finally {
      setRemoving(false);
    }
  };

  const dateLabel = format(parseISO(dateIso), "d MMMM, EEEE", { locale: ru });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">Выбранный день</p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-mist-50">{dateLabel}</h3>
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl border",
            isWork ? "border-brand-500/40 bg-brand-500/15 text-brand-200" : "border-ink-700 bg-ink-900 text-mist-500",
          )}
        >
          <Check className={cn("size-4", !isWork && "opacity-30")} />
        </span>
      </div>

      <Segmented
        id={segmentedId}
        value={isWork ? "work" : "off"}
        options={[
          { value: "work", label: "Смена" },
          { value: "off", label: "Выходной" },
        ]}
        onChange={(next) => onToggleWork(next === "work")}
      />

      <TextField
        label="Сумма проданного товара"
        value={amount}
        inputMode="decimal"
        placeholder="0"
        suffix="₽"
        onChange={(event) => setAmount(event.target.value)}
        hint="Введи общую сумму продаж за этот день — выплата посчитается сама."
      />

      <div className="rounded-3xl border border-ink-700/70 bg-ink-900/60 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">Расчёт выплаты</p>

        <div className="mt-3 flex flex-col gap-2.5 text-sm">
          <Row label="Сумма выхода" value={money(employee.base_payout)} />
          <Row
            label={"Процент " + fmtPercent(employee.sales_percent) + " от " + money(total)}
            value={"+" + money(bonus)}
          />
          <div className="my-1 h-px bg-ink-700/70" />
          <div className="flex items-baseline justify-between">
            <span className="font-medium text-mist-300">Итого к выплате</span>
            <AnimatedNumber
              value={payout}
              format={(input) => money(input)}
              className="text-xl font-semibold tracking-tight text-brand-200"
            />
          </div>
        </div>

        <p className="mt-3 text-[11px] leading-relaxed text-mist-600">
          {number(employee.base_payout)} ₽ + {fmtPercent(employee.sales_percent)} × {number(total)} ₽ = {money(payout, true)}
        </p>
      </div>

      <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

      <div className="flex gap-2">
        <Button onClick={submit} loading={saving} className="flex-1">
          {sale ? "Обновить день" : "Сохранить день"}
        </Button>
        {sale ? (
          <Button variant="danger" onClick={remove} loading={removing} aria-label="Удалить продажу">
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      <AnimatePresence>
        {sale ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center text-[11px] text-mist-600"
          >
            Сохранено: продажи {money(sale.total_amount)} · выплата {money(sale.payout)}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-mist-500">{label}</span>
      <span className="font-medium text-mist-100">{value}</span>
    </div>
  );
}
