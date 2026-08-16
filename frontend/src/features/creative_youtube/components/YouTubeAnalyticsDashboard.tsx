import React, { useEffect, useState, useCallback } from "react";
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
  ThumbsUp,
  MessageCircle,
  Globe,
  Lock,
  LinkIcon,
  Play,
  Hash,
  Flame,
  Star,
  Clock,
  ExternalLink,
  CheckCircle2,
  ListMusic,
  TrendingDown,
} from "lucide-react";
import UploadHistory from "./UploadHistory";

// ── Types ───────────────────────────────────────────────────────────────────

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
  duration?: string;
  description?: string;
  tags?: string[];
}

interface ChannelStats {
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
  title?: string;
  custom_url?: string;
  description?: string;
  thumbnail?: string;
  banner_url?: string;
  country?: string;
}

interface QuotaTelemetry {
  daily_limit?: number;
  used_today?: number;
  remaining?: number;
  health_status?: string;
}

interface PlaylistItem {
  id: string;
  title: string;
  item_count?: number;
  thumbnail?: string;
  privacy?: string;
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

// ── Helpers ─────────────────────────────────────────────────────────────────

const parseNum = (s?: string | number): number => {
  if (s == null) return 0;
  return parseInt(String(s).replace(/,/g, "")) || 0;
};

const fmtNum = (n: number): string => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
};

const timeAgo = (iso?: string): string => {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.round(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

// ── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({
  icon,
  label,
  value,
  sub,
  color,
  trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  trend?: "up" | "down" | null;
}) => (
  <div className="relative overflow-hidden p-4 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl flex items-center gap-3 hover:border-neutral-700/80 transition-all duration-200 group">
    <div
      className={`p-2.5 rounded-xl border ${color} shrink-0 transition-transform group-hover:scale-110 duration-200`}
    >
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xl font-black text-white truncate">{value}</p>
      {sub && (
        <p className="text-[10px] font-mono text-neutral-500 mt-0.5 truncate">
          {sub}
        </p>
      )}
    </div>
    {trend && (
      <div
        className={`shrink-0 ${
          trend === "up" ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {trend === "up" ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <TrendingDown className="w-4 h-4" />
        )}
      </div>
    )}
    {/* Subtle gradient glow in corner */}
    <div
      className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-10 ${
        color.includes("red")
          ? "bg-red-500"
          : color.includes("sky")
          ? "bg-sky-500"
          : color.includes("purple")
          ? "bg-purple-500"
          : color.includes("emerald")
          ? "bg-emerald-500"
          : "bg-amber-500"
      }`}
    />
  </div>
);

const MiniBar = ({ pct, color }: { pct: number; color: string }) => (
  <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
    <div
      className={`h-full ${color} rounded-full transition-all duration-700`}
      style={{ width: `${Math.max(pct, 2)}%` }}
    />
  </div>
);

// ── Main Component ──────────────────────────────────────────────────────────

export default function YouTubeAnalyticsDashboard({
  uploadHistory = [],
}: YouTubeAnalyticsDashboardProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channel, setChannel] = useState<ChannelStats | null>(null);
  const [quota, setQuota] = useState<QuotaTelemetry | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "videos" | "playlists" | "engagement"
  >("overview");

  const getHeaders = () => {
    const token =
      localStorage.getItem("sonikoma_token") ||
      localStorage.getItem("token") ||
      "";
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = getHeaders();
      const [videosRes, channelRes, quotaRes, playlistsRes] = await Promise.all(
        [
          fetch("/api/export/youtube/videos?max_results=50", { headers }),
          fetch("/api/export/youtube/channel/details", { headers }),
          fetch("/api/export/youtube/quota", { headers }),
          fetch("/api/export/youtube/playlists", { headers }),
        ]
      );
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
      if (playlistsRes.ok) {
        const d = await playlistsRes.json();
        setPlaylists(d.playlists || []);
      }
    } catch (e) {
      console.warn("Analytics load error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Computed ────────────────────────────────────────────────────────────

  const totalViews = videos.reduce((a, v) => a + parseNum(v.view_count), 0);
  const totalLikes = videos.reduce((a, v) => a + parseNum(v.like_count), 0);
  const totalComments = videos.reduce(
    (a, v) => a + parseNum(v.comment_count),
    0
  );
  const avgViews =
    videos.length > 0 ? Math.round(totalViews / videos.length) : 0;
  const engagementRate =
    totalViews > 0
      ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(2)
      : "0.00";

  const topVideos = [...videos]
    .sort((a, b) => parseNum(b.view_count) - parseNum(a.view_count))
    .slice(0, 10);
  const recentVideos = [...videos]
    .sort(
      (a, b) =>
        new Date(b.published_at || 0).getTime() -
        new Date(a.published_at || 0).getTime()
    )
    .slice(0, 8);
  const mostLiked = [...videos]
    .sort((a, b) => parseNum(b.like_count) - parseNum(a.like_count))
    .slice(0, 5);
  const mostDiscussed = [...videos]
    .sort((a, b) => parseNum(b.comment_count) - parseNum(a.comment_count))
    .slice(0, 5);

  const privacyCounts = {
    public: videos.filter((v) => v.privacy_status === "public").length,
    unlisted: videos.filter((v) => v.privacy_status === "unlisted").length,
    private: videos.filter((v) => v.privacy_status === "private").length,
  };

  const quotaUsedPct = quota?.daily_limit
    ? Math.round(((quota.used_today || 0) / quota.daily_limit) * 100)
    : 0;
  const quotaColor =
    quotaUsedPct > 80
      ? "text-red-400"
      : quotaUsedPct > 50
      ? "text-amber-400"
      : "text-emerald-400";

  // ── Tab definitions ─────────────────────────────────────────────────────

  const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "videos", label: "Videos", icon: Play },
    { id: "playlists", label: "Playlists", icon: ListMusic },
    { id: "engagement", label: "Engagement", icon: TrendingUp },
  ] as const;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 font-bold">
            Channel Intelligence
          </p>
          <h2 className="text-base font-black text-white mt-0.5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-red-400" />
            Analytics Dashboard
          </h2>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs font-mono text-neutral-400 hover:text-white hover:border-neutral-700 transition-all cursor-pointer"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-[11px] font-bold font-mono transition-all cursor-pointer ${
              activeTab === id
                ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-neutral-800 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
            </div>
          </div>
          <p className="text-xs text-neutral-400 font-mono">
            Fetching your channel analytics…
          </p>
        </div>
      ) : (
        <>
          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={<Users className="w-4 h-4 text-red-400" />}
                  label="Subscribers"
                  value={
                    channel?.subscriber_count
                      ? fmtNum(parseNum(channel.subscriber_count))
                      : "--"
                  }
                  sub={channel?.custom_url || ""}
                  color="bg-red-950/50 border-red-900/40"
                />
                <StatCard
                  icon={<Eye className="w-4 h-4 text-sky-400" />}
                  label="Total Views"
                  value={
                    channel?.view_count
                      ? fmtNum(parseNum(channel.view_count))
                      : fmtNum(totalViews)
                  }
                  sub="All-time channel views"
                  color="bg-sky-950/50 border-sky-900/40"
                />
                <StatCard
                  icon={<Video className="w-4 h-4 text-purple-400" />}
                  label="Videos"
                  value={channel?.video_count || videos.length || "--"}
                  sub={`${privacyCounts.public} public · ${privacyCounts.unlisted} unlisted`}
                  color="bg-purple-950/50 border-purple-900/40"
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
                  label="Avg Views"
                  value={avgViews > 0 ? fmtNum(avgViews) : "--"}
                  sub="Per video average"
                  color="bg-emerald-950/50 border-emerald-900/40"
                />
              </div>

              {/* Secondary KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={<ThumbsUp className="w-4 h-4 text-rose-400" />}
                  label="Total Likes"
                  value={fmtNum(totalLikes)}
                  color="bg-rose-950/50 border-rose-900/40"
                />
                <StatCard
                  icon={<MessageCircle className="w-4 h-4 text-blue-400" />}
                  label="Total Comments"
                  value={fmtNum(totalComments)}
                  color="bg-blue-950/50 border-blue-900/40"
                />
                <StatCard
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label="Engagement Rate"
                  value={`${engagementRate}%`}
                  sub="(Likes + Comments) / Views"
                  color="bg-orange-950/50 border-orange-900/40"
                />
                <StatCard
                  icon={<ListMusic className="w-4 h-4 text-violet-400" />}
                  label="Playlists"
                  value={playlists.length || "--"}
                  sub="On your channel"
                  color="bg-violet-950/50 border-violet-900/40"
                />
              </div>

              {/* 2-col: Leaderboard + Quota + Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Top 10 Videos Leaderboard */}
                <div className="lg:col-span-3 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                        Top 10 by Views
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {videos.length} total videos
                    </span>
                  </div>
                  {topVideos.length === 0 ? (
                    <p className="text-xs text-neutral-500 font-mono text-center py-6">
                      No video data available
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                      {topVideos.map((vid, idx) => {
                        const viewN = parseNum(vid.view_count);
                        const maxViews = parseNum(topVideos[0]?.view_count);
                        const barPct =
                          maxViews > 0 ? (viewN / maxViews) * 100 : 0;
                        const medal =
                          idx === 0
                            ? "🥇"
                            : idx === 1
                            ? "🥈"
                            : idx === 2
                            ? "🥉"
                            : null;
                        return (
                          <a
                            key={vid.id}
                            href={vid.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 p-2.5 bg-neutral-950/80 border border-neutral-800/60 rounded-xl hover:border-amber-900/40 transition-all group"
                          >
                            <span className="text-[11px] font-black font-mono text-neutral-500 w-6 shrink-0 text-center">
                              {medal || (
                                <span className="text-neutral-600">
                                  #{idx + 1}
                                </span>
                              )}
                            </span>
                            <img
                              src={vid.thumbnail}
                              alt={vid.title}
                              className="w-14 h-9 object-cover rounded-lg shrink-0 border border-neutral-800"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-neutral-200 truncate group-hover:text-amber-300 transition-colors">
                                {vid.title}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <MiniBar
                                  pct={barPct}
                                  color="bg-gradient-to-r from-amber-700 to-amber-400"
                                />
                                <span className="text-[10px] font-mono text-amber-400 whitespace-nowrap shrink-0">
                                  {fmtNum(viewN)}
                                </span>
                              </div>
                            </div>
                            <div className="shrink-0 flex flex-col items-end gap-0.5 text-[9px] font-mono text-neutral-600">
                              <span className="flex items-center gap-0.5">
                                <ThumbsUp className="w-2.5 h-2.5" />
                                {fmtNum(parseNum(vid.like_count))}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MessageCircle className="w-2.5 h-2.5" />
                                {fmtNum(parseNum(vid.comment_count))}
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right column: Quota + Privacy + Recent Activity */}
                <div className="lg:col-span-2 space-y-4">
                  {/* API Quota */}
                  <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                          API Quota
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          quotaUsedPct > 80
                            ? "bg-red-950/60 border border-red-900/40 text-red-400"
                            : quotaUsedPct > 50
                            ? "bg-amber-950/60 border border-amber-900/40 text-amber-400"
                            : "bg-emerald-950/60 border border-emerald-900/40 text-emerald-400"
                        }`}
                      >
                        {quota?.health_status || "Healthy"}
                      </span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono">
                      {[
                        {
                          label: "Daily Limit",
                          val: (quota?.daily_limit || 10000).toLocaleString(),
                        },
                        {
                          label: "Used Today",
                          val: String(quota?.used_today || 0),
                          cls: quotaColor,
                        },
                        {
                          label: "Remaining",
                          val: (
                            (quota?.daily_limit || 10000) -
                            (quota?.used_today || 0)
                          ).toLocaleString(),
                        },
                      ].map(({ label, val, cls }) => (
                        <div
                          key={label}
                          className="flex items-center justify-between"
                        >
                          <span className="text-neutral-500">{label}</span>
                          <span
                            className={`font-bold ${cls || "text-neutral-200"}`}
                          >
                            {val}
                          </span>
                        </div>
                      ))}
                    </div>
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
                    <p className={`text-[10px] font-mono ${quotaColor}`}>
                      {quotaUsedPct}% used · Resets at midnight PST
                    </p>
                    {quotaUsedPct > 80 && (
                      <div className="flex items-start gap-2 p-2.5 bg-red-950/40 border border-red-900/40 rounded-xl">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] font-mono text-red-300 leading-relaxed">
                          Quota nearly exhausted. Uploads and API calls may
                          fail.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Privacy Breakdown */}
                  {videos.length > 0 && (
                    <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                        Privacy Breakdown
                      </h3>
                      {[
                        {
                          key: "public",
                          icon: Globe,
                          label: "Public",
                          color: "bg-emerald-600",
                          textColor: "text-emerald-400",
                          count: privacyCounts.public,
                        },
                        {
                          key: "unlisted",
                          icon: LinkIcon,
                          label: "Unlisted",
                          color: "bg-amber-600",
                          textColor: "text-amber-400",
                          count: privacyCounts.unlisted,
                        },
                        {
                          key: "private",
                          icon: Lock,
                          label: "Private",
                          color: "bg-neutral-600",
                          textColor: "text-neutral-400",
                          count: privacyCounts.private,
                        },
                      ].map(
                        ({
                          key,
                          icon: Icon,
                          label,
                          color,
                          textColor,
                          count,
                        }) => {
                          const pct = Math.round((count / videos.length) * 100);
                          return (
                            <div key={key} className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span
                                  className={`font-bold flex items-center gap-1 ${textColor}`}
                                >
                                  <Icon className="w-3 h-3" />
                                  {label}
                                </span>
                                <span className="text-neutral-400">
                                  {count} · {pct}%
                                </span>
                              </div>
                              <MiniBar pct={pct} color={color} />
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* Channel info card */}
                  {channel?.title && (
                    <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                      <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                        Channel Info
                      </h3>
                      <div className="flex items-center gap-2.5">
                        {channel.thumbnail && (
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            className="w-10 h-10 rounded-full border border-neutral-700 shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white truncate">
                            {channel.title}
                          </p>
                          {channel.custom_url && (
                            <p className="text-[10px] font-mono text-neutral-500 truncate">
                              @{channel.custom_url.replace("@", "")}
                            </p>
                          )}
                          {channel.country && (
                            <p className="text-[10px] font-mono text-neutral-600">
                              {channel.country}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Uploads Timeline */}
              {recentVideos.length > 0 && (
                <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                      Recent Uploads
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {recentVideos.map((vid) => (
                      <a
                        key={vid.id}
                        href={vid.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2.5 bg-neutral-950/80 border border-neutral-800/60 rounded-xl hover:border-sky-900/50 transition-all group"
                      >
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          className="w-14 h-9 object-cover rounded-lg shrink-0 border border-neutral-800"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-neutral-200 truncate group-hover:text-sky-300 transition-colors">
                            {vid.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-mono text-neutral-600">
                              {timeAgo(vid.published_at)}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                vid.privacy_status === "public"
                                  ? "bg-emerald-950/50 text-emerald-400"
                                  : vid.privacy_status === "unlisted"
                                  ? "bg-amber-950/50 text-amber-400"
                                  : "bg-neutral-800 text-neutral-500"
                              }`}
                            >
                              {vid.privacy_status}
                            </span>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-neutral-500 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Eye className="w-3 h-3" />
                            {fmtNum(parseNum(vid.view_count))}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ VIDEOS TAB ══ */}
          {activeTab === "videos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-neutral-400">
                  {videos.length} videos on your channel
                </p>
              </div>
              {videos.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 font-mono text-xs">
                  No videos found.
                </div>
              ) : (
                <div className="space-y-2">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center gap-3 p-3 bg-neutral-900/80 border border-neutral-800/80 rounded-xl hover:border-neutral-700/80 transition-all group"
                    >
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-20 h-12 object-cover rounded-lg shrink-0 border border-neutral-800"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold text-white truncate">
                          {vid.title}
                        </p>
                        <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {fmtNum(parseNum(vid.view_count))}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {fmtNum(parseNum(vid.like_count))}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {fmtNum(parseNum(vid.comment_count))}
                          </span>
                          <span className="text-[9px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(vid.published_at)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] ${
                              vid.privacy_status === "public"
                                ? "bg-emerald-950/50 text-emerald-400"
                                : vid.privacy_status === "unlisted"
                                ? "bg-amber-950/50 text-amber-400"
                                : "bg-neutral-800 text-neutral-500"
                            }`}
                          >
                            {vid.privacy_status}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        {/* Engagement mini-meter */}
                        <div className="hidden sm:flex flex-col items-end gap-0.5">
                          {(() => {
                            const v = parseNum(vid.view_count);
                            const eng =
                              v > 0
                                ? (
                                    ((parseNum(vid.like_count) +
                                      parseNum(vid.comment_count)) /
                                      v) *
                                    100
                                  ).toFixed(1)
                                : "0";
                            const engN = parseFloat(eng);
                            return (
                              <>
                                <span
                                  className={`text-[10px] font-mono font-bold ${
                                    engN >= 5
                                      ? "text-emerald-400"
                                      : engN >= 2
                                      ? "text-amber-400"
                                      : "text-neutral-500"
                                  }`}
                                >
                                  {eng}%
                                </span>
                                <span className="text-[9px] font-mono text-neutral-600">
                                  ER
                                </span>
                              </>
                            );
                          })()}
                        </div>
                        <a
                          href={vid.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-neutral-800/60 hover:bg-red-950/40 border border-neutral-700/40 hover:border-red-900/40 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ PLAYLISTS TAB ══ */}
          {activeTab === "playlists" && (
            <div className="space-y-4">
              <p className="text-xs font-mono text-neutral-400">
                {playlists.length} playlists on your channel
              </p>
              {playlists.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <ListMusic className="w-8 h-8 text-neutral-700 mx-auto" />
                  <p className="text-xs text-neutral-500 font-mono">
                    No playlists found on your channel.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {playlists.map((pl) => (
                    <div
                      key={pl.id}
                      className="flex items-center gap-3 p-3.5 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl hover:border-violet-900/40 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center shrink-0">
                        {pl.thumbnail ? (
                          <img
                            src={pl.thumbnail}
                            alt={pl.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ListMusic className="w-6 h-6 text-neutral-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
                          {pl.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                          <span>{pl.item_count ?? "?"} videos</span>
                          {pl.privacy && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] ${
                                pl.privacy === "public"
                                  ? "bg-emerald-950/50 text-emerald-400"
                                  : pl.privacy === "unlisted"
                                  ? "bg-amber-950/50 text-amber-400"
                                  : "bg-neutral-800 text-neutral-500"
                              }`}
                            >
                              {pl.privacy}
                            </span>
                          )}
                        </div>
                      </div>
                      <a
                        href={`https://www.youtube.com/playlist?list=${pl.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-neutral-800/60 hover:bg-violet-950/40 border border-neutral-700/40 hover:border-violet-900/40 text-neutral-400 hover:text-violet-400 transition-all cursor-pointer shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ ENGAGEMENT TAB ══ */}
          {activeTab === "engagement" && (
            <div className="space-y-5">
              {/* Engagement summary */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                  icon={<ThumbsUp className="w-4 h-4 text-rose-400" />}
                  label="Total Likes"
                  value={fmtNum(totalLikes)}
                  sub="Across all videos"
                  color="bg-rose-950/50 border-rose-900/40"
                />
                <StatCard
                  icon={<MessageCircle className="w-4 h-4 text-blue-400" />}
                  label="Total Comments"
                  value={fmtNum(totalComments)}
                  sub="Across all videos"
                  color="bg-blue-950/50 border-blue-900/40"
                />
                <StatCard
                  icon={<Flame className="w-4 h-4 text-orange-400" />}
                  label="Engagement Rate"
                  value={`${engagementRate}%`}
                  sub="(Likes + Comments) / Views"
                  color="bg-orange-950/50 border-orange-900/40"
                />
              </div>

              {/* Most Liked vs Most Discussed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Most Liked */}
                <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-rose-400" />
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                      Most Liked
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {mostLiked.map((vid, i) => {
                      const n = parseNum(vid.like_count);
                      const max = parseNum(mostLiked[0]?.like_count);
                      return (
                        <a
                          key={vid.id}
                          href={vid.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 group"
                        >
                          <span className="w-4 text-[10px] font-mono text-neutral-600 shrink-0">
                            #{i + 1}
                          </span>
                          <img
                            src={vid.thumbnail}
                            alt=""
                            className="w-10 h-7 object-cover rounded shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-neutral-300 truncate group-hover:text-rose-300 transition-colors">
                              {vid.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MiniBar
                                pct={max > 0 ? (n / max) * 100 : 0}
                                color="bg-gradient-to-r from-rose-700 to-rose-400"
                              />
                              <span className="text-[10px] font-mono text-rose-400 shrink-0">
                                {fmtNum(n)}
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>

                {/* Most Discussed */}
                <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                      Most Discussed
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {mostDiscussed.map((vid, i) => {
                      const n = parseNum(vid.comment_count);
                      const max = parseNum(mostDiscussed[0]?.comment_count);
                      return (
                        <a
                          key={vid.id}
                          href={vid.youtube_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2.5 group"
                        >
                          <span className="w-4 text-[10px] font-mono text-neutral-600 shrink-0">
                            #{i + 1}
                          </span>
                          <img
                            src={vid.thumbnail}
                            alt=""
                            className="w-10 h-7 object-cover rounded shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-neutral-300 truncate group-hover:text-blue-300 transition-colors">
                              {vid.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <MiniBar
                                pct={max > 0 ? (n / max) * 100 : 0}
                                color="bg-gradient-to-r from-blue-700 to-blue-400"
                              />
                              <span className="text-[10px] font-mono text-blue-400 shrink-0">
                                {fmtNum(n)}
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Per-video engagement breakdown */}
              {videos.length > 0 && (
                <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                      Per-Video Engagement
                    </h3>
                  </div>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
                    {[...videos]
                      .map((v) => ({
                        ...v,
                        er:
                          parseNum(v.view_count) > 0
                            ? ((parseNum(v.like_count) +
                                parseNum(v.comment_count)) /
                                parseNum(v.view_count)) *
                              100
                            : 0,
                      }))
                      .sort((a, b) => b.er - a.er)
                      .map((vid) => (
                        <div key={vid.id} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-mono text-neutral-400 truncate">
                              {vid.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-44">
                            <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  vid.er >= 5
                                    ? "bg-emerald-500"
                                    : vid.er >= 2
                                    ? "bg-amber-500"
                                    : "bg-neutral-600"
                                }`}
                                style={{
                                  width: `${Math.min(vid.er * 10, 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold w-10 text-right ${
                                vid.er >= 5
                                  ? "text-emerald-400"
                                  : vid.er >= 2
                                  ? "text-amber-400"
                                  : "text-neutral-500"
                              }`}
                            >
                              {vid.er.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Upload History (always visible at bottom) ── */}
          <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-2xl p-5">
            <UploadHistory history={uploadHistory} />
          </div>
        </>
      )}
    </div>
  );
}
