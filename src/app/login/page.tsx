"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ShieldCheck, UserPlus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Callout, Segmented, TextField } from "@/components/ui";
import { db } from "@/lib/db";
import { writeSession } from "@/lib/session";

type Mode = "login" | "register";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Заполни имя и фамилию");
      return;
    }

    setLoading(true);
    try {
      const existing = await db.findEmployeeByName(firstName, lastName);

      if (mode === "register") {
        if (existing) {
          setError("Сотрудник с таким именем уже зарегистрирован — войди.");
          return;
        }
        const created = await db.createEmployee(firstName, lastName);
        writeSession({
          employeeId: created.id,
          firstName: created.first_name,
          lastName: created.last_name,
          createdAt: new Date().toISOString(),
        });
        router.replace("/setup");
        return;
      }

      if (!existing) {
        setError("Не нашли такого сотрудника. Создай аккаунт — это займёт секунду.");
        return;
      }
      writeSession({
        employeeId: existing.id,
        firstName: existing.first_name,
        lastName: existing.last_name,
        createdAt: new Date().toISOString(),
      });
      router.replace(existing.onboarded ? "/dashboard" : "/setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Что-то пошло не так, попробуй ещё раз");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <Logo />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="dashed-frame bg-ink-850/40 p-6 backdrop-blur-xl sm:p-8"
        >
          <div className="mb-6 flex flex-col items-center text-center">
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 320, damping: 24 }}
              className="grid size-12 place-items-center rounded-2xl border border-ink-600 text-mist-300"
            >
              <UserPlus className="size-5" />
            </motion.span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50">
              {mode === "login" ? "Вход в кабинет" : "Создание аккаунта"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-mist-500">
              {mode === "login"
                ? "Логин и пароль не нужны — только имя и фамилия."
                : "Представься — и мы создадим твой личный кабинет."}
            </p>
          </div>

          <Segmented
            id="auth-mode"
            value={mode}
            options={[
              { value: "login", label: "Вход" },
              { value: "register", label: "Регистрация" },
            ]}
            onChange={(next) => {
              setMode(next);
              setError(null);
            }}
          />

          <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
            <TextField
              label="Имя"
              value={firstName}
              autoComplete="given-name"
              placeholder="Даниил"
              onChange={(event) => setFirstName(event.target.value)}
            />
            <TextField
              label="Фамилия"
              value={lastName}
              autoComplete="family-name"
              placeholder="Васин"
              onChange={(event) => setLastName(event.target.value)}
            />

            <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

            <Button type="submit" size="lg" loading={loading} className="mt-1 w-full">
              {mode === "login" ? "Войти" : "Создать аккаунт"}
              <ArrowRight className="size-4" />
            </Button>
          </form>

          <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-mist-600">
            <ShieldCheck className="size-3.5 shrink-0" />
            Сессия и cookie хранятся в твоём браузере — из кабинета не выкинет.
          </p>
        </motion.div>
      </div>
    </main>
  );
}
