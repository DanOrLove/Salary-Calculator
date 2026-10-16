import type { Session } from "./types";

const STORAGE_KEY = "salarycalc.session.v1";
const COOKIE_NAME = "sc_session";

/** Через сколько простоя выкидываем из кабинета. */
export const SESSION_TTL_MS = 5 * 60 * 60 * 1000;
const COOKIE_MAX_AGE = Math.floor(SESSION_TTL_MS / 1000);
const COOKIE_ATTRS = "; path=/; max-age=" + COOKIE_MAX_AGE + "; samesite=lax";

const TOUCH_THROTTLE_MS = 60 * 1000;
let lastTouchAt = 0;

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

function normalize(raw: unknown): Session | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<Session>;
  if (!value.employeeId) return null;
  const createdAt = value.createdAt ?? new Date().toISOString();
  return {
    employeeId: String(value.employeeId),
    firstName: String(value.firstName ?? ""),
    lastName: String(value.lastName ?? ""),
    createdAt,
    lastActivityAt: String(value.lastActivityAt ?? createdAt),
  };
}

/** Читает сессию как есть, без проверки срока. */
export function readSessionRaw(): Session | null {
  if (!inBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = normalize(JSON.parse(raw));
      if (parsed) return parsed;
    }
  } catch {
    // повреждённая запись — попробуем cookie
  }
  const fromCookie = readCookie(COOKIE_NAME);
  if (!fromCookie) return null;
  return {
    employeeId: fromCookie,
    firstName: "",
    lastName: "",
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
  };
}

export function isSessionExpired(session: Session): boolean {
  const last = Date.parse(session.lastActivityAt);
  if (!Number.isFinite(last)) return false;
  return Date.now() - last > SESSION_TTL_MS;
}

export function sessionExpiresAt(session: Session): number {
  const last = Date.parse(session.lastActivityAt);
  return (Number.isFinite(last) ? last : Date.now()) + SESSION_TTL_MS;
}

/** Возвращает сессию только если она ещё жива. Просроченную стирает. */
export function readSession(): Session | null {
  const session = readSessionRaw();
  if (!session) return null;
  if (isSessionExpired(session)) {
    clearSession();
    return null;
  }
  return session;
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

/** Продлевает сессию. Пишет не чаще раза в минуту. */
export function touchSession(): void {
  if (!inBrowser()) return;
  const now = Date.now();
  if (now - lastTouchAt < TOUCH_THROTTLE_MS) return;
  const session = readSessionRaw();
  if (!session) return;
  lastTouchAt = now;
  writeSession({ ...session, lastActivityAt: new Date(now).toISOString() });
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
