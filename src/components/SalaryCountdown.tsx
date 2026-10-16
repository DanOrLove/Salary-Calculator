"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import {
  nextPayday,
  parseSalaryDays,
  paydayCountdownLabel,
  paydayDateLabel,
} from "@/lib/salary";
import { cn } from "@/lib/utils";

export function SalaryCountdown({
  salaryDays,
  onConfigure,
  className,
}: {
  salaryDays: string;
  onConfigure?: () => void;
  className?: string;
}) {
  const days = useMemo(() => parseSalaryDays(salaryDays), [salaryDays]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const info = useMemo(() => nextPayday(days, now), [days, now]);

  if (!days.length || !info) {
    return (
      <button
        type="button"
        onClick={onConfigure}
        disabled={!onConfigure}
        className={cn(
          "flex items-center gap-2 text-[12px] text-mist-500 transition-colors",
          onConfigure && "hover:text-mist-300",
          className,
        )}
      >
        <Coins className="size-3.5 shrink-0 text-gold-400/60" />
        <span>Даты зарплаты не заданы</span>
        {onConfigure ? <span className="font-medium text-brand-300">Добавить</span> : null}
      </button>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]", className)}>
      <Coins className={cn("size-3.5 shrink-0", info.isToday ? "text-gold-400" : "text-gold-400/80")} />
      {info.isToday ? (
        <span className="font-semibold text-gold-300">Зарплата сегодня</span>
      ) : (
        <>
          <span className="text-mist-400">До зарплаты</span>
          <span className="font-semibold text-mist-50">{paydayCountdownLabel(info)}</span>
        </>
      )}
      <span className="text-mist-600">·</span>
      <span className="text-mist-500">{paydayDateLabel(info.date)}</span>
    </div>
  );
}
