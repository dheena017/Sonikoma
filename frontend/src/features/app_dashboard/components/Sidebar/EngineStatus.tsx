import React from "react";
import { Activity } from "lucide-react";

interface EngineStatusProps {
  latency: number | null;
}

export default function EngineStatus({ latency }: EngineStatusProps) {
  return (
    <div className="bg-[#0b0b0e]/90 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md hover:border-emerald-500/20 transition-all duration-300">
      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-400" />
        Engine Status
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-350 font-medium">
            Computational Server
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-350 font-medium">
            API Health Latency
          </span>
          <span className="text-neutral-200 font-bold">
            {latency !== null ? `${latency}ms` : "Checking..."}
          </span>
        </div>

        <hr className="border-white/10" />

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 font-mono block">
            Active Worker Pipelines
          </span>

          <div className="space-y-2.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-300">Browser Scraping</span>
              <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-300">Panel Segmentor</span>
              <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-300">Speech OCR Models</span>
              <span className="text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30 font-bold text-[9px] uppercase">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-300">TTS Audio Engine</span>
              <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
