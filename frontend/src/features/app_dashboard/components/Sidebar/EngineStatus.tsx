import React from "react";
import { Activity } from "lucide-react";

interface EngineStatusProps {
  latency: number | null;
}

export default function EngineStatus({ latency }: EngineStatusProps) {
  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 shadow-md hover:border-[#2F2F2F]/80 transition-all duration-200 text-left">
      <h3 className="text-sm font-bold text-[#E5E5E5] mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <Activity className="h-4 w-4 text-[#10B981]" />
        <span>Engine Status</span>
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#9CA3AF] font-medium">
            Computational Server
          </span>
          <span className="flex items-center gap-1.5 text-[#10B981] font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
            Online
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#9CA3AF] font-medium">
            API Health Latency
          </span>
          <span className="text-[#E5E5E5] font-bold">
            {latency !== null ? `${latency}ms` : "Checking..."}
          </span>
        </div>

        <hr className="border-[#2F2F2F]" />

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] font-mono block">
            Active Worker Pipelines
          </span>

          <div className="space-y-2.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#E5E5E5]">Browser Scraping</span>
              <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#E5E5E5]">Panel Segmentor</span>
              <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#E5E5E5]">Speech OCR Models</span>
              <span className="text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 rounded border border-[#A855F7]/30 font-bold text-[9px] uppercase">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#E5E5E5]">TTS Audio Engine</span>
              <span className="text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
