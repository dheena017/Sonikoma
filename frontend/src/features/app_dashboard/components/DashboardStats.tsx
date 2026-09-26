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
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* 1. Total Series */}
      <div className="p-3.5 sm:p-5 rounded-lg bg-[#171717] border border-white/10 flex items-center gap-3 sm:gap-4 hover:border-white/20 hover:bg-[#1d1d1d] transition-colors group">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-bold text-[#F4F4F5] leading-none">
            {projectsCount}
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-[#A1A1AA] sm:text-xs">
            {completedCount} complete · {processingCount} active
          </div>
        </div>
      </div>

      {/* 2. Sliced Panels */}
      <div className="p-3.5 sm:p-5 rounded-lg bg-[#171717] border border-white/10 flex items-center gap-3 sm:gap-4 hover:border-amber-300/40 hover:bg-[#1d1d1d] transition-colors group">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#F59E0B]/10 text-[#FBBF24] border border-[#F59E0B]/25 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-bold text-[#F4F4F5] leading-none">
            {totalPanels.toLocaleString()}
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-[#A1A1AA] sm:text-xs">
            Panels sliced
          </div>
        </div>
      </div>

      {/* 3. Estimated Reel Runtime */}
      <div className="p-3.5 sm:p-5 rounded-lg bg-[#171717] border border-white/10 flex items-center gap-3 sm:gap-4 hover:border-emerald-300/40 hover:bg-[#1d1d1d] transition-colors group">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#10B981]/10 text-[#6EE7B7] border border-[#10B981]/25 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-2xl sm:text-3xl font-bold text-[#F4F4F5] leading-none">
            ~{estimatedRuntimeMinutes}m
          </div>
          <div className="mt-1.5 text-[11px] leading-snug text-[#A1A1AA] sm:text-xs">
            Estimated runtime
          </div>
        </div>
      </div>

      {/* 4. Production Health */}
      <div className="p-3.5 sm:p-5 rounded-lg bg-[#171717] border border-white/10 flex items-center gap-3 sm:gap-4 hover:border-white/20 hover:bg-[#1d1d1d] transition-colors group">
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-[#3B82F6]/10 text-[#60A5FA] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] mb-1.5 sm:text-xs">
            <span>Completion</span>
            <span className="font-semibold text-[#F4F4F5]">
              {projectsCount > 0
                ? Math.round((completedCount / projectsCount) * 100)
                : 100}
              %
            </span>
          </div>
          <div className="w-full bg-[#121212] rounded-full h-2 overflow-hidden border border-[#2F2F2F]">
            <div
              className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
              style={{
                width: `${
                  projectsCount > 0
                    ? Math.min(
                        100,
                        Math.max(
                          10,
                          Math.round((completedCount / projectsCount) * 100)
                        )
                      )
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
