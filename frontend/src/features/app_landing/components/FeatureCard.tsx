import React from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

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
    <div
      className={`p-8 rounded-[28px] transition-all duration-300 group border relative overflow-hidden ${
        isLight
          ? "bg-white border-slate-200 shadow-sm hover:shadow-xl hover:border-purple-300 hover:-translate-y-1"
          : "bg-[#0c0d16]/90 backdrop-blur-2xl border-white/10 hover:border-purple-500/40 hover:bg-[#121422]/95 shadow-[0_10px_35px_rgba(0,0,0,0.5)] hover:shadow-[0_15px_40px_rgba(168,85,247,0.25)] hover:-translate-y-1"
      }`}
    >
      {/* Subtle top-edge accent glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div
        className={`mb-6 p-4 rounded-2xl inline-flex group-hover:scale-110 transition-transform duration-300 border shadow-md ${
          isLight
            ? "bg-slate-50 border-slate-200"
            : "bg-[#141624] border-white/10 shadow-purple-900/10"
        } ${color}`}
      >
        {icon}
      </div>
      <h3
        className={`text-xl font-bold mb-3 transition-colors duration-200 ${
          isLight ? "text-slate-900" : "text-white group-hover:text-purple-300"
        }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm leading-relaxed transition-colors duration-200 ${
          isLight ? "text-slate-600" : "text-neutral-300"
        }`}
      >
        {description}
      </p>
    </div>
  );
}
