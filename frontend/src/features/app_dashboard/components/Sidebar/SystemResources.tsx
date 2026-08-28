import React from "react";
import { Cpu } from "lucide-react";

interface SystemResourcesProps {
  metrics: any;
  analytics: any;
}

export default function SystemResources({
  metrics,
}: SystemResourcesProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 shadow-md hover:border-[#2F2F2F]/80 transition-all duration-200 text-left">
      <h3 className="text-sm font-bold text-[#E5E5E5] mb-6 uppercase tracking-wider font-mono flex items-center gap-2">
        <Cpu className="h-4 w-4 text-[#3B82F6]" />
        System Resources
      </h3>

      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest font-mono">
              Memory Usage
            </span>
            <span className="text-xs font-mono text-[#E5E5E5] font-bold">
              {metrics?.memory?.rssMB ? `${metrics.memory.rssMB} MB` : "---"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden border border-[#2F2F2F]">
            <div
              className="h-full bg-[#3B82F6] transition-all duration-700"
              style={{ width: metrics?.memory?.systemUsedPct || "0%" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest font-mono">
              CPU Load
            </span>
            <span className="text-xs font-mono text-[#E5E5E5] font-bold">
              {metrics?.memory?.cpuPct ? `${metrics.memory.cpuPct}%` : "---"}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#121212] rounded-full overflow-hidden border border-[#2F2F2F]">
            <div
              className="h-full bg-[#3B82F6] transition-all duration-700"
              style={{ width: `${metrics?.memory?.cpuPct || 0}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
