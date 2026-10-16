"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format, startOfMonth } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BarChart3, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { LineChart } from "@/components/charts/LineChart";
import { ReportSummary } from "@/components/ReportSummary";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, LoadingScreen, Segmented } from "@/components/ui";
import { useEmployee } from "@/hooks/useEmployee";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { buildAllTimeReport, buildMonthReport, monthRange } from "@/lib/report";
import type { Sale } from "@/lib/types";

type Mode = "month" | "all";

const CHART_ACCRUED = "var(--sc-chart-1)";
const CHART_RECEIVED = "var(--sc-chart-2)";

export default function ReportsPage() {
  const router = useRouter();
  const { status, employee } = useEmployee({ requireOnboarded: true, redirectTo: "/login" });

  const [sales, setSales] = useState<Record<string, Sale>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [today, setToday] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [list, overrideMap] = await Promise.all([
          db.listSales(employee.id),
          db.listOverrides(employee.id),
        ]);
        if (cancelled) return;
        const index: Record<string, Sale> = {};
        for (const item of list) index[item.sale_date] = item;
        setSales(index);
        setOverrides(overrideMap);
      } catch {
        // отчёты просто останутся пустыми
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [employee]);

  const months = useMemo(() => monthRange(sales, today, 240), [sales, today]);
  const allReports = useMemo(
    () => (employee ? months.map((item) => buildMonthReport(item, employee, sales, overrides, today)) : []),
    [months, employee, sales, overrides, today],
  );
  const monthReport = useMemo(
    () => (employee ? buildMonthReport(month, employee, sales, overrides, today) : null),
    [month, employee, sales, overrides, today],
  );
  const allTime = useMemo(() => buildAllTimeReport(allReports), [allReports]);
  const recentReports = useMemo(() => allReports.slice(-12), [allReports]);
  const filledReports = useMemo(() => allReports.filter((item) => item.hasData), [allReports]);
  const maxAccrued = useMemo(
    () => filledReports.reduce((top, item) => Math.max(top, item.accrued), 0),
    [filledReports],
  );

  if (status !== "ready" || !employee || !monthReport) {
    return <LoadingScreen label="Считаем отчёты" />;
  }

  const monthKey = format(month, "yyyy-MM");
  const salaryConfigured = Boolean(employee.salary_days);

  const monthlyChart = {
    labels: recentReports.map((item) => item.shortLabel),
    series: [
      { name: "Начислено", color: CHART_ACCRUED, values: recentReports.map((item) => item.accrued) },
      { name: "Получено", color: CHART_RECEIVED, values: recentReports.map((item) => item.received) },
    ],
  };

  const dailyChart = {
    labels: monthReport.days.map((item) => String(item.day)),
    series: [
      {
        name: "Зарплата",
        color: CHART_ACCRUED,
        values: monthReport.days.map((item) => item.amount),
      },
    ],
  };

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3 sm:px-5 sm:py-3.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            aria-label="Назад в кабинет"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mist-50">Отчёты</p>
            <p className="truncate text-[11px] text-mist-500">
              {employee.first_name} {employee.last_name}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-5 sm:gap-5 sm:px-5 lg:py-6">
        <Segmented
          id="report-mode"
          value={mode}
          options={[
            { value: "month", label: "За месяц" },
            { value: "all", label: "За всё время" },
          ]}
          onChange={(next) => setMode(next as Mode)}
        />

        {mode === "month" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                aria-label="Предыдущий месяц"
                onClick={() => setMonth(addMonths(month, -1))}
                className="grid size-9 place-items-center rounded-xl border border-ink-700 text-mist-400 transition-colors hover:border-brand-500/60 hover:text-mist-100"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="relative h-7 flex-1 overflow-hidden text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={monthKey}
                    initial={{ y: 16, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -16, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="text-base font-semibold tracking-tight text-mist-50"
                  >
                    {monthReport.label}
                  </motion.p>
                </AnimatePresence>
              </div>
              <button
                type="button"
                aria-label="Следующий месяц"
                onClick={() => setMonth(addMonths(month, 1))}
                className="grid size-9 place-items-center rounded-xl border border-ink-700 text-mist-400 transition-colors hover:border-brand-500/60 hover:text-mist-100"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            <ReportSummary
              hero={[
                { label: "Начислено за месяц", value: monthReport.accrued, tone: "brand" },
                { label: "Фактически получено", value: monthReport.received, tone: "strong" },
                { label: "Осталось получить", value: monthReport.remaining, tone: "danger" },
                { label: "Отработано смен", value: monthReport.shifts, tone: "strong", isMoney: false },
              ]}
              tiles={[
                { label: "Средний заработок за смену", value: monthReport.averagePerShift },
                {
                  label: "Начислено за 1–15-е",
                  value: monthReport.firstHalf,
                  note: "За 16-е — конец месяца: " + money(monthReport.secondHalf),
                },
              ]}
              progressLabel="Выплачено от начисленного"
              ratio={monthReport.paidRatio}
              progressValue={money(monthReport.received)}
              progressNote={
                salaryConfigured
                  ? "Получено считается по датам зарплаты, которые уже прошли."
                  : "Укажи даты зарплаты в настройках — и кабинет поймёт, сколько уже выплачено."
              }
            />

            <section className="rounded-4xl border border-ink-700/70 bg-ink-850/60 p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-mist-50">
                <BarChart3 className="size-4 text-brand-300" />
                Заработок за {monthReport.label.toLowerCase()}
              </h2>
              <p className="mt-1 text-sm text-mist-500">Сумма заработка за конкретный день, в рублях</p>
              <div className="mt-5">
                <LineChart
                  key={"daily-" + monthKey}
                  labels={dailyChart.labels}
                  series={dailyChart.series}
                  emptyLabel="За этот месяц ещё нет внесённых продаж"
                />
              </div>
            </section>
          </>
        ) : (
          <ReportSummary
            hero={[
              { label: "Всего начислено", value: allTime.accrued, tone: "brand" },
              { label: "Фактически получено", value: allTime.received, tone: "strong" },
              { label: "Осталось получить", value: allTime.remaining, tone: "danger" },
              { label: "Отработано смен", value: allTime.shifts, tone: "strong", isMoney: false },
            ]}
            tiles={[
              { label: "Средний заработок за смену", value: allTime.averagePerShift },
              {
                label: "Средний заработок за месяц",
                value: allTime.averagePerMonth,
                note: "Активных месяцев: " + allTime.activeMonths,
              },
            ]}
            progressLabel="Выплачено от начисленного"
            ratio={allTime.paidRatio}
            progressValue={money(allTime.received)}
            progressNote={
              allTime.best
                ? "Лучший месяц — " + allTime.best.label + ": " + money(allTime.best.accrued)
                : "Данных пока нет"
            }
          />
        )}

        <section className="rounded-4xl border border-ink-700/70 bg-ink-850/60 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-mist-50">
            <TrendingUp className="size-4 text-brand-300" />
            Динамика заработка по месяцам
          </h2>
          <p className="mt-1 text-sm text-mist-500">
            {mode === "month" ? "Последние месяцы в сравнении" : "Все месяцы, по которым есть данные"}
          </p>
          <div className="mt-5">
            <LineChart
              key={"monthly-" + mode}
              labels={monthlyChart.labels}
              series={monthlyChart.series}
              emptyLabel="Внеси продажи — и здесь появится динамика"
            />
          </div>
        </section>

        {mode === "all" && filledReports.length ? (
          <section className="rounded-4xl border border-ink-700/70 bg-ink-850/60 p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight text-mist-50">Месяцы</h2>
            <p className="mt-1 text-sm text-mist-500">Начислено за каждый месяц</p>
            <div className="mt-4 flex flex-col gap-2">
              {[...filledReports].reverse().map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-ink-700/60 bg-ink-900/40 px-3 py-2.5 sm:px-4"
                >
                  <span className="w-[104px] shrink-0 truncate text-[13px] text-mist-300">{item.label}</span>
                  <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800 sm:block">
                    <motion.span
                      className="block h-full rounded-full bg-brand-400"
                      initial={{ width: 0 }}
                      animate={{ width: (maxAccrued > 0 ? (item.accrued / maxAccrued) * 100 : 0) + "%" }}
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </span>
                  <span className="ml-auto shrink-0 text-[13px] font-semibold text-mist-50">
                    {money(item.accrued)}
                  </span>
                  <span className="w-[62px] shrink-0 text-right text-[11px] text-mist-500">
                    {item.shifts} см.
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
