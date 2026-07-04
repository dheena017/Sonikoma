import { useState, useEffect, useCallback, useMemo } from "react";
import { createRoot } from "react-dom/client";
import LoadingPage from "../components/LoadingPage";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "app-theme-mode";

/** Duration of the cross-fade transition in ms — keep in sync with CSS */
const TRANSITION_MS = 1000;

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute("data-mode", mode);
  root.style.colorScheme = mode;
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Persist & sync on mount / change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    applyTheme(themeMode);
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";

      // 1. Lock element transitions while the overlay animates
      document.documentElement.setAttribute("data-theme-switching", "true");

      // 2. Create an overlay that covers the whole page
      const overlay = document.createElement("div");
      overlay.id = "theme-transition-overlay";
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 99999;
        pointer-events: auto;
        opacity: 0;
        transition: opacity ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1);
        will-change: opacity;
        transform: translateZ(0);
      `;
      document.body.appendChild(overlay);

      // Render LoadingPage into the overlay
      const root = createRoot(overlay);
      root.render(<LoadingPage status="Switching Theme..." themeMode={next} />);

      // 3. Fade IN — mask the old theme
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.style.opacity = "1";
        });
      });

      // 4. At peak opacity → switch theme instantly (hidden behind overlay)
      setTimeout(() => {
        applyTheme(next);
        localStorage.setItem(STORAGE_KEY, next);
      }, TRANSITION_MS * 0.55);

      // 5. Fade OUT — reveal the new theme; restore element transitions
      setTimeout(() => {
        overlay.style.opacity = "0";
        document.documentElement.removeAttribute("data-theme-switching");
        overlay.style.pointerEvents = "none";
        setTimeout(() => {
          root.unmount();
          overlay.remove();
        }, TRANSITION_MS + 60);
      }, TRANSITION_MS * 0.85);

      return next;
    });
  }, []);

  return useMemo(
    () => ({ themeMode, setThemeMode, toggleThemeMode }),
    [themeMode, toggleThemeMode]
  );
}
