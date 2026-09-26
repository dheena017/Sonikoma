import React from "react";
import { Film, CheckCircle2, BarChart2 } from "lucide-react";

interface ProjectsStatsProps {
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
  statusFilter: string;
  onStatusChange: (value: string) => void;
  showTabs: boolean;
}

const statusTabs = ["All", "Completed", "Processing", "Draft"];

export default function ProjectsStats({
  stats,
  statusFilter,
  onStatusChange,
  showTabs,
}: ProjectsStatsProps) {
  return (
    <div className="space-y-6 mb-8">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4 transition-colors hover:border-white/20 hover:bg-[#1d1d1d]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-300">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-[#F4F4F5] sm:text-3xl">
              {stats.totalProjects}
            </div>
            <div className="mt-1.5 text-xs text-[#A1A1AA]">
              Total Projects
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4 transition-colors hover:border-white/20 hover:bg-[#1d1d1d]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-[#F4F4F5] sm:text-3xl">
              {stats.completedProjects}
            </div>
            <div className="mt-1.5 text-xs text-[#A1A1AA]">
              Completed
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#171717] p-4 transition-colors hover:border-white/20 hover:bg-[#1d1d1d]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-300">
            <BarChart2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-none text-[#F4F4F5] sm:text-3xl">
              {stats.totalPanels.toLocaleString()}
            </div>
            <div className="mt-1.5 text-xs text-[#A1A1AA]">
              Panels sliced
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Status Pill Filter */}
      {showTabs && (
        <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-white/10 bg-[#141414] p-1 sm:w-fit">
          {statusTabs.map((tab) => {
            const isActive =
              statusFilter.toLowerCase() === tab.toLowerCase() ||
              (tab === "All" && !statusFilter);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusChange(tab)}
                className={`min-h-9 flex-1 rounded-md px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer sm:flex-none ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
