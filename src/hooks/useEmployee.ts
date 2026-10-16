"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import { clearSession, readSession, writeSession } from "@/lib/session";
import type { Employee } from "@/lib/types";

export type GateStatus = "loading" | "anonymous" | "ready";

export function useEmployee(options?: { requireOnboarded?: boolean; redirectTo?: string }) {
  const requireOnboarded = options?.requireOnboarded ?? false;
  const redirectTo = options?.redirectTo ?? "/login";
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>("loading");
  const [employee, setEmployee] = useState<Employee | null>(null);

  const reload = useCallback(async () => {
    const session = readSession();
    if (!session) {
      setStatus("anonymous");
      return null;
    }
    try {
      const found = await db.getEmployee(session.employeeId);
      if (!found) {
        clearSession();
        setStatus("anonymous");
        return null;
      }
      setEmployee(found);
      setStatus("ready");
      return found;
    } catch {
      setStatus("anonymous");
      return null;
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(redirectTo);
      return;
    }
    if (status === "ready" && employee && requireOnboarded && !employee.onboarded) {
      router.replace("/setup");
    }
  }, [status, employee, requireOnboarded, redirectTo, router]);

  const startSession = useCallback((next: Employee) => {
    writeSession({
      employeeId: next.id,
      firstName: next.first_name,
      lastName: next.last_name,
      createdAt: new Date().toISOString(),
    });
    setEmployee(next);
    setStatus("ready");
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setEmployee(null);
    setStatus("anonymous");
  }, []);

  return { status, employee, setEmployee, reload, startSession, signOut };
}
