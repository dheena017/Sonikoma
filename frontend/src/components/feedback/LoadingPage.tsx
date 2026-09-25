import { useState, useEffect } from "react";
import "@/styles/animations/loading.css";
import { SonikomaLogo } from "@/shared/ui/branding";
import { Sparkles } from "lucide-react";

export type ThemeMode = "dark" | "light";

interface LoadingPageProps {
  themeMode?: ThemeMode;
  status?: string;
  subtitle?: string;
  progress?: number;
}

const HUMAN_LOADING_MESSAGES = [
  "Preparing your AI webtoon parser and panel slice tools...",
  "Initializing video keyframe motion and camera zoom engine...",
  "Loading character voice synthesis and audio mixing controls...",
  "Synchronizing your studio environment — almost ready!",
];

export default function LoadingPage({
  status = "Initializing Studio...",
  subtitle,
  progress,
  themeMode,
}: LoadingPageProps) {
  const [activeMode, setActiveMode] = useState<ThemeMode>(themeMode || "dark");
  const [messageIndex, setMessageIndex] = useState(0);

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

  // Cycle through human-understandable status messages every 2.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % HUMAN_LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const clampedProgress =
    typeof progress === "number" ? Math.min(100, Math.max(0, progress)) : null;
  const hasProgress = clampedProgress !== null;
  const isLight = activeMode === "light";

  const activeSubtitle = subtitle || HUMAN_LOADING_MESSAGES[messageIndex];

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
      <div className="loading-studio-card max-w-md w-full mx-4 flex flex-col items-center text-center space-y-4 p-8">
        {/* Central Logo */}
        <div className="pb-1 flex justify-center">
          <SonikomaLogo
            size="lg"
            showSubtitle={true}
            subtitleText="Comic to Video AI"
            themeMode={activeMode}
          />
        </div>

        {/* Status Pill */}
        <div className="loading-status-pill">
          <span className="loading-status-dot" />
          <span className="loading-status-text font-bold tracking-tight">
            {status}
          </span>
        </div>

        {/* Human-Understandable Explanatory Text */}
        <div className="min-h-[44px] flex flex-col items-center justify-center px-4">
          <p className="text-xs sm:text-sm text-neutral-300 font-medium leading-relaxed transition-all duration-300">
            {activeSubtitle}
          </p>
        </div>

        {/* Progress Track */}
        <div className="w-full flex flex-col items-center gap-2 pt-1">
          <div className="loading-progress-track w-full">
            {hasProgress ? (
              <div
                className="loading-progress-determinate"
                style={{ width: `${clampedProgress}%` }}
              />
            ) : (
              <div className="loading-progress-indeterminate" />
            )}
          </div>

          <div className="flex items-center justify-between w-full text-[11px] text-neutral-400 font-mono px-1">
            <span className="flex items-center gap-1 text-neutral-400 font-sans">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Preparing resources</span>
            </span>
            {hasProgress && (
              <span className="font-bold text-blue-400 font-mono">
                {clampedProgress}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
