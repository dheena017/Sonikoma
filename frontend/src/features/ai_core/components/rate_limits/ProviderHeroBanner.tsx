import React from "react";
import { Zap, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { ProviderFullSpec } from "../../data/providerSpecs";

interface ProviderHeroBannerProps {
  currentProvider: ProviderFullSpec;
  isRefreshing: boolean;
  onSyncLiveQuotas: () => void;
}

export default function ProviderHeroBanner({
  currentProvider,
  isRefreshing,
  onSyncLiveQuotas,
}: ProviderHeroBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#141414] p-6 shadow-md text-left">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-400" /> {currentProvider.name} Usage & Limits
            </h3>
            <span className="text-[10px] font-mono font-bold bg-[#0E0E0E] border border-[#2F2F2F] text-neutral-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              {currentProvider.resetInfo}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {currentProvider.name} Rate Limits & Plans
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl leading-relaxed font-normal">
            View how many requests per minute (RPM) and tokens per minute (TPM) are available for {currentProvider.name} models.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {currentProvider.docsUrl !== "#" && (
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#181818] hover:bg-[#222] border border-[#2F2F2F] text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <span>{currentProvider.name} Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={onSyncLiveQuotas}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh Limits</span>
          </button>
        </div>
      </div>
    </div>
  );
}
