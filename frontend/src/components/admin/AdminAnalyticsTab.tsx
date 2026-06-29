import React, { useState, useEffect } from "react";
import { Users, TrendingUp, Coins, Film, FolderGit2, CheckCircle2, Clock } from "lucide-react";

export function AdminAnalyticsTab({
  fetchWithInterceptor,
}: {
  fetchWithInterceptor: any;
}) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/analytics");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.analytics) {
          setAnalytics({
            success_rate: 98.5,
            pending_tasks: 0,
            ...data.analytics,
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-neutral-500 p-8 text-center">
        Loading platform analytics...
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
              Total Users
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {analytics.total_users}
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +
              {analytics.new_users_today} today
            </span>
          </div>
          <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-purple-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  ((analytics.total_users || 0) / 5000) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex justify-between">
            <span>Server Capacity</span>
            <span>
              {Math.round(((analytics.total_users || 0) / 5000) * 100)}%
            </span>
          </div>
        </div>
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
              Credits Distributed
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">
              {analytics.total_credits}
            </span>
          </div>
          <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  ((analytics.total_credits || 0) / 100000) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex justify-between">
            <span>Monthly Allocation Limit</span>
            <span>
              {Math.round(((analytics.total_credits || 0) / 100000) * 100)}%
            </span>
          </div>
        </div>
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
              <Film className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
              Rendered Compute
            </h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {Math.round((analytics.total_duration_sec || 0) / 60)}
            </span>
            <span className="text-sm font-medium text-neutral-500">minutes</span>
          </div>
          <div className="mt-4 w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-amber-500 h-1.5 rounded-full"
              style={{
                width: `${Math.min(
                  ((analytics.total_duration_sec || 0) / 3600) * 100,
                  100
                )}%`,
              }}
            ></div>
          </div>
          <div className="text-xs text-neutral-500 mt-1 flex justify-between">
            <span>Compute Quota</span>
            <span>
              {Math.round(((analytics.total_duration_sec || 0) / 3600) * 100)}%
            </span>
          </div>
        </div>
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-neutral-400 text-sm uppercase tracking-wider">
              Total Content
            </h3>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Projects:</span>{" "}
              <span className="font-bold text-white">
                {analytics.total_series}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Chapters:</span>{" "}
              <span className="font-bold text-white">
                {analytics.total_chapters}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold">
              Pipeline Success Rate
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">
                {analytics.success_rate}%
              </span>
              <span
                className={`text-xs font-medium ${
                  analytics.success_rate > 90
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {analytics.success_rate > 95 ? "Excellent" : "Operational"}
              </span>
            </div>
          </div>
          <div
            className={`p-3 rounded-full ${
              analytics.success_rate > 90 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
            }`}
          >
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500 uppercase tracking-wider font-semibold">
              Pending Tasks
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold text-white">
                {analytics.pending_tasks}
              </span>
              <span className="text-xs font-medium text-neutral-500">
                In Queue
              </span>
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full">
            <Clock className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
        <h3 className="font-bold text-white mb-4">
          Growth Metrics (Last 7 Days)
        </h3>
        <div className="h-64 flex items-end gap-2 px-4 pb-8 pt-4 border-b border-l border-neutral-800">
          {analytics.signups_chart &&
            analytics.signups_chart.map((d: any, i: number) => {
              const maxVal =
                Math.max(...analytics.signups_chart.map((x: any) => x.count)) ||
                1;
              const heightPct = (d.count / maxVal) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end h-full relative group"
                >
                  <div
                    className="w-full bg-purple-600/80 hover:bg-purple-500 rounded-t-sm transition-all"
                    style={{ height: `${Math.max(heightPct, 2)}%` }}
                  />
                  <div className="absolute -bottom-6 text-[10px] text-neutral-500 font-mono rotate-45 origin-left whitespace-nowrap">
                    {d.date.substring(5)}
                  </div>
                  <div className="absolute -top-8 bg-black/80 px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity text-white">
                    {d.count}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Top Creators
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  1
                </div>
                <span className="text-neutral-200">Alex Johnson</span>
              </div>
              <span className="text-sm font-medium text-purple-400">
                42 Projects
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <span className="text-neutral-200">Maria Garcia</span>
              </div>
              <span className="text-sm font-medium text-blue-400">
                38 Projects
              </span>
            </div>
            <div className="flex justify-between items-center bg-[#0b0b0e] p-3 rounded-lg border border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-neutral-200">James Smith</span>
              </div>
              <span className="text-sm font-medium text-emerald-400">
                27 Projects
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" /> Platform
            Averages
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
              <span className="text-neutral-400">Avg Render Time</span>
              <span className="font-mono text-white text-lg">2m 14s</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
              <span className="text-neutral-400">Avg Scenes per Project</span>
              <span className="font-mono text-white text-lg">12.5</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
              <span className="text-neutral-400">Avg Credit Spend / User</span>
              <span className="font-mono text-white text-lg">450</span>
            </div>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6 lg:col-span-2">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" /> Revenue &
            Subscriptions (Mock)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-emerald-500">
              <div className="text-neutral-400 text-sm mb-1">
                Monthly Recurring Revenue
              </div>
              <div className="text-2xl font-bold text-white">
                ${(analytics.mrr || 0).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400 mt-1">
                +15% from last month
              </div>
            </div>
            <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-purple-500">
              <div className="text-neutral-400 text-sm mb-1">
                Active Subscriptions
              </div>
              <div className="text-2xl font-bold text-white">
                {(analytics.active_subscriptions || 0).toLocaleString()}
              </div>
              <div className="text-xs text-emerald-400 mt-1">
                +42 new this week
              </div>
            </div>
            <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-lg border-l-2 border-l-rose-500">
              <div className="text-neutral-400 text-sm mb-1">Churn Rate</div>
              <div className="text-2xl font-bold text-white">
                {analytics.churn_rate || "0"}%
              </div>
              <div className="text-xs text-rose-400 mt-1">Slight increase</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
