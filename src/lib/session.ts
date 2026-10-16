import type { Session } from "./types";

const STORAGE_KEY = "salarycalc.session.v1";
const COOKIE_NAME = "sc_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const COOKIE_ATTRS = "; path=/; max-age=" + COOKIE_MAX_AGE + "; samesite=lax";

function inBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

export function readSession(): Session | null {
  if (!inBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Session;
      if (parsed && parsed.employeeId) return parsed;
    }
  } catch {
    // повреждённая сессия — восстановим из cookie
  }
  const fromCookie = readCookie(COOKIE_NAME);
  if (!fromCookie) return null;
  return { employeeId: fromCookie, firstName: "", lastName: "", createdAt: new Date().toISOString() };
}

export function writeSession(session: Session): void {
  if (!inBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // приватный режим — остаётся cookie
  }
  document.cookie = COOKIE_NAME + "=" + encodeURIComponent(session.employeeId) + COOKIE_ATTRS;
}

export function clearSession(): void {
  if (!inBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  document.cookie = COOKIE_NAME + "=; path=/; max-age=0; samesite=lax";
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
