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

const CreativeSuiteDashboardStats: React.FC<
  CreativeSuiteDashboardStatsProps
> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 hover:border-[#3B82F6]/50 hover:bg-[#242424] transition-all duration-200 shadow-md group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl border ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-[#6B7280] font-mono font-bold tracking-wider uppercase">
                Telemetry
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#E5E5E5] font-mono tracking-tight">{stat.value}</div>
            <div className="text-[10px] font-bold text-[#9CA3AF] font-mono uppercase tracking-wider mt-1">
              {stat.label}
            </div>
            <p className="text-[10px] text-[#6B7280] font-medium mt-0.5 font-sans">
              {stat.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default CreativeSuiteDashboardStats;
