import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "app-theme-mode";

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "dark" || stored === "light") return stored;
    // Default to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    const root = document.documentElement;
    root.setAttribute("data-mode", themeMode);
    // Also update color-scheme for native browser controls
    root.style.colorScheme = themeMode;
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { themeMode, setThemeMode, toggleThemeMode };
}
