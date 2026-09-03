import React from "react";
import { BarChart2, Layers, CheckCircle2, Zap, Loader } from "lucide-react";

interface WorkspaceStatsBarProps {
  statsLoading: boolean;
  stats: {
    totalProjects: number;
    totalPanels: number;
    completedProjects: number;
  };
  projectId: string | null;
}

const WorkspaceStatsBar: React.FC<WorkspaceStatsBarProps> = ({
  statsLoading,
  stats,
  projectId,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        {
          icon: <BarChart2 className="h-4 w-4 text-[#3B82F6]" />,
          label: "Total Projects",
          value: statsLoading ? "—" : stats.totalProjects.toString(),
          color: "from-purple-900/20 to-indigo-900/20 border-[#3B82F6]/20",
        },
        {
          icon: <Layers className="h-4 w-4 text-sky-400" />,
          label: "Panels Processed",
          value: statsLoading ? "—" : stats.totalPanels.toLocaleString(),
          color: "from-sky-900/20 to-blue-900/20 border-sky-500/20",
        },
        {
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
          label: "Completed",
          value: statsLoading ? "—" : stats.completedProjects.toString(),
          color: "from-emerald-900/20 to-green-900/20 border-emerald-500/20",
        },
        {
          icon: <Zap className="h-4 w-4 text-amber-400" />,
          label: "Active Session",
          value: projectId ? "1" : "0",
          color: "from-amber-900/20 to-orange-900/20 border-amber-500/20",
        },
      ].map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.color} border rounded-2xl p-4 flex flex-col gap-2 backdrop-blur-md`}
        >
          <div className="flex items-center justify-between">
            {stat.icon}
            {statsLoading && (
              <Loader className="h-3 w-3 text-neutral-500 animate-spin" />
            )}
          </div>
          <p className="text-xl font-black text-white font-mono">
            {stat.value}
          </p>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
};

export default WorkspaceStatsBar;
