import React from "react";
import { Layers, CheckCircle2, Zap, Clock, Sparkles } from "lucide-react";

interface ProjectsStatsProps {
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  statusFilter: string;
  onStatusChange: (value: string) => void;
  showTabs: boolean;
  aiSeriesCount?: number;
}

const statusTabs = ["All", "Completed", "Processing", "Draft", "AI Series"];

export default function ProjectsStats({
  stats,
  statusFilter,
  onStatusChange,
  showTabs,
  aiSeriesCount = 0,
}: ProjectsStatsProps) {
  const estimatedRuntimeMinutes = Math.max(
    1,
    Math.round((stats.totalPanels * 4) / 60)
  );

  return (
    <div className="space-y-6 mb-8 text-left">
      {/* 4 Metric Cards Matching Image 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Series */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-neutral-700 hover:bg-[#252525] transition-all duration-200 group">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
              {stats.totalProjects}
            </div>
            <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
              Total Series ({stats.completedProjects} Done)
            </div>
          </div>
        </div>

        {/* 2. Sliced Panels */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#F59E0B]/60 hover:bg-[#252525] transition-all duration-200 group">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/25 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
              {stats.totalPanels.toLocaleString()}
            </div>
            <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
              Panels Sliced
            </div>
          </div>
        </div>

        {/* 3. Estimated Reel Duration */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-[#10B981]/60 hover:bg-[#252525] transition-all duration-200 group">
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

        {/* 4. Production Health with Progress Bar */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-neutral-700 hover:bg-[#252525] transition-all duration-200 group">
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#9CA3AF] mb-1.5">
              <span>Health</span>
              <span className="font-bold text-[#E5E5E5] font-mono">
                {stats.totalProjects > 0
                  ? Math.round((stats.completedProjects / stats.totalProjects) * 100)
                  : 100}
                %
              </span>
            </div>
            <div className="w-full bg-[#121212] rounded-full h-2 overflow-hidden border border-[#2F2F2F]">
              <div
                className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
                style={{
                  width: `${
                    stats.totalProjects > 0
                      ? Math.min(
                          100,
                          Math.max(
                            10,
                            Math.round(
                              (stats.completedProjects / stats.totalProjects) * 100
                            )
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

      {/* Segmented Status Pill Filter */}
      {showTabs && (
        <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-[#2F2F2F] bg-[#141414] p-1 sm:w-fit">
          {statusTabs.map((tab) => {
            const isAi = tab === "AI Series";
            const isActive =
              statusFilter.toLowerCase() === tab.toLowerCase() ||
              (tab === "All" && !statusFilter);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusChange(tab)}
                className={`min-h-9 flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer sm:flex-none inline-flex items-center justify-center gap-1.5 ${
                  isActive
                    ? isAi
                      ? "bg-purple-600 text-white"
                      : "bg-[#3B82F6] text-white"
                    : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                }`}
              >
                {isAi && <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                <span>{tab}</span>
                {isAi && aiSeriesCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {aiSeriesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
