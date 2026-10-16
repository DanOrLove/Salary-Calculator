"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/ui";
import { db } from "@/lib/db";
import { clearSession, readSession } from "@/lib/session";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const route = async () => {
      const session = readSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const employee = await db.getEmployee(session.employeeId);
        if (cancelled) return;
        if (!employee) {
          clearSession();
          router.replace("/login");
          return;
        }
        router.replace(employee.onboarded ? "/dashboard" : "/setup");
      } catch {
        if (!cancelled) router.replace("/login");
      }
    };

    void route();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <LoadingScreen label="Открываем кабинет" />;
}
