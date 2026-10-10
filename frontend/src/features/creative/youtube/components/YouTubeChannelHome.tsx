import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Video,
  Eye,
  ThumbsUp,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Search,
  Loader2,
  Youtube,
  Play,
  BadgeCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Share2,
  Calendar,
  Sparkles,
  ListMusic,
  Trophy,
  Flame,
  Layers,
  FolderPlus,
  BarChart3,
  Check,
  Film,
  Plus,
} from "lucide-react";
import RouteLoadingFallback from "@/shared/ui/feedback/RouteLoadingFallback";
import YouTubeOfficialLogo from "./YouTubeOfficialLogo";

export interface YouTubeVideoItem {
  id: string;
  title: string;
  description?: string;
  published_at?: string;
  thumbnail: string;
  view_count: string;
  like_count: string;
  comment_count: string;
  privacy_status: string;
  youtube_url: string;
}

interface ChannelData {
  id?: string;
  title?: string;
  custom_url?: string;
  thumbnail?: string;
  banner_url?: string;
  subscriber_count?: string;
  view_count?: string;
  video_count?: string;
  description?: string;
}

interface PlaylistSummary {
  id: string;
  title: string;
  description?: string;
  item_count?: number;
  thumbnail?: string;
  privacy?: string;
}

interface YouTubeChannelHomeProps {
  onWatchVideo: (videoId: string, video: YouTubeVideoItem) => void;
  onViewComments: (videoId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export default function YouTubeChannelHome({
  onWatchVideo,
  onViewComments,
  onNavigateTab,
}: YouTubeChannelHomeProps) {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "popular" | "shorts" | "playlists"
  >("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bannerError, setBannerError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const fetchData = async () => {
    setIsLoading(true);
    setBannerError(false);
    setAvatarError(false);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const headers = { Authorization: `Bearer ${token}` };
      const cacheBust = Date.now();

      const [videosRes, channelRes, playlistsRes] = await Promise.all([
        fetch(`/api/v1/export/youtube/videos?max_results=50&_t=${cacheBust}`, {
          headers,
        }),
        fetch(`/api/v1/export/youtube/channel/details?_t=${cacheBust}`, {
          headers,
        }),
        fetch(`/api/v1/export/youtube/playlists?_t=${cacheBust}`, { headers }),
      ]);

      if (videosRes.ok) {
        const data = await videosRes.json();
        setVideos(data.videos || []);
      }
      if (channelRes.ok) {
        const data = await channelRes.json();
        setChannel(data);
      }
      if (playlistsRes.ok) {
        const data = await playlistsRes.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.warn("Failed to load channel home:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isShortVideo = (v: YouTubeVideoItem) => {
    return (
      v.title?.toLowerCase().includes("#short") ||
      v.title?.toLowerCase().includes("short") ||
      v.description?.toLowerCase().includes("#shorts")
    );
  };

  // Separate Long-form videos and Shorts
  const shorts = useMemo(() => {
    return videos.filter(isShortVideo);
  }, [videos]);

  // Top performing videos (only videos with real views > 0)
  const topVideos = useMemo(() => {
    return [...videos]
      .filter((v) => (parseInt(v.view_count?.replace(/,/g, "") || "0") || 0) > 0)
      .sort((a, b) => {
        const av = parseInt(a.view_count?.replace(/,/g, "") || "0") || 0;
        const bv = parseInt(b.view_count?.replace(/,/g, "") || "0") || 0;
        return bv - av;
      })
      .slice(0, 4);
  }, [videos]);

  const latestVideo = videos[0] || null;
  const remainingVideos = useMemo(() => {
    return videos.slice(1, 9);
  }, [videos]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopyLink = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── 1. CHANNEL HERO BANNER & PROFILE CARD ── */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">


        {/* Banner Area */}
        <div className="relative w-full h-52 sm:h-64 md:h-76 lg:h-80 overflow-hidden bg-neutral-950">
          {channel?.banner_url && !bannerError ? (
            <img
              src={channel.banner_url}
              alt="Channel Banner"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover object-[center_top]"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-950/70 via-neutral-900 to-neutral-950 relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="flex items-center justify-center">
                <YouTubeOfficialLogo className="w-20 h-14 opacity-20" />
              </div>
            </div>
          )}
          {/* Subtle bottom gradient to blend cleanly into profile card */}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        {/* Channel Identity Overlay */}
        <div className="px-6 py-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-neutral-950/95 -mt-14 sm:-mt-16 relative z-10 border-t border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 min-w-0">
            {/* Channel Avatar */}
            {channel?.thumbnail && !avatarError ? (
              <div className="relative shrink-0">
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-neutral-950 ring-2 ring-white/10 shadow-2xl bg-neutral-900"
                />
              </div>
            ) : (
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-[#2A2A2A] border-4 border-neutral-950 ring-2 ring-white/10 flex items-center justify-center shrink-0 shadow-2xl">
                  <span className="text-3xl sm:text-4xl font-black text-white font-sans uppercase">
                    {channel?.title ? channel.title.charAt(0) : "Y"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-white font-sans tracking-tight truncate">
                  {channel?.title || "YouTube Channel"}
                </h1>
                {channel?.id && (
                  <span title="Verified Creator" className="flex items-center">
                    <BadgeCheck className="w-6 h-6 text-red-500 fill-red-500/20 shrink-0" />
                  </span>
                )}
              </div>

              {/* Stats & Identity Badges */}
              <div className="flex items-center gap-2.5 flex-wrap text-xs font-mono">
                {channel?.custom_url && (
                  <span className="px-3 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-300 font-bold shadow-sm">
                    {channel.custom_url}
                  </span>
                )}
                {channel?.subscriber_count && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 font-bold shadow-sm">
                    <Users className="w-3.5 h-3.5 text-red-400" />
                    <strong>{channel.subscriber_count}</strong> subscribers
                  </span>
                )}
                {channel?.video_count && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 text-[#60A5FA] font-bold shadow-sm">
                    <Video className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <strong>{channel.video_count}</strong> videos
                  </span>
                )}
                {channel?.view_count && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-300 font-bold shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <strong>{channel.view_count}</strong> views
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-end flex-wrap">
            <a
              href={
                channel?.custom_url
                  ? `https://youtube.com/${channel.custom_url}`
                  : channel?.id
                  ? `https://youtube.com/channel/${channel.id}`
                  : "https://youtube.com"
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold font-mono text-neutral-200 hover:text-white transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Open on YouTube</span>
            </a>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                fetchData();
              }}
              disabled={isLoading}
              className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
              title="Refresh Channel Data"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  isLoading ? "animate-spin text-red-400" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. QUICK LAUNCH STUDIO BAR ── */}
      {onNavigateTab && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab("studio")}
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-red-950/40 to-neutral-900/80 hover:from-red-900/40 hover:to-neutral-850 border border-red-500/30 hover:border-red-500/60 rounded-2xl transition-all cursor-pointer group shadow-lg text-left"
          >
            <div className="p-2 rounded-xl bg-[#14141E] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <YouTubeOfficialLogo className="w-5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Publish Video
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Open Studio Flow
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("playlists")}
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-[#2A2A2A] to-neutral-900/80 hover:from-[#2A2A2A] hover:to-neutral-850 border border-[#3B82F6]/30 hover:border-neutral-700 rounded-2xl transition-all cursor-pointer group shadow-lg text-left"
          >
            <div className="p-2.5 rounded-xl bg-[#2A2A2A] text-white shadow-md shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Create Playlist
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Curate Series
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("analytics")}
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-sky-950/40 to-neutral-900/80 hover:from-sky-900/40 hover:to-neutral-850 border border-sky-500/30 hover:border-sky-500/60 rounded-2xl transition-all cursor-pointer group shadow-lg text-left"
          >
            <div className="p-2.5 rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/30 shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                Analytics
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Channel Intelligence
              </span>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab("title-optimizer")}
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-amber-950/40 to-neutral-900/80 hover:from-amber-900/40 hover:to-neutral-850 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl transition-all cursor-pointer group shadow-lg text-left"
          >
            <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/30 shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">
                AI SEO Optimizer
              </span>
              <span className="text-[10px] font-mono text-neutral-400">
                Viral Titles & Tags
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── 3. CONTENT FILTER PILLS ── */}
      <div className="flex items-center gap-1 p-1 bg-[#1E1E1E] border border-[#2F2F2F] rounded-xl w-fit">
        {[
          { id: "all", label: "All Content", icon: Film },
          { id: "popular", label: "Top Watched", icon: Flame },
          { id: "shorts", label: "Shorts", icon: Zap },
          { id: "playlists", label: "Playlists", icon: ListMusic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap select-none ${
                isSel
                  ? "bg-red-600 text-white shadow-sm border border-red-500/50"
                  : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <RouteLoadingFallback />
      ) : (
        <>
          {/* ── 4. LATEST UPLOAD (REAL DATA) ── */}
          {latestVideo &&
            (activeFilter === "all" || (activeFilter === "shorts" && isShortVideo(latestVideo))) && (
              <div className="relative rounded-2xl bg-[#141414] border border-[#2F2F2F] p-5 sm:p-6 shadow-xl overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-red-600/10 border border-red-500/25 text-xs font-semibold font-sans text-red-400">
                      Latest Upload
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-xs font-medium font-sans text-[#9CA3AF]">
                      {isShortVideo(latestVideo) ? "Shorts" : "Video"}
                    </span>
                  </div>
                  <span className="text-xs text-[#9CA3AF] font-sans">
                    {formatDate(latestVideo.published_at)}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Video Preview */}
                  <div
                    className="lg:col-span-6 relative aspect-video bg-black rounded-xl overflow-hidden cursor-pointer group shadow-xl border border-[#2F2F2F]"
                    onClick={() =>
                      onWatchVideo(latestVideo.id, latestVideo)
                    }
                  >
                    <img
                      src={
                        latestVideo.thumbnail ||
                        `https://i.ytimg.com/vi/${latestVideo.id}/hqdefault.jpg`
                      }
                      alt={latestVideo.title}
                      onError={(e) => {
                        (
                          e.currentTarget as HTMLImageElement
                        ).src = `https://i.ytimg.com/vi/${latestVideo.id}/hqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-3 bg-red-600 rounded-2xl shadow-xl border border-red-500/40">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="lg:col-span-6 space-y-3.5">
                    <div className="space-y-1.5">
                      <h2
                        className="text-base sm:text-xl font-bold text-[#E5E5E5] font-sans leading-snug cursor-pointer hover:text-red-400 transition-colors"
                        onClick={() =>
                          onWatchVideo(latestVideo.id, latestVideo)
                        }
                      >
                        {latestVideo.title}
                      </h2>
                      {latestVideo.description && (
                        <p className="text-xs text-[#9CA3AF] font-sans line-clamp-3 leading-relaxed">
                          {latestVideo.description}
                        </p>
                      )}
                    </div>

                    {/* Real Telemetry Badges */}
                    <div className="flex items-center gap-2.5 flex-wrap text-xs font-sans">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#60A5FA] font-medium">
                        <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />{" "}
                        {latestVideo.view_count} views
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#34D399] font-medium">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#10B981]" />{" "}
                        {latestVideo.like_count} likes
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF]">
                        <Calendar className="w-3.5 h-3.5 text-[#6B7280]" />{" "}
                        {formatDate(latestVideo.published_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                      <button
                        onClick={() =>
                          onWatchVideo(latestVideo.id, latestVideo)
                        }
                        className="flex items-center gap-2 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold font-sans rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch Video</span>
                      </button>
                      <button
                        onClick={(e) =>
                          handleCopyLink(
                            latestVideo.youtube_url,
                            latestVideo.id,
                            e
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] text-xs font-medium font-sans rounded-xl transition-all cursor-pointer"
                      >
                        {copiedId === latestVideo.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* ── 5. TOP WATCHED VIDEOS (ONLY REAL ENGAGED VIDEOS) ── */}
          {activeFilter === "popular" && (
            topVideos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600/10 border border-red-500/25 rounded-lg text-red-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#E5E5E5] font-sans">
                      Top Watched Videos
                    </h3>
                    <p className="text-xs text-[#9CA3AF] font-sans">
                      Ranked by real viewer counts on your channel
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topVideos.map((vid, idx) => (
                    <div
                      key={vid.id}
                      onClick={() => onWatchVideo(vid.id, vid)}
                      className="group bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-red-500/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-video bg-black overflow-hidden">
                        <img
                          src={
                            vid.thumbnail ||
                            `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`
                          }
                          alt={vid.title}
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#0A0A0A]/85 backdrop-blur-md text-[10px] font-sans font-semibold text-[#E5E5E5] border border-[#2F2F2F]">
                          #{idx + 1}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="p-3 bg-red-600 rounded-2xl shadow-xl">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-semibold text-[#E5E5E5] line-clamp-2 leading-snug group-hover:text-red-400 transition-colors font-sans">
                          {vid.title}
                        </h4>
                        <div className="flex items-center justify-between text-xs font-sans pt-2 border-t border-[#2F2F2F] text-[#9CA3AF]">
                          <span className="text-[#60A5FA] font-medium flex items-center gap-1">
                            <Eye className="w-3 h-3 text-[#3B82F6]" /> {vid.view_count}
                          </span>
                          <span className="text-[#34D399] font-medium flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-[#10B981]" /> {vid.like_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-2">
                <Flame className="w-10 h-10 text-[#6B7280] mx-auto" />
                <h4 className="text-sm font-semibold text-[#E5E5E5] font-sans">
                  No view statistics yet
                </h4>
                <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
                  Videos will rank here once they accumulate real views from YouTube viewers.
                </p>
              </div>
            )
          )}

          {/* ── 6. PLAYLISTS & SERIES SHELF ── */}
          {(activeFilter === "all" || activeFilter === "playlists") &&
            (playlists.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-xl text-[#3B82F6]">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#E5E5E5] font-sans">
                        Playlists &amp; Series
                      </h3>
                      <p className="text-xs text-[#9CA3AF] font-sans">
                        Curated episode collections on your YouTube channel
                      </p>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("playlists")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-xs font-sans font-semibold text-[#60A5FA] hover:text-[#93C5FD] transition-all cursor-pointer"
                    >
                      <span>Manage Playlists ({playlists.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {playlists.slice(0, 4).map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() =>
                        onNavigateTab && onNavigateTab("playlists")
                      }
                      className="group bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-[#3B82F6]/40 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                        {pl.thumbnail ? (
                          <img
                            src={pl.thumbnail}
                            alt={pl.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <ListMusic className="w-10 h-10 text-[#6B7280]" />
                        )}
                        <div className="absolute inset-y-0 right-0 w-24 bg-black/85 backdrop-blur-md border-l border-[#2F2F2F] flex flex-col items-center justify-center gap-1 text-[#E5E5E5]">
                          <Layers className="w-4 h-4 text-[#60A5FA]" />
                          <span className="text-xs font-bold font-sans">
                            {pl.item_count ?? 0}
                          </span>
                          <span className="text-[9px] font-sans uppercase text-[#9CA3AF]">
                            Videos
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h4 className="text-xs font-bold text-[#E5E5E5] truncate group-hover:text-[#60A5FA] transition-colors font-sans">
                          {pl.title}
                        </h4>
                        <p className="text-[10px] font-sans text-[#9CA3AF] capitalize">
                          {pl.privacy || "public"} playlist
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeFilter === "playlists" ? (
              <div className="p-12 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-3">
                <ListMusic className="w-10 h-10 text-[#6B7280] mx-auto" />
                <h4 className="text-sm font-semibold text-[#E5E5E5] font-sans">
                  No Playlists Found
                </h4>
                <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
                  Create playlists and series on YouTube to organize your chapters and episodes.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("playlists")}
                    className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-semibold font-sans shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Playlist</span>
                  </button>
                )}
              </div>
            ) : null)}

          {/* ── 7. SHORTS SHELF ── */}
          {(activeFilter === "all" || activeFilter === "shorts") &&
            (shorts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-600/10 border border-red-500/25 rounded-xl text-red-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#E5E5E5] font-sans">
                        YouTube Shorts
                      </h3>
                      <p className="text-xs text-[#9CA3AF] font-sans">
                        Vertical short-form uploads from your channel
                      </p>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("shorts")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-xs font-sans font-semibold text-red-400 hover:text-red-300 transition-all cursor-pointer"
                    >
                      <span>View All ({shorts.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {shorts.slice(0, 6).map((short) => (
                    <div
                      key={short.id}
                      onClick={() => onWatchVideo(short.id, short)}
                      className="group relative aspect-[9/16] bg-black rounded-2xl overflow-hidden border border-[#2F2F2F] hover:border-red-500/50 shadow-sm transition-all duration-300 cursor-pointer flex flex-col justify-end"
                    >
                      <img
                        src={
                          short.thumbnail ||
                          `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`
                        }
                        alt={short.title}
                        onError={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).src = `https://i.ytimg.com/vi/${short.id}/hqdefault.jpg`;
                        }}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                      <div className="relative z-10 p-3 space-y-1">
                        <h4 className="text-xs font-semibold text-[#E5E5E5] line-clamp-2 leading-snug font-sans">
                          {short.title}
                        </h4>
                        <p className="text-[10px] text-[#9CA3AF] font-sans flex items-center gap-1">
                          <Eye className="w-3 h-3 text-[#60A5FA]" />{" "}
                          {short.view_count || "0"} views
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeFilter === "shorts" ? (
              <div className="p-12 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-3">
                <Zap className="w-10 h-10 text-[#6B7280] mx-auto" />
                <h4 className="text-sm font-semibold text-[#E5E5E5] font-sans">
                  No YouTube Shorts Found
                </h4>
                <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
                  Shorts tagged with #Shorts on YouTube will be organized here.
                </p>
              </div>
            ) : null)}

          {/* ── 8. RECENT UPLOADS GRID ── */}
          {activeFilter === "all" && remainingVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-[#1E1E1E] border border-[#2F2F2F] rounded-xl text-red-500">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#E5E5E5] font-sans">
                      More Uploads
                    </h3>
                    <p className="text-xs text-[#9CA3AF] font-sans">
                      Previous videos published to your YouTube channel
                    </p>
                  </div>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("videos")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] text-xs font-sans font-semibold text-[#9CA3AF] hover:text-[#E5E5E5] transition-all cursor-pointer"
                  >
                    <span>View All ({videos.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {remainingVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="group bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-red-500/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col"
                  >
                    <div
                      className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                      onClick={() => onWatchVideo(vid.id, vid)}
                    >
                      <img
                        src={
                          vid.thumbnail ||
                          `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`
                        }
                        alt={vid.title}
                        onError={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                        <div className="p-3 bg-red-600 rounded-2xl shadow-xl border border-red-400/40">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h4
                        className="text-xs font-semibold text-[#E5E5E5] line-clamp-2 font-sans cursor-pointer hover:text-red-400 transition-colors leading-snug"
                        onClick={() => onWatchVideo(vid.id, vid)}
                      >
                        {vid.title}
                      </h4>
                      <p className="text-[10px] text-[#9CA3AF] font-sans">
                        {formatDate(vid.published_at)}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] font-sans pt-3 border-t border-[#2F2F2F] mt-auto">
                        <span className="flex items-center gap-1 font-medium text-[#60A5FA]">
                          <Eye className="w-3 h-3" /> {vid.view_count || "0"}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-[#34D399]">
                          <ThumbsUp className="w-3 h-3" /> {vid.like_count || "0"}
                        </span>
                        <button
                          onClick={() => onViewComments(vid.id)}
                          className="flex items-center gap-1 hover:text-[#E5E5E5] transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3 text-[#3B82F6]" />{" "}
                          {vid.comment_count || "0"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback if user has no videos at all */}
          {videos.length === 0 && (
            <div className="p-12 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-3">
              <Youtube className="w-10 h-10 text-[#6B7280] mx-auto" />
              <h4 className="text-sm font-semibold text-[#E5E5E5] font-sans">
                No videos published yet
              </h4>
              <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
                Videos uploaded to your YouTube channel will appear here automatically.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
