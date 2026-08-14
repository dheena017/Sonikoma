import React, { useState, useEffect, useMemo } from "react";
import {
  ListVideo,
  Plus,
  Globe,
  Lock,
  Link,
  Sparkles,
  Check,
  Search,
  Loader2,
  Video,
  Eye,
  CheckCircle2,
  Layers,
  ArrowRight,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";

interface YouTubeCreatePlaylistPanelProps {
  onPlaylistCreated?: (playlist: any) => void;
  onNavigatePlaylists?: () => void;
}

export default function YouTubeCreatePlaylistPanel({
  onPlaylistCreated,
  onNavigatePlaylists,
}: YouTubeCreatePlaylistPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">("public");

  // Video Selection
  const [availableVideos, setAvailableVideos] = useState<YouTubeVideoItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [searchVideo, setSearchVideo] = useState("");

  // Submission
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  const getToken = () =>
    localStorage.getItem("sonikoma_token") || localStorage.getItem("token") || "";

  // Fetch channel videos for the picker
  useEffect(() => {
    const fetchVideos = async () => {
      setLoadingVideos(true);
      try {
        const res = await fetch("/api/export/youtube/videos?max_results=50", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableVideos(data.videos || []);
        }
      } catch (err) {
        console.warn("Failed to load channel videos:", err);
      } finally {
        setLoadingVideos(false);
      }
    };
    fetchVideos();
  }, []);

  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedVideoIds(availableVideos.map((v) => v.id));
  };

  const clearSelection = () => {
    setSelectedVideoIds([]);
  };

  const filteredVideos = useMemo(() => {
    if (!searchVideo.trim()) return availableVideos;
    return availableVideos.filter(
      (v) =>
        v.title?.toLowerCase().includes(searchVideo.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchVideo.toLowerCase())
    );
  }, [availableVideos, searchVideo]);

  const presetTitles = [
    "Webtoon Episode Recaps",
    "Season 1 Official Storyline",
    "Character Lore & Origins",
    "Anime Action Highlights",
    "Behind The Scenes & OST",
  ];

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Please enter a title for your playlist.");
      return;
    }

    setIsCreating(true);
    setErrorMsg("");
    setCreatedResult(null);

    try {
      const res = await fetch("/api/export/youtube/playlists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          privacy,
          video_ids: selectedVideoIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.detail || "Failed to create playlist on YouTube.");
        return;
      }

      const data = await res.json();
      setCreatedResult(data.playlist);
      if (onPlaylistCreated) onPlaylistCreated(data.playlist);
    } catch (err: any) {
      setErrorMsg("Network error. Failed to reach YouTube server.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setPrivacy("public");
    setSelectedVideoIds([]);
    setCreatedResult(null);
    setErrorMsg("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/50 via-neutral-900 to-neutral-950 p-5 rounded-3xl border border-purple-900/40 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl shadow-xl shadow-purple-600/30">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                Create YouTube Playlist
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold uppercase">
                Creator Studio
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Build and publish a new playlist directly to your connected YouTube channel
            </p>
          </div>
        </div>

        {onNavigatePlaylists && (
          <button
            onClick={onNavigatePlaylists}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer self-start sm:self-auto"
          >
            <ListVideo className="w-4 h-4 text-purple-400" />
            View All Playlists
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {createdResult && (
        <div className="p-5 bg-gradient-to-r from-emerald-950/60 to-neutral-900 border border-emerald-800/60 rounded-3xl space-y-3 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-white font-sans">
                  Playlist Created Successfully on YouTube!
                </h3>
                <p className="text-xs text-emerald-300/80 font-mono mt-0.5">
                  &ldquo;{createdResult.title}&rdquo; is now live on your YouTube channel.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-mono text-neutral-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Create Another
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <a
              href={createdResult.url || `https://youtube.com/playlist?list=${createdResult.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-mono shadow-md transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Playlist on YouTube
            </a>
            {onNavigatePlaylists && (
              <button
                onClick={onNavigatePlaylists}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 rounded-xl text-xs font-mono transition-all cursor-pointer"
              >
                Go to Playlists Hub
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace (Form & Video Selector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Playlist Metadata Form & Live Mockup */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                Playlist Details
              </h2>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold">
                Smart Suggestions
              </label>
              <div className="flex flex-wrap gap-1.5">
                {presetTitles.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTitle(p)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-purple-500/50 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    + {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                  Playlist Title *
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solo Leveling Episode Recaps"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/60 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

            {/* Privacy Status */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                Privacy Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "public", label: "Public", icon: Globe },
                    { id: "unlisted", label: "Unlisted", icon: Link },
                    { id: "private", label: "Private", icon: Lock },
                  ] as const
                ).map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = privacy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPrivacy(opt.id)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                        isSelected
                          ? "bg-purple-600/20 border-purple-500 text-purple-300 font-bold shadow-md shadow-purple-950/40"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] capitalize">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-400 font-bold uppercase">
                  Description (Optional)
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  {description.length}/5000
                </span>
              </div>
              <textarea
                value={description}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your series, episodes, or characters..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/60 rounded-xl p-3 text-xs text-white font-mono focus:outline-none transition-all placeholder:text-neutral-600 resize-none"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-400 font-mono bg-red-950/40 border border-red-900/40 p-3 rounded-xl">
                {errorMsg}
              </p>
            )}

            {/* Create Playlist CTA Button */}
            <button
              onClick={() => handleCreate()}
              disabled={isCreating || !title.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating on YouTube…
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Publish Playlist ({selectedVideoIds.length} Videos)
                </>
              )}
            </button>
          </div>

          {/* Live Mockup Preview Card */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase font-bold">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Live YouTube Preview
            </div>

            <div className="bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80">
              <div className="relative aspect-video bg-neutral-900 flex items-center justify-center">
                {selectedVideoIds.length > 0 && availableVideos.length > 0 ? (
                  <img
                    src={
                      availableVideos.find((v) => v.id === selectedVideoIds[0])?.thumbnail ||
                      availableVideos[0]?.thumbnail
                    }
                    alt="Playlist Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListVideo className="w-12 h-12 text-purple-400/60" />
                )}

                <div className="absolute inset-y-0 right-0 w-24 bg-black/80 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1 text-white">
                  <Layers className="w-4 h-4 text-purple-300" />
                  <span className="text-xs font-black font-mono">
                    {selectedVideoIds.length}
                  </span>
                  <span className="text-[8px] font-mono uppercase text-neutral-400">
                    Videos
                  </span>
                </div>
              </div>

              <div className="p-3.5 space-y-1">
                <h4 className="text-xs font-bold text-white line-clamp-1 font-sans">
                  {title.trim() || "Untitled Playlist"}
                </h4>
                <p className="text-[10px] text-neutral-500 font-mono capitalize">
                  {privacy} · {selectedVideoIds.length} videos selected
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Select Videos To Include */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                Select Videos to Include ({selectedVideoIds.length}/{availableVideos.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-purple-400 hover:text-purple-300 bg-purple-950/40 border border-purple-900/40 rounded-lg cursor-pointer transition-colors"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1 text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Videos */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchVideo}
              onChange={(e) => setSearchVideo(e.target.value)}
              placeholder="Search your channel videos to add..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
            />
          </div>

          {/* Video List Items */}
          {loadingVideos ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
              <p className="text-xs text-neutral-400 font-mono">Loading channel videos…</p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center border border-neutral-800/60 rounded-2xl bg-neutral-950/40">
              <Video className="w-8 h-8 text-neutral-500" />
              <p className="text-xs text-neutral-400 font-mono">No videos found to add</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
              {filteredVideos.map((vid) => {
                const isSelected = selectedVideoIds.includes(vid.id);
                return (
                  <div
                    key={vid.id}
                    onClick={() => toggleSelectVideo(vid.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-500/70 shadow-md shadow-purple-950/20"
                        : "bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? "bg-purple-600 border-purple-500 text-white"
                          : "border-neutral-700 bg-neutral-900"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    {/* Thumbnail */}
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-20 sm:w-24 aspect-video object-cover rounded-xl shrink-0 border border-neutral-800"
                    />

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h4
                        className={`text-xs font-bold font-sans line-clamp-1 ${
                          isSelected ? "text-purple-200" : "text-neutral-200"
                        }`}
                      >
                        {vid.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-sky-400" />
                          {vid.view_count}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{vid.privacy_status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
