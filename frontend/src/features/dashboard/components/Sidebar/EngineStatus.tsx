import React from "react";
import { Activity } from "lucide-react";

interface EngineStatusProps {
  latency: number | null;
}

export default function EngineStatus({ latency }: EngineStatusProps) {
  return (
    <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
      <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-400" />
        Engine Status
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">Computational Server</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Online
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-neutral-500">API Health Latency</span>
          <span className="text-neutral-300 font-bold">
            {latency !== null ? `${latency}ms` : "Checking..."}
          </span>
        </div>

        <hr className="border-white/5" />

        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 font-mono block">
            Active Worker Pipelines
          </span>

          <div className="space-y-2.5 mt-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Browser Scraping</span>
              <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Panel Segmentor</span>
              <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">Speech OCR Models</span>
              <span className="text-purple-400 bg-purple-950/20 px-2 py-0.5 rounded border border-purple-900/30 font-bold text-[9px] uppercase">
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-neutral-400">TTS Audio Engine</span>
              <span className="text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30 font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
