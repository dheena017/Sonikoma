import React from "react";
import { Layers, CheckCircle2, Zap, Clock } from "lucide-react";
import { DashboardStatsSkeleton } from "@/shared/ui/loading";
import type { DashboardStatsMetrics } from "../types";

export interface DashboardStatsProps {
  stats: DashboardStatsMetrics;
  loading?: boolean;
}

export default function DashboardStats({
  stats,
  loading = false,
}: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <DashboardStatsSkeleton count={4} />
      </div>
    );
  }

  const {
    projectsCount,
    completedCount,
    totalPanels,
    estimatedRuntimeMinutes,
    healthPercentage,
  } = stats;

  const metricCards = [
    {
      id: "series",
      label: `Total Series (${completedCount} Done)`,
      value: projectsCount,
      icon: Layers,
      color: "text-[#3B82F6]",
      bg: "bg-[#3B82F6]/10 border-[#3B82F6]/25",
    },
    {
      id: "panels",
      label: "Panels Sliced",
      value: totalPanels.toLocaleString(),
      icon: Zap,
      color: "text-[#F59E0B]",
      bg: "bg-[#F59E0B]/10 border-[#F59E0B]/25",
    },
    {
      id: "runtime",
      label: "Reel Duration",
      value: `~${estimatedRuntimeMinutes}m`,
      icon: Clock,
      color: "text-[#10B981]",
      bg: "bg-[#10B981]/10 border-[#10B981]/25",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
      {/* 1-3. Standard Metric Summary Cards */}
      {metricCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-neutral-700 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group"
          >
            <div
              className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-3xl font-black text-[#E5E5E5] font-mono leading-none tracking-tight">
                {card.value}
              </div>
              <div className="text-[10px] sm:text-xs text-[#9CA3AF] font-mono tracking-wide mt-1 sm:mt-1.5 truncate">
                {card.label}
              </div>
            </div>
          </div>
        );
      })}

      {/* 4. Production Health Progress Card */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] shadow-md flex items-center gap-3 sm:gap-4 hover:border-neutral-700 hover:bg-[#252525] hover:-translate-y-1 hover:shadow-xl transition-all duration-200 group">
        <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-mono text-[#9CA3AF] mb-1.5">
            <span>Health</span>
            <span className="font-bold text-[#E5E5E5] font-mono">
              {healthPercentage}%
            </span>
          </div>
          <div className="w-full bg-[#121212] rounded-full h-2 overflow-hidden border border-[#2F2F2F]">
            <div
              className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
              style={{ width: `${healthPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
