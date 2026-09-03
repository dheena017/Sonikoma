import { useState, useEffect } from "react";
import "@/styles/animations/loading.css";
import { SonikomaLogo } from "@/shared/ui/branding";

export type ThemeMode = "dark" | "light";

interface LoadingPageProps {
  themeMode?: ThemeMode;
  status?: string;
  progress?: number;
}

export default function LoadingPage({
  status = "Initializing",
  progress,
  themeMode,
}: LoadingPageProps) {
  const [activeMode, setActiveMode] = useState<ThemeMode>(themeMode || "dark");

  useEffect(() => {
    if (themeMode) {
      setActiveMode(themeMode);
    } else {
      const currentMode = document.documentElement.getAttribute(
        "data-mode"
      ) as ThemeMode | null;
      if (currentMode) {
        setActiveMode(currentMode);
      } else {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setActiveMode(mq.matches ? "dark" : "light");
      }
    }
  }, [themeMode]);

  const clampedProgress =
    typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;
  const hasProgress = clampedProgress !== null;
  const isLight = activeMode === "light";

  return (
    <div
      className={`loading-page-shell fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden select-none ${
        isLight ? "loading-page-shell-light" : "loading-page-shell-dark"
      }`}
      style={{
        fontFamily:
          "'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Luxury Glass Studio Card */}
      <div className="loading-studio-card">
        {/* Central Logo */}
        <div className="pb-3 flex justify-center">
          <SonikomaLogo
            size="lg"
            themeMode={activeMode}
          />
        </div>

        {/* Status Pill */}
        <div className="loading-status-pill">
          <span className="loading-status-dot" />
          <span className="loading-status-text">{status}</span>
        </div>

        {/* Progress Track */}
        <div className="w-full flex flex-col items-center gap-2">
          <div className="loading-progress-track">
            {hasProgress ? (
              <div
                className="loading-progress-determinate"
                style={{ width: `${clampedProgress}%` }}
              />
            ) : (
              <div className="loading-progress-indeterminate" />
            )}
          </div>

          {hasProgress && (
            <span className="text-[11px] font-mono font-bold text-cyan-400">
              {clampedProgress}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
