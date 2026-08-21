import React from "react";
import { ProviderFullSpec, ProviderTierOption } from "../../data/providerSpecs";
import { AIModelCardData } from "../AIModelCard";

interface ProviderBatchLimitsTableProps {
  currentProvider: ProviderFullSpec;
  providerModels: AIModelCardData[];
  activeTier?: ProviderTierOption;
}

export default function ProviderBatchLimitsTable({
  currentProvider,
  providerModels,
  activeTier,
}: ProviderBatchLimitsTableProps) {
  return (
    <div className="rounded-2xl border border-neutral-850 bg-[#161616] p-5 space-y-4 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-white font-sans">
            {currentProvider.name} Batch API &amp; Async Capacities
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            {currentProvider.batchFeature.subtext} · Discount: {currentProvider.batchFeature.discount}
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-neutral-900 border border-neutral-800 text-purple-400 px-3 py-1 rounded-full">
          Selected Tier: {activeTier ? activeTier.label : "Standard"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="text-[10px] text-neutral-400 uppercase bg-neutral-900/60 border-b border-neutral-800">
            <tr>
              <th className="py-2.5 px-3">Model</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3">Interactive RPM</th>
              <th className="py-2.5 px-3">Batch Discount</th>
              <th className="py-2.5 px-3">Batch Enqueued Cap</th>
              <th className="py-2.5 px-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850 text-neutral-300">
            {providerModels.map((m) => (
              <tr key={m.id} className="hover:bg-neutral-900/40">
                <td className="py-2.5 px-3 font-bold text-white">{m.name}</td>
                <td className="py-2.5 px-3 text-neutral-400">{m.category}</td>
                <td className="py-2.5 px-3 text-purple-400">{m.limit_rpm} RPM</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">
                  {currentProvider.batchFeature.discount}
                </td>
                <td className="py-2.5 px-3 text-indigo-400">
                  {m.batch_enqueued_tokens?.tier2
                    ? `${(m.batch_enqueued_tokens.tier2 / 1_000_000).toLocaleString()}M Tokens`
                    : "High-Volume Queue"}
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[9px] bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
