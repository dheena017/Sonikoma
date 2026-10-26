import React from "react";
import { Server } from "lucide-react";
import { AdminBackendStats } from "../types";

export interface AdminDashboardPulseProps {
  stats: Partial<AdminBackendStats>;
  dbStatus: string;
}

export const AdminDashboardPulse: React.FC<AdminDashboardPulseProps> = ({
  stats,
  dbStatus,
}) => {
  const cpuLoad = stats.cpuPct || 0;
  const activeJobsCount = stats.activeJobs || 0;

  return (
    <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 flex flex-col justify-between shadow-sm text-left">
      <div>
        <h3 className="text-md font-extrabold text-[#E5E5E5] mb-4 flex items-center gap-2 font-mono">
          <Server className="w-4 h-4 text-[#3B82F6]" /> Infrastructure Pulse
        </h3>

        <div className="space-y-4">
          {/* CPU Load bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-neutral-500 uppercase tracking-widest font-mono">
                CPU LOAD
              </span>
              <span className="text-neutral-300 font-mono">{cpuLoad}%</span>
            </div>
            <div className="w-full bg-[#040406] h-1.5 rounded-full overflow-hidden border border-neutral-900">
              <div
                className={`h-full transition-all duration-1000 ${
                  cpuLoad > 80
                    ? "bg-rose-500"
                    : cpuLoad > 50
                    ? "bg-amber-500"
                    : "bg-[#3B82F6]"
                }`}
                style={{ width: `${cpuLoad}%` }}
              />
            </div>
          </div>

          {/* RAM usage bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-neutral-500 uppercase tracking-widest font-mono">
                RSS MEMORY
              </span>
              <span className="text-neutral-300 font-mono">
                {stats.memory || "0MB"}
              </span>
            </div>
            <div className="w-full bg-[#040406] h-1.5 rounded-full overflow-hidden border border-neutral-900">
              <div
                className="bg-[#3B82F6] h-full transition-all duration-1000"
                style={{
                  width: `${Math.min(
                    ((parseFloat(stats.memory as string) || 0) / 512) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-800/60 space-y-2 text-xs font-medium">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">System Uptime</span>
              <span className="text-neutral-300 font-mono font-bold">
                {stats.uptime || "Online"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Active Compiles</span>
              <span className="text-[#3B82F6] font-mono font-bold">
                {activeJobsCount} jobs in queue
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">DB Host Status</span>
              <span
                className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold font-mono ${
                  dbStatus === "Healthy"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {dbStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">DB IO Latency</span>
              <span className="text-blue-400 font-mono font-bold">
                {stats.dbLatencyMs || 0}ms
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPulse;
