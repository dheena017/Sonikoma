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

export default function DashboardActivityFeed({ analytics }: DashboardActivityFeedProps) {
  return (
    <div className="bg-[#0b0b0e]/80 border border-white/5 rounded-3xl p-6 shadow-xl">
      <h2 className="text-xl font-bold flex items-center gap-2 mb-6">
        <Activity className="h-5 w-5 text-emerald-400" />
        Recent Activity
      </h2>

      <div className="space-y-4">
        {analytics?.activities?.length > 0 ? (
          analytics.activities.map((act, idx) => (
            <div
              key={idx}
              className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-neutral-900 flex items-center justify-center shrink-0 border border-white/5">
                <FileText className="h-5 w-5 text-neutral-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{act.title}</h4>
                <p className="text-xs text-neutral-500 mb-1">{act.desc}</p>
                <p className="text-[10px] text-neutral-600 font-mono">{act.time}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <p className="text-sm text-neutral-500">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
