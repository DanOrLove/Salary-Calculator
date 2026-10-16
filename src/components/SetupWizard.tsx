"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Rocket, Sparkles } from "lucide-react";
import { ScheduleEditor, type ScheduleDraft } from "./ScheduleEditor";
import { ThemeToggle } from "./ThemeToggle";
import { Button, Callout, TextField } from "./ui";
import { money, number, percent as fmtPercent } from "@/lib/format";
import { calcPayout } from "@/lib/payout";
import { parseAmount } from "@/lib/amount";
import { cn } from "@/lib/utils";

export interface SetupPayload {
  salesPercent: number;
  basePayout: number;
  schedule: ScheduleDraft;
}

const STEP_TITLES = ["Быстрая настройка", "Умный календарь"];

export function SetupWizard({
  initial,
  onComplete,
  onCancel,
  completeLabel = "Начать работу",
  embedded = false,
}: {
  initial: SetupPayload;
  onComplete: (payload: SetupPayload) => Promise<void> | void;
  onCancel?: () => void;
  completeLabel?: string;
  embedded?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [salesPercent, setSalesPercent] = useState(String(initial.salesPercent));
  const [basePayout, setBasePayout] = useState(String(initial.basePayout));
  const [schedule, setSchedule] = useState<ScheduleDraft>(initial.schedule);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const percentValue = parseAmount(salesPercent);
  const baseValue = parseAmount(basePayout);
  const exampleTotal = 50000;
  const examplePayout = calcPayout(baseValue, percentValue, exampleTotal);

  const goTo = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const finish = async () => {
    setSaving(true);
    setError(null);
    try {
      await onComplete({ salesPercent: percentValue, basePayout: baseValue, schedule });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить настройки");
    } finally {
      setSaving(false);
    }
  };

  const card = (
    <div className="w-full max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        {STEP_TITLES.map((title, index) => {
          const active = index === step;
          const passed = index < step;
          return (
            <div key={title} className="flex flex-1 flex-col gap-2">
              <div className="h-1 overflow-hidden rounded-full bg-ink-800">
                <motion.div
                  className="h-full rounded-full bg-brand-500"
                  initial={false}
                  animate={{ width: index <= step ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                  active ? "text-mist-100" : passed ? "text-brand-300" : "text-mist-600",
                )}
              >
                {title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === 0 ? (
            <motion.div
              key="step-pay"
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-brand-500/35 bg-brand-500/12 text-brand-300">
                  <Sparkles className="size-5" />
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50">
                  Как считаем выплату?
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-mist-500">
                  Укажи процент от продаж и сумму выхода. Дальше кабинет посчитает всё сам.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Процент от продаж"
                  value={salesPercent}
                  inputMode="decimal"
                  placeholder="5"
                  suffix="%"
                  onChange={(event) => setSalesPercent(event.target.value)}
                />
                <TextField
                  label="Сумма выхода"
                  value={basePayout}
                  inputMode="decimal"
                  placeholder="2000"
                  suffix="₽"
                  onChange={(event) => setBasePayout(event.target.value)}
                />
              </div>

              <div className="rounded-3xl border border-ink-700/70 bg-ink-900/60 p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
                  Пример расчёта
                </p>
                <p className="mt-2 text-mist-300">
                  Продал на {money(exampleTotal)} — получишь{" "}
                  <span className="font-semibold text-brand-200">{money(examplePayout)}</span>
                </p>
                <p className="mt-1.5 text-[11px] text-mist-600">
                  {number(baseValue)} ₽ выход + {fmtPercent(percentValue)} от {number(exampleTotal)} ₽
                </p>
              </div>

              <div className="flex gap-2">
                {onCancel ? (
                  <Button variant="ghost" onClick={onCancel}>
                    Отмена
                  </Button>
                ) : null}
                <Button className="flex-1" size="lg" onClick={() => goTo(1)} disabled={percentValue <= 0 && baseValue <= 0}>
                  Далее
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-schedule"
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-5"
            >
              <div className="text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-brand-500/35 bg-brand-500/12 text-brand-300">
                  <Rocket className="size-5" />
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50">Твой график смен</h1>
                <p className="mt-2 text-sm leading-relaxed text-mist-500">
                  Выбери 2/2 или 3/3 и отметь рабочие дни — календарь закрасит смены сам.
                </p>
              </div>

              <ScheduleEditor value={schedule} onChange={setSchedule} previewDays={21} />

              <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => goTo(0)}>
                  <ArrowLeft className="size-4" />
                  Назад
                </Button>
                <Button className="flex-1" size="lg" loading={saving} onClick={finish}>
                  {completeLabel}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  if (embedded) return card;

  return (
    <main className="relative flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="dashed-frame w-full max-w-xl bg-ink-850/40 p-6 backdrop-blur-xl sm:p-8"
      >
        {card}
      </motion.div>
    </main>
  );
}
