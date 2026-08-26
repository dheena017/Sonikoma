import React from "react";
import { Layers, CheckCircle2, Zap, Clock } from "lucide-react";
import { DashboardStatsSkeleton } from "@/shared/ui/loading";

interface DashboardStatsProps {
  projectsCount: number;
  completedCount: number;
  processingCount: number;
  totalPanels: number;
  loading?: boolean;
}

export default function DashboardStats({
  projectsCount,
  completedCount,
  processingCount,
  totalPanels,
  loading = false,
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <DashboardStatsSkeleton count={4} />
      </div>
    );
  }

  const estimatedRuntimeMinutes = Math.max(
    1,
    Math.round((totalPanels * 4) / 60)
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* 1. Total Series */}
      <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-purple-500/40 transition-all group">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
            {projectsCount}
          </div>
          <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
            Total Series ({completedCount} Done · {processingCount} Proc)
          </div>
        </div>
      </div>

      {/* 2. Sliced Panels */}
      <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-amber-500/40 transition-all group">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
            {totalPanels.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
            Comic Panels Sliced
          </div>
        </div>
      </div>

      {/* 3. Estimated Reel Runtime */}
      <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
            ~{estimatedRuntimeMinutes}m
          </div>
          <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
            Estimated Reel Duration
          </div>
        </div>
      </div>

      {/* 4. Production Health */}
      <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-cyan-500/40 transition-all group">
        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
            <span>Health Score</span>
            <span className="font-bold text-white font-mono">
              {projectsCount > 0
                ? Math.round((completedCount / projectsCount) * 100)
                : 100}
              %
            </span>
          </div>
          <div className="w-full bg-[#131524] rounded-full h-2 overflow-hidden border border-white/5">
            <div
              className="bg-gradient-to-r from-purple-500 via-indigo-400 to-cyan-400 h-full rounded-full transition-all duration-700"
              style={{
                width: `${
                  projectsCount > 0
                    ? Math.round((completedCount / projectsCount) * 100)
                    : 100
                }%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
