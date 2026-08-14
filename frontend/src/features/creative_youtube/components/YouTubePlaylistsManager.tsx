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
} from "lucide-react";
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
  onWatchVideo?: (videoId: string, video: YouTubeVideoItem, playlistId?: string) => void;
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

  // View state inside Playlist Panel: "gallery" | "detail" | "create"
  const [currentView, setCurrentView] = useState<"gallery" | "detail" | "create">("gallery");

  // Selected Playlist for Dedicated Detail View
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistData | null>(null);
  const [selectedVideos, setSelectedVideos] = useState<PlaylistItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getToken = () =>
    localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";

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

  // When clicking a playlist, open the dedicated playlist page and fetch its videos
  const handleOpenPlaylist = async (playlist: PlaylistData) => {
    setSelectedPlaylist(playlist);
    setSelectedVideos([]);
    setCurrentView("detail");
    setLoadingVideos(true);
    try {
      const res = await fetch(`/api/export/youtube/playlist/${playlist.id}/items`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
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

  const handleCopyLink = (pl: PlaylistData) => {
    const url = pl.url || `https://youtube.com/playlist?list=${pl.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(pl.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredAndSorted = useMemo(() => {
    let list = [...playlists];

    if (privacyFilter !== "all") {
      list = list.filter((p) => p.privacy?.toLowerCase() === privacyFilter);
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
      if (sortBy === "items") return (b.item_count || 0) - (a.item_count || 0);
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      return (
        new Date(b.published_at || 0).getTime() -
        new Date(a.published_at || 0).getTime()
      );
    });

    return list;
  }, [playlists, privacyFilter, search, sortBy]);

  const totalVideosInPlaylists = useMemo(() => {
    return playlists.reduce((acc, p) => acc + (p.item_count || 0), 0);
  }, [playlists]);

  const privacyIcon = (p: string) => {
    if (p === "public") return <Globe className="w-3.5 h-3.5 text-emerald-400" />;
    if (p === "private") return <Lock className="w-3.5 h-3.5 text-red-400" />;
    return <LinkIcon className="w-3.5 h-3.5 text-amber-400" />;
  };

  const privacyColor = (p: string) => {
    if (p === "public")
      return "text-emerald-400 bg-emerald-950/50 border-emerald-900/40";
    if (p === "private")
      return "text-red-400 bg-red-950/50 border-red-900/40";
    return "text-amber-400 bg-amber-950/50 border-amber-900/40";
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 1: DEDICATED CREATE PLAYLIST PANEL (Inside Playlists tab!)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentView === "create") {
    return (
      <YouTubeCreatePlaylistPanel
        onNavigatePlaylists={() => setCurrentView("gallery")}
        onPlaylistCreated={(newPl) => {
          if (newPl) setPlaylists((prev) => [newPl, ...prev]);
          setCurrentView("gallery");
        }}
      />
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 2: DEDICATED PLAYLIST DETAIL VIEW (When a playlist is clicked!)
  // ─────────────────────────────────────────────────────────────────────────────
  if (currentView === "detail" && selectedPlaylist) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back Button Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              setSelectedPlaylist(null);
              setCurrentView("gallery");
            }}
            className="flex items-center gap-2 text-xs font-bold font-mono text-neutral-400 hover:text-white transition-colors cursor-pointer group px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to All Playlists
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyLink(selectedPlaylist)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              {copiedId === selectedPlaylist.id ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Link</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </>
              )}
            </button>
            <a
              href={selectedPlaylist.url || `https://youtube.com/playlist?list=${selectedPlaylist.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open on YouTube
            </a>
          </div>
        </div>

        {/* Playlist Hub Layout (Left: Hero Card, Right: Video Queue) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Playlist Card & Play All CTA */}
          <div className="lg:col-span-4 bg-gradient-to-b from-purple-950/40 via-neutral-900/90 to-neutral-950 p-6 rounded-3xl border border-purple-900/30 shadow-2xl space-y-5 lg:sticky lg:top-4 self-start">
            {/* Cover Artwork */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-xl group">
              {selectedPlaylist.thumbnail ? (
                <img
                  src={selectedPlaylist.thumbnail}
                  alt={selectedPlaylist.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-neutral-950 flex items-center justify-center">
                  <ListVideo className="w-16 h-16 text-purple-300/60" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handlePlayAll}
                  disabled={selectedVideos.length === 0}
                  className="p-4 bg-purple-600 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform cursor-pointer"
                >
                  <Play className="w-7 h-7 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>

            {/* Title & Metadata */}
            <div className="space-y-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase ${privacyColor(
                  selectedPlaylist.privacy
                )}`}
              >
                {privacyIcon(selectedPlaylist.privacy)}
                {selectedPlaylist.privacy}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-white font-sans leading-tight">
                {selectedPlaylist.title}
              </h1>
              {selectedPlaylist.description && (
                <p className="text-xs text-neutral-300 font-sans leading-relaxed pt-1">
                  {selectedPlaylist.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-400 py-3 border-y border-neutral-800/80">
              <span className="flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-purple-400" />
                <strong className="text-white">{selectedVideos.length || selectedPlaylist.item_count}</strong> videos
              </span>
              <span>•</span>
              <span>Updated recently</span>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={handlePlayAll}
                disabled={selectedVideos.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Play All ({selectedVideos.length || selectedPlaylist.item_count} Videos)
              </button>
            </div>
          </div>

          {/* Right Column: Playlist Video Tracklist */}
          <div className="lg:col-span-8 bg-neutral-900/70 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  Videos in Playlist ({selectedVideos.length})
                </h3>
              </div>
            </div>

            {loadingVideos ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-xs text-neutral-400 font-mono">Loading playlist videos…</p>
              </div>
            ) : selectedVideos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-neutral-800/60 rounded-2xl bg-neutral-950/40">
                <ListVideo className="w-8 h-8 text-neutral-500" />
                <p className="text-sm font-bold text-neutral-300">This playlist has no videos</p>
                <p className="text-xs text-neutral-500 font-mono">
                  Publish or add new videos in the Studio tab
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedVideos.map((vid, idx) => (
                  <div
                    key={vid.id + idx}
                    onClick={() => handlePlaySingleVideo(vid)}
                    className="group flex flex-col sm:flex-row sm:items-center gap-3.5 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-2xl hover:border-purple-500/50 hover:bg-neutral-900/90 transition-all cursor-pointer"
                  >
                    {/* Index Number */}
                    <span className="text-xs font-black font-mono text-neutral-500 w-6 shrink-0 text-center group-hover:text-purple-400 transition-colors">
                      #{idx + 1}
                    </span>

                    {/* Video Thumbnail */}
                    <div className="relative w-full sm:w-36 aspect-video bg-black rounded-xl overflow-hidden shrink-0">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="p-2 bg-purple-600 rounded-full shadow-lg">
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200 line-clamp-2 font-sans group-hover:text-white transition-colors leading-snug">
                        {vid.title}
                      </h4>
                      {vid.published_at && (
                        <p className="text-[10px] text-neutral-500 font-mono">
                          {new Date(vid.published_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      )}
                    </div>

                    {/* Play Action Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlaySingleVideo(vid);
                      }}
                      className="px-3 py-1.5 bg-purple-600/20 group-hover:bg-purple-600 hover:bg-purple-500 text-purple-300 group-hover:text-white rounded-xl text-xs font-bold font-mono transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Watch
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW 3: MAIN PLAYLISTS GALLERY LIST VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-neutral-900 to-neutral-950 p-5 rounded-2xl border border-purple-900/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/30">
            <ListVideo className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-sans tracking-tight">
                Playlists & Series Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-400 text-[10px] font-mono font-bold">
                {playlists.length} Collections · {totalVideosInPlaylists} Videos
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Click any playlist to open its full collection, manage videos, and play
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchPlaylists}
            disabled={isLoading}
            className="p-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Playlists"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCurrentView("create")}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </button>
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
            placeholder="Search playlists..."
            className="w-full bg-neutral-900/80 border border-neutral-800 focus:border-purple-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Privacy */}
          <div className="flex items-center gap-1 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
            {["all", "public", "unlisted", "private"].map((p) => (
              <button
                key={p}
                onClick={() => setPrivacyFilter(p)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  privacyFilter === p
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] font-mono text-neutral-300 focus:outline-none cursor-pointer"
            >
              <option value="items" className="bg-neutral-950">Most Videos</option>
              <option value="newest" className="bg-neutral-950">Newest First</option>
              <option value="alpha" className="bg-neutral-950">Alphabetical</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-neutral-500">
            {filteredAndSorted.length} Playlists
          </span>
        </div>
      </div>

      {/* Playlists Gallery Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-neutral-900/40 border border-neutral-800/60 rounded-3xl overflow-hidden p-0 animate-pulse space-y-3"
            >
              <div className="aspect-video bg-neutral-800/80 rounded-t-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
              </div>
              <div className="p-4 space-y-2.5">
                <div className="h-4 bg-neutral-800/80 rounded-md w-3/4" />
                <div className="h-3 bg-neutral-800/50 rounded-md w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-neutral-800/60 rounded-3xl bg-neutral-950/40">
          <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-2xl">
            <ListVideo className="w-8 h-8 text-neutral-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-neutral-200">No Playlists Found</p>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              {search
                ? `No results for "${search}"`
                : "Create your first playlist collection above"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSorted.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handleOpenPlaylist(pl)}
              className="group bg-neutral-900/80 border border-neutral-800/80 rounded-3xl overflow-hidden hover:border-purple-600/50 hover:shadow-2xl hover:shadow-purple-950/30 transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Playlist Thumbnail / Stack Effect */}
              <div className="relative aspect-video bg-neutral-950 overflow-hidden">
                {pl.thumbnail ? (
                  <img
                    src={pl.thumbnail}
                    alt={pl.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-950/70 via-neutral-900 to-neutral-950 flex items-center justify-center">
                    <ListVideo className="w-12 h-12 text-purple-400/60" />
                  </div>
                )}

                {/* Playlist Stack Ribbon on the right */}
                <div className="absolute inset-y-0 right-0 w-24 bg-black/75 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                  <Layers className="w-5 h-5 text-purple-300" />
                  <span className="text-xs font-black font-mono">
                    {pl.item_count}
                  </span>
                  <span className="text-[9px] font-mono uppercase text-neutral-400">
                    Videos
                  </span>
                </div>

                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="p-3.5 bg-purple-600/90 rounded-full shadow-2xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Privacy Badge */}
                <div className="absolute top-2.5 left-2.5">
                  <span
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-bold border uppercase backdrop-blur-md ${privacyColor(
                      pl.privacy
                    )}`}
                  >
                    {privacyIcon(pl.privacy)}
                    {pl.privacy}
                  </span>
                </div>
              </div>

              {/* Playlist Meta */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="text-sm font-bold text-white line-clamp-1 font-sans group-hover:text-purple-300 transition-colors">
                  {pl.title}
                </h3>
                {pl.description ? (
                  <p className="text-xs text-neutral-400 line-clamp-2 font-sans leading-relaxed">
                    {pl.description}
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-500 italic font-mono">
                    Click to view collection &amp; play
                  </p>
                )}

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-800/80 mt-auto text-xs font-mono">
                  <span className="text-purple-400 group-hover:text-purple-300 font-bold flex items-center gap-1 transition-colors">
                    View Playlist →
                  </span>

                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleCopyLink(pl)}
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy Playlist URL"
                    >
                      {copiedId === pl.id ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Share2 className="w-4 h-4" />
                      )}
                    </button>

                    <a
                      href={pl.url || `https://youtube.com/playlist?list=${pl.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-neutral-400 hover:text-white transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="w-4 h-4" />
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
