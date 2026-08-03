import React from "react";
import { LucideIcon } from "lucide-react";

export interface CreativeSuiteDashboardStat {
  label: string;
  value: string;
  desc: string;
  icon: LucideIcon;
  color: string;
}

interface CreativeSuiteDashboardStatsProps {
  stats: CreativeSuiteDashboardStat[];
}

const CreativeSuiteDashboardStats: React.FC<CreativeSuiteDashboardStatsProps> = ({
  stats,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-[#0c0a15] border border-[#1f1b2e] rounded-2xl p-5 hover:border-purple-500/40 transition-all duration-300 shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl border ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-neutral-500 font-mono">
                Telemetry
              </span>
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-[10px] font-bold text-neutral-400 font-mono uppercase tracking-wide mt-1">
              {stat.label}
            </div>
            <p className="text-[10px] text-neutral-500 font-medium mt-0.5">
              {stat.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default CreativeSuiteDashboardStats;
