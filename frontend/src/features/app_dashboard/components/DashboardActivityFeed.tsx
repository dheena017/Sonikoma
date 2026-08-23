import React, { useState, useMemo } from "react";
import {
  Activity,
  Layers,
  Sparkles,
  Volume2,
  Film,
  Download,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Project } from "@/features/app_dashboard/hooks/useDashboardPage";

interface ActivityItem {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "scrape" | "panel" | "voice" | "render" | "general";
  projectId?: string;
  coverImage?: string;
  badge?: string;
  badgeColor?: string;
}

interface DashboardActivityFeedProps {
  analytics?: { activities?: any[] } | null;
  projects?: Project[];
}

export default function DashboardActivityFeed({
  analytics,
  projects = [],
}: DashboardActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  // Derive dynamic activity items from real projects & analytics
  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    // 1. Explicit activities from analytics
    if (analytics?.activities && Array.isArray(analytics.activities)) {
      analytics.activities.forEach((act, idx) => {
        items.push({
          id: `analytics-${idx}`,
          title: act.title || "Project Update",
          desc: act.desc || act.description || "",
          time: act.time || "Recently",
          type: act.type || "general",
          badge: act.badge || "Live",
          badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        });
      });
    }

    // 2. Synthesize activities from user's actual projects
    projects.forEach((proj) => {
      const pTitle = proj.title || "Untitled Project";
      const createdDate = proj.created_at ? new Date(proj.created_at) : null;
      const timeStr = createdDate && !isNaN(createdDate.getTime())
        ? createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "Recent";

      // A. Panel Import / Scrape Activity
      const importedCount = proj.imported_assets_count || proj.panels_count || 0;
      if (importedCount > 0) {
        items.push({
          id: `scrape-${proj.project_id}`,
          title: `${pTitle}`,
          desc: `Imported and indexed ${importedCount} panels into the asset deck.`,
          time: timeStr,
          type: "scrape",
          projectId: proj.project_id,
          coverImage: proj.cover_image,
          badge: `${importedCount} Panels`,
          badgeColor: "text-purple-300 bg-purple-500/15 border-purple-500/30",
        });
      }

      // B. Storyboard / Panel Segmentation Activity
      if (proj.panels_count > 0) {
        items.push({
          id: `panel-${proj.project_id}`,
          title: `${pTitle} · Panel Segmentation`,
          desc: `Cleaned speech bubbles and configured 2.5D camera motions.`,
          time: timeStr,
          type: "panel",
          projectId: proj.project_id,
          coverImage: proj.cover_image,
          badge: "Storyboard Ready",
          badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        });
      }

      // C. Video Render / Complete Activity
      if (proj.status?.toLowerCase() === "completed" || proj.status?.toLowerCase() === "ready") {
        items.push({
          id: `render-${proj.project_id}`,
          title: `${pTitle} · Final Reel Rendered`,
          desc: `High-definition anime video composition exported.`,
          time: timeStr,
          type: "render",
          projectId: proj.project_id,
          coverImage: proj.cover_image,
          badge: "Completed",
          badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        });
      }
    });

    return items;
  }, [projects, analytics]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    if (activeFilter === "all") return activities;
    return activities.filter((act) => act.type === activeFilter);
  }, [activities, activeFilter]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "scrape":
        return <Download className="w-4 h-4 text-purple-400" />;
      case "panel":
        return <Layers className="w-4 h-4 text-amber-400" />;
      case "voice":
        return <Volume2 className="w-4 h-4 text-pink-400" />;
      case "render":
        return <Film className="w-4 h-4 text-emerald-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getActivityIconBg = (type: string) => {
    switch (type) {
      case "scrape":
        return "bg-purple-500/10 border-purple-500/20";
      case "panel":
        return "bg-amber-500/10 border-amber-500/20";
      case "voice":
        return "bg-pink-500/10 border-pink-500/20";
      case "render":
        return "bg-emerald-500/10 border-emerald-500/20";
      default:
        return "bg-indigo-500/10 border-indigo-500/20";
    }
  };

  return (
    <div className="bg-[#0e0f19]/90 border border-white/[0.08] hover:border-purple-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              Recent Activity
            </h2>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">
              Real-time pipeline timeline &amp; production events
            </p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 p-1.5 bg-[#090a12]/80 border border-white/[0.08] rounded-2xl self-start sm:self-auto overflow-x-auto max-w-full">
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
                  ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
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
              className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#131524]/60 border border-white/[0.06] hover:border-purple-500/40 hover:bg-[#1a1c30]/80 transition-all group cursor-pointer shadow-sm"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                {/* Thumbnail or Category Icon */}
                {act.coverImage ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#090910] border border-white/10 shrink-0 relative shadow-md group-hover:scale-105 transition-transform">
                    <img
                      src={
                        act.coverImage.startsWith("http")
                          ? `/api/proxy-image?url=${encodeURIComponent(act.coverImage)}`
                          : act.coverImage
                      }
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 group-hover:scale-105 transition-transform ${getActivityIconBg(
                      act.type
                    )}`}
                  >
                    {getActivityIcon(act.type)}
                  </div>
                )}

                {/* Event Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="text-xs sm:text-sm font-extrabold text-white truncate group-hover:text-purple-300 transition-colors">
                      {act.title}
                    </h4>
                    {act.badge && (
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          act.badgeColor || "text-neutral-400 bg-neutral-800 border-neutral-700"
                        }`}
                      >
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed truncate">
                    {act.desc}
                  </p>
                </div>
              </div>

              {/* Timestamp & Open Indicator */}
              <div className="flex items-center gap-2 shrink-0 self-center">
                <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-neutral-600" />
                  {act.time}
                </span>
                {act.projectId && (
                  <div className="p-1.5 rounded-lg bg-neutral-800/80 group-hover:bg-purple-600 text-neutral-400 group-hover:text-white transition-all">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center bg-white/[0.01] rounded-2xl border border-white/5">
            <p className="text-xs text-neutral-500 font-mono">
              No events found for this filter category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
