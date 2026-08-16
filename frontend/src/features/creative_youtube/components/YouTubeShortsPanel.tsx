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
  Flame,
  TrendingUp,
  Share2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";
import YouTubeShortsPlayer from "./YouTubeShortsPlayer";

interface YouTubeShortsPanelProps {
  onNavigateStudio?: () => void;
}

export default function YouTubeShortsPanel({
  onNavigateStudio,
}: YouTubeShortsPanelProps) {
  const [shorts, setShorts] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "likes">(
    "newest"
  );
  const [activeReelIndex, setActiveReelIndex] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchShorts = async () => {
    setIsLoading(true);
    try {
      const token =
        localStorage.getItem("sonikoma_token") ||
        localStorage.getItem("token") ||
        "";
      const res = await fetch("/api/export/youtube/videos?max_results=50", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allVideos: YouTubeVideoItem[] = data.videos || [];
        // Filter for shorts
        const filtered = allVideos.filter(
          (v) =>
            v.title?.toLowerCase().includes("#short") ||
            v.title?.toLowerCase().includes("short") ||
            v.description?.toLowerCase().includes("#shorts")
        );
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
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.title?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q)
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
    } else {
      list.sort((a, b) => {
        return (
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime()
        );
      });
    }
    return list;
  }, [shorts, search, sortBy]);

  // Aggregated telemetry
  const totalShortsViews = useMemo(() => {
    return shorts.reduce(
      (acc, s) => acc + (parseInt(s.view_count?.replace(/,/g, "") || "0") || 0),
      0
    );
  }, [shorts]);

  const totalShortsLikes = useMemo(() => {
    return shorts.reduce(
      (acc, s) => acc + (parseInt(s.like_count?.replace(/,/g, "") || "0") || 0),
      0
    );
  }, [shorts]);

  const handleCopy = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. HEADER BANNER & SHORTS TELEMETRY ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-red-950/40 via-purple-950/30 to-neutral-950 p-6 rounded-3xl border border-red-900/30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl shadow-xl shadow-red-600/30 shrink-0">
            <Zap className="w-6 h-6 text-white fill-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                YouTube Shorts Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold uppercase">
                Vertical 9:16
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Continuous fullscreen reel player, performance analytics, and
              vertical story discovery
            </p>
          </div>
        </div>

        {/* Action Controls & Metrics */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-3 px-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-xs font-mono">
            <span className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Eye className="w-3.5 h-3.5" />
              {totalShortsViews.toLocaleString()} views
            </span>
            <span className="text-neutral-700">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ThumbsUp className="w-3.5 h-3.5" />
              {totalShortsLikes.toLocaleString()} likes
            </span>
          </div>

          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold font-mono shadow-md shadow-red-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Short</span>
            </button>
          )}

          <button
            onClick={fetchShorts}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Shorts"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading ? "animate-spin text-red-400" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 2. CONTROLS, SEARCH & FILTER TABS ── */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Shorts by keyword, title, hashtags..."
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

          {/* Quick Sort Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-950 border border-neutral-800 rounded-xl">
            {[
              { id: "newest", label: "Newest", icon: Sparkles },
              { id: "popular", label: "🔥 Top Watched", icon: Flame },
              { id: "likes", label: "❤️ Most Liked", icon: ThumbsUp },
            ].map((f) => {
              const isSel = sortBy === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => setSortBy(f.id as any)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSel
                      ? "bg-red-600 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/60">
          <span>
            Displaying{" "}
            <strong className="text-white">{sortedShorts.length}</strong>{" "}
            vertical shorts
          </span>
          <span className="text-[10px] text-neutral-500">
            Click any card to start full Reels Player
          </span>
        </div>
      </div>

      {/* ── 3. 9:16 VERTICAL SHORTS CARDS GRID ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">
            Loading Shorts reels…
          </p>
        </div>
      ) : sortedShorts.length === 0 ? (
        <div className="p-16 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
          <Zap className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">
            No YouTube Shorts found
          </h3>
          <p className="text-xs text-neutral-500 font-mono max-w-sm mx-auto">
            Upload your first vertical comic short by checking the "#Shorts"
            toggle in Studio.
          </p>
          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-red-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Vertical Short</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {sortedShorts.map((short, idx) => (
            <div
              key={short.id}
              onClick={() => setActiveReelIndex(idx)}
              className="group relative aspect-[9/16] bg-neutral-950 rounded-3xl overflow-hidden border border-neutral-800/80 hover:border-red-500/70 shadow-xl hover:shadow-[0_0_30px_rgba(239,68,68,0.3)] transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              {/* Thumbnail Image */}
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

              {/* Gradient Scrim */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/50 pointer-events-none" />

              {/* Top Bar on Card */}
              <div className="relative z-10 p-3 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-mono font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  Short
                </span>
                <button
                  onClick={(e) => handleCopy(short.youtube_url, short.id, e)}
                  className="p-1 rounded-md bg-black/60 hover:bg-black/90 text-neutral-300 hover:text-white transition-colors backdrop-blur-sm"
                  title="Copy Link"
                >
                  {copiedId === short.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Share2 className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Hover Center Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
                <div className="p-3 bg-red-600 rounded-2xl shadow-2xl border border-red-400/40 transform group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="relative z-10 p-3.5 space-y-1.5">
                <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug font-sans drop-shadow-md group-hover:text-red-200 transition-colors">
                  {short.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-300">
                  <span className="flex items-center gap-1 font-bold text-sky-400">
                    <Eye className="w-3 h-3" />
                    {short.view_count}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-emerald-400">
                    <ThumbsUp className="w-3 h-3" />
                    {short.like_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 4. FULLSCREEN REEL PLAYER MODAL ── */}
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
