import React from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  themeMode?: "dark" | "light";
}

export function FeatureCard({
  icon,
  title,
  description,
  color,
  themeMode: propThemeMode,
}: FeatureCardProps) {
  const { themeMode: hookThemeMode } = useThemeMode();
  const themeMode = propThemeMode || hookThemeMode || "dark";
  const isLight = themeMode === "light";

  return (
    <div
      className={`p-7 rounded-2xl transition-all duration-300 border relative overflow-hidden hover:-translate-y-1.5 cursor-pointer ${
        isLight
          ? "bg-white border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg"
          : "bg-[#181818] border-[#2F2F2F] hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-950/20 shadow-md"
      }`}
    >
      <div
        className={`mb-5 p-3.5 rounded-xl inline-flex border transition-all duration-200 ${
          isLight
            ? "bg-slate-50 border-slate-200"
            : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        } ${color}`}
      >
        {icon}
      </div>
      <h3
        className={`text-lg font-bold mb-2.5 transition-colors ${
          isLight ? "text-slate-950" : "text-white"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed font-normal transition-colors ${
          isLight ? "text-slate-700" : "text-neutral-400"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
