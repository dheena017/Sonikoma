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
        <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-purple-500/40 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
              {stats.totalProjects}
            </div>
            <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
              Total Projects
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-emerald-500/40 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
              {stats.completedProjects}
            </div>
            <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
              Completed
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0e0f19]/90 backdrop-blur-2xl border border-white/[0.08] shadow-2xl flex items-center gap-4 hover:border-amber-500/40 transition-all group">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono leading-none">
              {stats.totalPanels.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-400 font-mono tracking-wide mt-1.5">
              Total Panels Sliced
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Status Pill Filter */}
      {showTabs && (
        <div className="flex items-center gap-1.5 p-1.5 bg-[#0c0d16]/80 border border-white/10 rounded-full w-fit backdrop-blur-2xl">
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
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
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
