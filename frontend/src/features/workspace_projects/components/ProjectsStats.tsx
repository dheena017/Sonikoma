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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#262626] hover:-translate-y-0.5 transition-all shadow-md flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-[#121212] text-[#3B82F6] border border-[#2F2F2F] group-hover:border-[#3B82F6]/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#E5E5E5] font-mono leading-none">
              {stats.totalProjects}
            </div>
            <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
              Total Projects
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#10B981]/60 hover:bg-[#262626] hover:-translate-y-0.5 transition-all shadow-md flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-[#121212] text-[#10B981] border border-[#2F2F2F] group-hover:border-[#10B981]/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#E5E5E5] font-mono leading-none">
              {stats.completedProjects}
            </div>
            <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
              Completed
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#F59E0B]/60 hover:bg-[#262626] hover:-translate-y-0.5 transition-all shadow-md flex items-center gap-4 group">
          <div className="w-14 h-14 rounded-2xl bg-[#121212] text-[#F59E0B] border border-[#2F2F2F] group-hover:border-[#F59E0B]/50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-[#E5E5E5] font-mono leading-none">
              {stats.totalPanels.toLocaleString()}
            </div>
            <div className="text-xs text-[#9CA3AF] font-mono tracking-wide mt-1.5">
              Total Panels Sliced
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Status Pill Filter */}
      {showTabs && (
        <div className="flex items-center gap-1.5 p-1.5 bg-[#121212] border border-[#2F2F2F] rounded-full w-fit shadow-inner">
          {statusTabs.map((tab) => {
            const isActive =
              statusFilter.toLowerCase() === tab.toLowerCase() ||
              (tab === "All" && !statusFilter);
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onStatusChange(tab)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                    : "text-[#9CA3AF] hover:text-white hover:bg-[#262626] border border-transparent"
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
