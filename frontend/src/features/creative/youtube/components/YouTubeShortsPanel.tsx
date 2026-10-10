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
      const res = await fetch("/api/v1/export/youtube/videos?max_results=50", {
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
        setShorts(filtered);
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
      {/* ── CONTROLS, SEARCH & FILTER TABS ── */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Shorts by title, hashtags..."
              className="w-full bg-[#1E1E1E] border border-[#2F2F2F] focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] font-sans focus:outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#E5E5E5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Sort Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-[#1E1E1E] border border-[#2F2F2F] rounded-xl">
              {[
                { id: "newest", label: "Newest", icon: Sparkles },
                { id: "popular", label: "Top Watched", icon: Flame },
                { id: "likes", label: "Most Liked", icon: ThumbsUp },
              ].map((f) => {
                const isSel = sortBy === f.id;
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSortBy(f.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-all cursor-pointer ${
                      isSel
                        ? "bg-red-600 text-white shadow-sm border border-red-500/50"
                        : "text-[#9CA3AF] hover:text-[#E5E5E5] border border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchShorts}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer shadow-sm active:scale-95 shrink-0"
              title="Refresh Shorts"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoading ? "animate-spin text-red-400" : ""
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-sans text-[#9CA3AF] pt-2 border-t border-[#2F2F2F] flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <span>
              Displaying <strong className="text-[#E5E5E5]">{sortedShorts.length}</strong> Shorts
            </span>
            <span className="text-[#4B5563]">•</span>
            <span className="text-[#60A5FA] font-medium">{totalShortsViews.toLocaleString()} views</span>
            <span className="text-[#4B5563]">•</span>
            <span className="text-[#34D399] font-medium">{totalShortsLikes.toLocaleString()} likes</span>
          </div>
        </div>
      </div>

      {/* ── 3. 9:16 VERTICAL SHORTS CARDS GRID ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-[#9CA3AF] font-sans">
            Loading Shorts reels…
          </p>
        </div>
      ) : sortedShorts.length === 0 ? (
        <div className="p-16 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-3">
          <Zap className="w-10 h-10 text-[#6B7280] mx-auto" />
          <h3 className="text-sm font-semibold text-[#E5E5E5] font-sans">
            No YouTube Shorts found
          </h3>
          <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
            Vertical uploads with #Shorts on YouTube will be organized here.
          </p>
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
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[9px] font-sans font-bold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  Short
                </span>
                <button
                  onClick={(e) => handleCopy(short.youtube_url, short.id, e)}
                  className="p-1 rounded-md bg-black/60 hover:bg-black/90 text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors backdrop-blur-sm cursor-pointer"
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
                <h4 className="text-xs font-semibold text-[#E5E5E5] line-clamp-2 leading-snug font-sans drop-shadow-md group-hover:text-red-400 transition-colors">
                  {short.title}
                </h4>
                <div className="flex items-center justify-between text-[11px] font-sans text-[#9CA3AF]">
                  <span className="flex items-center gap-1 font-medium text-[#60A5FA]">
                    <Eye className="w-3 h-3" />
                    {short.view_count || "0"}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-[#34D399]">
                    <ThumbsUp className="w-3 h-3" />
                    {short.like_count || "0"}
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
