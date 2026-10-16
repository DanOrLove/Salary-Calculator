"use client";

import { useCallback, useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Settings as SettingsIcon } from "lucide-react";
import { CalendarGrid, MonthSummary } from "@/components/CalendarGrid";
import { DayEditor } from "@/components/DayEditor";
import { Logo } from "@/components/Logo";
import { SettingsModal } from "@/components/SettingsModal";
import { Button, LoadingScreen, Modal, Panel } from "@/components/ui";
import { useEmployee } from "@/hooks/useEmployee";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { db } from "@/lib/db";
import { money, percent as fmtPercent } from "@/lib/format";
import { calcPayout } from "@/lib/payout";
import { SCHEDULE_TITLE, isWorkByPattern } from "@/lib/schedule";
import type { Sale } from "@/lib/types";

export default function DashboardPage() {
  const { status, employee, setEmployee, signOut } = useEmployee({
    requireOnboarded: true,
    redirectTo: "/login",
  });

  const isDesktop = useIsDesktop();
  const [month, setMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [salesByDate, setSalesByDate] = useState<Record<string, Sale>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [sales, overrideMap] = await Promise.all([
          db.listSales(employee.id),
          db.listOverrides(employee.id),
        ]);
        if (cancelled) return;
        const map: Record<string, Sale> = {};
        for (const item of sales) map[item.sale_date] = item;
        setSalesByDate(map);
        setOverrides(overrideMap);
      } catch {
        // оставим пустые данные, интерфейс продолжит работать
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [employee]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const plannedWork = useCallback(
    (iso: string) => {
      if (!employee || !employee.schedule_type || !employee.schedule_anchor) return true;
      return isWorkByPattern(employee.schedule_anchor, employee.schedule_pattern, employee.schedule_type, iso);
    },
    [employee],
  );

  const selectedSale = salesByDate[selectedDate] ?? null;
  const manualOverride = overrides[selectedDate];
  const selectedIsWork = typeof manualOverride === "boolean" ? manualOverride : plannedWork(selectedDate);

  const handleSelect = (iso: string) => {
    setSelectedDate(iso);
    if (!isDesktop) setMobileOpen(true);
  };

  const handleSave = async (total: number) => {
    if (!employee) return;
    const payout = calcPayout(employee.base_payout, employee.sales_percent, total);
    const saved = await db.upsertSale({
      employeeId: employee.id,
      date: selectedDate,
      totalAmount: total,
      payout,
    });
    setSalesByDate((prev) => ({ ...prev, [selectedDate]: saved }));
    setToast("День сохранён");
  };

  const handleDelete = async () => {
    if (!employee) return;
    await db.deleteSale(employee.id, selectedDate);
    setSalesByDate((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setToast("Запись удалена");
  };

  const handleToggleWork = async (next: boolean) => {
    if (!employee) return;
    const planned = plannedWork(selectedDate);
    const value = planned === next ? null : next;
    const map = await db.setOverride(employee.id, selectedDate, value);
    setOverrides(map);
  };

  if (status !== "ready" || !employee) {
    return <LoadingScreen label="Открываем кабинет" />;
  }

  const scheduleLabel = employee.schedule_type ? SCHEDULE_TITLE[employee.schedule_type] : "график не задан";

  const editor = (segmentedId: string) => (
    <DayEditor
      dateIso={selectedDate}
      employee={employee}
      sale={selectedSale}
      isWork={selectedIsWork}
      segmentedId={segmentedId}
      onToggleWork={handleToggleWork}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="min-h-dvh pb-16">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <Logo withText={false} size={38} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-mist-50">
              {employee.first_name} {employee.last_name}
            </p>
            <p className="truncate text-[11px] text-mist-500">
              {scheduleLabel} · выход {money(employee.base_payout)} · {fmtPercent(employee.sales_percent)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon className="size-4" />
            <span className="hidden sm:inline">Настройки</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-5 sm:gap-5 sm:px-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:py-6">
        <CalendarGrid
          month={month}
          onMonthChange={setMonth}
          employee={employee}
          overrides={overrides}
          salesByDate={salesByDate}
          selectedDate={selectedDate}
          onSelectDate={handleSelect}
        />

        <div className="flex flex-col gap-5">
          <MonthSummary month={month} employee={employee} overrides={overrides} salesByDate={salesByDate} />
          {isDesktop ? <Panel className="p-5">{editor("day-desktop")}</Panel> : null}
        </div>
      </main>

      {isDesktop ? null : (
        <Modal open={mobileOpen} onClose={() => setMobileOpen(false)} title="Продажи за день">
          {editor("day-mobile")}
        </Modal>
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        employee={employee}
        onSaved={(next) => {
          setEmployee(next);
          setToast("Настройки обновлены");
        }}
        onSignOut={() => {
          setSettingsOpen(false);
          signOut();
        }}
      />

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-brand-500/40 bg-ink-900/95 px-4 py-2.5 text-sm font-medium text-brand-100 shadow-glow backdrop-blur-xl"
          >
            <CheckCircle2 className="size-4 text-brand-300" />
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
