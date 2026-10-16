"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion } from "framer-motion";
import { useElementWidth } from "@/hooks/useElementWidth";
import { moneyAxis } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
}

const PAD_LEFT = 76;
const PAD_RIGHT = 14;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const exponent = Math.floor(Math.log10(value));
  const base = Math.pow(10, exponent);
  const normalized = value / base;
  let step = 10;
  if (normalized <= 1) step = 1;
  else if (normalized <= 2) step = 2;
  else if (normalized <= 2.5) step = 2.5;
  else if (normalized <= 5) step = 5;
  return step * base;
}

const TICK_COUNT = 3;

/** Верхняя граница и шаг подбираются так, чтобы подписи были круглыми. */
function axisFor(rawMax: number): { max: number; step: number } {
  const step = niceStep(rawMax / TICK_COUNT);
  return { max: step * TICK_COUNT, step };
}

export function LineChart({
  labels,
  series,
  height = 250,
  emptyLabel = "Пока нет данных",
  className,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  emptyLabel?: string;
  className?: string;
}) {
  const { ref, width } = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const hasValues = series.some((item) => item.values.some((value) => value > 0));
  const count = labels.length;
  const plotWidth = Math.max(10, width - PAD_LEFT - PAD_RIGHT);
  const plotHeight = Math.max(10, height - PAD_TOP - PAD_BOTTOM);

  const axis = useMemo(() => {
    let top = 0;
    for (const item of series) {
      for (const value of item.values) {
        if (value > top) top = value;
      }
    }
    return axisFor(top);
  }, [series]);

  const max = axis.max;

  const ticks = useMemo(() => {
    const result: number[] = [];
    for (let index = 0; index <= TICK_COUNT; index += 1) {
      result.push(axis.step * index);
    }
    return result;
  }, [axis]);

  const xAt = (index: number) => {
    if (count <= 1) return PAD_LEFT + plotWidth / 2;
    return PAD_LEFT + (plotWidth * index) / (count - 1);
  };
  const yAt = (value: number) => PAD_TOP + plotHeight - (plotHeight * value) / max;

  const labelStride = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(plotWidth / 34))));

  const handleMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (count === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - PAD_LEFT;
    const ratio = plotWidth <= 0 ? 0 : x / plotWidth;
    const index = Math.round(ratio * (count - 1));
    setHover(Math.max(0, Math.min(count - 1, index)));
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      {!hasValues ? (
        <div
          className="flex items-center justify-center rounded-2xl border border-dashed border-ink-700 text-sm text-mist-500"
          style={{ height }}
        >
          {emptyLabel}
        </div>
      ) : width > 0 ? (
        <svg
          data-chart="1"
          width={width}
          height={height}
          onPointerMove={handleMove}
          onPointerLeave={() => setHover(null)}
          className="touch-pan-y"
        >
          {ticks.map((tick, index) => (
            <g key={index}>
              <line
                x1={PAD_LEFT}
                x2={width - PAD_RIGHT}
                y1={yAt(tick)}
                y2={yAt(tick)}
                stroke="var(--sc-grid)"
                strokeWidth={1}
                strokeDasharray="4 5"
              />
              <text
                x={PAD_LEFT - 12}
                y={yAt(tick) + 4}
                textAnchor="end"
                fontSize={10}
                fill="var(--sc-text-faint)"
              >
                {moneyAxis(tick)}
              </text>
            </g>
          ))}

          {labels.map((label, index) =>
            index % labelStride === 0 || index === count - 1 ? (
              <text
                key={index}
                x={xAt(index)}
                y={height - 12}
                textAnchor="middle"
                fontSize={11}
                fill="var(--sc-text-faint)"
              >
                {label}
              </text>
            ) : null,
          )}

          {hover !== null ? (
            <line
              x1={xAt(hover)}
              x2={xAt(hover)}
              y1={PAD_TOP}
              y2={PAD_TOP + plotHeight}
              stroke="var(--sc-line-strong)"
              strokeWidth={1}
            />
          ) : null}

          {series.map((item, seriesIndex) => {
            const path = item.values
              .map((value, index) => (index === 0 ? "M" : " L") + xAt(index) + " " + yAt(value))
              .join("");
            return (
              <g key={item.name}>
                <motion.path
                  d={path}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: seriesIndex * 0.1, ease: "easeOut" }}
                />
                {item.values.map((value, index) => (
                  <motion.circle
                    key={index}
                    cx={xAt(index)}
                    cy={yAt(value)}
                    r={hover === index ? 5.5 : 4}
                    fill={item.color}
                    stroke="var(--sc-surface)"
                    strokeWidth={1.5}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + index * 0.02, type: "spring", stiffness: 420, damping: 28 }}
                  />
                ))}
              </g>
            );
          })}
        </svg>
      ) : (
        <div style={{ height }} />
      )}

      {hasValues && hover !== null ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-2xl border border-ink-700 bg-ink-850/95 px-3 py-2 text-xs shadow-[var(--sc-shadow)] backdrop-blur"
          style={{
            left: Math.min(Math.max(xAt(hover), 70), Math.max(70, width - 70)),
            top: 8,
          }}
        >
          <div className="mb-1 font-semibold text-mist-100">{labels[hover]}</div>
          {series.map((item) => (
            <div key={item.name} className="flex items-center gap-2 whitespace-nowrap">
              <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
              <span className="text-mist-500">{item.name}</span>
              <span className="ml-auto font-semibold text-mist-100">
                {moneyAxis(item.values[hover] ?? 0)}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {series.length > 1 ? (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
          {series.map((item) => (
            <span key={item.name} className="flex items-center gap-2 text-xs text-mist-500">
              <span className="size-2.5 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
