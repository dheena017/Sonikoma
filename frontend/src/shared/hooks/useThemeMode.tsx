import { useState, useEffect, useCallback, useMemo } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "app-theme-mode";

function applyTheme(mode: ThemeMode = "dark") {
  const root = document.documentElement;
  root.setAttribute("data-mode", "dark");
  root.classList.add("dark");
  root.classList.remove("light");
  root.style.colorScheme = "dark";
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");

  // Persist & enforce permanent dark theme
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, "dark");
    applyTheme("dark");
  }, []);

  const toggleThemeMode = useCallback(() => {
    // Pure dark theme lock — always remains dark
    applyTheme("dark");
    setThemeMode("dark");
  }, []);

  return useMemo(
    () => ({ themeMode: themeMode as ThemeMode, setThemeMode, toggleThemeMode }),
    [themeMode, toggleThemeMode]
  );
}

export default useThemeMode;
