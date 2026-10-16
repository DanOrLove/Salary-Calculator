"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { SetupWizard, type SetupPayload } from "@/components/SetupWizard";
import { LoadingScreen } from "@/components/ui";
import { useEmployee } from "@/hooks/useEmployee";
import { toIso } from "@/lib/calendar";
import { db } from "@/lib/db";
import { DEFAULT_PATTERN } from "@/lib/schedule";

export default function SetupPage() {
  const router = useRouter();
  const { status, employee, setEmployee } = useEmployee({ redirectTo: "/login" });

  const handleComplete = useCallback(
    async (payload: SetupPayload) => {
      if (!employee) return;
      const updated = await db.updateEmployee(employee.id, {
        sales_percent: payload.salesPercent,
        base_payout: payload.basePayout,
        schedule_type: payload.schedule.type,
        schedule_anchor: payload.schedule.anchor,
        schedule_pattern: payload.schedule.pattern,
        onboarded: true,
      });
      setEmployee(updated);
      router.replace("/dashboard");
    },
    [employee, router, setEmployee],
  );

  if (status !== "ready" || !employee) {
    return <LoadingScreen label="Готовим настройку" />;
  }

  const type = employee.schedule_type ?? "2/2";

  return (
    <SetupWizard
      initial={{
        salesPercent: employee.sales_percent,
        basePayout: employee.base_payout,
        schedule: {
          type,
          anchor: employee.schedule_anchor ?? toIso(new Date()),
          pattern: employee.schedule_pattern ?? DEFAULT_PATTERN[type],
        },
      }}
      onComplete={handleComplete}
      completeLabel={employee.onboarded ? "Сохранить" : "Начать работу"}
    />
  );
}
