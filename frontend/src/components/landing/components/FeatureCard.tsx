import React from "react";
import { useThemeMode } from "../../../hooks/useThemeMode";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  color,
}: FeatureCardProps) {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";

  return (
    <div className={`p-8 rounded-[32px] transition-all group border ${
      isLight
        ? "bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-350"
        : "bg-neutral-900/50 border-white/5 hover:border-white/10 hover:bg-neutral-800/50"
    }`}>
      <div
        className={`mb-6 p-4 rounded-2xl inline-flex group-hover:scale-110 transition-transform border ${
          isLight
            ? "bg-slate-50 border-slate-200"
            : "bg-neutral-800 border-white/5"
        } ${color}`}
      >
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-3 transition-colors ${
        isLight ? "text-slate-900" : "text-white"
      }`}>{title}</h3>
      <p className={`text-sm leading-relaxed transition-colors ${
        isLight ? "text-slate-600" : "text-neutral-500"
      }`}>{description}</p>
    </div>
  );
}
