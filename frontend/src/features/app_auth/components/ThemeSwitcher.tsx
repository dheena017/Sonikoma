import React from "react";
import { ThemeKey, THEMES } from "@/features/app_auth/components/constants";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface ThemeSwitcherProps {
  activeTheme: ThemeKey;
  onChange: (theme: ThemeKey) => void;
  className?: string;
}

const paletteStyles: Record<ThemeKey, string> = {
  purple: "bg-[#2A2A2A]",
  blue: "bg-blue-500",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
};

export default function ThemeSwitcher({
  activeTheme,
  onChange,
  className,
}: ThemeSwitcherProps) {
  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 p-1 rounded-full backdrop-blur-md ${
        className ?? ""
      }`}
    >
      {(Object.keys(THEMES) as ThemeKey[]).map((theme) => (
        <Tooltip key={theme} text={`Switch to ${theme} accent`} placement="top">
          <button
            type="button"
            onClick={() => onChange(theme)}
            className={`w-4 h-4 rounded-full transition-transform active:scale-90 cursor-pointer ${
              paletteStyles[theme]
            } ${
              activeTheme === theme
                ? "scale-110 ring-2 ring-white/40"
                : "scale-90 opacity-60 hover:opacity-100"
            }`}
          />
        </Tooltip>
      ))}
    </div>
  );
}
