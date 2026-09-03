import React from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

export type SonikomaLogoSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface SonikomaLogoProps {
  /** Size preset for icon and text */
  size?: SonikomaLogoSize;
  /** Whether to show the subtitle tag (e.g. "Comic to Video AI") */
  showSubtitle?: boolean;
  /** Optional custom subtitle text */
  subtitleText?: string;
  /** Optional badge next to the logo (e.g. "Studio", "Pro") */
  badge?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Custom additional className */
  className?: string;
  /** Force theme mode override */
  themeMode?: "dark" | "light" | "auto";
  /** Whether to show only the icon (hide text) */
  iconOnly?: boolean;
}

const SIZE_CONFIGS: Record<
  SonikomaLogoSize,
  {
    boxSize: string;
    textSize: string;
    subtextSize: string;
    gap: string;
  }
> = {
  xs: {
    boxSize: "w-7 h-7",
    textSize: "text-sm font-bold tracking-tight",
    subtextSize: "text-[9px]",
    gap: "gap-2",
  },
  sm: {
    boxSize: "w-8.5 h-8.5",
    textSize: "text-base font-bold tracking-tight",
    subtextSize: "text-[10px]",
    gap: "gap-2.5",
  },
  md: {
    boxSize: "w-10 h-10",
    textSize: "text-lg font-bold tracking-tight",
    subtextSize: "text-[11px]",
    gap: "gap-3",
  },
  lg: {
    boxSize: "w-12 h-12",
    textSize: "text-2xl font-bold tracking-tight",
    subtextSize: "text-xs",
    gap: "gap-3.5",
  },
  xl: {
    boxSize: "w-14 h-14",
    textSize: "text-3xl font-bold tracking-tight",
    subtextSize: "text-sm",
    gap: "gap-4",
  },
};

export function SonikomaLogo({
  size = "md",
  showSubtitle = false,
  subtitleText = "Comic to Video AI",
  badge,
  onClick,
  className = "",
  themeMode = "auto",
  iconOnly = false,
}: SonikomaLogoProps) {
  const { themeMode: currentAppTheme } = useThemeMode();
  const isLight =
    themeMode === "light" ||
    (themeMode === "auto" && currentAppTheme === "light");

  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const isInteractive = Boolean(onClick);

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${config.gap} select-none ${
        isInteractive
          ? "cursor-pointer group hover:opacity-90 transition-all duration-200"
          : ""
      } ${className}`}
    >
      {/* 1. Seamless Circular Emblem Frame - crops inner square background natively */}
      <div
        className={`${config.boxSize} rounded-full flex items-center justify-center overflow-hidden shrink-0 border transition-all duration-200 shadow-sm ${
          isLight
            ? "border-slate-300 bg-white group-hover:border-slate-400"
            : "border-[#2F2F2F] bg-[#0A0B0E] group-hover:border-neutral-500"
        }`}
      >
        <img
          src={isLight ? "/logo-light.png" : "/logo-dark.png"}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
          }}
          alt="Sonikoma"
          className="w-full h-full object-cover scale-[1.18] transition-transform duration-200 group-hover:scale-[1.25]"
          draggable={false}
        />
      </div>

      {/* 2. Professional Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-2">
            <span
              className={`${config.textSize} transition-colors duration-200 ${
                isLight
                  ? "text-slate-900 group-hover:text-blue-600"
                  : "text-white group-hover:text-neutral-200"
              }`}
            >
              Sonikoma
            </span>

            {badge && (
              <span
                className={`text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${
                  isLight
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-white/5 text-neutral-300 border border-white/10"
                }`}
              >
                {badge}
              </span>
            )}
          </div>

          {showSubtitle && (
            <span
              className={`${config.subtextSize} font-medium transition-colors duration-200 ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SonikomaLogo;
