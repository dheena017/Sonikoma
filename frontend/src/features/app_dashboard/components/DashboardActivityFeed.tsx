import React from "react";
import { Activity, FileText } from "lucide-react";

interface ActivityItem {
  title: string;
  desc: string;
  time: string;
}

interface DashboardActivityFeedProps {
  analytics: { activities?: ActivityItem[] } | null;
}

export default function DashboardActivityFeed({
  analytics,
}: DashboardActivityFeedProps) {
  return (
    <div className="bg-gradient-to-br from-[#0c0c14] via-[#10101c] to-[#141424] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-white flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Activity className="h-4 w-4" />
          </div>
          Recent Activity
        </h2>
        <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider">Live Stream</span>
      </div>

      <div className="space-y-3">
        {analytics?.activities && analytics.activities.length > 0 ? (
          analytics.activities.map((act, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 hover:bg-black/60 transition-all group"
            >
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white mb-0.5 truncate group-hover:text-purple-300 transition-colors">
                  {act.title}
                </h4>
                <p className="text-[11px] text-neutral-400 mb-1 leading-relaxed">{act.desc}</p>
                <p className="text-[9px] text-neutral-500 font-mono">
                  {act.time}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center bg-black/20 rounded-2xl border border-white/5">
            <p className="text-xs text-neutral-500 font-mono">
              No recent production activity. Start a new series to begin!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
