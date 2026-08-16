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
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Filter,
  Image as ImageIcon,
  Flame,
  Hash,
  Copy,
  SlidersHorizontal,
  Bookmark,
  TrendingUp,
  X,
} from "lucide-react";
import type { YouTubeVideoItem } from "./YouTubeChannelHome";

interface YouTubeCreatePlaylistPanelProps {
  onPlaylistCreated?: (playlist: any) => void;
  onNavigatePlaylists?: () => void;
}

const PRESET_TEMPLATES = [
  {
    title: "Webtoon Episode Recaps",
    desc: "Complete recap and story analysis of all episodes in chronological order.",
    tags: ["#WebtoonRecap", "#Manhwa", "#StoryRecap", "#AnimeRecap"],
  },
  {
    title: "Season 1 Official Storyline",
    desc: "Binge all Season 1 episodes from the beginning to the climactic season finale.",
    tags: ["#Season1", "#FullSeries", "#BingeWatch", "#WebtoonAnimation"],
  },
  {
    title: "Character Lore & Power Scaling",
    desc: "Deep dive character origins, backstories, tier lists, and combat abilities.",
    tags: ["#CharacterLore", "#PowerScaling", "#TierList", "#AnimeLore"],
  },
  {
    title: "Epic Action & Combat Highlights",
    desc: "The most intense fight scenes, sakuga animation highlights, and climax moments.",
    tags: ["#ActionHighlights", "#FightScenes", "#AnimeAction", "#Sakuga"],
  },
  {
    title: "Ambient Reading & Official OST",
    desc: "Relaxing soundscapes, background music, and atmospheric audiobooks for reading.",
    tags: ["#AmbientMusic", "#WebtoonOST", "#RelaxingReading", "#BGM"],
  },
];

export default function YouTubeCreatePlaylistPanel({
  onPlaylistCreated,
  onNavigatePlaylists,
}: YouTubeCreatePlaylistPanelProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "unlisted" | "private">(
    "public"
  );

  // Video Selection & Ordering
  const [availableVideos, setAvailableVideos] = useState<YouTubeVideoItem[]>(
    []
  );
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [coverVideoId, setCoverVideoId] = useState<string | null>(null);

  // Search & Filter
  const [searchVideo, setSearchVideo] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState<
    "all" | "public" | "unlisted" | "private"
  >("all");

  // AI Generation & Processing
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdResult, setCreatedResult] = useState<any | null>(null);

  const getToken = () =>
    localStorage.getItem("sonikoma_token") ||
    localStorage.getItem("token") ||
    "";

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
          const vids: YouTubeVideoItem[] = data.videos || [];
          setAvailableVideos(vids);
        }
      } catch (err) {
        console.warn("Failed to load channel videos:", err);
      } finally {
        setLoadingVideos(false);
      }
    };
    fetchVideos();
  }, []);

  // Set default cover thumbnail to first selected video
  useEffect(() => {
    if (
      selectedVideoIds.length > 0 &&
      (!coverVideoId || !selectedVideoIds.includes(coverVideoId))
    ) {
      setCoverVideoId(selectedVideoIds[0]);
    } else if (selectedVideoIds.length === 0) {
      setCoverVideoId(null);
    }
  }, [selectedVideoIds, coverVideoId]);

  // Video selection helpers
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

  const selectTopViews = (count: number) => {
    const sorted = [...availableVideos].sort((a, b) => {
      const av = parseInt(a.view_count?.replace(/,/g, "") || "0");
      const bv = parseInt(b.view_count?.replace(/,/g, "") || "0");
      return bv - av;
    });
    setSelectedVideoIds(sorted.slice(0, count).map((v) => v.id));
  };

  const selectRecent = (count: number) => {
    const sorted = [...availableVideos].sort((a, b) => {
      const da = new Date(a.published_at || 0).getTime();
      const db = new Date(b.published_at || 0).getTime();
      return db - da;
    });
    setSelectedVideoIds(sorted.slice(0, count).map((v) => v.id));
  };

  // Reordering helpers
  const moveVideoOrder = (id: string, direction: "up" | "down") => {
    const idx = selectedVideoIds.indexOf(id);
    if (idx === -1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= selectedVideoIds.length) return;

    const next = [...selectedVideoIds];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;
    setSelectedVideoIds(next);
  };

  const reverseOrder = () => {
    setSelectedVideoIds((prev) => [...prev].reverse());
  };

  const sortByViews = (order: "desc" | "asc") => {
    const videoMap = new Map(availableVideos.map((v) => [v.id, v]));
    const sorted = [...selectedVideoIds].sort((idA, idB) => {
      const vA = parseInt(
        videoMap.get(idA)?.view_count?.replace(/,/g, "") || "0"
      );
      const vB = parseInt(
        videoMap.get(idB)?.view_count?.replace(/,/g, "") || "0"
      );
      return order === "desc" ? vB - vA : vA - vB;
    });
    setSelectedVideoIds(sorted);
  };

  // Filtered available videos
  const filteredVideos = useMemo(() => {
    return availableVideos.filter((v) => {
      const matchSearch =
        !searchVideo.trim() ||
        v.title?.toLowerCase().includes(searchVideo.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchVideo.toLowerCase());

      const matchPrivacy =
        privacyFilter === "all" || v.privacy_status === privacyFilter;

      return matchSearch && matchPrivacy;
    });
  }, [availableVideos, searchVideo, privacyFilter]);

  // Selected videos detailed items
  const selectedVideoObjects = useMemo(() => {
    const videoMap = new Map(availableVideos.map((v) => [v.id, v]));
    return selectedVideoIds
      .map((id) => videoMap.get(id))
      .filter(Boolean) as YouTubeVideoItem[];
  }, [selectedVideoIds, availableVideos]);

  // Aggregated analytics of selected videos
  const totalSelectedViews = useMemo(() => {
    return selectedVideoObjects.reduce((acc, v) => {
      return acc + (parseInt(v.view_count?.replace(/,/g, "") || "0") || 0);
    }, 0);
  }, [selectedVideoObjects]);

  // AI Playlist Generator (Real LLM / Gemini Backend Call)
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);

  const handleAiAutoFill = async (customTopic?: string) => {
    setIsAiGenerating(true);
    setErrorMsg("");
    try {
      const promptToSend =
        customTopic || aiPrompt || title || "Series recaps and top highlights";
      const payload = {
        prompt: promptToSend,
        videos: availableVideos.map((v) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          view_count: v.view_count,
        })),
        channel_name: "Webtoon Anime Studio",
      };

      const res = await fetch("/api/export/youtube/playlist/ai-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.model_used) setAiModelUsed(data.model_used);

        // Auto-select the matching video IDs recommended by the AI
        if (
          data.suggested_video_ids &&
          Array.isArray(data.suggested_video_ids) &&
          data.suggested_video_ids.length > 0
        ) {
          setSelectedVideoIds(data.suggested_video_ids);
        } else if (
          selectedVideoIds.length === 0 &&
          availableVideos.length > 0
        ) {
          selectTopViews(Math.min(5, availableVideos.length));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        console.warn(
          "AI generation endpoint error, applying smart template:",
          err
        );
        // Fallback to random preset if server error
        const randomTemplate =
          PRESET_TEMPLATES[Math.floor(Math.random() * PRESET_TEMPLATES.length)];
        setTitle(randomTemplate.title);
        setDescription(
          `${randomTemplate.desc}\n\n${randomTemplate.tags.join(" ")}`
        );
        if (selectedVideoIds.length === 0 && availableVideos.length > 0) {
          selectTopViews(Math.min(5, availableVideos.length));
        }
      }
    } catch (err) {
      console.warn("Network error during AI auto-fill:", err);
      const randomTemplate =
        PRESET_TEMPLATES[Math.floor(Math.random() * PRESET_TEMPLATES.length)];
      setTitle(randomTemplate.title);
      setDescription(
        `${randomTemplate.desc}\n\n${randomTemplate.tags.join(" ")}`
      );
      if (selectedVideoIds.length === 0 && availableVideos.length > 0) {
        selectTopViews(Math.min(5, availableVideos.length));
      }
    } finally {
      setIsAiGenerating(false);
    }
  };

  const applyTemplate = (template: (typeof PRESET_TEMPLATES)[0]) => {
    setAiPrompt(template.title);
    handleAiAutoFill(template.title);
  };

  const addHashtag = (tag: string) => {
    if (!description.includes(tag)) {
      setDescription((prev) => (prev ? `${prev.trim()} ${tag}` : tag));
    }
  };

  // Submit Playlist to YouTube
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
      // Reorder selected videos with cover video first if specified
      let orderedIds = [...selectedVideoIds];
      if (coverVideoId && orderedIds.includes(coverVideoId)) {
        orderedIds = [
          coverVideoId,
          ...orderedIds.filter((id) => id !== coverVideoId),
        ];
      }

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
          video_ids: orderedIds,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
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
    setCoverVideoId(null);
    setCreatedResult(null);
    setErrorMsg("");
  };

  const coverVideo =
    availableVideos.find((v) => v.id === coverVideoId) ||
    selectedVideoObjects[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1. HEADER BANNER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-neutral-900 to-neutral-950 p-5 rounded-3xl border border-red-900/30 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl shadow-xl shadow-red-600/30">
            <ListVideo className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white font-sans tracking-tight">
                Create YouTube Playlist
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-bold uppercase">
                Live Studio
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Curate, sequence, and publish custom series playlists directly to
              your YouTube channel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => handleAiAutoFill()}
            disabled={isAiGenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-red-600/20 to-rose-600/20 border border-red-500/40 hover:border-red-500 text-red-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
          >
            <Sparkles
              className={`w-3.5 h-3.5 ${
                isAiGenerating ? "animate-spin" : "animate-pulse text-red-400"
              }`}
            />
            <span>{isAiGenerating ? "Generating..." : "AI Auto-Fill"}</span>
          </button>
          {onNavigatePlaylists && (
            <button
              onClick={onNavigatePlaylists}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              <Bookmark className="w-4 h-4 text-red-400" />
              View Playlists
            </button>
          )}
        </div>
      </div>

      {/* ── 2. SUCCESS NOTIFICATION BANNER ── */}
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
                  &ldquo;{createdResult.title}&rdquo; with{" "}
                  {createdResult.item_count || selectedVideoIds.length} videos
                  is live.
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
              href={
                createdResult.url ||
                `https://youtube.com/playlist?list=${createdResult.id}`
              }
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

      {/* ── 3. MAIN WORKSPACE (Left: Details & Live Preview, Right: Video Selection & Sequence) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (5 cols): Details Form, Templates & Live Preview */}
        <div className="lg:col-span-5 space-y-5">
          {/* Playlist Form Card */}
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-red-400" />
                <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  Playlist Details
                </h2>
              </div>
              <span className="text-[10px] font-mono text-neutral-500">
                Step 1 of 2
              </span>
            </div>

            {/* AI Generator Input Bar */}
            <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-neutral-950 to-neutral-950 rounded-2xl border border-red-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-red-300 uppercase font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-red-400" />
                  <span>AI Prompt / Topic Generator</span>
                </label>
                {aiModelUsed && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-950/60 border border-red-900/40 text-red-400">
                    Engine: {aiModelUsed}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAiAutoFill();
                    }
                  }}
                  placeholder="e.g. Solo Leveling Season 1 fight highlights & recaps..."
                  className="flex-1 bg-neutral-950 border border-neutral-800 focus:border-red-500/60 rounded-xl px-3 py-2 text-xs text-white placeholder:text-neutral-500 font-sans focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAiAutoFill()}
                  disabled={isAiGenerating}
                  className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 shadow-md shadow-red-600/30"
                >
                  {isAiGenerating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            </div>

            {/* Smart Preset Templates */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold flex items-center justify-between">
                <span>Quick Prompt Ideas</span>
                <span className="text-[9px] text-neutral-600">
                  Click to generate with AI
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TEMPLATES.map((p) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => applyTemplate(p)}
                    className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-red-500/50 text-[10px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    + {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-300 font-bold uppercase tracking-wider">
                  Playlist Title <span className="text-red-400">*</span>
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    title.length > 90 ? "text-amber-400" : "text-neutral-500"
                  }`}
                >
                  {title.length}/100
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Solo Leveling Episode Recaps & Highlights"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl px-4 py-2.5 text-xs text-white font-sans focus:outline-none transition-all placeholder:text-neutral-600"
              />
            </div>

            {/* Privacy Status Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-300 font-bold uppercase tracking-wider">
                Privacy Status
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      id: "public",
                      label: "Public",
                      icon: Globe,
                      desc: "Searchable by all",
                    },
                    {
                      id: "unlisted",
                      label: "Unlisted",
                      icon: Link,
                      desc: "Direct link only",
                    },
                    {
                      id: "private",
                      label: "Private",
                      icon: Lock,
                      desc: "Only you",
                    },
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
                          ? "bg-red-950/40 border-red-500/80 text-red-300 font-bold shadow-md shadow-red-950/30"
                          : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px] capitalize">
                        {opt.label}
                      </span>
                      <span className="text-[9px] text-neutral-500">
                        {opt.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-neutral-300 font-bold uppercase tracking-wider">
                  Description
                </label>
                <span
                  className={`text-[10px] font-mono ${
                    description.length > 4800
                      ? "text-amber-400"
                      : "text-neutral-500"
                  }`}
                >
                  {description.length}/5000
                </span>
              </div>
              <textarea
                value={description}
                maxLength={5000}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your series, episodes, or characters... (hashtags auto-index on YouTube)"
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/20 rounded-xl p-3 text-xs text-neutral-200 font-sans focus:outline-none transition-all placeholder:text-neutral-600 resize-none leading-relaxed"
              />
              {/* Quick Hashtag Injector */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-red-400" />
                  Add tags:
                </span>
                {[
                  "#Webtoon",
                  "#Manhwa",
                  "#Recap",
                  "#Anime",
                  "#Manga",
                  "#OST",
                  "#Action",
                ].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addHashtag(tag)}
                    className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 hover:border-red-500/40 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
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
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-rose-600 hover:from-red-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black font-mono rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-[0.99]"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing to YouTube…
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase font-bold">
                <Layers className="w-3.5 h-3.5 text-red-400" />
                Live YouTube Playlist Preview
              </div>
              {coverVideo && (
                <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[140px]">
                  Cover: {coverVideo.title}
                </span>
              )}
            </div>

            <div className="bg-neutral-950 rounded-2xl overflow-hidden border border-neutral-800/80">
              <div className="relative aspect-video bg-neutral-900 flex items-center justify-center">
                {coverVideo ? (
                  <img
                    src={coverVideo.thumbnail}
                    alt="Playlist Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListVideo className="w-12 h-12 text-red-500/40" />
                )}

                {/* YouTube Style Overlay Bar */}
                <div className="absolute inset-y-0 right-0 w-28 bg-black/85 backdrop-blur-md border-l border-white/10 flex flex-col items-center justify-center gap-1 text-white">
                  <Layers className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-black font-mono">
                    {selectedVideoIds.length}
                  </span>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-400">
                    Videos
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-2 bg-neutral-950/90">
                <h4 className="text-sm font-bold text-white line-clamp-1 font-sans">
                  {title.trim() || "Untitled Playlist Draft"}
                </h4>
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                  <span className="capitalize text-neutral-400">
                    {privacy} Series
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <TrendingUp className="w-3 h-3" />
                    {totalSelectedViews.toLocaleString()} combined views
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Video Picker, Search, Filters & Sequence Ordering */}
        <div className="lg:col-span-7 bg-neutral-900/80 border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
          {/* Header with Counters & Batch Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-red-400" />
                <h2 className="text-xs font-black text-white font-mono uppercase tracking-wider">
                  Select & Sequence Videos ({selectedVideoIds.length}/
                  {availableVideos.length})
                </h2>
              </div>
              <p className="text-[10.5px] text-neutral-500 font-mono">
                Order represents the exact playback sequence on YouTube
              </p>
            </div>

            {/* Batch Select Actions */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="px-2.5 py-1 text-[10px] font-mono font-bold text-red-300 hover:text-white bg-red-950/40 border border-red-900/40 rounded-lg cursor-pointer transition-colors"
              >
                All ({availableVideos.length})
              </button>
              <button
                type="button"
                onClick={() => selectTopViews(5)}
                className="px-2.5 py-1 text-[10px] font-mono text-neutral-300 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                Top 5
              </button>
              <button
                type="button"
                onClick={() => selectRecent(5)}
                className="px-2.5 py-1 text-[10px] font-mono text-neutral-300 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                Recent 5
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Search Bar & Privacy Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                value={searchVideo}
                onChange={(e) => setSearchVideo(e.target.value)}
                placeholder="Search channel videos to include..."
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/60 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono focus:outline-none transition-all"
              />
              {searchVideo && (
                <button
                  onClick={() => setSearchVideo("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="sm:col-span-4">
              <select
                value={privacyFilter}
                onChange={(e: any) => setPrivacyFilter(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-500/60 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value="all">All Privacy Types</option>
                <option value="public">Public Only</option>
                <option value="unlisted">Unlisted Only</option>
                <option value="private">Private Only</option>
              </select>
            </div>
          </div>

          {/* Reordering & Sort Toolbar (Visible when videos are selected) */}
          {selectedVideoIds.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded-xl">
              <span className="text-[10px] font-mono text-neutral-400 font-bold flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-red-400" />
                Sequence Controls:
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => sortByViews("desc")}
                  className="px-2 py-0.5 text-[9px] font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                >
                  Sort by Views ↓
                </button>
                <button
                  type="button"
                  onClick={reverseOrder}
                  className="px-2 py-0.5 text-[9px] font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors"
                >
                  Reverse Order
                </button>
              </div>
            </div>
          )}

          {/* Video List Items */}
          {loadingVideos ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 text-red-500 animate-spin" />
              <p className="text-xs text-neutral-400 font-mono">
                Loading your channel videos…
              </p>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-center border border-neutral-800/60 rounded-2xl bg-neutral-950/40">
              <Video className="w-8 h-8 text-neutral-500" />
              <p className="text-xs text-neutral-400 font-mono">
                No matching videos found
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredVideos.map((vid) => {
                const isSelected = selectedVideoIds.includes(vid.id);
                const orderIndex = selectedVideoIds.indexOf(vid.id);
                const isCover = coverVideoId === vid.id;

                return (
                  <div
                    key={vid.id}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-red-950/20 border-red-500/70 shadow-md shadow-red-950/10"
                        : "bg-neutral-950/80 border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    {/* Checkbox / Selection Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleSelectVideo(vid.id)}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-red-600 border-red-500 text-white"
                          : "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </button>

                    {/* Order Sequence Badge */}
                    {isSelected && (
                      <span className="w-6 h-6 rounded-full bg-red-600/30 border border-red-500/60 text-red-300 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                        #{orderIndex + 1}
                      </span>
                    )}

                    {/* Thumbnail */}
                    <div className="relative shrink-0">
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        className="w-20 sm:w-24 aspect-video object-cover rounded-xl border border-neutral-800"
                      />
                      {isCover && (
                        <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] font-mono text-amber-400 font-bold border border-amber-500/40">
                          Cover
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4
                        onClick={() => toggleSelectVideo(vid.id)}
                        className={`text-xs font-bold font-sans line-clamp-1 cursor-pointer ${
                          isSelected
                            ? "text-white"
                            : "text-neutral-300 hover:text-white"
                        }`}
                      >
                        {vid.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Eye className="w-3 h-3" />
                          {vid.view_count}
                        </span>
                        <span>•</span>
                        <span
                          className={`capitalize ${
                            vid.privacy_status === "public"
                              ? "text-emerald-400"
                              : vid.privacy_status === "unlisted"
                              ? "text-amber-400"
                              : "text-neutral-500"
                          }`}
                        >
                          {vid.privacy_status}
                        </span>
                      </div>
                    </div>

                    {/* Reorder Buttons (Move Up / Down) & Set As Cover */}
                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setCoverVideoId(vid.id)}
                          title="Set as playlist cover thumbnail"
                          className={`p-1.5 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                            isCover
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                              : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-300"
                          }`}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveVideoOrder(vid.id, "up")}
                          disabled={orderIndex === 0}
                          title="Move up in playlist order"
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveVideoOrder(vid.id, "down")}
                          disabled={orderIndex === selectedVideoIds.length - 1}
                          title="Move down in playlist order"
                          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 disabled:opacity-30 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
