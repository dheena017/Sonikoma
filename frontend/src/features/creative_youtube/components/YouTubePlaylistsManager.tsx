import React, { useEffect, useState, useMemo } from "react";
import {
  ListVideo,
  Plus,
  Globe,
  Lock,
  Link as LinkIcon,
  RefreshCw,
  Loader2,
  ChevronLeft,
  Play,
  Search,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Share2,
  Check,
  Film,
  X,
  Eye,
  Calendar,
  Sparkles,
  ArrowRight,
  FolderPlus,
} from "lucide-react";
import CyberSelect from "@/shared/ui/common/CyberSelect";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";
import YouTubeCreatePlaylistPanel from "./YouTubeCreatePlaylistPanel";

export interface PlaylistItem {
  id: string;
  playlist_item_id: string;
  title: string;
  description: string;
  thumbnail: string;
  published_at?: string;
  position: number;
  youtube_url: string;
}

export interface PlaylistData {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  published_at?: string;
  item_count: number;
  privacy: string;
  url?: string;
}

interface YouTubePlaylistsManagerProps {
  onWatchVideo?: (
    videoId: string,
    video: YouTubeVideoItem,
    playlistId?: string
  ) => void;
  onNavigateStudio?: () => void;
}

export default function YouTubePlaylistsManager({
  onWatchVideo,
  onNavigateStudio,
}: YouTubePlaylistsManagerProps) {
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"items" | "newest" | "alpha">("items");

  // View state: "gallery" | "detail" | "create"
  const [currentView, setCurrentView] = useState<
    "gallery" | "detail" | "create"
  >("gallery");

  // Selected Playlist for Dedicated Detail View
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(
    null
  );
  const [selectedVideos, setSelectedVideos] = useState<PlaylistItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem("sonikoma_token") ||
    localStorage.getItem("token") ||
    "";

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/export/youtube/playlists", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data.playlists || []);
      }
    } catch (e) {
      console.warn("Failed to load playlists:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // When clicking a playlist, open the dedicated playlist tracklist and fetch its videos
  const handleOpenPlaylist = async (playlist: PlaylistData) => {
    setSelectedPlaylist(playlist);
    setSelectedVideos([]);
    setCurrentView("detail");
    setLoadingVideos(true);
    try {
      const res = await fetch(
        `/api/export/youtube/playlist/${playlist.id}/items`,
        {
          headers: { Authorization: `Bearer ${getToken()}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSelectedVideos(data.items || []);
      }
    } catch (e) {
      console.warn(`Failed to fetch items for playlist ${playlist.id}:`, e);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handlePlayAll = () => {
    if (!selectedPlaylist || selectedVideos.length === 0) return;
    const firstVideo = selectedVideos[0];
    if (onWatchVideo) {
      onWatchVideo(
        firstVideo.id,
        {
          id: firstVideo.id,
          title: firstVideo.title,
          description: firstVideo.description,
          thumbnail: firstVideo.thumbnail,
          published_at: firstVideo.published_at,
          view_count: "--",
          like_count: "--",
          comment_count: "--",
          privacy_status: selectedPlaylist.privacy,
          youtube_url: firstVideo.youtube_url,
        },
        selectedPlaylist.id
      );
    }
  };

  const handlePlaySingleVideo = (video: PlaylistItem) => {
    if (onWatchVideo && selectedPlaylist) {
      onWatchVideo(
        video.id,
        {
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnail: video.thumbnail,
          published_at: video.published_at,
          view_count: "--",
          like_count: "--",
          comment_count: "--",
          privacy_status: selectedPlaylist.privacy,
          youtube_url: video.youtube_url,
        },
        selectedPlaylist.id
      );
    }
  };

  const handleCopyLink = (url: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter & sort
  const filteredPlaylists = useMemo(() => {
    let list = [...playlists];
    if (privacyFilter !== "all") {
      list = list.filter(
        (p) => (p.privacy || "public").toLowerCase() === privacyFilter
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.published_at || 0).getTime() -
          new Date(a.published_at || 0).getTime()
        );
      }
      if (sortBy === "alpha") {
        return (a.title || "").localeCompare(b.title || "");
      }
      // default: items count
      return (b.item_count || 0) - (a.item_count || 0);
    });
    return list;
  }, [playlists, privacyFilter, search, sortBy]);

  const totalVideosInPlaylists = useMemo(() => {
    return playlists.reduce((acc, p) => acc + (p.item_count || 0), 0);
  }, [playlists]);

  // If in create view
  if (currentView === "create") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setCurrentView("gallery");
            fetchPlaylists();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Playlists Hub</span>
        </button>
        <YouTubeCreatePlaylistPanel
          onPlaylistCreated={() => {
            fetchPlaylists();
            setCurrentView("gallery");
          }}
          onNavigatePlaylists={() => {
            fetchPlaylists();
            setCurrentView("gallery");
          }}
        />
      </div>
    );
  }

  // If in detail tracklist view
  if (currentView === "detail" && selectedPlaylist) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Top Back Navigation */}
        <button
          onClick={() => {
            setCurrentView("gallery");
            setSelectedPlaylist(null);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Hero Banner & Tracklist Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-950 p-6 sm:p-8 rounded-3xl border border-purple-900/40 shadow-2xl items-center">
          <div className="lg:col-span-4 relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-2xl flex items-center justify-center">
            {selectedPlaylist.thumbnail ? (
              <img
                src={selectedPlaylist.thumbnail}
                alt={selectedPlaylist.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ListVideo className="w-16 h-16 text-[#3B82F6]/40" />
            )}
            <div className="absolute inset-y-0 right-0 w-28 bg-black/85 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1 text-white">
              <Layers className="w-5 h-5 text-[#3B82F6]" />
              <span className="text-sm font-black font-mono">
                {selectedVideos.length || selectedPlaylist.item_count}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                Videos
              </span>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] text-[10px] font-mono font-bold uppercase">
                  {selectedPlaylist.privacy || "public"} Series
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {selectedVideos.length || selectedPlaylist.item_count} items
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight">
                {selectedPlaylist.title}
              </h1>
              {selectedPlaylist.description && (
                <p className="text-xs text-neutral-400 font-sans leading-relaxed line-clamp-3">
                  {selectedPlaylist.description}
                </p>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button
                onClick={handlePlayAll}
                disabled={selectedVideos.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black font-mono shadow-lg shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play All in Sequence</span>
              </button>

              <button
                onClick={(e) =>
                  handleCopyLink(
                    `https://youtube.com/playlist?list=${selectedPlaylist.id}`,
                    selectedPlaylist.id,
                    e
                  )
                }
                className="flex items-center gap-1.5 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-colors cursor-pointer"
              >
                {copiedId === selectedPlaylist.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>

              <a
                href={`https://youtube.com/playlist?list=${selectedPlaylist.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open on YouTube</span>
              </a>
            </div>
          </div>
        </div>

        {/* Video Items List */}
        <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-[#3B82F6]" />
              <span>Playlist Tracklist ({selectedVideos.length} Episodes)</span>
            </h3>
            <span className="text-[10px] font-mono text-neutral-500">
              Click any video to start playback
            </span>
          </div>

          {loadingVideos ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-7 h-7 text-[#3B82F6] animate-spin" />
              <p className="text-xs text-neutral-400 font-mono">
                Loading playlist items…
              </p>
            </div>
          ) : selectedVideos.length === 0 ? (
            <div className="p-12 text-center border border-neutral-800/60 rounded-2xl bg-neutral-950/40">
              <p className="text-xs text-neutral-500 font-mono">
                No videos found in this playlist.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedVideos.map((vid, idx) => (
                <div
                  key={vid.playlist_item_id || vid.id}
                  onClick={() => handlePlaySingleVideo(vid)}
                  className="flex items-center gap-4 p-3 rounded-2xl bg-neutral-950/60 hover:bg-neutral-950 border border-neutral-800/60 hover:border-[#3B82F6]/50 transition-all cursor-pointer group"
                >
                  <span className="w-6 text-center text-xs font-mono font-black text-neutral-500 group-hover:text-[#60A5FA] shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="relative w-24 sm:w-28 aspect-video bg-black rounded-xl overflow-hidden shrink-0 border border-neutral-800">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-white truncate font-sans group-hover:text-purple-200 transition-colors">
                      {vid.title}
                    </h4>
                    {vid.description && (
                      <p className="text-[10px] text-neutral-500 line-clamp-1 font-mono">
                        {vid.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySingleVideo(vid);
                    }}
                    className="p-2 rounded-xl bg-neutral-900 hover:bg-purple-950/40 border border-neutral-800 hover:border-[#3B82F6]/50 text-neutral-400 hover:text-[#93C5FD] transition-colors cursor-pointer shrink-0"
                    title="Play in Theater"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── GALLERY VIEW (Default) ──
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. HEADER BANNER & METRICS ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-950 p-6 rounded-3xl border border-purple-900/30 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-sm shrink-0">
            <ListVideo className="w-6 h-6 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                Playlists &amp; Series Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 text-[#60A5FA] text-[10px] font-mono font-bold">
                {playlists.length} Playlists
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">
              Curate, organize, and publish binge-worthy episode playlists on
              YouTube
            </p>
          </div>
        </div>

        {/* Actions & Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-4 py-2 bg-neutral-950/80 border border-neutral-800 rounded-2xl text-xs font-mono text-[#60A5FA] font-bold">
            <span className="text-white">{totalVideosInPlaylists}</span> total
            curated videos
          </div>

          <button
            onClick={() => setCurrentView("create")}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold font-mono shadow-lg shadow-sm transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchPlaylists();
            }}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
            title="Refresh Playlists"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isLoading ? "animate-spin text-[#3B82F6]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER TOOLBAR ── */}
      <div className="bg-neutral-900/80 border border-neutral-800/80 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search playlists by title or description..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#3B82F6]/70 focus:ring-1 focus:ring-purple-500/20 rounded-xl pl-9 pr-8 py-2.5 text-xs text-white placeholder:text-neutral-500 font-sans focus:outline-none transition-all"
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

          {/* Privacy Filter */}
          <div className="md:col-span-3">
            <CyberSelect
              value={privacyFilter}
              onChange={setPrivacyFilter}
              options={[
                { value: "all", label: "All Privacy Types" },
                { value: "public", label: "Public" },
                { value: "unlisted", label: "Unlisted" },
                { value: "private", label: "Private" },
              ]}
            />
          </div>

          {/* Sort By */}
          <div className="md:col-span-3">
            <CyberSelect
              value={sortBy}
              onChange={(val: any) => setSortBy(val)}
              options={[
                { value: "items", label: "Most Videos First" },
                { value: "newest", label: "Recently Published" },
                { value: "alpha", label: "Alphabetical (A-Z)" },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/60">
          <span>
            Showing{" "}
            <strong className="text-white">{filteredPlaylists.length}</strong>{" "}
            of <strong>{playlists.length}</strong> playlists
          </span>
          {(search || privacyFilter !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setPrivacyFilter("all");
              }}
              className="text-[#3B82F6] hover:text-[#93C5FD] underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── 3. PLAYLISTS CARDS GRID ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">
            Loading playlists from YouTube…
          </p>
        </div>
      ) : filteredPlaylists.length === 0 ? (
        <div className="p-16 text-center border border-neutral-800/80 rounded-3xl bg-neutral-950/40 space-y-3">
          <ListVideo className="w-12 h-12 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No playlists found</h3>
          <p className="text-xs text-neutral-500 font-mono max-w-sm mx-auto">
            Organize your episodes into bingeable playlists to increase channel
            watch time and SEO rankings.
          </p>
          <button
            onClick={() => setCurrentView("create")}
            className="px-5 py-2.5 bg-purple-600 hover:bg-[#3B82F6] text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-sm transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create First Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handleOpenPlaylist(pl)}
              className="group bg-neutral-900/70 border border-neutral-800/80 rounded-3xl overflow-hidden hover:border-[#3B82F6]/50 hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col backdrop-blur-sm"
            >
              {/* Cover Preview Area */}
              <div className="relative aspect-video bg-neutral-950 overflow-hidden flex items-center justify-center">
                {pl.thumbnail ? (
                  <img
                    src={pl.thumbnail}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <ListVideo className="w-12 h-12 text-[#3B82F6]/40" />
                )}

                {/* Video Count Sidebar Overlay */}
                <div className="absolute inset-y-0 right-0 w-24 bg-black/85 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1 text-white">
                  <Layers className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs font-black font-mono">
                    {pl.item_count ?? "?"}
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-400">
                    Videos
                  </span>
                </div>

                {/* Privacy Badge */}
                <div
                  className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase backdrop-blur-sm border ${
                    pl.privacy === "public"
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-800/60"
                      : pl.privacy === "unlisted"
                      ? "bg-amber-950/80 text-amber-300 border-amber-800/60"
                      : "bg-neutral-950/80 text-neutral-400 border-neutral-700/60"
                  }`}
                >
                  {pl.privacy || "public"}
                </div>

                {/* Hover Play Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="p-3 bg-purple-600 rounded-2xl shadow-xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Details & Actions */}
              <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white line-clamp-1 font-sans group-hover:text-[#93C5FD] transition-colors">
                    {pl.title}
                  </h4>
                  {pl.description && (
                    <p className="text-[10px] text-neutral-400 line-clamp-2 font-mono leading-relaxed">
                      {pl.description}
                    </p>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/60 mt-auto">
                  <span className="text-[10px] font-mono text-[#3B82F6] font-bold flex items-center gap-1">
                    <span>View Tracklist</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) =>
                        handleCopyLink(
                          `https://youtube.com/playlist?list=${pl.id}`,
                          pl.id,
                          e
                        )
                      }
                      className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Playlist URL"
                    >
                      {copiedId === pl.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={`https://youtube.com/playlist?list=${pl.id}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
