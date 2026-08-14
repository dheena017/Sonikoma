import React, { useState, useEffect, useMemo } from "react";
import {
  Zap,
  Play,
  Eye,
  ThumbsUp,
  MessageSquare,
  Search,
  RefreshCw,
  Loader2,
  ExternalLink,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";
import YouTubeShortsPlayer from "./YouTubeShortsPlayer";

interface YouTubeShortsPanelProps {
  onNavigateStudio?: () => void;
}

export default function YouTubeShortsPanel({ onNavigateStudio }: YouTubeShortsPanelProps) {
  const [shorts, setShorts] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes">("newest");
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);

  const fetchShorts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";
      const res = await fetch("/api/export/youtube/videos?max_results=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allVideos: YouTubeVideoItem[] = data.videos || [];
        // Filter for shorts (e.g. title includes #shorts, #short, or short tag)
        // If not many tagged with #shorts, also include vertical formatted or all short videos
        const filtered = allVideos.filter(
          (v) =>
            v.title?.toLowerCase().includes("#short") ||
            v.title?.toLowerCase().includes("short") ||
            v.description?.toLowerCase().includes("#shorts")
        );
        // Fallback: If channel hasn't explicitly tagged with #shorts, show all as available in shorts mode
        setShorts(filtered.length > 0 ? filtered : allVideos);
      }
    } catch (err) {
      console.warn("Failed to load shorts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const sortedShorts = useMemo(() => {
    let list = [...shorts];
    if (search.trim()) {
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(search.toLowerCase()) ||
          s.description?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sortBy === "popular") {
      list.sort((a, b) => {
        const av = parseInt(a.view_count?.replace(/,/g, "") || "0");
        const bv = parseInt(b.view_count?.replace(/,/g, "") || "0");
        return bv - av;
      });
    } else if (sortBy === "likes") {
      list.sort((a, b) => {
        const al = parseInt(a.like_count?.replace(/,/g, "") || "0");
        const bl = parseInt(b.like_count?.replace(/,/g, "") || "0");
        return bl - al;
      });
    }
    return list;
  }, [shorts, search, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-purple-950/30 to-neutral-950 p-5 rounded-2xl border border-red-900/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/30">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-sans tracking-tight">
                YouTube Shorts Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-mono font-bold uppercase">
                Vertical Video
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Browse, watch in reel mode, and analyze vertical short-form content
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchShorts}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Shorts"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Short
            </button>
          )}
        </div>
      </div>

      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Shorts..."
            className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-red-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
          />
        </div>

        {/* Sorting */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
          <span className="text-[11px] font-mono text-neutral-400 uppercase">Sort:</span>
          <div className="flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            {(
              [
                { id: "newest", label: "Latest" },
                { id: "popular", label: "Most Viewed" },
                { id: "likes", label: "Top Liked" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  sortBy === opt.id
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <span className="text-[11px] font-mono text-neutral-500 ml-2">
            {sortedShorts.length} Shorts
          </span>
        </div>
      </div>

      {/* Shorts 9:16 Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden animate-pulse space-y-2 p-0"
            >
              <div className="aspect-[9/16] bg-neutral-800/80 rounded-t-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
              <div className="p-3 space-y-2">
                <div className="h-3 bg-neutral-800/80 rounded w-4/5" />
                <div className="h-2.5 bg-neutral-800/50 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedShorts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-neutral-800/60 rounded-3xl bg-neutral-950/40">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <Zap className="w-8 h-8 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-200">No Shorts Found</p>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Publish vertical shorts in the Studio tab to see them here!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedShorts.map((short, idx) => (
            <div
              key={short.id}
              onClick={() => setActiveReelIndex(idx)}
              className="group relative aspect-[9/16] bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80 hover:border-red-500/60 shadow-xl hover:shadow-2xl hover:shadow-red-950/30 transition-all duration-300 cursor-pointer flex flex-col justify-end"
            >
              {/* Poster Image */}
              <img
                src={short.thumbnail}
                alt={short.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />

              {/* Play Badge on Hover */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-3 bg-red-600/90 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>

              {/* Top Tag */}
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-neutral-800 text-[9px] font-mono font-bold text-red-400 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-red-400" />
                  Short
                </span>
              </div>

              {/* Bottom Meta */}
              <div className="relative z-10 p-3 space-y-1.5 pointer-events-none">
                <h4 className="text-xs font-bold text-white font-sans line-clamp-2 leading-snug drop-shadow">
                  {short.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3 text-sky-400" />
                    {short.view_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3 text-emerald-400" />
                    {short.like_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reel Player Modal */}
      {activeReelIndex !== null && (
        <YouTubeShortsPlayer
          shorts={sortedShorts}
          currentIndex={activeReelIndex}
          onClose={() => setActiveReelIndex(null)}
          onNavigateIndex={(newIdx) => setActiveReelIndex(newIdx)}
        />
      )}
    </div>
  );
}
