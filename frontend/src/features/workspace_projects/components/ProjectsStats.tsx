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
        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl p-5 shadow-lg hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                Total Projects
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {stats.totalProjects}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <Film className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500/40 via-purple-500/10 to-transparent" />
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl p-5 shadow-lg hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                Completed
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {stats.completedProjects}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/40 via-emerald-500/10 to-transparent" />
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 backdrop-blur-xl p-5 shadow-lg hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
                Total Panels Sliced
              </div>
              <div className="text-3xl font-black text-white tracking-tight">
                {stats.totalPanels.toLocaleString()}
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
              <BarChart2 className="w-6 h-6" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500/40 via-indigo-500/10 to-transparent" />
        </div>
      </div>

      {/* Segmented Status Pill Filter */}
      {showTabs && (
        <div className="flex items-center gap-1.5 p-1.5 bg-[#0c0d16]/80 border border-white/10 rounded-full w-fit backdrop-blur-2xl">
          {statusTabs.map((tab) => {
            const isActive = (statusFilter.toLowerCase() === tab.toLowerCase()) || (tab === "All" && !statusFilter);
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
