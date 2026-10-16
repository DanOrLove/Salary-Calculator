"use client";

import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  size = 40,
  withText = true,
  className,
}: {
  size?: number;
  withText?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className="grid shrink-0 place-items-center rounded-2xl border border-brand-500/35 bg-brand-500/12 text-brand-300"
        style={{ width: size, height: size }}
      >
        <Wallet style={{ width: size * 0.48, height: size * 0.48 }} />
      </span>
      {withText ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight text-mist-50">SalaryCalculator</span>
          <span className="mt-1 text-[11px] font-medium tracking-wide text-mist-500">личный кабинет</span>
        </span>
      ) : null}
    </span>
  );
}
