import React from "react";
import { useThemeMode } from "@/shared/hooks/useThemeMode";

interface StepProps {
  num: string;
  title: string;
  desc: string;
}

export function Step({ num, title, desc }: StepProps) {
  const { themeMode } = useThemeMode();
  const isLight = themeMode === "light";

  return (
    <div className="flex gap-6 group">
      <div
        className={`text-4xl font-black transition-colors duration-300 ${
          isLight
            ? "text-slate-300 group-hover:text-[#3B82F6]/50"
            : "text-neutral-700 group-hover:text-[#3B82F6]/50"
        }`}
      >
        {num}
      </div>
      <div className="space-y-1">
        <h4
          className={`text-xl font-bold transition-colors duration-300 ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          {title}
        </h4>
        <p
          className={`text-sm leading-relaxed transition-colors duration-300 ${
            isLight ? "text-slate-600" : "text-neutral-400"
          }`}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}
