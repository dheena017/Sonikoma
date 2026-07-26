import React from "react";
import { Cpu } from "lucide-react";

interface SystemResourcesProps {
  metrics: any;
  analytics: any;
}

export default function SystemResources({ metrics, analytics }: SystemResourcesProps) {
  return (
    <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
      <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider font-mono flex items-center gap-2">
        <Cpu className="h-4 w-4 text-purple-400" />
        System Resources
      </h3>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              Memory Usage
            </span>
            <span className="text-xs font-mono text-neutral-300">
              {metrics?.memory?.rssMB ? `${metrics.memory.rssMB} MB` : "---"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-1000"
              style={{ width: metrics?.memory?.systemUsedPct || "0%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              CPU Load
            </span>
            <span className="text-xs font-mono text-neutral-300">
              {metrics?.memory?.cpuPct ? `${metrics.memory.cpuPct}%` : "---"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-1000"
              style={{ width: `${metrics?.memory?.cpuPct || 0}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              Storage Usage
            </span>
            <span className="text-xs font-mono text-neutral-300">
              {metrics?.storage?.usedBytes
                ? `${(metrics.storage.usedBytes / (1024 * 1024)).toFixed(
                    1
                  )} MB`
                : "---"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
              style={{
                width: `${
                  metrics?.storage?.usedBytes && metrics?.storage?.limitBytes
                    ? (metrics.storage.usedBytes /
                        metrics.storage.limitBytes) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              AI Tokens Used
            </span>
            <span className="text-xs font-mono text-neutral-300">
              {analytics?.total_tokens
                ? analytics.total_tokens.toLocaleString()
                : "0"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-1000"
              style={{
                width: `${Math.min(
                  100,
                  (analytics?.total_tokens || 0) / 10000
                )}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
