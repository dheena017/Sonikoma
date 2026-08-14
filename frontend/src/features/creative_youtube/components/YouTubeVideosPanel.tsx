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
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "views" | "likes" | "comments">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
        return (new Date(a.published_at || 0).getTime()) - (new Date(b.published_at || 0).getTime());
      }
      // default: newest
      return (new Date(b.published_at || 0).getTime()) - (new Date(a.published_at || 0).getTime());
    });

    return list;
  }, [videos, privacyFilter, search, sortBy]);

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const privacyBadge = (p: string) => {
    if (p === "public")
      return "text-emerald-400 border-emerald-900/40 bg-emerald-950/50";
    if (p === "unlisted")
      return "text-amber-400 border-amber-900/40 bg-amber-950/50";
    return "text-neutral-400 border-neutral-800 bg-neutral-950/50";
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900/80 to-neutral-950 p-5 rounded-2xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-sans tracking-tight">
                Channel Videos
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 text-[10px] font-mono font-bold">
                {videos.length} Uploads
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Manage, search, and watch your published YouTube video catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchVideos}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Videos"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload New Video
            </button>
          )}
        </div>
      </div>

      {/* Filter, Search & View Modes */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description..."
            className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
          />
        </div>

        {/* Filters & View Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Privacy Status */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            {["all", "public", "unlisted", "private"].map((p) => (
              <button
                key={p}
                onClick={() => setPrivacyFilter(p)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  privacyFilter === p
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-mono text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-neutral-950">Newest First</option>
              <option value="oldest" className="bg-neutral-950">Oldest First</option>
              <option value="views" className="bg-neutral-950">Most Viewed</option>
              <option value="likes" className="bg-neutral-950">Most Liked</option>
              <option value="comments" className="bg-neutral-950">Most Discussed</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "grid" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "list" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden p-0 animate-pulse space-y-3"
            >
              <div className="aspect-video bg-neutral-800/70 rounded-t-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="h-3.5 bg-neutral-800/80 rounded-md w-4/5" />
                <div className="h-3 bg-neutral-800/50 rounded-md w-3/5" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-2.5 bg-neutral-800/60 rounded w-16" />
                  <div className="h-2.5 bg-neutral-800/60 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-neutral-800/60 rounded-3xl bg-neutral-950/40">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <Video className="w-8 h-8 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-200">No Videos Found</p>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              {search ? `No results for "${search}"` : "Upload a video in the Studio tab to see it here"}
            </p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredAndSorted.map((vid) => (
            <div
              key={vid.id}
              className="group bg-neutral-900/70 border border-neutral-800/80 rounded-2xl overflow-hidden hover:border-red-500/40 hover:shadow-xl hover:shadow-red-950/20 transition-all flex flex-col"
            >
              {/* Thumbnail Container */}
              <div
                className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                onClick={() => onWatchVideo(vid.id, vid)}
              >
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="p-3 bg-red-600/90 rounded-full shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>

                {/* Privacy Badge */}
                <span
                  className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono border uppercase backdrop-blur-md ${privacyBadge(
                    vid.privacy_status
                  )}`}
                >
                  {vid.privacy_status}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="space-y-1">
                  <h3
                    className="text-xs font-bold text-neutral-200 line-clamp-2 font-sans leading-snug cursor-pointer hover:text-red-300 transition-colors"
                    onClick={() => onWatchVideo(vid.id, vid)}
                  >
                    {vid.title}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono">
                    {formatDate(vid.published_at)}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-3 border-t border-neutral-800/60 mt-auto">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-sky-400" /> {vid.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> {vid.like_count}
                  </span>
                  <button
                    onClick={() => onViewComments(vid.id)}
                    className="flex items-center gap-1 hover:text-purple-300 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> {vid.comment_count}
                  </button>
                  <a
                    href={vid.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-white transition-colors"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-neutral-500 hover:text-white" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-3">
          {filteredAndSorted.map((vid) => (
            <div
              key={vid.id}
              className="group flex flex-col sm:flex-row sm:items-center gap-4 p-3.5 bg-neutral-900/70 border border-neutral-800/80 rounded-2xl hover:border-red-500/40 transition-all"
            >
              {/* Thumbnail */}
              <div
                className="relative w-full sm:w-48 aspect-video bg-black rounded-xl overflow-hidden shrink-0 cursor-pointer"
                onClick={() => onWatchVideo(vid.id, vid)}
              >
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono border uppercase ${privacyBadge(
                      vid.privacy_status
                    )}`}
                  >
                    {vid.privacy_status}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {formatDate(vid.published_at)}
                  </span>
                </div>
                <h3
                  className="text-sm font-bold text-white line-clamp-1 font-sans cursor-pointer hover:text-red-300 transition-colors"
                  onClick={() => onWatchVideo(vid.id, vid)}
                >
                  {vid.title}
                </h3>
                {vid.description && (
                  <p className="text-xs text-neutral-400 line-clamp-1 font-sans">
                    {vid.description}
                  </p>
                )}
              </div>

              {/* Actions & Stats */}
              <div className="flex items-center gap-4 shrink-0 text-xs font-mono text-neutral-400">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-sky-400" />
                  {vid.view_count}
                </span>
                <span className="flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4 text-emerald-400" />
                  {vid.like_count}
                </span>
                <button
                  onClick={() => onWatchVideo(vid.id, vid)}
                  className="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer"
                >
                  Watch
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
