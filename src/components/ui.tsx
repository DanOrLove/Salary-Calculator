"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-3xl border border-ink-700/70 bg-ink-850/70 backdrop-blur-xl", className)}
      {...props}
    />
  );
}

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-500 text-on-brand hover:bg-brand-400 shadow-[var(--sc-shadow)]",
  outline: "border border-ink-600 bg-ink-850/80 text-mist-100 hover:border-brand-500/70 hover:text-white",
  ghost: "text-mist-400 hover:bg-ink-800 hover:text-mist-100",
  danger: "border border-danger-line bg-danger-soft text-danger hover:bg-danger/15",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3.5 text-sm",
  md: "h-11 gap-2 rounded-2xl px-5 text-sm",
  lg: "h-13 gap-2.5 rounded-2xl px-6 text-base",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "relative inline-flex select-none items-center justify-center font-semibold",
        "transition-all duration-200 will-change-transform",
        "hover:-translate-y-px active:translate-y-0 active:scale-[0.985]",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function TextField({
  label,
  hint,
  suffix,
  prefix,
  className,
  inputClassName,
  ...props
}: React.ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  suffix?: string;
  prefix?: string;
  inputClassName?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label ? (
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-mist-500">
          {label}
        </span>
      ) : null}
      <span className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-900/70 px-3.5 transition-colors focus-within:border-brand-400/80 focus-within:bg-ink-900">
        {prefix ? <span className="text-sm text-mist-500">{prefix}</span> : null}
        <input
          className={cn(
            "h-12 w-full bg-transparent text-[15px] font-medium text-mist-100 outline-none",
            "placeholder:text-mist-600",
            inputClassName,
          )}
          {...props}
        />
        {suffix ? <span className="shrink-0 text-sm font-medium text-mist-500">{suffix}</span> : null}
      </span>
      {hint ? <span className="mt-2 block text-xs leading-relaxed text-mist-600">{hint}</span> : null}
    </label>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cn(
              "relative z-10 max-h-[92dvh] w-full overflow-y-auto border border-ink-700/80 bg-ink-900/95 p-6 backdrop-blur-2xl",
              "rounded-t-4xl sm:max-w-lg sm:rounded-4xl",
              className,
            )}
            initial={{ y: 48, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 32, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  {title ? <h2 className="text-lg font-semibold tracking-tight text-mist-50">{title}</h2> : null}
                  {description ? <p className="mt-1 text-sm text-mist-500">{description}</p> : null}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Закрыть"
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-mist-500 transition-colors hover:bg-ink-800 hover:text-mist-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "brand" | "muted";
  className?: string;
}) {
  const tones = {
    neutral: "border-ink-700 bg-ink-850 text-mist-300",
    brand: "border-brand-500/40 bg-brand-500/15 text-brand-200",
    muted: "border-ink-700/60 bg-ink-900/70 text-mist-500",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className,
  id,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn("relative flex rounded-2xl border border-ink-700/80 bg-ink-900/60 p-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative z-10 flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200",
              active ? "text-on-brand" : "text-mist-500 hover:text-mist-300",
            )}
          >
            {active ? (
              <motion.span
                layoutId={"segmented-" + (id ?? options.map((item) => item.value).join("-"))}
                className="absolute inset-0 -z-10 rounded-xl bg-brand-500 shadow-[var(--sc-shadow)]"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function LoadingScreen({ label = "Загрузка" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center">
      <div className="flex flex-col items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl border border-ink-700 bg-ink-850">
          <Loader2 className="size-5 animate-spin text-brand-300" />
        </span>
        <p className="text-sm text-mist-500">{label}</p>
      </div>
    </div>
  );
}

export function Callout({
  tone = "error",
  children,
}: {
  tone?: "error" | "info";
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        tone === "error"
          ? "border-danger-line bg-danger-soft text-danger"
          : "border-brand-500/30 bg-brand-500/10 text-brand-200",
      )}
    >
      {children}
    </motion.div>
  );
}
