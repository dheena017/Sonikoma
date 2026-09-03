import React from "react";
import { DollarSign, Database, Zap } from "lucide-react";
import { ProviderFullSpec, ProviderTierOption } from "../../data/providerSpecs";

interface ProviderTierMetricsProps {
  currentProvider: ProviderFullSpec;
  selectedTierId: string;
  onSelectTierId: (tierId: string) => void;
  isPriorityInference: boolean;
  onTogglePriorityInference: () => void;
  activeTier?: ProviderTierOption;
}

export default function ProviderTierMetrics({
  currentProvider,
  selectedTierId,
  onSelectTierId,
  isPriorityInference,
  onTogglePriorityInference,
  activeTier,
}: ProviderTierMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
      {/* ── CARD 1: TIER SELECTOR ─────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#2F2F2F] space-y-2.5">
        <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider block">
          Active Plan / Tier
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {currentProvider.tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTierId(t.id)}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer truncate ${
                selectedTierId === t.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-[#0E0E0E] text-neutral-400 hover:text-white border border-[#2F2F2F]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CARD 2: SPEND LIMIT ──────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#2F2F2F] space-y-1">
        <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Spend Rate Limit
        </span>
        <p className="text-xl font-black text-emerald-400 font-mono">
          {activeTier ? activeTier.spend10Min : "N/A"}
        </p>
        <span className="text-xs text-neutral-400 font-medium">
          Cap: {activeTier ? activeTier.billingCap : "Standard"}
        </span>
      </div>

      {/* ── CARD 3: PRIORITY / SPEED ACCELERATION ──────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#2F2F2F] space-y-1">
        <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Speed Priority
          </span>
          <button
            onClick={onTogglePriorityInference}
            className={`text-[10px] px-2 py-0.5 rounded font-bold cursor-pointer transition-all ${
              isPriorityInference
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "bg-[#0E0E0E] text-neutral-400 border border-[#2F2F2F] hover:text-white"
            }`}
          >
            {isPriorityInference ? "ON" : "OFF"}
          </button>
        </span>
        <p className="text-sm sm:text-base font-bold text-white truncate">
          {isPriorityInference ? "Fast Priority Queue" : "Standard Speed Queue"}
        </p>
        <span className="text-xs text-neutral-400 font-medium block truncate">
          {isPriorityInference ? "Faster processing enabled" : "Normal processing speed"}
        </span>
      </div>

      {/* ── CARD 4: BATCH API SPECS & DISCOUNT ────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-[#2F2F2F] space-y-1">
        <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-400" /> Batch Mode
          </span>
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold">
            50% Off
          </span>
        </span>
        <p className="text-base font-bold text-blue-400 truncate">
          Background Processing
        </p>
        <span className="text-xs text-neutral-400 font-medium block truncate">
          Process multiple chapters in background
        </span>
      </div>
    </div>
  );
}
