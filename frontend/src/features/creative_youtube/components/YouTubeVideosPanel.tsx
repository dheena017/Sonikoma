import React, { useState, useEffect, useMemo } from "react";
import {
  Video,
  Play,
  Eye,
  ThumbsUp,
  MessageSquare,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  LayoutGrid,
  List,
  Calendar,
  SlidersHorizontal,
  Plus,
  Zap,
  Film,
  Share2,
  Check,
  X,
  TrendingUp,
  FolderPlus,
  Clock,
  Sparkles,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";

interface YouTubeVideosPanelProps {
  onWatchVideo: (videoId: string, video: YouTubeVideoItem) => void;
  onViewComments: (videoId: string) => void;
  onNavigateStudio?: () => void;
}

export default function YouTubeVideosPanel({
  onWatchVideo,
  onViewComments,
  onNavigateStudio,
}: YouTubeVideosPanelProps) {
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<"all" | "videos" | "shorts">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views" | "likes" | "comments">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/videos?max_results=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch (err) {
      console.warn("Failed to fetch videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let list = [...videos];

    // Format filter (Shorts vs Long-form)
    if (formatFilter === "shorts") {
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes("#short") ||
          v.title?.toLowerCase().includes("short") ||
          v.description?.toLowerCase().includes("#shorts")
      );
    } else if (formatFilter === "videos") {
      list = list.filter(
        (v) =>
          !v.title?.toLowerCase().includes("#short") &&
          !v.title?.toLowerCase().includes("short") &&
          !v.description?.toLowerCase().includes("#shorts")
      );
    }

    // Privacy Filter
    if (privacyFilter !== "all") {
      list = list.filter((v) => v.privacy_status?.toLowerCase() === privacyFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) => v.title?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "views") {
        const av = parseInt(a.view_count?.replace(/,/g, "") || "0");
        const bv = parseInt(b.view_count?.replace(/,/g, "") || "0");
        return bv - av;
      }
      if (sortBy === "likes") {
        const al = parseInt(a.like_count?.replace(/,/g, "") || "0");
        const bl = parseInt(b.like_count?.replace(/,/g, "") || "0");
        return bl - al;
      }
      if (sortBy === "comments") {
        const ac = parseInt(a.comment_count?.replace(/,/g, "") || "0");
        const bc = parseInt(b.comment_count?.replace(/,/g, "") || "0");
        return bc - ac;
      }
      if (sortBy === "oldest") {
        return new Date(a.published_at || 0).getTime() - new Date(b.published_at || 0).getTime();
      }
      // default: newest
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    });

    return list;
  }, [videos, privacyFilter, formatFilter, search, sortBy]);

  // Aggregated stats
  const totalViews = useMemo(() => {
    return videos.reduce((acc, v) => acc + (parseInt(v.view_count?.replace(/,/g, "") || "0") || 0), 0);
  }, [videos]);

  const totalLikes = useMemo(() => {
    return videos.reduce((acc, v) => acc + (parseInt(v.like_count?.replace(/,/g, "") || "0") || 0), 0);
  }, [videos]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCopy = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isShortVideo = (v: YouTubeVideoItem) => {
    return (
      v.title?.toLowerCase().includes("#short") ||
      v.title?.toLowerCase().includes("short") ||
      v.description?.toLowerCase().includes("#shorts")
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. HEADER & KPI SUMMARY BANNER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950 p-6 rounded-3xl border border-red-900/30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl shadow-xl shadow-red-600/30 shrink-0">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                Channel Videos &amp; Catalog
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold">
                {videos.length} Uploads
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Manage, analyze, search, and watch your published YouTube video catalog
            </p>
          </div>
        </div>

        {/* Aggregated Stats & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 px-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Eye className="w-3.5 h-3.5" />
              {totalViews.toLocaleString()} views
            </span>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ThumbsUp className="w-3.5 h-3.5" />
              {totalLikes.toLocaleString()} likes
            </span>
          </div>

          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-mono shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          )}

          <button
            onClick={fetchVideos}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Videos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-red-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH, FILTER & TOOLBAR ── */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Bar */}
          <div className="md:col-span-5 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by video title, keywords, tags..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-neutral-500 font-sans focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Format Filter Pills */}
          <div className="md:col-span-3 flex items-center gap-1 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            {[
              { id: "all", label: "All Formats", icon: Film },
              { id: "videos", label: "HD Videos", icon: Video },
              { id: "shorts", label: "Shorts", icon: Zap },
            ].map((f) => {
              const isSel = formatFilter === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormatFilter(f.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                    isSel ? "bg-red-600 text-white shadow-sm" : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Privacy & Sort Dropdowns */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={privacyFilter}
              onChange={(e) => setPrivacyFilter(e.target.value)}
              className="w-1/2 bg-neutral-950 border border-neutral-800 focus:border-red-500/60 rounded-xl px-2.5 py-2.5 text-xs text-neutral-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="all">All Privacy</option>
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
            </select>

            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-1/2 bg-neutral-950 border border-neutral-800 focus:border-red-500/60 rounded-xl px-2.5 py-2.5 text-xs text-neutral-300 font-mono focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Views</option>
              <option value="likes">Most Likes</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>

          {/* View Mode Toggle (Grid vs List) */}
          <div className="md:col-span-1 flex items-center justify-end gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-red-600/20 border-red-500 text-red-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-red-600/20 border-red-500 text-red-400"
                  : "bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/60">
          <span>
            Showing <strong className="text-white">{filteredAndSorted.length}</strong> of{" "}
            <strong>{videos.length}</strong> videos
          </span>
          {(search || privacyFilter !== "all" || formatFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setPrivacyFilter("all");
                setFormatFilter("all");
              }}
              className="text-red-400 hover:text-red-300 underline cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── 3. VIDEOS FEED ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">Loading channel videos catalog…</p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="p-16 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
          <Video className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No matching videos found</h3>
          <p className="text-xs text-neutral-500 font-mono max-w-sm mx-auto">
            Try adjusting your search terms or filters above to find published videos.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ── GRID VIEW ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAndSorted.map((vid) => {
            const isShort = isShortVideo(vid);
            return (
              <div
                key={vid.id}
                className="group bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-red-500/40 hover:shadow-2xl transition-all duration-300 flex flex-col backdrop-blur-sm"
              >
                {/* Thumbnail Preview Area */}
                <div
                  className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                  onClick={() => onWatchVideo(vid.id, vid)}
                >
                  <img
                    src={vid.thumbnail || `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`}
                    alt={vid.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${vid.id}/hqdefault.jpg`;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Format Pill */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-[9px] font-mono font-bold text-white border border-white/10 flex items-center gap-1">
                    {isShort ? (
                      <>
                        <Zap className="w-2.5 h-2.5 text-red-400 fill-red-400" />
                        <span>Shorts</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-2.5 h-2.5 text-sky-400" />
                        <span>HD Video</span>
                      </>
                    )}
                  </div>

                  {/* Privacy Badge */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase backdrop-blur-sm border ${
                      vid.privacy_status === "public"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                        : vid.privacy_status === "unlisted"
                        ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                        : "bg-neutral-950/80 text-neutral-400 border-neutral-700/60"
                    }`}
                  >
                    {vid.privacy_status}
                  </div>

                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
                    <div className="p-3.5 bg-gradient-to-br from-red-600 to-rose-600 rounded-2xl shadow-2xl border border-red-400/40 transform group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content & Metadata */}
                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                  <div className="space-y-1">
                    <h4
                      className="text-xs font-bold text-neutral-100 line-clamp-2 font-sans cursor-pointer hover:text-red-300 transition-colors leading-snug"
                      onClick={() => onWatchVideo(vid.id, vid)}
                    >
                      {vid.title}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      {formatDate(vid.published_at)}
                    </p>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="space-y-2.5 pt-3 border-t border-neutral-800/60">
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-neutral-400">
                      <span className="flex items-center gap-1 font-bold text-sky-400">
                        <Eye className="w-3 h-3" /> {vid.view_count}
                      </span>
                      <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <ThumbsUp className="w-3 h-3" /> {vid.like_count}
                      </span>
                      <button
                        onClick={() => onViewComments(vid.id)}
                        className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
                        title="View Comments"
                      >
                        <MessageSquare className="w-3 h-3 text-purple-400" /> {vid.comment_count}
                      </button>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => onWatchVideo(vid.id, vid)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-neutral-950 hover:bg-red-950/40 border border-neutral-800 hover:border-red-500/50 rounded-xl text-[10px] font-mono font-bold text-neutral-300 hover:text-red-300 transition-all cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Theater</span>
                      </button>
                      <button
                        onClick={(e) => handleCopy(vid.youtube_url, vid.id, e)}
                        className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy YouTube Link"
                      >
                        {copiedId === vid.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Share2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={vid.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                        title="Open on YouTube"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── LIST VIEW ── */
        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-xl">
          <div className="divide-y divide-neutral-800/60">
            {filteredAndSorted.map((vid) => (
              <div
                key={vid.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-neutral-950/40 transition-colors group"
              >
                <div
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onWatchVideo(vid.id, vid)}
                >
                  <div className="relative w-28 sm:w-36 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-neutral-800">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate font-sans group-hover:text-red-300 transition-colors">
                        {vid.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                          vid.privacy_status === "public"
                            ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/40"
                            : "text-amber-400 border-amber-900/40 bg-amber-950/40"
                        }`}
                      >
                        {vid.privacy_status}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      Published {formatDate(vid.published_at)}
                    </p>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs font-mono text-neutral-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <Eye className="w-3.5 h-3.5" /> {vid.view_count}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-bold">
                      <ThumbsUp className="w-3.5 h-3.5" /> {vid.like_count}
                    </span>
                    <button
                      onClick={() => onViewComments(vid.id)}
                      className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> {vid.comment_count}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onWatchVideo(vid.id, vid)}
                      className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl text-xs font-bold font-mono transition-colors cursor-pointer"
                    >
                      Watch
                    </button>
                    <button
                      onClick={(e) => handleCopy(vid.youtube_url, vid.id, e)}
                      className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Link"
                    >
                      {copiedId === vid.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={vid.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
