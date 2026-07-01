import { useState, useEffect } from "react";

export type ThemeMode = "dark" | "light";

interface LoadingPageProps {
  themeMode?: ThemeMode;
  status?: string;
  progress?: number;
}

const LOADING_TIPS = [
  "Use the Speech Bubble Cleaner to erase text for translation.",
  "Select from multiple Voice Actors to narrate your webtoon.",
  "Enable Smart Scanner for automatic webtoon strip division.",
  "Check the System Diagnostics page to view GPU utilization.",
  "Stitch adjacent panels to create wide landscape scenes.",
  "The first URL import is free. Sign in to import more!",
];

export default function LoadingPage({
  status = "Initializing",
  progress,
  themeMode,
}: LoadingPageProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
        setFadeState("in");
      }, 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const hasProgress = progress !== undefined && progress >= 0;
  const clampedProgress = hasProgress
    ? Math.min(100, Math.max(0, progress))
    : 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050507",
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
      {/* Background Ambient Glows */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "30%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(168, 85, 247, 0.08)",
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "lp-float-bg 8s infinite alternate ease-in-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "20%",
          right: "30%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(6, 182, 212, 0.08)",
          filter: "blur(80px)",
          pointerEvents: "none",
          animation: "lp-float-bg 8s infinite alternate-reverse ease-in-out",
        }}
      />

      {/* Glass Card Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "40px",
          borderRadius: "24px",
          background: "rgba(10, 10, 15, 0.6)",
          border: "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3)",
          width: "90%",
          maxWidth: "400px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Pulsing Glowing Logo Wrapper */}
        <div
          style={{
            position: "relative",
            marginBottom: "16px",
            animation: "lp-pulse 2s infinite ease-in-out",
          }}
        >
          <div
            style={{
              position: "relative",
              width: 96,
              height: 96,
              borderRadius: 18,
              background: "linear-gradient(135deg, #a855f7, #06b6d4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(168,85,247,0.4)",
            }}
          >
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              alt="Sonikoma Logo"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "15px",
                objectFit: "cover",
                padding: "3px",
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
            />
          </div>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            marginBottom: "4px",
            background: "linear-gradient(to right, #ffffff, #e4e4e7)",
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
            color: "#9ca3af",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: "24px",
            textAlign: "center",
          }}
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
            marginBottom: "24px",
          }}
        >
          {/* Progress bar container */}
          <div
            style={{
              width: "100%",
              height: 4,
              background: "rgba(255,255,255,0.06)",
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
                  transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 0 8px rgba(6,182,212,0.5)",
                }}
              />
            ) : (
              // Indeterminate shimmer bar
              <div
                style={{
                  width: "40%",
                  height: "100%",
                  background: "linear-gradient(to right, #a855f7, #06b6d4)",
                  borderRadius: 9999,
                  animation: "lp-shimmer 1.4s infinite ease-in-out",
                  position: "absolute",
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
                animation: "lp-spin 1s linear infinite",
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
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes lp-shimmer {
          0%   { left: -40%; }
          100% { left: 100%; }
        }
        @keyframes lp-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.02); }
        }
        @keyframes lp-float-bg {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -30px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
