"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const LEGACY_THEME_STORAGE_KEY = "contribcit-theme";
const DSFR_THEME_STORAGE_KEY = "scheme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const dsfrStoredTheme = window.localStorage.getItem(DSFR_THEME_STORAGE_KEY);
  if (dsfrStoredTheme === "light" || dsfrStoredTheme === "dark") {
    return dsfrStoredTheme;
  }

  const legacyStoredTheme = window.localStorage.getItem(
    LEGACY_THEME_STORAGE_KEY
  );
  if (legacyStoredTheme === "light" || legacyStoredTheme === "dark") {
    return legacyStoredTheme;
  }

  if (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.setAttribute("data-fr-theme", theme);
  document.documentElement.setAttribute("data-fr-scheme", theme);
}

export function ThemeProviderClient({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(DSFR_THEME_STORAGE_KEY, theme);
    }
  }, [theme]);
  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProviderClient");
  }
  return context;
}
