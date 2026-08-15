import { useState, useEffect } from "react";

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
      const currentMode = document.documentElement.getAttribute("data-mode") as ThemeMode | null;
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
      className={`loading-page-shell ${
        isLight ? "loading-page-shell-light" : "loading-page-shell-dark"
      }`}
      style={{
        position: "fixed",
        inset: 0,
        background: isLight ? "#f4f4f5" : "#050507",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "24px",
        zIndex: 9999,
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <div className="loading-anime-backdrop" aria-hidden="true">
        <div className="loading-anime-wash" />
        <div className="loading-scanline" />
      </div>

      {/* Glass Card Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "42px 40px 36px",
          borderRadius: "28px",
          background: isLight ? "rgba(255, 255, 255, 0.92)" : "rgba(8, 8, 12, 0.88)",
          border: isLight ? "1px solid rgba(148, 163, 184, 0.24)" : "1px solid rgba(255, 255, 255, 0.09)",
          backdropFilter: "blur(22px) saturate(1.15)",
          boxShadow: isLight
            ? "0 28px 70px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(255,255,255,0.6) inset"
            : "0 30px 90px rgba(0, 0, 0, 0.5), 0 0 70px rgba(124,58,237,0.12)",
          width: "90%",
          maxWidth: "380px",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div className="loading-motion-stage">
          {/* Pulsing Glowing Logo Wrapper */}
          <div
            className="loading-logo-stage"
            style={{
              position: "relative",
            }}
          >
            <div
              className="loading-logo-frame"
              style={{
                position: "relative",
                width: 102,
                height: 102,
                borderRadius: 26,
                padding: 4,
                background: isLight ? "rgba(255, 255, 255, 0.86)" : "rgba(8, 8, 12, 0.92)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: isLight
                  ? "0 18px 40px rgba(15, 23, 42, 0.12)"
                  : "0 18px 50px rgba(0, 0, 0, 0.48)",
              }}
            >
              <img
                src={isLight ? "/logo-light.png" : "/logo-dark.png"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                }}
                alt="Sonikoma Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "20px",
                  objectFit: "cover",
                  padding: "5px",
                  boxSizing: "border-box",
                  background: isLight ? "#ffffff" : "#000000",
                  position: "relative",
                  zIndex: 1,
                }}
              />
            </div>
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: isLight ? "#18181b" : "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: "6px",
            background: isLight ? "linear-gradient(to right, #18181b, #3f3f46)" : "linear-gradient(to right, #ffffff, #e4e4e7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Sonikoma
        </div>

        {/* Tagline / status */}
        <div
          style={{
            fontSize: "0.75rem",
            color: isLight ? "#71717a" : "#9ca3af",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "28px",
            textAlign: "center",
          }}
          aria-live="polite"
        >
          {status}
        </div>

        {/* Progress Display */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Progress bar container */}
          <div
            style={{
              width: "100%",
              height: 5,
              background: isLight ? "rgba(15,23,42,0.08)" : "rgba(255,255,255,0.08)",
              borderRadius: 9999,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {hasProgress ? (
              // Determinate bar
              <div
                style={{
                  width: `${clampedProgress}%`,
                  height: "100%",
                  background: "linear-gradient(to right, #a855f7, #06b6d4)",
                  borderRadius: 9999,
                  transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  boxShadow: "0 0 8px rgba(6,182,212,0.5)",
                  willChange: "width",
                }}
              />
            ) : (
              // Indeterminate shimmer bar using GPU transform for seamless movement
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(to right, transparent 0%, #a855f7 35%, #06b6d4 65%, transparent 100%)",
                  borderRadius: 9999,
                  animation: "lp-shimmer 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite",
                  position: "absolute",
                  inset: 0,
                  willChange: "transform",
                }}
              />
            )}
          </div>

          {/* Optional Percentage / Status text */}
          {hasProgress ? (
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#06b6d4",
                fontFamily: "monospace",
              }}
            >
              {clampedProgress}%
            </div>
          ) : (
            // Indeterminate Spinner
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              style={{
                width: 20,
                height: 20,
                color: "#a855f7",
                animation: "lp-spin 1.8s linear infinite",
                willChange: "transform",
              }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                opacity={0.15}
              />
              <path
                fill="currentColor"
                opacity={0.85}
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          )}
        </div>
      </div>

      <style>{`
        @keyframes lp-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes lp-shimmer {
          0%   { transform: translate3d(-100%, 0, 0); }
          100% { transform: translate3d(100%, 0, 0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .loading-anime-backdrop::before,
          .loading-anime-backdrop::after,
          .loading-scanline,
          .loading-motion-stage::before,
          .loading-panel-chip,
          .loading-panel-chip::after,
          .loading-logo-stage,
          .loading-logo-frame::before,
          .loading-logo-stage::before,
          .loading-logo-stage::after {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
