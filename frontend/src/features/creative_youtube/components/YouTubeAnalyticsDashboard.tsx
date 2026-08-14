import React, { useEffect, useState } from "react";
import {
  Users,
  Eye,
  Video,
  TrendingUp,
  Zap,
  BarChart3,
  Trophy,
  RefreshCw,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import UploadHistory from "./UploadHistory";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  view_count: string;
  like_count: string;
  comment_count: string;
  privacy_status: string;
  youtube_url: string;
  published_at?: string;
}

interface ChannelStats {
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
  title?: string;
  custom_url?: string;
}

interface QuotaTelemetry {
  daily_limit?: number;
  used_today?: number;
  remaining?: number;
  health_status?: string;
}

interface UploadHistoryItem {
  id: number;
  youtube_url: string;
  title: string;
  privacy_status: string;
  published_at: string;
}

interface YouTubeAnalyticsDashboardProps {
  uploadHistory?: UploadHistoryItem[];
}

const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div className={`p-4 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl flex items-center gap-3`}>
    <div className={`p-2.5 rounded-xl border ${color} shrink-0`}>{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-black text-white truncate">{value}</p>
    </div>
  </div>
);

export default function YouTubeAnalyticsDashboard({ uploadHistory = [] }: YouTubeAnalyticsDashboardProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [quota, setQuota] = useState<QuotaTelemetry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [videosRes, channelRes, quotaRes] = await Promise.all([
        fetch("/api/export/youtube/videos?max_results=50", { headers }),
        fetch("/api/export/youtube/channel/details", { headers }),
        fetch("/api/export/youtube/quota", { headers }),
      ]);

      if (videosRes.ok) {
        const d = await videosRes.json();
        setVideos(d.videos || []);
      }
      if (channelRes.ok) {
        setChannel(await channelRes.json());
      }
      if (quotaRes.ok) {
        setQuota(await quotaRes.json());
      }
    } catch (e) {
      console.warn("Analytics load error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Top 5 videos by view count
  const topVideos = [...videos]
    .sort((a, b) => {
      const av = parseInt(a.view_count?.replace(/,/g, "") || "0");
      const bv = parseInt(b.view_count?.replace(/,/g, "") || "0");
      return bv - av;
    })
    .slice(0, 5);

  // Quota health
  const quotaUsedPct =
    quota && quota.daily_limit
      ? Math.round(((quota.used_today || 0) / quota.daily_limit) * 100)
      : 0;
  const quotaColor =
    quotaUsedPct > 80 ? "text-red-400" : quotaUsedPct > 50 ? "text-amber-400" : "text-emerald-400";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">Channel Intelligence</p>
          <h2 className="text-base font-black text-white mt-0.5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            Analytics Dashboard
          </h2>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Loading analytics…</p>
        </div>
      ) : (
        <>
          {/* Channel KPI Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="w-4 h-4 text-red-400" />}
              label="Subscribers"
              value={channel?.subscriber_count || "--"}
              color="bg-red-950/50 border-red-900/40"
            />
            <StatCard
              icon={<Eye className="w-4 h-4 text-sky-400" />}
              label="Total Views"
              value={channel?.view_count || "--"}
              color="bg-sky-950/50 border-sky-900/40"
            />
            <StatCard
              icon={<Video className="w-4 h-4 text-purple-400" />}
              label="Videos"
              value={channel?.video_count || videos.length}
              color="bg-purple-950/50 border-purple-900/40"
            />
            <StatCard
              icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
              label="Avg Views"
              value={
                videos.length > 0
                  ? Math.round(
                      videos.reduce((acc, v) => acc + parseInt(v.view_count?.replace(/,/g, "") || "0"), 0) /
                        videos.length
                    ).toLocaleString()
                  : "--"
              }
              color="bg-emerald-950/50 border-emerald-900/40"
            />
          </div>

          {/* Top Videos Leaderboard + Quota Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Leaderboard */}
            <div className="lg:col-span-3 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">Top Performing Videos</h3>
              </div>

              {topVideos.length === 0 ? (
                <p className="text-xs text-neutral-500 font-mono text-center py-6">No video data available</p>
              ) : (
                <div className="space-y-2.5">
                  {topVideos.map((vid, idx) => {
                    const viewN = parseInt(vid.view_count?.replace(/,/g, "") || "0");
                    const maxViews = parseInt(topVideos[0]?.view_count?.replace(/,/g, "") || "1");
                    const barPct = maxViews > 0 ? (viewN / maxViews) * 100 : 0;
                    return (
                      <a
                        key={vid.id}
                        href={vid.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-neutral-950/80 border border-neutral-800/60 rounded-xl hover:border-amber-900/40 transition-all group"
                      >
                        <span className="text-[11px] font-black font-mono text-neutral-500 w-4 shrink-0">
                          {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                        </span>
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-12 h-8 object-cover rounded-lg shrink-0 border border-neutral-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-neutral-200 truncate group-hover:text-amber-300 transition-colors">
                            {vid.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                                style={{ width: `${barPct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap shrink-0">
                              {vid.view_count} views
                            </span>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quota + Right Column */}
            <div className="lg:col-span-2 space-y-3">
              {/* API Quota Card */}
              <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">API Quota</h3>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Daily Limit</span>
                    <span className="text-neutral-200 font-bold">{quota?.daily_limit?.toLocaleString() || "10,000"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Used Today</span>
                    <span className={`font-bold ${quotaColor}`}>{quota?.used_today || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Remaining</span>
                    <span className="text-neutral-200 font-bold">
                      {((quota?.daily_limit || 10000) - (quota?.used_today || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Quota bar */}
                <div className="pt-1">
                  <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        quotaUsedPct > 80
                          ? "bg-gradient-to-r from-red-600 to-red-400"
                          : quotaUsedPct > 50
                          ? "bg-gradient-to-r from-amber-600 to-amber-400"
                          : "bg-gradient-to-r from-emerald-700 to-emerald-400"
                      }`}
                      style={{ width: `${Math.max(quotaUsedPct, 2)}%` }}
                    />
                  </div>
                  <p className={`text-[10px] font-mono mt-1 ${quotaColor}`}>
                    {quotaUsedPct}% used · {quota?.health_status || "Healthy"}
                  </p>
                </div>

                {quotaUsedPct > 80 && (
                  <div className="flex items-start gap-2 p-2.5 bg-red-950/40 border border-red-900/40 rounded-xl">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-mono text-red-300 leading-relaxed">
                      Quota nearly exhausted. API calls will be rate-limited. Wait for midnight PST reset.
                    </p>
                  </div>
                )}
              </div>

              {/* Video Privacy Breakdown */}
              {videos.length > 0 && (
                <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">Privacy Breakdown</h3>
                  {["public", "unlisted", "private"].map((p) => {
                    const count = videos.filter((v) => v.privacy_status === p).length;
                    const pct = Math.round((count / videos.length) * 100);
                    const color =
                      p === "public" ? "bg-emerald-600" : p === "unlisted" ? "bg-amber-600" : "bg-neutral-600";
                    const textColor =
                      p === "public" ? "text-emerald-400" : p === "unlisted" ? "text-amber-400" : "text-neutral-400";
                    return (
                      <div key={p} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className={`capitalize font-bold ${textColor}`}>{p}</span>
                          <span className="text-neutral-400">{count} videos · {pct}%</span>
                        </div>
                        <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${color} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Upload History */}
          <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5">
            <UploadHistory history={uploadHistory} />
          </div>
        </>
      )}
    </div>
  );
}
