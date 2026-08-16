import { useState, useEffect } from "react";
import { LandingAnimeScene } from "@/features/app_landing/components/LandingAnimeScene";
import "@/styles/animations/loading.css";

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

  const hasProgress = progress !== undefined && progress >= 0;
  const clampedProgress = hasProgress
    ? Math.min(100, Math.max(0, progress))
    : 0;

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
      {/* Background Anime Scene matching the app */}
      <LandingAnimeScene themeMode={activeMode} variant="app" />

      {/* Luxury Glass Studio Card */}
      <div className="loading-studio-card">
        {/* Central Logo with Ambient Glow & Floating Specular Shine */}
        <div className="loading-logo-container">
          <div className="loading-logo-glow" />
          <div className="loading-logo-box">
            <img
              src={isLight ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="loading-logo-img"
            />
          </div>
        </div>

        {/* Title */}
        <div className="loading-title">Sonikoma</div>

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
