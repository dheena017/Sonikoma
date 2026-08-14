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
      {/* Channel Hero Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-neutral-800/80 shadow-2xl bg-neutral-950">
        {/* Banner */}
        {channel?.banner_url ? (
          <img
            src={channel.banner_url}
            alt="Channel Banner"
            className="w-full h-36 sm:h-52 object-cover"
          />
        ) : (
          <div className="w-full h-36 sm:h-52 bg-gradient-to-br from-red-950/60 via-purple-950/50 to-neutral-950 relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff0000_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>
        )}

        {/* Channel Identity Overlay */}
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-end gap-5 bg-gradient-to-t from-neutral-950 to-neutral-950/40 -mt-12 sm:-mt-14 relative">
          {channel?.thumbnail ? (
            <img
              src={channel.thumbnail}
              alt={channel.title}
              className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-neutral-950 shadow-2xl shrink-0"
            />
          ) : (
            <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-3xl bg-neutral-900 border-4 border-neutral-950 flex items-center justify-center shrink-0">
              <Youtube className="w-12 h-12 text-neutral-500" />
            </div>
          )}

          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-3xl font-black text-white font-sans tracking-tight truncate">
                {channel?.title || "YouTube Channel"}
              </h1>
              {channel?.id && (
                <span title="Verified Channel" className="flex items-center">
                  <BadgeCheck className="w-6 h-6 text-red-500 shrink-0" />
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs font-mono text-neutral-400">
              {channel?.custom_url && (
                <span className="text-neutral-300 font-bold">{channel.custom_url}</span>
              )}
              {channel?.subscriber_count && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-red-400" />
                  <strong className="text-white">{channel.subscriber_count}</strong> subscribers
                </span>
              )}
              {channel?.video_count && (
                <span className="flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-400" />
                  <strong className="text-white">{channel.video_count}</strong> videos
                </span>
              )}
              {channel?.view_count && (
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <strong className="text-white">{channel.view_count}</strong> views
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
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
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold font-mono text-neutral-300 hover:text-white transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open on YouTube
            </a>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
              title="Refresh Channel"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Spotlight Hero Skeleton */}
          <div className="bg-neutral-900/40 border border-neutral-800/60 rounded-3xl p-5 md:p-6 animate-pulse grid grid-cols-1 lg:grid-cols-12 gap-6">
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
          {/* Featured Spotlight Video Hero (if available) */}
          {featuredVideo && (
            <div className="bg-gradient-to-r from-red-950/20 via-neutral-900/60 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span className="text-xs font-black font-mono text-red-400 uppercase tracking-widest">
                  Featured Premiere / Latest Video
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Video Preview */}
                <div
                  className="lg:col-span-6 relative aspect-video bg-black rounded-2xl overflow-hidden cursor-pointer group shadow-xl border border-neutral-800"
                  onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
                >
                  <img
                    src={featuredVideo.thumbnail}
                    alt={featuredVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                    <div className="p-4 bg-red-600 rounded-full shadow-2xl transform group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="lg:col-span-6 space-y-4">
                  <div className="space-y-2">
                    <h2
                      className="text-lg sm:text-xl font-black text-white font-sans leading-tight cursor-pointer hover:text-red-300 transition-colors"
                      onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
                    >
                      {featuredVideo.title}
                    </h2>
                    {featuredVideo.description && (
                      <p className="text-xs text-neutral-400 font-sans line-clamp-3 leading-relaxed">
                        {featuredVideo.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-sky-400" /> {featuredVideo.view_count} views
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {featuredVideo.like_count} likes
                    </span>
                    <span className="text-neutral-500 font-mono">
                      {formatDate(featuredVideo.published_at)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => onWatchVideo(featuredVideo.id, featuredVideo)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Watch in Theater
                    </button>
                    {onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab("videos")}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-mono rounded-xl transition-all cursor-pointer"
                      >
                        All Videos
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: ⚡ Latest Shorts Shelf */}
          {shorts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-600/20 rounded-lg border border-red-500/30">
                    <Zap className="w-4 h-4 text-red-500 fill-red-500" />
                  </div>
                  <h3 className="text-base font-black text-white font-sans tracking-tight">
                    YouTube Shorts
                  </h3>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab("shorts")}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer group"
                  >
                    View All Shorts ({shorts.length})
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
                    className="group relative aspect-[9/16] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800 hover:border-red-500/60 shadow-lg hover:shadow-xl hover:shadow-red-950/30 transition-all cursor-pointer flex flex-col justify-end"
                  >
                    <img
                      src={short.thumbnail}
                      alt={short.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
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

          {/* Section: 🎬 Recent Uploads Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-neutral-800 rounded-lg border border-neutral-700">
                  <Video className="w-4 h-4 text-neutral-300" />
                </div>
                <h3 className="text-base font-black text-white font-sans tracking-tight">
                  Recent Uploads
                </h3>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab("videos")}
                  className="flex items-center gap-1.5 text-xs font-mono font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer group"
                >
                  View All Videos ({videos.length})
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentUploads.map((vid) => (
                <div
                  key={vid.id}
                  className="group bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-red-500/40 hover:shadow-xl transition-all flex flex-col"
                >
                  <div
                    className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                    onClick={() => onWatchVideo(vid.id, vid)}
                  >
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <div className="p-3 bg-red-600/90 rounded-full shadow-xl">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2 flex-1">
                    <h4
                      className="text-xs font-bold text-neutral-200 line-clamp-2 font-sans cursor-pointer hover:text-red-300 transition-colors"
                      onClick={() => onWatchVideo(vid.id, vid)}
                    >
                      {vid.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {formatDate(vid.published_at)}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-2 border-t border-neutral-800/60 mt-auto">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-sky-400" /> {vid.view_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 text-emerald-400" /> {vid.like_count}
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
