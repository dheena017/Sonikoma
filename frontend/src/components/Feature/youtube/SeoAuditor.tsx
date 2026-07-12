import React from "react";
import { TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";

interface SeoAuditorProps {
  seoScore: number;
  seoChecks: {
    titleLength: boolean;
    titleHook: boolean;
    descLength: boolean;
    descChapters: boolean;
    descSocials: boolean;
    tagsVolume: boolean;
    metadataConsistency: boolean;
  };
}

export default function SeoAuditor({ seoScore, seoChecks }: SeoAuditorProps) {
  // Translate snake_case/camelCase check keys to human-friendly short titles
  const getCheckLabel = (key: string) => {
    switch (key) {
      case "titleLength":
        return "Title Length";
      case "titleHook":
        return "CTR Hook";
      case "descLength":
        return "Description Length";
      case "descChapters":
        return "Chapters";
      case "descSocials":
        return "Socials";
      case "tagsVolume":
        return "Tag Volume";
      case "metadataConsistency":
        return "Consistency";
      default:
        return key.replace(/([A-Z])/g, " $1");
    }
  };

  return (
    <div className="bg-neutral-950/40 backdrop-blur-md p-5 border border-neutral-900 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 transition-all duration-300 hover:border-neutral-800/80 hover:shadow-xl hover:shadow-purple-950/5">
      <div className="space-y-1.5 flex-1">
        <div className="text-xs font-mono font-bold text-neutral-200 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          Real-Time SEO Auditor
        </div>
        <p className="text-[11px] text-neutral-400 leading-relaxed max-w-lg">
          Optimizes key metrics like CTR title hooks, description length, chapters layout, and tag volume to elevate organic search traffic.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 shrink-0 border-t md:border-t-0 md:border-l border-neutral-900 pt-4 md:pt-0 md:pl-5">
        <div className="text-left flex md:flex-col items-baseline md:items-start gap-2 md:gap-0.5 min-w-[80px]">
          <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
            SEO SCORE
          </span>
          <div
            className={`text-2xl font-black font-mono transition-colors duration-300 ${
              seoScore >= 80
                ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.15)]"
                : seoScore >= 50
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {seoScore}%
          </div>
        </div>

        {/* Beautiful tags representation */}
        <div className="flex flex-wrap gap-1.5 max-w-[340px]">
          {Object.entries(seoChecks).map(([key, val]) => (
            <div
              key={key}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-medium transition-all duration-300 border ${
                val
                  ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-400"
                  : "bg-neutral-900/40 border-neutral-850/60 text-neutral-500 hover:border-neutral-800"
              }`}
              title={`${getCheckLabel(key)}: ${val ? "Passed" : "Action Required"}`}
            >
              {val ? (
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="h-2.5 w-2.5 text-neutral-500 shrink-0" />
              )}
              <span>{getCheckLabel(key)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
