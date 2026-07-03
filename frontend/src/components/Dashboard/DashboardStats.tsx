import React from "react";
import { Film, Video, Loader2, Scissors } from "lucide-react";

interface DashboardStatsProps {
  projectsCount: number;
  completedCount: number;
  processingCount: number;
  totalPanels: number;
}

export default function DashboardStats({
  projectsCount,
  completedCount,
  processingCount,
  totalPanels,
}: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
      <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Film className="h-32 w-32" />
        </div>
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">
          Total Series
        </p>
        <div className="text-4xl font-black text-white">{projectsCount}</div>
      </div>

      <div className="bg-[#0b0b0e]/80 border border-emerald-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-emerald-500">
          <Video className="h-32 w-32" />
        </div>
        <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-widest mb-1">
          Completed
        </p>
        <div className="text-4xl font-black text-white">{completedCount}</div>
      </div>

      <div className="bg-[#0b0b0e]/80 border border-amber-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/30 transition-colors">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-amber-500">
          <Loader2 className="h-32 w-32" />
        </div>
        <p className="text-xs font-bold text-amber-500/70 uppercase tracking-widest mb-1">
          Processing
        </p>
        <div className="text-4xl font-black text-white">{processingCount}</div>
      </div>

      <div className="bg-[#0b0b0e]/80 border border-indigo-500/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity text-indigo-500">
          <Scissors className="h-32 w-32" />
        </div>
        <p className="text-xs font-bold text-indigo-500/70 uppercase tracking-widest mb-1">
          Total Panels
        </p>
        <div className="text-4xl font-black text-white">{totalPanels}</div>
      </div>
    </div>
  );
}
