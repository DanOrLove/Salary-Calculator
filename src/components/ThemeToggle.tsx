"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const STARS: Array<{ left: number; top: number; size: number }> = [
  { left: 34, top: 7, size: 4 },
  { left: 37, top: 17, size: 5 },
  { left: 42, top: 25, size: 3 },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Включить светлую тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
      onClick={toggle}
      className={cn(
        "theme-switch relative h-[38px] w-[76px] shrink-0 rounded-full border border-white/25 bg-[#152238]",
        "transition-colors duration-300 hover:border-white/45",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400",
        className,
      )}
    >
      <span aria-hidden className="pointer-events-none absolute inset-0">
        <span className="switch-moon absolute inset-0">
          {STARS.map((star, index) => (
            <span
              key={index}
              className="absolute rounded-full bg-[#ffe98a]"
              style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
            />
          ))}
          <span className="absolute" style={{ left: 46, top: 8, width: 20, height: 20 }}>
            <Moon className="size-full text-[#ffd93d]" fill="#ffd93d" />
          </span>
        </span>

        <span className="switch-sun absolute" style={{ left: 8, top: 8, width: 20, height: 20 }}>
          <Sun className="size-full text-[#ffd93d]" fill="#ffd93d" />
        </span>

        <span
          className="switch-knob absolute rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
          style={{ left: 4, top: 4, width: 28, height: 28 }}
        />
      </span>
    </button>
  );
}
