"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface AcademiaThemeContextValue {
  mounted: boolean;
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const storageKey = "academia-okajima-theme";
const themeChangeEvent = "academia-theme-change";
const themeValues = new Set<Theme>(["light", "dark", "system"]);
const AcademiaThemeContext = createContext<AcademiaThemeContextValue | null>(
  null,
);

export function isAcademiaTheme(value: string | undefined): value is Theme {
  return Boolean(value && themeValues.has(value as Theme));
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme, resolvedTheme: ResolvedTheme) {
  const root = document.documentElement;

  root.classList.toggle("dark", resolvedTheme === "dark");
  root.style.colorScheme = resolvedTheme;
  root.dataset.theme = theme;
}

function readStoredTheme(): Theme {
  const storedTheme = window.localStorage.getItem(storageKey);
  const theme = storedTheme ?? undefined;

  return isAcademiaTheme(theme) ? theme : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function getServerResolvedThemeSnapshot(): ResolvedTheme {
  return "light";
}

function getMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEvent, callback);
  };
}

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  media.addEventListener("change", callback);

  return () => media.removeEventListener("change", callback);
}

function subscribeMounted() {
  return () => {};
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribeMounted,
    getMountedSnapshot,
    getServerMountedSnapshot,
  );
  const theme = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    getServerThemeSnapshot,
  );
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    getServerResolvedThemeSnapshot,
  );
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    if (!mounted) return;

    applyTheme(theme, resolvedTheme);
  }, [mounted, resolvedTheme, theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(storageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }, []);

  const value = useMemo(
    () => ({ mounted, theme, resolvedTheme, setTheme }),
    [mounted, resolvedTheme, setTheme, theme],
  );

  return (
    <AcademiaThemeContext.Provider value={value}>
      {children}
    </AcademiaThemeContext.Provider>
  );
}

export function useAcademiaTheme() {
  const context = useContext(AcademiaThemeContext);

  if (!context) {
    throw new Error("useAcademiaTheme must be used within ThemeProvider");
  }

  return context;
}
