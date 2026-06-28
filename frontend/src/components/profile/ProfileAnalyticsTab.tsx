import React from "react";
import * as api from "../../api/index.js";
import {
  Activity,
  Film,
  Clock,
  Zap,
  Sparkles,
  TrendingUp,
  Volume2,
  Tv,
  MessageSquare,
} from "lucide-react";

export default function ProfileAnalyticsTab() {
  const [analytics, setAnalytics] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    if (!token) return;

    api
      .getCreatorAnalytics(token)
      .then((data) => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    if (m > 0) {
      return `${m}m ${s}s`;
    }
    return `${s}s`;
  };

  const heatmapData = React.useMemo(() => {
    if (analytics?.heatmap) return analytics.heatmap;
    return [];
  }, [analytics]);

  const totalActions = React.useMemo(() => {
    return heatmapData
      .flat()
      .reduce((sum: number, cell: any) => sum + cell.count, 0);
  }, [heatmapData]);

  const videosCompleted = analytics?.videos_completed ?? 0;
  const totalDurationStr = formatDuration(analytics?.total_duration_sec ?? 0);
  const avgLatency = analytics?.avg_latency ?? 0;
  const creditsOptimized = analytics?.credits_optimized_pct ?? 0;

  const verticalPct = analytics?.formats?.vertical_pct ?? 0;
  const widescreenPct = analytics?.formats?.widescreen_pct ?? 0;

  const matthewPct = analytics?.voices?.Matthew ?? 0;
  const rachelPct = analytics?.voices?.Rachel ?? 0;
  const marcusPct = analytics?.voices?.Marcus ?? 0;

  const badgesPct = analytics?.narrations?.["Storyteller Badges"] ?? 0;
  const subtitlesPct = analytics?.narrations?.["Snappy Subtitles"] ?? 0;

  const activities = analytics?.activities ?? [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Overview Analytics Banner */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-full">
            Performance Insights
          </span>
          <h3 className="text-xl font-black text-white">Creator Analytics</h3>
          <p className="text-xs text-neutral-500 font-semibold leading-relaxed">
            Monitor compilation rendering loads, Smart synthesis distribution,
            and weekly content pipelines.
          </p>
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 shadow-2xl relative space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="space-y-0.5">
            <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4.5 h-4.5 text-purple-400" /> Rendering
              Activity
            </h4>
            <p className="text-[10px] text-neutral-500 font-semibold">
              Daily pipeline operations completed over the last 12 weeks
            </p>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-neutral-500 uppercase block font-mono">
              Total Operations
            </span>
            <span className="text-sm font-black text-purple-400 font-mono">
              {totalActions} actions
            </span>
          </div>
        </div>

        {/* Heatmap Grid Wrapper */}
        <div className="flex flex-col space-y-2 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex gap-3 min-w-[360px]">
            {/* Day Labels Column */}
            <div className="grid grid-rows-7 gap-1 text-[9px] font-bold text-neutral-500 pr-1 select-none font-mono">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Weeks Column Grid */}
            <div className="flex gap-1.5 flex-1 justify-between">
              {heatmapData.map((week, wIdx) => (
                <div key={wIdx} className="grid grid-rows-7 gap-1 flex-1">
                  {week.map((cell, dIdx) => (
                    <div
                      key={dIdx}
                      className={`w-full aspect-square min-w-[12px] max-w-[16px] rounded-sm transition-colors cursor-pointer ${
                        cell.level === 0
                          ? "bg-neutral-900 border border-white/5"
                          : cell.level === 1
                          ? "bg-purple-900/30 border border-purple-500/10 hover:bg-purple-800/40"
                          : cell.level === 2
                          ? "bg-purple-600/50 border border-purple-500/20 hover:bg-purple-500/60"
                          : "bg-purple-500 border border-purple-400/30 hover:bg-purple-400"
                      }`}
                      title={`${cell.count} operation(s) on ${cell.day} (Week ${
                        wIdx + 1
                      })`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 text-[9px] text-neutral-500 font-bold pr-2 pt-1 font-mono">
            <span>Less</span>
            <div className="w-2.5 h-2.5 bg-neutral-900 border border-white/5 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-900/30 border border-purple-500/10 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-600/50 border border-purple-500/20 rounded-sm" />
            <div className="w-2.5 h-2.5 bg-purple-500 border border-purple-400/30 rounded-sm" />
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Videos Completed */}
        <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-center">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-neutral-500 block uppercase font-mono tracking-wider">
              Videos Completed
            </span>
            <span className="text-base font-black text-white font-mono">
              {videosCompleted} {videosCompleted === 1 ? "release" : "releases"}
            </span>
          </div>
        </div>

        {/* Video Duration */}
        <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-center">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-neutral-500 block uppercase font-mono tracking-wider">
              Render Duration
            </span>
            <span className="text-base font-black text-white font-mono">
              {totalDurationStr}
            </span>
          </div>
        </div>

        {/* Sync Latency */}
        <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-center">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-neutral-500 block uppercase font-mono tracking-wider">
              Average Latency
            </span>
            <span className="text-base font-black text-white font-mono">
              {avgLatency}s/frame
            </span>
          </div>
        </div>

        {/* Optimization Credits */}
        <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-4 flex gap-3.5 items-center">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[8px] text-neutral-500 block uppercase font-mono tracking-wider">
              Credits Optimized
            </span>
            <span className="text-base font-black text-white font-mono">
              {creditsOptimized}% saved
            </span>
          </div>
        </div>
      </div>

      {/* Usage breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Aspect Ratio Breakdown */}
        <div className="bg-[#0f0f13]/30 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Tv className="w-4 h-4 text-purple-400" /> Output Formats
          </h5>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Vertical Shorts (9:16)</span>
                <span className="text-white font-bold">{verticalPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${verticalPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Widescreen YT (16:9)</span>
                <span className="text-white font-bold">{widescreenPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${widescreenPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Voice Actor Preferences */}
        <div className="bg-[#0f0f13]/30 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-purple-400" /> Smart Voices
            Preference
          </h5>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Matthew (Narrator)</span>
                <span className="text-white font-bold">{matthewPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${matthewPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Rachel (Storyteller)</span>
                <span className="text-white font-bold">{rachelPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${rachelPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Marcus (Cyberpunk)</span>
                <span className="text-white font-bold">{marcusPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-900/60 rounded-full"
                  style={{ width: `${marcusPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Narration script type */}
        <div className="bg-[#0f0f13]/30 border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl">
          <h5 className="text-[10px] font-black uppercase text-neutral-400 tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-purple-400" /> Narration Mode
          </h5>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Storyteller Badges</span>
                <span className="text-white font-bold">{badgesPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${badgesPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-400 font-semibold font-mono">
                <span>Snappy Subtitles</span>
                <span className="text-white font-bold">{subtitlesPct}%</span>
              </div>
              <div className="h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${subtitlesPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline Feed */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-6 shadow-2xl relative space-y-4">
        <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 pb-3 border-b border-white/5">
          <Activity className="w-4.5 h-4.5 text-purple-400" /> Recent Activity
          Feed
        </h4>

        <div className="relative pl-4 space-y-6 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-neutral-800">
          {activities.map((act, idx) => (
            <div key={idx} className="relative space-y-1 text-left">
              {/* Bullet point */}
              <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-neutral-950" />
              <div className="flex justify-between items-baseline">
                <h6 className="text-xs font-bold text-neutral-200">
                  {act.title}
                </h6>
                <span className="text-[9px] text-neutral-500 font-mono">
                  {act.time}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 font-medium leading-relaxed">
                {act.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
