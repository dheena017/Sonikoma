import React from "react";
import { TrendingUp, HelpCircle } from "lucide-react";

interface SeoAuditorProps {
  seoScore: number;
  seoChecks: {
    titleLength: boolean;
    titleHook: boolean;
    descLength: boolean;
    descChapters: boolean;
    descSocials: boolean;
    tagsVolume: boolean;
  };
}

export default function SeoAuditor({ seoScore, seoChecks }: SeoAuditorProps) {
  return (
    <div className="bg-neutral-950/60 p-4 border border-neutral-850 rounded-xl flex items-center justify-between gap-4 animate-fade-in">
      <div className="space-y-1">
        <div className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Real-Time SEO Auditor
        </div>
        <p className="text-[10px] text-neutral-450 leading-relaxed max-w-md">
          Analyzes key elements (Title Hook, Description Length, Chapters, Tag
          Volume) to optimize video search rank.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <div className="text-xs font-mono text-neutral-500 uppercase">
            SEO Score
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              seoScore >= 80
                ? "text-emerald-400 animate-pulse"
                : seoScore >= 50
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {seoScore}%
          </div>
        </div>
        <div className="h-10 w-px bg-neutral-900" />

        {/* Checklist representation dots */}
        <div className="grid grid-cols-3 gap-1">
          {Object.entries(seoChecks).map(([key, val]) => (
            <div
              key={key}
              className={`h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                val
                  ? "bg-emerald-500 border-emerald-400"
                  : "bg-neutral-900 border-neutral-850"
              }`}
              title={`${key.replace(/([A-Z])/g, " $1")}: ${
                val ? "Passed" : "Failed"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
