"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PinPad } from "@/components/PinPad";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Callout, TextField } from "@/components/ui";
import { db } from "@/lib/db";
import { hashPin, randomSalt, verifyPin } from "@/lib/pin";
import { readSession, writeSession } from "@/lib/session";
import type { Employee } from "@/lib/types";

type Step = "name" | "pin";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (readSession()) router.replace("/dashboard");
  }, [router]);

  const findMe = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Заполни имя и фамилию");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const found = await db.findEmployeeByName(firstName, lastName);
      if (!found) {
        setError("Не нашли такого сотрудника. Создай кабинет — это займёт полминуты.");
        return;
      }
      setEmployee(found);
      setStep("pin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось найти кабинет");
    } finally {
      setLoading(false);
    }
  };

  const checkPin = useCallback(
    async (pin: string) => {
      if (!employee) return "Что-то пошло не так, попробуй снова";
      if (!employee.pin_hash) return null;
      const ok = await verifyPin(pin, employee.pin_salt, employee.pin_hash);
      return ok ? null : "Неверный код";
    },
    [employee],
  );

  const finish = useCallback(
    async (pin: string) => {
      if (!employee) return;
      let current = employee;

      if (!employee.pin_hash) {
        const salt = randomSalt();
        const pinHash = await hashPin(pin, salt);
        current = await db.updateEmployee(employee.id, { pin_hash: pinHash, pin_salt: salt });
      }

      const now = new Date().toISOString();
      writeSession({
        employeeId: current.id,
        firstName: current.first_name,
        lastName: current.last_name,
        createdAt: now,
        lastActivityAt: now,
      });
      router.replace(current.onboarded ? "/dashboard" : "/setup");
    },
    [employee, router],
  );

  const fullName = employee ? employee.first_name + " " + employee.last_name : "";
  const settingFirstPin = Boolean(employee && !employee.pin_hash);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === "name" ? (
          <motion.div
            key="name"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <div className="mb-7 flex justify-center">
              <Logo />
            </div>

            <div className="dashed-frame bg-ink-850/40 p-6 backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-2xl border border-ink-600 text-mist-300">
                  <KeyRound className="size-5" />
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50">Вход в кабинет</h1>
                <p className="mt-2 text-sm leading-relaxed text-mist-500">
                  Назови себя и введи свой код из 4 цифр.
                </p>
              </div>

              <div className="flex flex-col gap-4">
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
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void findMe();
                  }}
                />

                <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

                <Button size="lg" loading={loading} className="mt-1 w-full" onClick={findMe}>
                  Ввести код
                  <ArrowRight className="size-4" />
                </Button>

                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="text-center text-sm text-mist-500 transition-colors hover:text-mist-200"
                >
                  Нет кабинета? <span className="font-medium text-brand-300">Создать</span>
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-sm"
          >
            <PinPad
              title={settingFirstPin ? "Придумай код" : "Введи код"}
              subtitle={
                settingFirstPin
                  ? fullName + ", код ещё не задан — придумай 4 цифры, он станет твоим паролем."
                  : "С возвращением, " + fullName + "."
              }
              check={checkPin}
              onSuccess={finish}
              onBack={() => {
                setEmployee(null);
                setStep("name");
              }}
              backLabel="Другое имя"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
