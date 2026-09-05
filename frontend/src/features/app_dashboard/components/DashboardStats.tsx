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
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#3B82F6]/60 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
            {projectsCount}
          </div>
          <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
            Total Series ({completedCount} Done)
          </div>
        </div>
      </div>

      {/* 2. Sliced Panels */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#F59E0B]/60 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
            {totalPanels.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
            Panels Sliced
          </div>
        </div>
      </div>

      {/* 3. Estimated Reel Runtime */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#10B981]/60 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
            ~{estimatedRuntimeMinutes}m
          </div>
          <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
            Reel Duration
          </div>
        </div>
      </div>

      {/* 4. Production Health */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#3B82F6]/60 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#9CA3AF] mb-1.5">
            <span>Health</span>
            <span className="font-bold text-[#E5E5E5] font-mono">
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
                        Math.max(10, Math.round((completedCount / projectsCount) * 100))
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
