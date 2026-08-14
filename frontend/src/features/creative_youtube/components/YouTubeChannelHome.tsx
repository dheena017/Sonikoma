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
  Radio,
  Zap,
  ArrowRight,
  TrendingUp,
  Share2,
  Calendar,
  Sparkles,
} from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };

      const [videosRes, channelRes] = await Promise.all([
        fetch("/api/export/youtube/videos?max_results=50", { headers }),
        fetch("/api/export/youtube/channel/details", { headers }),
      ]);

      if (videosRes.ok) {
        const data = await videosRes.json();
        setVideos(data.videos || []);
      }
      if (channelRes.ok) {
        const data = await channelRes.json();
        setChannel(data);
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

  const recentUploads = useMemo(() => {
    return videos.slice(0, 8);
  }, [videos]);

  const featuredVideo = videos[0] || null;

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* ── Channel Hero Banner & Profile Card ── */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-950">
        {/* Banner Area */}
        <div className="relative w-full h-40 sm:h-56 md:h-64 overflow-hidden bg-neutral-950">
          {channel?.banner_url ? (
            <img
              src={channel.banner_url}
              alt="Channel Banner"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-red-950/70 via-purple-950/60 to-neutral-950 relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:20px_20px]" />
              <div className="flex items-center gap-3 text-red-500/30">
                <Youtube className="w-16 h-16" />
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
            {channel?.thumbnail ? (
              <div className="relative shrink-0">
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-neutral-950 ring-2 ring-white/10 shadow-2xl bg-neutral-900"
                />
                <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950 shadow-md" />
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900 border-4 border-neutral-950 ring-2 ring-white/10 flex items-center justify-center shrink-0 shadow-2xl">
                <Youtube className="w-12 h-12 text-red-500" />
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
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-300 font-bold shadow-sm">
                    <Video className="w-3.5 h-3.5 text-purple-400" />
                    <strong>{channel.video_count}</strong> videos
                  </span>
                )}
                {channel?.view_count && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-bold shadow-sm">
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    <strong>{channel.view_count}</strong> views
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-end">
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
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold font-mono text-neutral-200 hover:text-white transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
              <span>Open on YouTube</span>
            </a>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer shadow-md active:scale-95"
              title="Refresh Channel Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Spotlight Hero Skeleton */}
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-3xl p-6 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 aspect-video bg-neutral-800/80 rounded-2xl" />
            <div className="lg:col-span-5 space-y-4 justify-center flex flex-col">
              <div className="h-4 bg-neutral-800/80 rounded-md w-1/3" />
              <div className="h-6 bg-neutral-800/90 rounded-md w-4/5" />
              <div className="h-4 bg-neutral-800/50 rounded-md w-full" />
              <div className="h-4 bg-neutral-800/50 rounded-md w-2/3" />
              <div className="h-10 bg-neutral-800/70 rounded-xl w-1/2 pt-2" />
            </div>
          </div>

          {/* Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl p-0 animate-pulse space-y-3">
                <div className="aspect-video bg-neutral-800/70 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3.5 bg-neutral-800/80 rounded w-4/5" />
                  <div className="h-3 bg-neutral-800/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Featured Spotlight Video Hero ── */}
          {featuredVideo && (
            <div className="relative rounded-3xl bg-gradient-to-r from-red-950/25 via-neutral-900/70 to-neutral-950 border border-red-500/20 p-6 md:p-8 shadow-2xl backdrop-blur-xl overflow-hidden">
              {/* Ambient Red Spot Glow */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                  </span>
                  <span className="text-xs font-black font-mono text-red-400 uppercase tracking-widest">
                    Featured Premiere • Latest Video
                  </span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-neutral-900/80 border border-neutral-800 text-[11px] font-mono text-neutral-400">
                  HD • 1080p
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Video Preview with Hover Zoom & Play Button */}
                <div
                  className="lg:col-span-6 relative aspect-video bg-black rounded-2xl overflow-hidden cursor-pointer group shadow-2xl border border-white/10"
                  onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
                >
                  <img
                    src={featuredVideo.thumbnail}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all duration-300">
                    <div className="p-4 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.6)] transform group-hover:scale-110 transition-transform duration-300 border border-red-400/40">
                      <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono font-bold text-white backdrop-blur-sm border border-white/10">
                    Play Video
                  </div>
                </div>

                {/* Details Column */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="space-y-2">
                    <h2
                      className="text-xl sm:text-2xl font-black text-white font-sans leading-tight cursor-pointer hover:text-red-300 transition-colors"
                      onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
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
                      <Eye className="w-3.5 h-3.5 text-sky-400" /> {featuredVideo.view_count} views
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {featuredVideo.like_count} likes
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" /> {formatDate(featuredVideo.published_at)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2 flex-wrap">
                    <button
                      onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black font-mono rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all cursor-pointer active:scale-95 border border-red-400/30"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Watch in Theater</span>
                    </button>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab("videos")}
                        className="flex items-center gap-2 px-5 py-3 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-bold font-mono rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
                      >
                        <span>All Videos</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Section: ⚡ Latest Shorts Shelf ── */}
          {shorts.length > 0 && (
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
                      Fast-paced vertical shorts generated from your webtoon strips
                    </p>
                  </div>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("shorts")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer group shadow-sm"
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
                      src={short.thumbnail}
                      alt={short.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                    <div className="relative z-10 p-3 space-y-1">
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                        {short.title}
                      </h4>
                      <p className="text-[10px] text-neutral-300 font-mono flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" /> {short.view_count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Section: 🎬 Recent Uploads Grid ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-neutral-900 rounded-xl border border-neutral-800 text-purple-400">
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800 text-xs font-mono font-bold text-neutral-300 hover:text-white transition-all cursor-pointer group shadow-sm"
                >
                  <span>View All ({videos.length})</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Grid */}
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
                      src={vid.thumbnail}
                      alt={vid.title}
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
                        className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-purple-400" /> {vid.comment_count}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
