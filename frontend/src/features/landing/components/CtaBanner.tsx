import React from "react";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import type { ThemeMode } from "../types";

export interface CtaBannerProps {
  themeMode?: ThemeMode;
  isNavigating: boolean;
  onGetStarted: () => void;
}

export function CtaBanner({
  themeMode = "dark",
  isNavigating,
  onGetStarted,
}: CtaBannerProps) {
  const isLight = themeMode === "light";

  return (
    <section className="py-20 px-6 relative z-10">
      <div
        className={`max-w-5xl mx-auto rounded-[28px] p-10 md:p-14 text-center space-y-6 border transition-all ${
          isLight
            ? "bg-white border-slate-200 shadow-sm"
            : "bg-[#181818] border-[#2F2F2F] shadow-xl"
        }`}
      >
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isLight
              ? "bg-slate-100 text-slate-700 border border-slate-200"
              : "bg-[#181818] text-neutral-300 border border-[#2F2F2F]"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          Get Started Now
        </span>

        <h2
          className={`text-3xl md:text-5xl font-black leading-tight transition-colors ${
            isLight ? "text-slate-950" : "text-white"
          }`}
        >
          Start Creating Comic Videos Today
        </h2>

        <p
          className={`max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed transition-colors ${
            isLight ? "text-slate-600" : "text-neutral-400"
          }`}
        >
          Turn static webtoon panels into voiced, animated vertical videos
          in just a few clicks.
        </p>

        <Tooltip
          text="Create your free account and export videos"
          placement="top"
        >
          <button
            disabled={isNavigating}
            onClick={onGetStarted}
            className="mx-auto h-13 px-8 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white font-bold rounded-xl transition-all duration-200 active:scale-95 cursor-pointer text-base flex items-center justify-center gap-2.5 shadow-xl shadow-blue-500/30"
          >
            {isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Loading Studio...</span>
              </>
            ) : (
              <>
                <span>Start Creating Free</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </Tooltip>
      </div>
    </section>
  );
}
