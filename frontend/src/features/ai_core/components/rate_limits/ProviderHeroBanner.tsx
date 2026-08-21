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
    <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${currentProvider.color}`} />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> {currentProvider.name} Speed Limits &amp; Quotas
            </h3>
            <span className="text-[10px] font-mono font-bold bg-neutral-950 border border-neutral-800 text-neutral-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 text-purple-400" />
              Resets: {currentProvider.resetInfo}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
            {currentProvider.name} Rate Limits &amp; Spend Caps
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-3xl font-mono leading-relaxed">
            Live rate limits (RPM / TPM / RPD), spend limits, priority execution, and batch processing capacities for{" "}
            {currentProvider.name}.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {currentProvider.docsUrl !== "#" && (
            <a
              href={currentProvider.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <span>{currentProvider.name} Docs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          <button
            onClick={onSyncLiveQuotas}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all cursor-pointer font-sans"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Probe Live Quotas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
