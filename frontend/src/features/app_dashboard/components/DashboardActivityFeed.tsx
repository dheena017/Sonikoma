import React, { useState, useMemo } from "react";
import { formatDetailedTime, parseUtcDate } from "@/utils/dateUtils";
import {
  Activity,
  ArrowUpRight,
  Clock,
} from "lucide-react";

interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  rawTime?: any;
  type: "scrape" | "panel" | "voice" | "render" | "general";
  projectId?: string;
  coverImage?: string;
  badge?: string;
  badgeColor?: string;
}

interface DashboardActivityFeedProps {
  analytics?: { activities?: any[] } | null;
}

export default function DashboardActivityFeed({
  analytics,
}: DashboardActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Derive dynamic activity items from real analytics only
  const activities: ActivityItem[] = useMemo(() => {
    const items: (ActivityItem & { rawTimeVal?: number })[] = [];

    // Only use explicit activities from the analytics API — no synthesized/fake items
    if (analytics?.activities && Array.isArray(analytics.activities)) {
      analytics.activities.forEach((act, idx) => {
        const rawT = act.timestamp || act.created_at || act.time;
        const parsedD = parseUtcDate(rawT);
        const timeDisplay = formatDetailedTime(rawT);
        items.push({
          id: `analytics-${idx}-${act.title || ""}`,
          title: act.title || "Project Update",
          desc: act.desc || act.description || "",
          time: timeDisplay,
          rawTime: rawT,
          rawTimeVal: parsedD ? parsedD.getTime() : 0,
          type: act.type || "general",
          badge: act.badge || "Live",
          badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        });
      });
    }

    // Sort descending: newest activity at the top
    items.sort((a, b) => (b.rawTimeVal || 0) - (a.rawTimeVal || 0));

    return items;
  }, [analytics]);


  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activeFilter === "all") return activities;
    return activities.filter((act) => act.type === activeFilter);
  }, [activities, activeFilter]);

  return (
    <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-7 shadow-2xl transition-all duration-300">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#121212] text-[#3B82F6] border border-[#2F2F2F] shadow-inner">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#E5E5E5] flex items-center gap-2">
              Recent Activity
            </h2>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Real-time pipeline timeline &amp; production events
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#121212] border border-[#2F2F2F] rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
          {[
            { id: "all", label: "All" },
            { id: "scrape", label: "Scraped" },
            { id: "panel", label: "Panels" },
            { id: "render", label: "Renders" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                  : "text-[#9CA3AF] hover:text-white hover:bg-[#262626] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-3">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => {
                if (act.projectId && (window as any).navigateTo) {
                  (window as any).navigateTo(
                    `/scraper/editor?project_id=${encodeURIComponent(act.projectId)}`
                  );
                }
              }}
              className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#262626] hover:-translate-y-0.5 transition-all group cursor-pointer shadow-sm"
            >
              {/* Event Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#E5E5E5] truncate group-hover:text-[#3B82F6] transition-colors">
                    {act.title}
                  </h4>
                  {act.badge && (
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        act.badgeColor || "text-[#9CA3AF] bg-[#121212] border-[#2F2F2F]"
                      }`}
                    >
                      {act.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed truncate">
                  {act.desc}
                </p>
              </div>

              {/* Timestamp & Open Indicator */}
              <div className="flex items-center gap-2 shrink-0 self-center">
                <span className="text-[10px] font-mono text-[#6B7280] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#6B7280]" />
                  {act.time}
                </span>
                {act.projectId && (
                  <div className="p-1.5 rounded-lg bg-[#121212] border border-[#2F2F2F] group-hover:border-[#3B82F6] group-hover:bg-[#3B82F6] text-[#9CA3AF] group-hover:text-white transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center bg-[#1E1E1E] rounded-2xl border border-[#2F2F2F]">
            <p className="text-xs text-[#9CA3AF] font-mono">
              No events found for this filter category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
