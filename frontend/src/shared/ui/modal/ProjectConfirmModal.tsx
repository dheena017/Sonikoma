import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronRight,
  Video,
  Crop,
  Globe,
  FolderTree,
  Upload,
  BookOpen,
  Hash,
  FileText,
  Tags,
  User,
  Image as ImageIcon,
  AlignLeft,
  Sparkles,
  Loader2,
  Eye,
  Save,
  Wand2,
  Mic,
  Music,
  Play,
  Zap,
  Sliders,
  Film,
  Camera,
  Tv,
  Flame,
  CheckCircle2,
} from "lucide-react";

interface ProjectConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    details: {
      seriesTitle: string;
      chapterNumber: string;
      chapterTitle: string;
      scrapedGenre: string;
      seriesAuthor: string;
      seriesCoverImage: string;
      seriesSynopsis: string;
      status: string;

      targetLayout: string;
      narrationTone: string;
      cropSensitivity: string;
      splitTallStrips: boolean;
      ageRating: string;
      primaryLanguage: string;
      subtitleLanguage: string;
      customTags: string[];
      workspaceFolder: string;
      episodePrefix: string;
      localCoverImage: string | null;
      aiTasks: {
        generateScript: boolean;
        generateVoice: boolean;
        generateSFX: boolean;
      };
    },
    shouldGenerate: boolean
  ) => Promise<boolean>;
  onAutoExtractCover?: () => Promise<string | null>;
  initialDetails: {
    seriesTitle: string;
    chapterNumber: string;
    chapterTitle: string;
    scrapedGenre: string;
    seriesAuthor: string;
    seriesCoverImage: string;
    seriesSynopsis: string;
    status?: string;
  };
}

export default function ProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onAutoExtractCover,
  initialDetails,
}: ProjectConfirmModalProps) {
  // Existing State
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [scrapedGenre, setScrapedGenre] = useState("");
  const [seriesAuthor, setSeriesAuthor] = useState("");
  const [seriesCoverImage, setSeriesCoverImage] = useState("");
  const [seriesSynopsis, setSeriesSynopsis] = useState("");

  // Premium State Additions
  const [projectStatus, setProjectStatus] = useState("Draft");
  const [aiTasks, setAiTasks] = useState({
    generateScript: true,
    generateVoice: true,
    generateSFX: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Configuration States
  const [targetLayout, setTargetLayout] = useState("9:16");
  const [narrationTone, setNarrationTone] = useState("Dramatic");
  const [cropSensitivity, setCropSensitivity] = useState("Balanced");
  const [splitTallStrips, setSplitTallStrips] = useState(true);
  const [ageRating, setAgeRating] = useState("All Ages");
  const [primaryLanguage, setPrimaryLanguage] = useState("English");
  const [subtitleLanguage, setSubtitleLanguage] = useState("None");
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [workspaceFolder, setWorkspaceFolder] = useState("");
  const [episodePrefix, setEpisodePrefix] = useState("");
  const [localCoverImage, setLocalCoverImage] = useState<string | null>(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);

  // Rich AI Audio & Visual Pipeline States
  const [voiceActor, setVoiceActor] = useState("Epic Trailer Narrator");
  const [bgmStyle, setBgmStyle] = useState("Dark Action Hybrid");
  const [artStyle, setArtStyle] = useState("Manhwa Vibrant");
  const [transitionPace, setTransitionPace] = useState("Standard (4.0s)");
  const [cameraMotion, setCameraMotion] = useState("2.5D Parallax Motion");
  const [renderQuality, setRenderQuality] = useState("1080p Standard");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>(["YouTube Shorts", "TikTok"]);

  // Accordion State
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    media: true,
    video: true,
    processing: false,
    ai_audio: true,
    visual_motion: false,
    audience: false,
    organization: false,
  });

  const isSubmittingRef = useRef(false);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTask = (taskKey: keyof typeof aiTasks) => {
    setAiTasks((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const togglePlatform = (platform: string) => {
    setTargetPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleAutoGenerateTags = () => {
    const generated: string[] = [];
    if (scrapedGenre) {
      scrapedGenre.split(",").forEach((g) => {
        const clean = g.trim().toLowerCase().replace(/\s+/g, "");
        if (clean && !generated.includes(`#${clean}`)) generated.push(`#${clean}`);
      });
    }
    if (seriesTitle) {
      const titleTag = seriesTitle.trim().toLowerCase().replace(/\s+/g, "");
      if (titleTag && !generated.includes(`#${titleTag}`)) generated.push(`#${titleTag}`);
    }
    const defaults = ["#manhwa", "#webtoon", "#recap", "#anime", "#comic", "#shorts"];
    defaults.forEach((d) => {
      if (!generated.includes(d)) generated.push(d);
    });
    setCustomTags(Array.from(new Set([...customTags, ...generated])));
  };

  const applyPreset = (preset: "shorts" | "movie" | "reel") => {
    if (preset === "shorts") {
      setTargetLayout("9:16");
      setNarrationTone("Dramatic");
      setTransitionPace("Fast (2.5s)");
      setCameraMotion("Pan & Zoom Dynamic");
      setVoiceActor("Epic Trailer Narrator");
      setBgmStyle("Dark Action Hybrid");
      setTargetPlatforms(["YouTube Shorts", "TikTok"]);
    } else if (preset === "movie") {
      setTargetLayout("16:9");
      setNarrationTone("Cinematic");
      setTransitionPace("Cinematic Slow (6.0s)");
      setCameraMotion("2.5D Parallax Motion");
      setVoiceActor("Deep Fantasy Narrator");
      setBgmStyle("Epic Orchestral");
      setRenderQuality("4K Ultra Precision");
      setTargetPlatforms(["YouTube Video"]);
    } else if (preset === "reel") {
      setTargetLayout("9:16");
      setNarrationTone("Dialogue-focused");
      setTransitionPace("Standard (4.0s)");
      setCameraMotion("Static Clean");
      setVoiceActor("Soft Female Storyteller");
      setBgmStyle("Lo-Fi Recaps");
      setTargetPlatforms(["Instagram Reels", "TikTok"]);
    }
  };

  // Sync when initialDetails updates or panel opens
  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (isOpen) {
      setSeriesTitle(initialDetails.seriesTitle || "");
      setChapterNumber(initialDetails.chapterNumber || "");
      setChapterTitle(initialDetails.chapterTitle || "");
      setScrapedGenre(initialDetails.scrapedGenre || "");
      setSeriesAuthor(initialDetails.seriesAuthor || "");
      setSeriesCoverImage(initialDetails.seriesCoverImage || "");
      setSeriesSynopsis(initialDetails.seriesSynopsis || "");
      setProjectStatus(initialDetails.status || "Draft");
      document.body.style.overflow = "hidden";
      if (container) container.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      if (container) container.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      if (container) container.style.overflow = "unset";
    };
  }, [isOpen, initialDetails]);

  if (!isOpen) return null;

  const handleConfirm = async (shouldGenerate: boolean) => {
    if (isSaving || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSaving(true);
    try {
      const success = await onConfirm(
        {
          seriesTitle: seriesTitle.trim(),
          chapterNumber: chapterNumber.trim(),
          chapterTitle: chapterTitle.trim(),
          scrapedGenre: scrapedGenre.trim(),
          seriesAuthor: seriesAuthor.trim(),
          seriesCoverImage: seriesCoverImage.trim(),
          seriesSynopsis: seriesSynopsis.trim(),
          status: projectStatus,
          targetLayout,
          narrationTone,
          cropSensitivity,
          splitTallStrips,
          ageRating,
          primaryLanguage,
          subtitleLanguage,
          customTags,
          workspaceFolder: workspaceFolder.trim(),
          episodePrefix: episodePrefix.trim(),
          localCoverImage,
          aiTasks,
        },
        shouldGenerate
      );
      if (success) {
        onClose();
      }
    } finally {
      setIsSaving(false);
      isSubmittingRef.current = false;
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !customTags.includes(val)) {
        setCustomTags([...customTags, val.startsWith("#") ? val : `#${val}`]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setCustomTags(customTags.filter((tag) => tag !== tagToRemove));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCoverImage(reader.result as string);
        setSeriesCoverImage("");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAutoExtract = async () => {
    if (onAutoExtractCover) {
      setIsExtractingCover(true);
      try {
        const url = await onAutoExtractCover();
        if (url) {
          setSeriesCoverImage(url);
          setLocalCoverImage(null);
        }
      } finally {
        setIsExtractingCover(false);
      }
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex project-confirm-modal-overlay" data-modal="true">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="relative ml-auto h-full w-full max-w-2xl bg-[#09090c] border-l border-neutral-800 rounded-l-3xl shadow-2xl overflow-hidden z-10 animate-in slide-in-from-right-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-850 shrink-0 bg-neutral-900/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl text-purple-400 border border-purple-500/30 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-tight">
                  Project & AI Pipeline Initialization
                </h2>
                <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                  PRO STUDIO
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono tracking-wide mt-0.5">
                Configure metadata, AI voice actor, motion pacing & target platforms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-450 hover:text-white bg-neutral-950/40 border border-neutral-800 hover:bg-neutral-800 p-2 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 py-3 bg-neutral-950/60 border-b border-neutral-850 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Presets:</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => applyPreset("shorts")}
              className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Flame className="w-3 h-3 text-purple-400" />
              <span>TikTok / Shorts</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("movie")}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Film className="w-3 h-3 text-indigo-400" />
              <span>Full Recap (16:9)</span>
            </button>
            <button
              type="button"
              onClick={() => applyPreset("reel")}
              className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Tv className="w-3 h-3 text-cyan-400" />
              <span>Story Reel</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-neutral-950/40 [&::-webkit-scrollbar-thumb]:bg-purple-500/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/60 transition-colors">
          {/* Section 1 */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("core")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" />
                1. Core Metadata
              </div>
              {openSections.core ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.core && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                      Series Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={seriesTitle}
                      onChange={(e) => setSeriesTitle(e.target.value)}
                      placeholder="e.g. Boundless Necromancer"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Hash className="h-3.5 w-3.5 text-purple-400" />
                      Chapter No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors font-mono shadow-inner"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-purple-400" />
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="e.g. The S-Rank Awakens"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <Tags className="h-3.5 w-3.5 text-purple-400" />
                      Genre
                    </label>
                    <input
                      type="text"
                      value={scrapedGenre}
                      onChange={(e) => setScrapedGenre(e.target.value)}
                      placeholder="e.g. Fantasy, Action"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-purple-400" />
                      Author / Artist
                    </label>
                    <input
                      type="text"
                      value={seriesAuthor}
                      onChange={(e) => setSeriesAuthor(e.target.value)}
                      placeholder="e.g. Chugong, DUBU"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2 */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("media")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-purple-400" />
                2. Media & Details
              </div>
              {openSections.media ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.media && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-purple-400" />
                    Project Visibility
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                  >
                    <option value="Draft">Private Draft</option>
                    <option value="Review">Ready for Review</option>
                    <option value="Published">Published (Public)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
                    Cover Image
                  </label>

                  <div className="flex gap-4 items-start flex-col sm:flex-row">
                    <div className="w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-neutral-800 bg-[#0a0a0e] flex items-center justify-center relative group">
                      {localCoverImage || seriesCoverImage ? (
                        <>
                          <img
                            src={localCoverImage || seriesCoverImage}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => (e.currentTarget.style.display = "none")}
                          />
                          {isExtractingCover && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-neutral-700">
                          {isExtractingCover ? (
                            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                          ) : (
                            <ImageIcon className="h-6 w-6" />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={seriesCoverImage}
                          onChange={(e) => {
                            setSeriesCoverImage(e.target.value);
                            if (e.target.value) setLocalCoverImage(null);
                          }}
                          placeholder="Image URL (e.g. https://.../cover.jpg)"
                          className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-xs text-neutral-200 outline-none transition-colors shadow-inner font-mono"
                        />
                        {onAutoExtractCover && (
                          <button
                            type="button"
                            onClick={handleAutoExtract}
                            disabled={isExtractingCover}
                            className="px-3 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            title="Auto-extract cover from scraped panels"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Auto</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-neutral-700">
                          <Upload className="w-3.5 h-3.5 text-purple-400" />
                          <span>Upload Local File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                        {localCoverImage && (
                          <span className="text-[10px] text-emerald-400 font-mono">File selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-2">
                    <AlignLeft className="h-3.5 w-3.5 text-purple-400" />
                    Series Synopsis
                  </label>
                  <textarea
                    value={seriesSynopsis}
                    onChange={(e) => setSeriesSynopsis(e.target.value)}
                    rows={3}
                    placeholder="Enter series summary or story background..."
                    className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none transition-colors shadow-inner resize-none font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3 */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("video")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-purple-400" />
                3. Video & Layout
              </div>
              {openSections.video ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.video && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Target Layout
                    </label>
                    <select
                      value={targetLayout}
                      onChange={(e) => setTargetLayout(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="9:16">📱 Vertical Shorts (9:16)</option>
                      <option value="16:9">🎬 Landscape Video (16:9)</option>
                      <option value="1:1">⏹️ Square Post (1:1)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Narration Tone
                    </label>
                    <select
                      value={narrationTone}
                      onChange={(e) => setNarrationTone(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Dramatic">Dramatic / Cinematic</option>
                      <option value="Dialogue-focused">Dialogue-focused</option>
                      <option value="Action-paced">Action-paced</option>
                      <option value="Minimalistic">Minimalistic</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NEW Section 4: AI Voice & Audio Pipeline */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("ai_audio")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-purple-400" />
                4. AI Voice & Sound Pipeline
              </div>
              {openSections.ai_audio ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.ai_audio && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* AI Tasks Toggles */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => toggleTask("generateScript")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      aiTasks.generateScript
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                        : "bg-[#0a0a0e] border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <FileText className="w-4 h-4" />
                      {aiTasks.generateScript && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-xs font-bold leading-tight">Extract Script</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">OCR dialogue</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTask("generateVoice")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      aiTasks.generateVoice
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                        : "bg-[#0a0a0e] border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Mic className="w-4 h-4" />
                      {aiTasks.generateVoice && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-xs font-bold leading-tight">AI Voiceover</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">TTS Narration</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTask("generateSFX")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      aiTasks.generateSFX
                        ? "bg-purple-500/10 border-purple-500/40 text-purple-300"
                        : "bg-[#0a0a0e] border-neutral-800 text-neutral-500"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Music className="w-4 h-4" />
                      {aiTasks.generateSFX && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                    </div>
                    <p className="text-xs font-bold leading-tight">SFX & BGM</p>
                    <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Audio FX</p>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Mic className="w-3.5 h-3.5 text-purple-400" />
                      AI Voice Actor
                    </label>
                    <select
                      value={voiceActor}
                      onChange={(e) => setVoiceActor(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Epic Trailer Narrator">🎙️ Epic Trailer Narrator (Deep Male)</option>
                      <option value="Anime Protagonist (Male)">🔥 Anime Protagonist (Hype Male)</option>
                      <option value="Deep Fantasy Narrator">🏰 Deep Fantasy Narrator (Cinematic)</option>
                      <option value="Soft Female Storyteller">🌸 Soft Female Storyteller</option>
                      <option value="Cinematic Male">🎬 Cinematic Male (Standard)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5 text-purple-400" />
                      Background BGM Style
                    </label>
                    <select
                      value={bgmStyle}
                      onChange={(e) => setBgmStyle(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Dark Action Hybrid">⚡ Dark Action Hybrid (Manhwa Hype)</option>
                      <option value="Epic Orchestral">🎻 Epic Orchestral (Symphonic)</option>
                      <option value="Lo-Fi Recaps">🎧 Lo-Fi Chill Recap</option>
                      <option value="Cyberpunk Synthwave">🌆 Cyberpunk Synthwave</option>
                      <option value="None">🔇 None (Voice Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NEW Section 5: Visual Effects & Motion Style */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("visual_motion")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-purple-400" />
                5. Visual Motion & Rendering
              </div>
              {openSections.visual_motion ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.visual_motion && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Camera Motion Pacing
                    </label>
                    <select
                      value={transitionPace}
                      onChange={(e) => setTransitionPace(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Fast (2.5s)">⚡ Fast Paced (2.5s / panel - TikTok)</option>
                      <option value="Standard (4.0s)">🎯 Standard Paced (4.0s / panel)</option>
                      <option value="Cinematic Slow (6.0s)">🎥 Cinematic Slow (6.0s / panel)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Motion Effect Mode
                    </label>
                    <select
                      value={cameraMotion}
                      onChange={(e) => setCameraMotion(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="2.5D Parallax Motion">✨ 2.5D Parallax Depth Motion</option>
                      <option value="Pan & Zoom Dynamic">🔍 Dynamic Pan & Zoom</option>
                      <option value="Static Clean">📷 Static Clean Frame</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Art Style Enhancement
                    </label>
                    <select
                      value={artStyle}
                      onChange={(e) => setArtStyle(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Manhwa Vibrant">💥 Manhwa Vibrant Glow</option>
                      <option value="Anime Studio">🎨 Anime Studio Crisp</option>
                      <option value="Dark Fantasy">🌙 Dark Fantasy Contrast</option>
                      <option value="Manga Monochrome">✒️ Manga Ink Black & White</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Render Engine Quality
                    </label>
                    <select
                      value={renderQuality}
                      onChange={(e) => setRenderQuality(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="1080p Standard">⚡ 1080p Standard (Fast Export)</option>
                      <option value="4K Ultra Precision">🌟 4K Ultra Precision Studio</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Panel Processing */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("processing")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Crop className="h-4 w-4 text-purple-400" />
                6. Panel Crop & Segmentation
              </div>
              {openSections.processing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.processing && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Crop Sensitivity
                    </label>
                    <select
                      value={cropSensitivity}
                      onChange={(e) => setCropSensitivity(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="Conservative">Conservative (Preserve full panels)</option>
                      <option value="Balanced">Balanced (Recommended)</option>
                      <option value="Aggressive">Aggressive (Tight on speech bubbles)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 flex flex-col justify-center pt-5">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={splitTallStrips}
                          onChange={(e) => setSplitTallStrips(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={`block w-10 h-6 rounded-full transition-colors ${
                            splitTallStrips ? "bg-purple-500" : "bg-neutral-800"
                          }`}
                        ></div>
                        <div
                          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
                            splitTallStrips ? "transform translate-x-4" : ""
                          }`}
                        ></div>
                      </div>
                      <span className="text-sm text-neutral-300">Auto-split long tall strips</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Tags & Audience */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("audience")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-400" />
                7. Tags & Target Audience
              </div>
              {openSections.audience ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.audience && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Age Rating
                    </label>
                    <select
                      value={ageRating}
                      onChange={(e) => setAgeRating(e.target.value)}
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                    >
                      <option value="All Ages">All Ages</option>
                      <option value="Teen (13+)">Teen (13+)</option>
                      <option value="Mature (18+)">Mature (18+)</option>
                      <option value="Action Violence">Action Violence</option>
                      <option value="Flash Warning">Flash Warning</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Languages (Primary / Subtitles)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={primaryLanguage}
                        onChange={(e) => setPrimaryLanguage(e.target.value)}
                        className="w-1/2 bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                      >
                        <option value="English">English</option>
                        <option value="Korean">Korean</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                      <select
                        value={subtitleLanguage}
                        onChange={(e) => setSubtitleLanguage(e.target.value)}
                        className="w-1/2 bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner cursor-pointer"
                      >
                        <option value="None">None</option>
                        <option value="English">English</option>
                        <option value="Korean">Korean</option>
                        <option value="Japanese">Japanese</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Project Custom Tags
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateTags}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Wand2 className="w-3 h-3 text-purple-400" />
                      <span>Auto-Generate AI Tags</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-[#0a0a0e] border border-neutral-800 rounded-xl min-h-[46px]">
                    {customTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono font-semibold"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={customTags.length === 0 ? "e.g. #manhwa, #action" : ""}
                      className="bg-transparent border-none outline-none text-sm text-neutral-200 flex-1 min-w-[120px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 8: Workspace & Target Platforms */}
          <div className="space-y-4 bg-neutral-900/40 p-4 rounded-xl border border-neutral-800/60 transition-all">
            <h3
              onClick={() => toggleSection("organization")}
              className="text-xs font-bold text-neutral-400 uppercase tracking-wider font-mono flex items-center justify-between cursor-pointer hover:text-white transition-colors select-none"
            >
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-purple-400" />
                8. Workspace & Publishing Destinations
              </div>
              {openSections.organization ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </h3>
            {openSections.organization && (
              <div className="space-y-4 pt-4 border-t border-neutral-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Folder / Series Grouping
                    </label>
                    <input
                      type="text"
                      value={workspaceFolder}
                      onChange={(e) => setWorkspaceFolder(e.target.value)}
                      placeholder="e.g. Season 1, Action Recaps"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                      Episode Numbering Prefix
                    </label>
                    <input
                      type="text"
                      value={episodePrefix}
                      onChange={(e) => setEpisodePrefix(e.target.value)}
                      placeholder="e.g. EP {num} • S1"
                      className="w-full bg-[#0a0a0e] border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-3 text-sm text-neutral-200 outline-none transition-colors font-mono shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider font-mono">
                    Target Distribution Platforms
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["YouTube Shorts", "TikTok", "Instagram Reels", "YouTube Video"].map((platform) => (
                      <button
                        key={platform}
                        type="button"
                        onClick={() => togglePlatform(platform)}
                        className={`p-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                          targetPlatforms.includes(platform)
                            ? "bg-purple-600/20 border-purple-500/40 text-purple-300 shadow-md shadow-purple-950/20"
                            : "bg-[#0a0a0e] border-neutral-800 text-neutral-500 hover:text-neutral-300"
                        }`}
                      >
                        {platform}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-900/90 backdrop-blur-xl border-t border-neutral-850 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-[#0a0a0e] hover:bg-neutral-850 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800 text-center"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleConfirm(false)}
              disabled={!seriesTitle.trim() || isSaving}
              className="px-4 py-2.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 hover:border-neutral-600 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-purple-400" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleConfirm(true)}
              disabled={!seriesTitle.trim() || isSaving}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-lg shadow-purple-900/30 border border-purple-400/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Initializing Studio...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
                  <span>🚀 Initialize & Launch AI Studio</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
