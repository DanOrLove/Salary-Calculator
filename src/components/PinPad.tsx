"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Delete } from "lucide-react";
import { PIN_LENGTH } from "@/lib/pin";
import { cn } from "@/lib/utils";

const KEYS: Array<{ digit: string; ru: string; en: string }> = [
  { digit: "1", ru: "", en: "" },
  { digit: "2", ru: "АБВГ", en: "ABC" },
  { digit: "3", ru: "ДЕЖЗ", en: "DEF" },
  { digit: "4", ru: "ИЙКЛ", en: "GHI" },
  { digit: "5", ru: "МНОП", en: "JKL" },
  { digit: "6", ru: "РСТУ", en: "MNO" },
  { digit: "7", ru: "ФХЦЧ", en: "PQRS" },
  { digit: "8", ru: "ШЩЪЫ", en: "TUV" },
  { digit: "9", ru: "ЬЭЮЯ", en: "WXYZ" },
];

export function PinPad({
  title,
  subtitle,
  check,
  onSuccess,
  onBack,
  backLabel = "Назад",
}: {
  title: string;
  subtitle?: string;
  /** Возвращает текст ошибки или null, если код верный */
  check: (pin: string) => Promise<string | null>;
  onSuccess: (pin: string) => void | Promise<void>;
  onBack?: () => void;
  backLabel?: string;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const pinRef = useRef("");

  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const submit = useCallback(
    async (value: string) => {
      setBusy(true);
      let message: string | null = null;
      try {
        message = await check(value);
      } catch (err) {
        message = err instanceof Error ? err.message : "Не получилось проверить код";
      }
      if (!alive.current) return;
      setBusy(false);

      if (message) {
        setError(message);
        setShake((prev) => prev + 1);
        pinRef.current = "";
        setPin("");
        return;
      }

      setError(null);
      await onSuccess(value);
    },
    [check, onSuccess],
  );

  const press = useCallback(
    (digit: string) => {
      if (busy) return;
      const current = pinRef.current;
      if (current.length >= PIN_LENGTH) return;
      const next = current + digit;
      pinRef.current = next;
      setError(null);
      setPin(next);
      if (next.length === PIN_LENGTH) {
        window.setTimeout(() => {
          void submit(next);
        }, 170);
      }
    },
    [busy, submit],
  );

  const backspace = useCallback(() => {
    if (busy) return;
    const next = pinRef.current.slice(0, -1);
    pinRef.current = next;
    setError(null);
    setPin(next);
  }, [busy]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key >= "0" && event.key <= "9") {
        press(event.key);
        return;
      }
      if (event.key === "Backspace") {
        backspace();
        return;
      }
      if (event.key === "Escape" && onBack) onBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press, backspace, onBack]);

  return (
    <div className="relative flex w-full flex-col items-center gap-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full opacity-70"
        style={{
          background: "radial-gradient(circle, var(--sc-glow-a) 0%, transparent 62%)",
        }}
      />

      <div className="relative text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-mist-50">{title}</h1>
        {subtitle ? (
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-mist-500">{subtitle}</p>
        ) : null}
      </div>

      <motion.div
        key={shake}
        animate={shake > 0 ? { x: [0, -12, 12, -8, 8, -4, 0] } : undefined}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative flex items-center gap-3.5"
      >
        {Array.from({ length: PIN_LENGTH }, (_, index) => {
          const filled = index < pin.length;
          return (
            <motion.span
              key={index}
              animate={filled ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.24 }}
              className={cn(
                "size-4 rounded-full border transition-colors duration-200",
                filled ? "border-brand-400 bg-brand-400" : "border-ink-600 bg-transparent",
                busy && "opacity-70",
              )}
            />
          );
        })}
      </motion.div>

      <div className="relative grid grid-cols-3 gap-3 sm:gap-4">
        {KEYS.map((key) => (
          <PinKey
            key={key.digit}
            digit={key.digit}
            ru={key.ru}
            en={key.en}
            onPress={press}
            disabled={busy}
          />
        ))}

        <span aria-hidden />

        <PinKey digit="0" ru="" en="" onPress={press} disabled={busy} />

        <motion.button
          type="button"
          aria-label="Стереть"
          onClick={backspace}
          disabled={busy}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "grid size-[76px] place-items-center rounded-full border border-transparent text-mist-500",
            "transition-colors duration-200 hover:bg-ink-800 hover:text-mist-200 disabled:opacity-50 sm:size-[88px]",
          )}
        >
          <Delete className="size-6" />
        </motion.button>
      </div>

      <div className="relative flex min-h-[24px] flex-col items-center gap-3">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key={error}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-center text-sm text-danger"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-mist-500 transition-colors hover:text-mist-200"
          >
            {backLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PinKey({
  digit,
  ru,
  en,
  onPress,
  disabled,
}: {
  digit: string;
  ru: string;
  en: string;
  onPress: (digit: string) => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      data-key={digit}
      aria-label={"Цифра " + digit}
      onClick={() => onPress(digit)}
      disabled={disabled}
      whileTap={{ scale: 0.9 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
      className={cn(
        "relative grid size-[76px] place-items-center rounded-full border border-ink-700/70 bg-ink-850",
        "transition-colors duration-200 hover:border-brand-400/60 hover:bg-brand-500/10",
        "disabled:opacity-50 sm:size-[88px]",
      )}
    >
      <span className="flex flex-col items-center leading-none">
        <span className="text-[30px] font-light tracking-tight text-mist-50 sm:text-[34px]">{digit}</span>
        {ru ? (
          <span className="mt-1 text-[9px] font-semibold tracking-[0.14em] text-mist-500">{ru}</span>
        ) : null}
        {en ? <span className="mt-0.5 text-[8px] tracking-[0.14em] text-mist-600">{en}</span> : null}
      </span>
    </motion.button>
  );
}
