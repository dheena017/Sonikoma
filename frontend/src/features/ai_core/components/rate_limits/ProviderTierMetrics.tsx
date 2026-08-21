import React from "react";
import { DollarSign, Database } from "lucide-react";
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
      <div className="p-4 rounded-2xl bg-[#161616] border border-neutral-850 space-y-2">
        <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold block">
          {currentProvider.name} Active Tier
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {currentProvider.tiers.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTierId(t.id)}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-mono font-bold capitalize transition-all cursor-pointer truncate ${
                selectedTierId === t.id
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── CARD 2: SPEND RATE LIMIT ──────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#161616] border border-neutral-850 space-y-1">
        <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold flex items-center gap-1">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Spend Rate Limit
        </span>
        <p className="text-xl font-black text-emerald-400 font-mono">
          {activeTier ? activeTier.spend10Min : "N/A"}
        </p>
        <span className="text-[10px] text-neutral-500 font-mono">
          Billing Cap: {activeTier ? activeTier.billingCap : "N/A"}
        </span>
      </div>

      {/* ── CARD 3: PRIORITY / SPEED ACCELERATION ──────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#161616] border border-neutral-850 space-y-1">
        <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold flex items-center justify-between">
          <span>{currentProvider.priorityFeature.title}</span>
          <button
            onClick={onTogglePriorityInference}
            className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold cursor-pointer transition-all ${
              isPriorityInference
                ? "bg-amber-500 text-black shadow-sm"
                : "bg-neutral-900 text-neutral-400 border border-neutral-800"
            }`}
          >
            {currentProvider.priorityFeature.toggleLabel}
          </button>
        </span>
        <p className="text-sm sm:text-base font-black text-white font-mono truncate">
          {isPriorityInference
            ? currentProvider.priorityFeature.activeText
            : currentProvider.priorityFeature.standardText}
        </p>
        <span className="text-[10px] text-neutral-500 font-mono block truncate">
          {currentProvider.priorityFeature.description}
        </span>
      </div>

      {/* ── CARD 4: BATCH API SPECS & DISCOUNT ────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#161616] border border-neutral-850 space-y-1">
        <span className="text-[10px] text-neutral-400 uppercase font-mono font-bold flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-indigo-400" /> {currentProvider.batchFeature.title}
          </span>
          <span className="text-[9px] bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 px-1.5 py-0.2 rounded font-mono">
            {currentProvider.batchFeature.discount}
          </span>
        </span>
        <p className="text-base sm:text-lg font-black text-indigo-400 font-mono truncate">
          {currentProvider.batchFeature.highlight}
        </p>
        <span className="text-[10px] text-neutral-500 font-mono block truncate">
          {currentProvider.batchFeature.subtext}
        </span>
      </div>
    </div>
  );
}
