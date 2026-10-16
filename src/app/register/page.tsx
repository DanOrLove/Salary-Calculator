"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, UserPlus } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PinPad } from "@/components/PinPad";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Callout, TextField } from "@/components/ui";
import { db } from "@/lib/db";
import { hashPin, randomSalt } from "@/lib/pin";
import { readSession, writeSession } from "@/lib/session";

type Step = "name" | "create" | "confirm";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstPin, setFirstPin] = useState("");
  const [salt, setSalt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (readSession()) router.replace("/dashboard");
  }, [router]);

  const goToPin = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Заполни имя и фамилию");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const existing = await db.findEmployeeByName(firstName, lastName);
      if (existing) {
        setError("Такое имя уже занято — войди по своему коду.");
        return;
      }
      setSalt(randomSalt());
      setStep("create");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не получилось проверить имя");
    } finally {
      setLoading(false);
    }
  };

  const acceptPin = useCallback(async (pin: string) => {
    setFirstPin(pin);
    setStep("confirm");
  }, []);

  const confirmPin = useCallback(
    async (pin: string) => (pin === firstPin ? null : "Коды не совпали, попробуй ещё раз"),
    [firstPin],
  );

  const finish = useCallback(
    async (pin: string) => {
      try {
        const pinHash = await hashPin(pin, salt);
        const created = await db.createEmployee({
          firstName,
          lastName,
          pinHash,
          pinSalt: salt,
        });
        const now = new Date().toISOString();
        writeSession({
          employeeId: created.id,
          firstName: created.first_name,
          lastName: created.last_name,
          createdAt: now,
          lastActivityAt: now,
        });
        router.replace("/setup");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не получилось создать кабинет");
        setStep("name");
      }
    },
    [firstName, lastName, salt, router],
  );

  const fullName = (firstName + " " + lastName).trim();

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
                  <UserPlus className="size-5" />
                </span>
                <h1 className="mt-4 text-2xl font-semibold tracking-tight text-mist-50">
                  Создание кабинета
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-mist-500">
                  Логин и пароль не нужны: имя, фамилия и код из 4 цифр.
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
                    if (event.key === "Enter") void goToPin();
                  }}
                />

                <AnimatePresence>{error ? <Callout>{error}</Callout> : null}</AnimatePresence>

                <Button size="lg" loading={loading} className="mt-1 w-full" onClick={goToPin}>
                  Придумать код
                  <ArrowRight className="size-4" />
                </Button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-center text-sm text-mist-500 transition-colors hover:text-mist-200"
                >
                  Уже есть код? <span className="font-medium text-brand-300">Войти</span>
                </button>
              </div>

              <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] leading-relaxed text-mist-600">
                <KeyRound className="size-3.5 shrink-0" />
                Из кабинета не выкинет 5 часов, потом нужно будет ввести код снова.
              </p>
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
            {step === "create" ? (
              <PinPad
                key="create"
                title="Придумай код"
                subtitle={fullName + ", задай 4 цифры для входа. Восстановить их не получится — запомни."}
                check={async () => null}
                onSuccess={acceptPin}
                onBack={() => setStep("name")}
                backLabel="Изменить имя"
              />
            ) : (
              <PinPad
                key="confirm"
                title="Повтори код"
                subtitle="Введи те же 4 цифры ещё раз, чтобы не ошибиться."
                check={confirmPin}
                onSuccess={finish}
                onBack={() => setStep("create")}
                backLabel="Другой код"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
