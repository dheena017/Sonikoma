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
import RouteLoadingFallback from "@/components/feedback/RouteLoadingFallback";
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
        fetch(`/api/export/youtube/videos?max_results=50&_t=${cacheBust}`, {
          headers,
        }),
        fetch(`/api/export/youtube/channel/details?_t=${cacheBust}`, {
          headers,
        }),
        fetch(`/api/export/youtube/playlists?_t=${cacheBust}`, { headers }),
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

  // Separate Long-form videos and Shorts
  const shorts = useMemo(() => {
    return videos.filter(
      (v) =>
        v.title?.toLowerCase().includes("#short") ||
        v.title?.toLowerCase().includes("short") ||
        v.description?.toLowerCase().includes("#shorts")
    );
  }, [videos]);

  // Top performing videos
  const topVideos = useMemo(() => {
    return [...videos]
      .sort((a, b) => {
        const av = parseInt(a.view_count?.replace(/,/g, "") || "0");
        const bv = parseInt(b.view_count?.replace(/,/g, "") || "0");
        return bv - av;
      })
      .slice(0, 4);
  }, [videos]);

  const recentUploads = useMemo(() => {
    return videos.slice(0, 8);
  }, [videos]);

  const featuredVideo = topVideos[0] || videos[0] || null;

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
        <div className="relative w-full h-44 sm:h-56 md:h-64 overflow-hidden bg-neutral-950">
          {channel?.banner_url && !bannerError ? (
            <img
              src={channel.banner_url}
              alt="Channel Banner"
              referrerPolicy="no-referrer"
              onError={() => setBannerError(true)}
              className="w-full h-full object-cover object-center"
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
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-red-600 via-rose-700 to-purple-800 border-4 border-neutral-950 ring-2 ring-white/10 flex items-center justify-center shrink-0 shadow-2xl">
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
            className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-purple-950/40 to-neutral-900/80 hover:from-purple-900/40 hover:to-neutral-850 border border-[#3B82F6]/30 hover:border-[#3B82F6]/60 rounded-2xl transition-all cursor-pointer group shadow-lg text-left"
          >
            <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-md shadow-sm shrink-0 group-hover:scale-105 transition-transform">
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
      <div className="flex items-center gap-1.5 p-1 bg-neutral-900/80 border border-neutral-800/80 rounded-2xl w-fit">
        {[
          { id: "all", label: "All Content", icon: Film },
          { id: "popular", label: "🔥 Top Watched", icon: Flame },
          { id: "shorts", label: "⚡ Shorts", icon: Zap },
          { id: "playlists", label: "📁 Playlists", icon: ListMusic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                isSel
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "text-neutral-400 hover:text-neutral-200"
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
          {/* ── 4. FEATURED SPOTLIGHT HERO VIDEO ── */}
          {featuredVideo &&
            (activeFilter === "all" || activeFilter === "popular") && (
              <div className="relative rounded-3xl bg-gradient-to-r from-red-950/25 via-neutral-900/70 to-neutral-950 border border-red-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    </span>
                    <span className="text-xs font-black font-mono text-red-400 uppercase tracking-widest">
                      Featured Spotlight • Top Story
                    </span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-neutral-400">
                    HD 1080p
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  {/* Video Preview with Hover Zoom & Play Button */}
                  <div
                    className="lg:col-span-6 relative aspect-video bg-black rounded-2xl overflow-hidden cursor-pointer group shadow-2xl border border-white/10"
                    onClick={() =>
                      onWatchVideo(featuredVideo.id, featuredVideo)
                    }
                  >
                    <img
                      src={
                        featuredVideo.thumbnail ||
                        `https://i.ytimg.com/vi/${featuredVideo.id}/hqdefault.jpg`
                      }
                      alt={featuredVideo.title}
                      onError={(e) => {
                        (
                          e.currentTarget as HTMLImageElement
                        ).src = `https://i.ytimg.com/vi/${featuredVideo.id}/hqdefault.jpg`;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all duration-300">
                      <div className="p-4 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.6)] transform group-hover:scale-110 transition-transform duration-300 border border-red-400/40">
                        <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono font-bold text-white backdrop-blur-sm border border-white/10">
                      Play in Theater
                    </div>
                  </div>

                  {/* Details Column */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="space-y-2">
                      <h2
                        className="text-xl sm:text-2xl font-black text-white font-sans leading-tight cursor-pointer hover:text-red-300 transition-colors"
                        onClick={() =>
                          onWatchVideo(featuredVideo.id, featuredVideo)
                        }
                      >
                        {featuredVideo.title}
                      </h2>
                      {featuredVideo.description && (
                        <p className="text-xs sm:text-sm text-neutral-400 font-sans line-clamp-3 leading-relaxed">
                          {featuredVideo.description}
                        </p>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 font-bold">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />{" "}
                        {featuredVideo.view_count} views
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />{" "}
                        {featuredVideo.like_count} likes
                      </span>
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                        <Calendar className="w-3.5 h-3.5 text-neutral-500" />{" "}
                        {formatDate(featuredVideo.published_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <button
                        onClick={() =>
                          onWatchVideo(featuredVideo.id, featuredVideo)
                        }
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black font-mono rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer active:scale-95 border border-red-400/30"
                      >
                        <Play className="w-4 h-4 fill-white" />
                        <span>Watch in Theater</span>
                      </button>
                      <button
                        onClick={(e) =>
                          handleCopyLink(
                            featuredVideo.youtube_url,
                            featuredVideo.id,
                            e
                          )
                        }
                        className="flex items-center gap-1.5 px-4 py-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        {copiedId === featuredVideo.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">
                              Copied Link
                            </span>
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

          {/* ── 5. TOP PERFORMING STORIES (LEADERBOARD) ── */}
          {(activeFilter === "all" || activeFilter === "popular") && (
            topVideos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white font-sans tracking-tight">
                        Top Performing Videos
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Your channel's highest watched and most engaged content
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topVideos.map((vid, idx) => (
                    <div
                      key={vid.id}
                      onClick={() => onWatchVideo(vid.id, vid)}
                      className="group relative bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-amber-500/40 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
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
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/85 backdrop-blur-md text-[10px] font-mono font-black text-amber-400 border border-amber-500/30">
                          {idx === 0
                            ? "🥇 #1 Top"
                            : idx === 1
                            ? "🥈 #2 Top"
                            : idx === 2
                            ? "🥉 #3 Top"
                            : `#${idx + 1}`}
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <div className="p-3 bg-red-600 rounded-2xl shadow-xl">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                          {vid.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] font-mono pt-2 border-t border-neutral-800/60">
                          <span className="text-sky-400 font-bold flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {vid.view_count}
                          </span>
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> {vid.like_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeFilter === "popular" ? (
              <div className="p-12 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
                <Trophy className="w-12 h-12 text-neutral-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  No Popular Videos Yet
                </h4>
                <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
                  Videos and their performance analytics will rank here as they accumulate views and likes.
                </p>
              </div>
            ) : null
          )}

          {/* ── 6. PLAYLISTS & SERIES SHELF ── */}
          {(activeFilter === "all" || activeFilter === "playlists") && (
            playlists.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#3B82F6]/10 border border-[#3B82F6]/25 rounded-xl text-[#3B82F6]">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white font-sans tracking-tight">
                        Series &amp; Playlists
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Curated episode collections on your YouTube channel
                      </p>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("playlists")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-[#60A5FA] hover:text-white transition-all cursor-pointer"
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
                      className="group bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-[#3B82F6]/50 hover:shadow-xl transition-all cursor-pointer flex flex-col"
                    >
                      <div className="relative aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden">
                        {pl.thumbnail ? (
                          <img
                            src={pl.thumbnail}
                            alt={pl.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <ListMusic className="w-10 h-10 text-neutral-600" />
                        )}
                        <div className="absolute inset-y-0 right-0 w-24 bg-black/85 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1 text-white">
                          <Layers className="w-4 h-4 text-[#60A5FA]" />
                          <span className="text-xs font-black font-mono">
                            {pl.item_count ?? "?"}
                          </span>
                          <span className="text-[8px] font-mono uppercase text-neutral-400">
                            Videos
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-[#93C5FD] transition-colors font-sans">
                          {pl.title}
                        </h4>
                        <p className="text-[10px] font-mono text-neutral-500 capitalize">
                          {pl.privacy || "public"} series
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeFilter === "playlists" ? (
              <div className="p-12 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
                <ListMusic className="w-12 h-12 text-neutral-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  No Playlists Found
                </h4>
                <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
                  Create playlists and series to organize your chapters and video episodes.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("playlists")}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Create Playlist</span>
                  </button>
                )}
              </div>
            ) : null
          )}

          {/* ── 7. SHORTS SHELF ── */}
          {(activeFilter === "all" || activeFilter === "shorts") && (
            shorts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-gradient-to-br from-red-500/20 to-transparent rounded-xl border border-red-500/30">
                      <Zap className="w-4 h-4 text-red-500 fill-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white font-sans tracking-tight">
                        YouTube Shorts
                      </h3>
                      <p className="text-[11px] text-neutral-400 font-mono">
                        Vertical micro-episodes generated for mobile discovery
                      </p>
                    </div>
                  </div>

                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("shorts")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer group shadow-sm"
                    >
                      <span>View All ({shorts.length})</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>

                {/* Horizontal Scrollable Shorts Reel */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {shorts.slice(0, 6).map((short) => (
                    <div
                      key={short.id}
                      onClick={() => onWatchVideo(short.id, short)}
                      className="group relative aspect-[9/16] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80 hover:border-red-500/60 shadow-lg hover:shadow-[0_0_24px_rgba(239,68,68,0.25)] transition-all duration-300 cursor-pointer flex flex-col justify-end"
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
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                          {short.title}
                        </h4>
                        <p className="text-[10px] text-neutral-300 font-mono flex items-center gap-1">
                          <Eye className="w-3 h-3 text-sky-400" />{" "}
                          {short.view_count}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeFilter === "shorts" ? (
              <div className="p-12 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
                <Zap className="w-12 h-12 text-neutral-600 mx-auto" />
                <h4 className="text-sm font-bold text-white">
                  No YouTube Shorts Found
                </h4>
                <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
                  Generate vertical short-form episodes from your comic panels for YouTube Shorts.
                </p>
                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("studio")}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Short</span>
                  </button>
                )}
              </div>
            ) : null
          )}

          {/* ── 8. RECENT UPLOADS GRID ── */}
          {activeFilter === "all" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 text-[#3B82F6]">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white font-sans tracking-tight">
                      Recent Uploads
                    </h3>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      Latest storyboards and episodes published to YouTube
                    </p>
                  </div>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("videos")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 hover:text-white transition-all cursor-pointer group shadow-sm"
                  >
                    <span>View All ({videos.length})</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {videos.length === 0 ? (
                <div className="p-12 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
                  <Youtube className="w-12 h-12 text-neutral-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">
                    No videos published yet
                  </h4>
                  <p className="text-xs text-neutral-400 font-mono max-w-sm mx-auto">
                    Export your first webtoon animation from the Creative Suite
                    directly to your YouTube channel.
                  </p>
                  {onNavigateTab && (
                    <button
                      onClick={() => onNavigateTab("studio")}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload First Video</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recentUploads.map((vid) => (
                    <div
                      key={vid.id}
                      className="group bg-neutral-900/60 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-red-500/40 hover:shadow-xl transition-all duration-300 flex flex-col backdrop-blur-sm"
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
                          <div className="p-3 bg-red-600/95 rounded-2xl shadow-xl border border-red-400/40">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      <div className="p-4 flex flex-col gap-2 flex-1">
                        <h4
                          className="text-xs font-bold text-neutral-200 line-clamp-2 font-sans cursor-pointer hover:text-red-300 transition-colors leading-snug"
                          onClick={() => onWatchVideo(vid.id, vid)}
                        >
                          {vid.title}
                        </h4>
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {formatDate(vid.published_at)}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-3 border-t border-neutral-800/60 mt-auto">
                          <span className="flex items-center gap-1 font-bold text-sky-400">
                            <Eye className="w-3 h-3" /> {vid.view_count}
                          </span>
                          <span className="flex items-center gap-1 font-bold text-emerald-400">
                            <ThumbsUp className="w-3 h-3" /> {vid.like_count}
                          </span>
                          <button
                            onClick={() => onViewComments(vid.id)}
                            className="flex items-center gap-1 hover:text-[#93C5FD] transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-[#3B82F6]" />{" "}
                            {vid.comment_count}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
