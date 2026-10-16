"use client";

import { motion } from "framer-motion";
import { AnimatedNumber } from "./AnimatedNumber";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SummaryItem {
  label: string;
  value: number;
  tone?: "brand" | "strong" | "danger" | "default";
  note?: string;
  isMoney?: boolean;
}

const TONES: Record<string, string> = {
  brand: "text-brand-300",
  strong: "text-mist-50",
  danger: "text-danger",
  default: "text-mist-100",
};

export function ReportSummary({
  hero,
  tiles,
  progressLabel,
  ratio,
  progressValue,
  progressNote,
}: {
  hero: SummaryItem[];
  tiles: SummaryItem[];
  progressLabel: string;
  ratio: number;
  progressValue: string;
  progressNote?: string;
}) {
  const percentRounded = Math.round(Math.min(1, Math.max(0, ratio)) * 1000) / 10;

  return (
    <div className="rounded-4xl border border-ink-700/70 bg-ink-850/60 p-5 sm:p-6">
      <div className="grid grid-cols-2 gap-x-4 gap-y-6">
        {hero.map((item) => (
          <div key={item.label}>
            <p className="text-[13px] text-mist-500 sm:text-sm">{item.label}</p>
            <p
              className={cn(
                "mt-1.5 text-2xl font-semibold tracking-tight sm:text-3xl",
                TONES[item.tone ?? "default"],
              )}
            >
              <AnimatedNumber
                value={item.value}
                format={(input) => (item.isMoney === false ? String(Math.round(input)) : money(input))}
              />
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tiles.map((item) => (
          <div key={item.label} className="rounded-3xl border border-ink-700/70 bg-ink-900/50 p-4">
            <p className="text-[13px] text-mist-500 sm:text-sm">{item.label}</p>
            <p className="mt-1.5 text-xl font-semibold tracking-tight text-mist-50 sm:text-2xl">
              <AnimatedNumber
                value={item.value}
                format={(input) => (item.isMoney === false ? String(Math.round(input)) : money(input))}
              />
            </p>
            {item.note ? <p className="mt-1.5 text-xs text-mist-500">{item.note}</p> : null}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-ink-800 pt-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <span className="text-[13px] text-mist-400 sm:text-sm">{progressLabel}</span>
          <span className="text-lg font-semibold tracking-tight text-mist-50 sm:text-xl">
            {percentRounded.toString().replace(".", ",")}%
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-800">
          <motion.div
            className="h-full rounded-full bg-brand-400"
            initial={{ width: 0 }}
            animate={{ width: percentRounded + "%" }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {progressNote ? <p className="mt-3 text-xs text-mist-500">{progressNote}</p> : null}
      </div>
    </div>
  );
}
