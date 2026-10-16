"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { SalaryDaysField } from "./SalaryDaysField";
import { ScheduleEditor, type ScheduleDraft } from "./ScheduleEditor";
import { Button, Callout, Modal, Segmented, TextField } from "./ui";
import { formatAmountInput, parseAmount } from "@/lib/amount";
import { money, number, percent as fmtPercent } from "@/lib/format";
import { calcPayout } from "@/lib/payout";
import { DEFAULT_PATTERN } from "@/lib/schedule";
import { toIso } from "@/lib/calendar";
import type { Employee } from "@/lib/types";

type Tab = "pay" | "schedule";

export function SettingsModal({
  open,
  onClose,
  employee,
  onSaved,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  onSaved: (next: Employee) => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("pay");
  const [salesPercent, setSalesPercent] = useState("0");
  const [basePayout, setBasePayout] = useState("0");
  const [salaryDays, setSalaryDays] = useState("");
  const [schedule, setSchedule] = useState<ScheduleDraft>({
    type: "2/2",
    anchor: toIso(new Date()),
    pattern: DEFAULT_PATTERN["2/2"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSalesPercent(formatAmountInput(employee.sales_percent));
    setBasePayout(formatAmountInput(employee.base_payout));
    setSalaryDays(employee.salary_days ?? "");
    const type = employee.schedule_type ?? "2/2";
    setSchedule({
      type,
      anchor: employee.schedule_anchor ?? toIso(new Date()),
      pattern: employee.schedule_pattern ?? DEFAULT_PATTERN[type],
    });
    setError(null);
    setSaving(false);
  }, [open, employee]);

  const percentValue = parseAmount(salesPercent);
  const baseValue = parseAmount(basePayout);
  const preview = calcPayout(baseValue, percentValue, 50000);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const { db } = await import("@/lib/db");
      const updated = await db.updateEmployee(employee.id, {
        sales_percent: percentValue,
        base_payout: baseValue,
        schedule_type: schedule.type,
        schedule_anchor: schedule.anchor,
        schedule_pattern: schedule.pattern,
        salary_days: salaryDays,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Настройки" description="Выплаты и график смен">
      <div className="flex flex-col gap-5">
        <Segmented
          id="settings-tabs"
          value={tab}
          options={[
            { value: "pay", label: "Выплаты" },
            { value: "schedule", label: "График" },
          ]}
          onChange={(next) => setTab(next as Tab)}
        />

        <AnimatePresence mode="wait" initial={false}>
          {tab === "pay" ? (
            <motion.div
              key="tab-pay"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="flex flex-col gap-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Процент от продаж"
                  value={salesPercent}
                  inputMode="decimal"
                  suffix="%"
                  onChange={(event) => setSalesPercent(event.target.value)}
                />
                <TextField
                  label="Сумма выхода"
                  value={basePayout}
                  inputMode="decimal"
                  suffix="₽"
                  onChange={(event) => setBasePayout(event.target.value)}
                />
              </div>
              <SalaryDaysField value={salaryDays} onChange={setSalaryDays} />

              <p className="rounded-2xl border border-ink-700/70 bg-ink-900/60 px-4 py-3 text-xs text-mist-500">
                Пример: продажи {money(50000)} → выплата{" "}
                <span className="font-semibold text-brand-200">{money(preview)}</span> ({number(baseValue)} ₽ +{" "}
                {fmtPercent(percentValue)})
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="tab-schedule"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
            >
              <ScheduleEditor value={schedule} onChange={setSchedule} previewDays={21} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

        <div className="flex items-center gap-2 border-t border-ink-800 pt-4">
          <Button variant="ghost" size="sm" onClick={onSignOut} className="text-mist-500">
            <LogOut className="size-4" />
            Выйти
          </Button>
          <Button className="ml-auto flex-1 sm:flex-none" loading={saving} onClick={save}>
            Сохранить
          </Button>
        </div>
      </div>
    </Modal>
  );
}
