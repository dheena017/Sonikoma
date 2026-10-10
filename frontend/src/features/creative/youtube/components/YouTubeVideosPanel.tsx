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
import CyberSelect from "@/shared/ui/common/CyberSelect";

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
  const [formatFilter, setFormatFilter] = useState<"all" | "videos" | "shorts">(
    "all"
  );
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "views" | "likes" | "comments"
  >("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchVideos = async () => {
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
      list = list.filter(
        (v) => v.privacy_status?.toLowerCase() === privacyFilter
      );
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title?.toLowerCase().includes(q) ||
          v.description?.toLowerCase().includes(q)
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
        return (
          new Date(a.published_at || 0).getTime() -
          new Date(b.published_at || 0).getTime()
        );
      }
      // default: newest
      return (
        new Date(b.published_at || 0).getTime() -
        new Date(a.published_at || 0).getTime()
      );
    });

    return list;
  }, [videos, privacyFilter, formatFilter, search, sortBy]);

  // Aggregated stats
  const totalViews = useMemo(() => {
    return videos.reduce(
      (acc, v) => acc + (parseInt(v.view_count?.replace(/,/g, "") || "0") || 0),
      0
    );
  }, [videos]);

  const totalLikes = useMemo(() => {
    return videos.reduce(
      (acc, v) => acc + (parseInt(v.like_count?.replace(/,/g, "") || "0") || 0),
      0
    );
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


      {/* ── 2. SEARCH, FILTER & TOOLBAR ── */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-3.5 sm:p-4 space-y-3.5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-full xl:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by video title, keywords, tags..."
              className="w-full bg-[#1E1E1E] hover:bg-[#242424] focus:bg-[#2A2A2A] border border-[#2F2F2F] focus:border-red-500/60 focus:ring-2 focus:ring-red-500/20 rounded-xl pl-10 pr-9 py-2 text-xs text-[#E5E5E5] placeholder:text-[#6B7280] font-sans focus:outline-none transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer p-0.5 rounded-md"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            {/* Format Segmented Filter Pills */}
            <div className="flex items-center gap-1 p-1 bg-[#1E1E1E] border border-[#2F2F2F] rounded-xl shrink-0">
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer whitespace-nowrap select-none ${
                      isSel
                        ? "bg-red-600 text-white shadow-sm border border-red-500/50"
                        : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isSel ? "text-white" : "text-[#9CA3AF]"
                      }`}
                    />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Privacy & Sort Dropdowns */}
            <div className="flex items-center gap-2 shrink-0">
              <CyberSelect
                value={privacyFilter}
                onChange={setPrivacyFilter}
                size="sm"
                className="w-[125px]"
                options={[
                  { value: "all", label: "All Privacy" },
                  { value: "public", label: "Public" },
                  { value: "unlisted", label: "Unlisted" },
                  { value: "private", label: "Private" },
                ]}
              />

              <CyberSelect
                value={sortBy}
                onChange={(val: any) => setSortBy(val)}
                size="sm"
                className="w-[135px]"
                options={[
                  { value: "newest", label: "Newest First" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "views", label: "Most Views" },
                  { value: "likes", label: "Most Likes" },
                  { value: "comments", label: "Most Comments" },
                ]}
              />
            </div>

            {/* View Mode Toggle & Refresh */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              <div className="flex items-center gap-0.5 p-1 bg-[#1E1E1E] border border-[#2F2F2F] rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-[#2A2A2A] text-white shadow-xs"
                      : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-white/[0.04]"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-[#2A2A2A] text-white shadow-xs"
                      : "text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-white/[0.04]"
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={fetchVideos}
                disabled={isLoading}
                className="p-2 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
                title="Refresh Videos"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isLoading ? "animate-spin text-red-400" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Status Bar with telemetry */}
        <div className="flex items-center justify-between text-xs font-sans text-[#9CA3AF] pt-2.5 border-t border-[#2F2F2F] flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-[#9CA3AF]">
              Showing{" "}
              <strong className="text-[#E5E5E5] font-semibold">
                {filteredAndSorted.length}
              </strong>{" "}
              of{" "}
              <strong className="text-[#9CA3AF] font-medium">
                {videos.length}
              </strong>{" "}
              videos
            </span>
            <span className="text-[#6B7280]">•</span>
            <span className="inline-flex items-center gap-1 text-[#60A5FA] font-medium">
              <Eye className="w-3.5 h-3.5 text-[#3B82F6]" />
              <strong className="text-[#E5E5E5]">{totalViews.toLocaleString()}</strong> views
            </span>
            <span className="text-[#6B7280]">•</span>
            <span className="inline-flex items-center gap-1 text-[#34D399] font-medium">
              <ThumbsUp className="w-3.5 h-3.5 text-[#10B981]" />
              <strong className="text-[#E5E5E5]">{totalLikes.toLocaleString()}</strong> likes
            </span>
          </div>

          {(search || privacyFilter !== "all" || formatFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setPrivacyFilter("all");
                setFormatFilter("all");
              }}
              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3. VIDEOS FEED ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <p className="text-xs text-[#9CA3AF] font-sans">
            Loading channel videos catalog…
          </p>
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="p-16 text-center border border-[#2F2F2F] rounded-2xl bg-[#141414] space-y-3">
          <Video className="w-12 h-12 text-[#6B7280] mx-auto" />
          <h3 className="text-sm font-bold text-[#E5E5E5] font-sans">
            No matching videos found
          </h3>
          <p className="text-xs text-[#9CA3AF] font-sans max-w-sm mx-auto">
            Try adjusting your search terms or filters above to find published
            videos.
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
                className="group bg-[#141414] hover:bg-[#1A1A1A] border border-[#2F2F2F] hover:border-red-500/40 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col"
              >
                {/* Thumbnail Preview Area */}
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

                  {/* Format Pill */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#0A0A0A]/80 backdrop-blur-sm text-[10px] font-sans font-medium text-[#E5E5E5] border border-[#2F2F2F] flex items-center gap-1">
                    {isShort ? (
                      <>
                        <Zap className="w-2.5 h-2.5 text-red-400 fill-red-400" />
                        <span>Shorts</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-2.5 h-2.5 text-[#60A5FA]" />
                        <span>HD Video</span>
                      </>
                    )}
                  </div>

                  {/* Privacy Badge */}
                  <div
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-sans font-medium uppercase backdrop-blur-sm border ${
                      vid.privacy_status === "public"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                        : vid.privacy_status === "unlisted"
                        ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                        : "bg-[#1E1E1E]/80 text-[#9CA3AF] border-[#2F2F2F]"
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
                <div className="p-4 flex flex-col gap-2.5 flex-1 justify-between">
                  <div className="space-y-1">
                    <h4
                      className="text-xs font-semibold text-[#E5E5E5] line-clamp-2 font-sans cursor-pointer hover:text-red-400 transition-colors leading-snug"
                      onClick={() => onWatchVideo(vid.id, vid)}
                    >
                      {vid.title}
                    </h4>
                    <p className="text-[11px] text-[#9CA3AF] font-sans">
                      {formatDate(vid.published_at)}
                    </p>
                  </div>

                  {/* Telemetry Footer */}
                  <div className="space-y-2.5 pt-2.5 border-t border-[#2F2F2F]">
                    <div className="flex items-center justify-between text-xs font-sans text-[#9CA3AF]">
                      <span className="flex items-center gap-1 font-medium text-[#60A5FA]">
                        <Eye className="w-3.5 h-3.5 text-[#3B82F6]" /> {vid.view_count}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-[#34D399]">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#10B981]" /> {vid.like_count}
                      </span>
                      <button
                        onClick={() => onViewComments(vid.id)}
                        className="flex items-center gap-1 text-[#9CA3AF] hover:text-[#60A5FA] transition-colors cursor-pointer"
                        title="View Comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />{" "}
                        {vid.comment_count}
                      </button>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <button
                        onClick={() => onWatchVideo(vid.id, vid)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium font-sans transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Watch</span>
                      </button>
                      <button
                        onClick={(e) => handleCopy(vid.youtube_url, vid.id, e)}
                        className="p-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer"
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
                        className="p-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors"
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
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-xl">
          <div className="divide-y divide-[#2F2F2F]">
            {filteredAndSorted.map((vid) => (
              <div
                key={vid.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-[#1A1A1A] transition-colors group"
              >
                <div
                  className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => onWatchVideo(vid.id, vid)}
                >
                  <div className="relative w-28 sm:w-36 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-[#2F2F2F]">
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
                      <h4 className="text-xs sm:text-sm font-semibold text-[#E5E5E5] truncate font-sans group-hover:text-red-400 transition-colors">
                        {vid.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium uppercase border ${
                          vid.privacy_status === "public"
                            ? "text-emerald-400 border-emerald-900/40 bg-emerald-950/40"
                            : "text-amber-400 border-amber-900/40 bg-amber-950/40"
                        }`}
                      >
                        {vid.privacy_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] font-sans">
                      Published {formatDate(vid.published_at)}
                    </p>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 text-xs font-sans text-[#9CA3AF]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[#60A5FA] font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#3B82F6]" /> {vid.view_count}
                    </span>
                    <span className="flex items-center gap-1 text-[#34D399] font-medium">
                      <ThumbsUp className="w-3.5 h-3.5 text-[#10B981]" /> {vid.like_count}
                    </span>
                    <button
                      onClick={() => onViewComments(vid.id)}
                      className="flex items-center gap-1 text-[#9CA3AF] hover:text-[#60A5FA] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#3B82F6]" />{" "}
                      {vid.comment_count}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onWatchVideo(vid.id, vid)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium font-sans transition-colors cursor-pointer shadow-sm active:scale-95"
                    >
                      Watch
                    </button>
                    <button
                      onClick={(e) => handleCopy(vid.youtube_url, vid.id, e)}
                      className="p-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer"
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
                      className="p-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors"
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
