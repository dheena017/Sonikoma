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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
            <Film className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.totalProjects}
            </div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              Total Projects
            </div>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.completedProjects}
            </div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              Completed
            </div>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {stats.totalPanels.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">
              Total Panels
            </div>
          </div>
        </div>
      </div>

      {showTabs && (
        <div className="flex border-b border-neutral-800 mb-6">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onStatusChange(tab)}
              className={`px-6 py-3 font-semibold text-sm border-b-2 transition-colors ${
                statusFilter === tab
                  ? "border-purple-500 text-purple-400"
                  : "border-transparent text-neutral-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
