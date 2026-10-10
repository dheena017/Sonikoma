import React from "react";
import {
  Activity,
  Cpu,
  Layers,
  CheckCircle2,
  Zap,
  HardDrive,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface DashboardSystemHealthProps {
  latency: number | null;
  analytics?: any;
}

export default function DashboardSystemHealth({
  latency,
  analytics,
}: DashboardSystemHealthProps) {
  const latencyDisplay = latency !== null ? `${latency}ms` : "24ms";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Worker Pipeline & Engine Status */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md hover:border-neutral-700 transition-all text-left">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#141414] text-[#10B981] border border-[#2F2F2F]">
              <Activity className="h-4 w-4 text-[#10B981]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E5E5E5] font-mono tracking-tight uppercase">
                Worker Pipelines &amp; AI Health
              </h3>
              <p className="text-[11px] text-[#9CA3AF] font-sans">
                Real-time status of neural processing microservices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[#10B981] font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              Online
            </span>
          </div>
        </div>

        {/* Server & Latency Row */}
        <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-xl bg-[#141414] border border-[#282828] text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">
              Inference Server
            </span>
            <span className="text-[#E5E5E5] font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              Sonikoma Engine v2.4
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#6B7280] uppercase tracking-wider block">
              Round-Trip Ping
            </span>
            <span className="text-[#10B981] font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              {latencyDisplay}
            </span>
          </div>
        </div>

        {/* 4 Pipeline Worker Statuses */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] font-mono block mb-1">
            Active Processing Workers
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#282828]">
              <span className="text-[#E5E5E5]">Webtoon Scraper</span>
              <span className="text-[#10B981] bg-[#141414] px-2 py-0.5 rounded border border-[#2F2F2F] font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#282828]">
              <span className="text-[#E5E5E5]">Canny Segmentor</span>
              <span className="text-[#10B981] bg-[#141414] px-2 py-0.5 rounded border border-[#2F2F2F] font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#282828]">
              <span className="text-[#E5E5E5]">Speech OCR Vision</span>
              <span className="text-[#3B82F6] bg-[#141414] px-2 py-0.5 rounded border border-[#2F2F2F] font-bold text-[9px] uppercase">
                Connected
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#141414] border border-[#282828]">
              <span className="text-[#E5E5E5]">TTS Voice Models</span>
              <span className="text-[#10B981] bg-[#141414] px-2 py-0.5 rounded border border-[#2F2F2F] font-bold text-[9px] uppercase">
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Resources & Creative Quotas */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md hover:border-neutral-700 transition-all text-left flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
                <Cpu className="h-4 w-4 text-[#3B82F6]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#E5E5E5] font-mono tracking-tight uppercase">
                  Compute Capacity &amp; Quota
                </h3>
                <p className="text-[11px] text-[#9CA3AF] font-sans">
                  GPU render acceleration and account resource budget
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-[#9CA3AF] px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F]">
              Pro Tier
            </span>
          </div>

          {/* Progress Metrics */}
          <div className="space-y-3.5 mb-4">
            {/* GPU Memory */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-[#9CA3AF] flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-[#3B82F6]" /> WebGPU Memory Buffer
                </span>
                <span className="font-bold text-[#E5E5E5]">2.1 GB / 8.0 GB (26%)</span>
              </div>
              <div className="h-2 w-full bg-[#121212] rounded-full overflow-hidden border border-[#2F2F2F]">
                <div
                  className="h-full bg-[#3B82F6] rounded-full transition-all duration-700"
                  style={{ width: "26%" }}
                />
              </div>
            </div>

            {/* Daily Render Budget */}
            <div>
              <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                <span className="text-[#9CA3AF] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#10B981]" /> Export Render Minutes
                </span>
                <span className="font-bold text-[#E5E5E5]">48m / 60m remaining</span>
              </div>
              <div className="h-2 w-full bg-[#121212] rounded-full overflow-hidden border border-[#2F2F2F]">
                <div
                  className="h-full bg-[#10B981] rounded-full transition-all duration-700"
                  style={{ width: "80%" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="pt-3 border-t border-[#282828] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <span className="text-[#9CA3AF] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            Hardware Acceleration Enabled
          </span>
          <span className="text-[#F59E0B] font-bold bg-[#141414] border border-[#2F2F2F] px-2 py-0.5 rounded-lg">
            +70 Daily Credits Active
          </span>
        </div>
      </div>
    </div>
  );
}
