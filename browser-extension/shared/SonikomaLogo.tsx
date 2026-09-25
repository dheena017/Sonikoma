import React from "react";

export interface SonikomaLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  showSubtitle?: boolean;
  subtitleText?: string;
  badge?: string;
  className?: string;
  iconOnly?: boolean;
  onClick?: () => void;
}

const SIZE_CONFIGS = {
  xs: {
    boxSize: "w-6 h-6",
    textSize: "text-xs font-bold tracking-tight",
    subtextSize: "text-[8px]",
    gap: "gap-1.5",
  },
  sm: {
    boxSize: "w-7 h-7",
    textSize: "text-sm font-bold tracking-tight",
    subtextSize: "text-[9px]",
    gap: "gap-2",
  },
  md: {
    boxSize: "w-8.5 h-8.5",
    textSize: "text-base font-bold tracking-tight",
    subtextSize: "text-[10px]",
    gap: "gap-2.5",
  },
  lg: {
    boxSize: "w-10 h-10",
    textSize: "text-lg font-bold tracking-tight",
    subtextSize: "text-xs",
    gap: "gap-3",
  },
};

export const SonikomaLogo: React.FC<SonikomaLogoProps> = ({
  size = "sm",
  showSubtitle = false,
  subtitleText = "Comic to Video AI",
  badge,
  className = "",
  iconOnly = false,
  onClick,
}) => {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.sm;

  // Resolve logo path via Chrome extension runtime or fallback
  const logoSrc =
    typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL("icons/logo-dark.png")
      : "/icons/logo-dark.png";

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center ${config.gap} select-none ${
        onClick
          ? "cursor-pointer group hover:opacity-95 transition-opacity"
          : ""
      } ${className}`}
    >
      {/* Seamless Circular Emblem Frame with Real Sonikoma Logo */}
      <div
        className={`${config.boxSize} rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-[#2F2F2F] bg-[#0A0B0E] shadow-md shadow-black/40`}
      >
        <img
          src={logoSrc}
          onError={(e) => {
            // Fallback to relative or icon if needed
            (e.currentTarget as HTMLImageElement).src =
              "../icons/logo-dark.png";
          }}
          alt="Sonikoma"
          className="w-full h-full object-cover scale-[1.20] transition-transform duration-200 group-hover:scale-[1.28]"
          draggable={false}
        />
      </div>

      {/* Brand Typography */}
      {!iconOnly && (
        <div className="flex flex-col text-left leading-tight">
          <div className="flex items-center gap-1.5">
            <span
              className={`${config.textSize} text-white font-bold tracking-tight`}
            >
              Sonikoma
            </span>

            {badge && (
              <span className="text-[8px] font-extrabold uppercase font-mono px-1 py-0.2 rounded bg-sky-950/80 border border-sky-700/60 text-sky-400">
                {badge}
              </span>
            )}
          </div>

          {showSubtitle && (
            <span
              className={`${config.subtextSize} font-medium text-slate-400`}
            >
              {subtitleText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SonikomaLogo;
