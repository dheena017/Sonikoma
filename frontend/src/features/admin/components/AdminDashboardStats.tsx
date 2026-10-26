import React from "react";
import {
  Users,
  FolderGit2,
  DollarSign,
  Activity,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { DashboardStatsSkeleton } from "@/shared/ui/loading";
import { AdminBackendStats } from "../types";

export interface AdminDashboardStatsProps {
  stats: Partial<AdminBackendStats>;
  analytics?: any;
  loading: boolean;
}

export const AdminDashboardStats: React.FC<AdminDashboardStatsProps> = ({
  stats,
  analytics,
  loading,
}) => {
  if (loading) {
    return <DashboardStatsSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Creators */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-all shadow-sm text-left">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Users className="w-16 h-16 text-[#3B82F6]" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
            <Users className="w-4 h-4" />
          </div>
          <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
            Total Creators
          </h3>
        </div>
        <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
          {stats.users?.toLocaleString() || "0"}
        </div>
        <p className="text-[10px] text-[#3B82F6] font-bold flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Active platform subscription tier</span>
        </p>
      </div>

      {/* Total Projects */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-all shadow-sm text-left">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <FolderGit2 className="w-16 h-16 text-[#3B82F6]" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
            <FolderGit2 className="w-4 h-4" />
          </div>
          <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
            Total Projects
          </h3>
        </div>
        <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
          {stats.projects?.toLocaleString() || "0"}
        </div>
        <p className="text-[10px] text-[#10B981] font-bold flex items-center gap-1 font-mono">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Storyboards compiled</span>
        </p>
      </div>

      {/* Revenue MRR */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-[#10B981]/50 transition-all shadow-sm text-left">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <DollarSign className="w-16 h-16 text-[#10B981]" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#10B981]/10 rounded-xl text-[#10B981] border border-[#10B981]/20">
            <DollarSign className="w-4 h-4" />
          </div>
          <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
            Revenue MRR
          </h3>
        </div>
        <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
          ${(analytics?.mrr || 0).toLocaleString()}
        </div>
        <p className="text-[10px] text-[#10B981] font-bold flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {analytics?.active_subscriptions || 0} active paying plans
          </span>
        </p>
      </div>

      {/* Pipeline Health */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 relative overflow-hidden group hover:border-neutral-700 transition-all shadow-sm text-left">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <Activity className="w-16 h-16 text-[#3B82F6]" />
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-[#1E1E1E] rounded-xl text-[#3B82F6] border border-[#2F2F2F]">
            <Activity className="w-4 h-4" />
          </div>
          <h3 className="text-[#9CA3AF] font-bold text-xs uppercase tracking-wider font-mono">
            Pipeline Health
          </h3>
        </div>
        <div className="text-3xl font-extrabold text-[#E5E5E5] font-mono leading-none mb-2">
          {analytics?.success_rate || 100}%
        </div>
        <p className="text-[10px] text-[#3B82F6] font-bold flex items-center gap-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Process compilation rate</span>
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardStats;
