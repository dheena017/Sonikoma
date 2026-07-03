import React from "react";
import { Activity, AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface LogsPageStatsProps {
  total: number;
  errors: number;
  warnings: number;
  success: number;
  viewMode: "live" | "historical";
  isPaused: boolean;
}

export function LogsPageStats({
  total,
  errors,
  warnings,
  success,
  viewMode,
  isPaused,
}: LogsPageStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-2xl">
        <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">
          Total Logs
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-white">{total}</span>
          <Activity className="h-4 w-4 text-purple-400" />
        </div>
      </div>
      <div className="bg-red-500/5 border border-red-900/20 p-4 rounded-2xl relative overflow-hidden group">
        {errors > 0 && viewMode === "live" && !isPaused && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
        )}
        <p className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest mb-1">
          Critical Errors
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-red-400">{errors}</span>
          <AlertTriangle className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
        </div>
      </div>
      <div className="bg-amber-500/5 border border-amber-900/20 p-4 rounded-2xl">
        <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-1">
          System Warnings
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-amber-400">{warnings}</span>
          <Info className="h-4 w-4 text-amber-500" />
        </div>
      </div>
      <div className="bg-emerald-500/5 border border-emerald-900/20 p-4 rounded-2xl">
        <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">
          Success Events
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-emerald-400">{success}</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      </div>
    </div>
  );
}
