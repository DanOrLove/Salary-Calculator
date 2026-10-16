"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const STORAGE_KEY = "salarycalc.theme.v1";
const COOKIE = "sc_theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(next: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // приватный режим — тема останется только на эту сессию
  }
  document.cookie = COOKIE + "=" + next + "; path=/; max-age=31536000; samesite=lax";
  for (const listener of listeners) listener();
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    setThemeState(readTheme());
    const listener = () => setThemeState(readTheme());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => applyTheme(next), []);

  const toggle = useCallback(() => {
    applyTheme(readTheme() === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggle, setTheme };
}

export const THEME_STORAGE_KEY = STORAGE_KEY;
