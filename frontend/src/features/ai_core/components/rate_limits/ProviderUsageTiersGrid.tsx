import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { ProviderFullSpec } from "../../data/providerSpecs";

interface ProviderUsageTiersGridProps {
  currentProvider: ProviderFullSpec;
  selectedTierId: string;
  onSelectTierId: (tierId: string) => void;
}

export default function ProviderUsageTiersGrid({
  currentProvider,
  selectedTierId,
  onSelectTierId,
}: ProviderUsageTiersGridProps) {
  return (
    <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white font-sans">
            {currentProvider.name} Usage Tiers &amp; Upgrade Path
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Official qualifications, deposit milestones, and billing caps for {currentProvider.name}.
          </p>
        </div>
        {currentProvider.docsUrl !== "#" && (
          <a
            href={currentProvider.docsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-mono text-[#3B82F6] hover:text-[#93C5FD] flex items-center gap-1"
          >
            <span>Full Pricing &amp; Tier Policy</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {currentProvider.tiers.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectTierId(t.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 text-left ${
              selectedTierId === t.id
                ? "bg-[#222222] border-[#3B82F6] ring-1 ring-purple-500/50 shadow-md"
                : "bg-neutral-900/80 border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono">{t.label}</span>
              {selectedTierId === t.id && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
              )}
            </div>
            <span className="text-xs text-neutral-400 font-mono block">
              Qualification: {t.qualification}
            </span>
            <div className="pt-2 border-t border-neutral-800 space-y-0.5">
              <span className="text-xs text-emerald-400 font-mono font-bold block">
                Spend Rate: {t.spend10Min}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono block">
                Cap: {t.billingCap}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
