import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
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
  Zap,
  Film,
  Flame,
  Tv,
  CheckCircle2,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";
import { getProxyImageUrl, isApiUrl, isProxyUrl } from "@/api/endpoints/image";

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

// ── Shared Style Classes ──
const inputCls =
  "w-full bg-[#0a0a12] border border-white/[0.08] focus:border-[#3B82F6]/60 rounded-2xl px-4 py-3 text-sm text-neutral-200 outline-none transition-all shadow-inner placeholder:text-neutral-600 focus:bg-[#0e0f1a]";

const selectCls =
  "w-full bg-[#0a0a12] border border-white/[0.08] focus:border-[#3B82F6]/60 rounded-2xl px-4 py-3 text-sm text-neutral-200 outline-none transition-all shadow-inner cursor-pointer focus:bg-[#0e0f1a]";

const labelCls =
  "text-[10px] font-bold text-neutral-500 uppercase tracking-wider font-mono flex items-center gap-1.5 mb-1.5";

const cardCls =
  "bg-[#0e0f19]/80 border border-white/[0.07] rounded-2xl p-5 space-y-4";

type TabKey = "metadata" | "ai" | "distribution";

// ── Configuration Constants (Decoupled & Extensible) ──
const PRESETS = [
  {
    id: "shorts" as const,
    label: "Shorts / TikTok",
    icon: Flame,
    color: "blue",
    config: {
      targetLayout: "9:16",
      narrationTone: "Dramatic",
      voiceActor: "Epic Trailer Narrator",
      bgmStyle: "Dark Action Hybrid",
      targetPlatforms: ["YouTube Shorts", "TikTok"],
    },
  },
  {
    id: "movie" as const,
    label: "Full Video (16:9)",
    icon: Film,
    color: "indigo",
    config: {
      targetLayout: "16:9",
      narrationTone: "Cinematic",
      voiceActor: "Deep Fantasy Narrator",
      bgmStyle: "Epic Orchestral",
      targetPlatforms: ["YouTube Video"],
    },
  },
  {
    id: "reel" as const,
    label: "Story Reel",
    icon: Tv,
    color: "cyan",
    config: {
      targetLayout: "9:16",
      narrationTone: "Dialogue-focused",
      voiceActor: "Soft Female Storyteller",
      bgmStyle: "Lo-Fi Recaps",
      targetPlatforms: ["Instagram Reels", "TikTok"],
    },
  },
];

const LAYOUT_OPTIONS = [
  { value: "9:16", label: "📱 Vertical Shorts (9:16)" },
  { value: "16:9", label: "🎬 Landscape Video (16:9)" },
  { value: "1:1", label: "⏹️ Square Post (1:1)" },
];

const TONE_OPTIONS = [
  { value: "Dramatic", label: "Dramatic / Epic" },
  { value: "Dialogue-focused", label: "Dialogue Focused" },
  { value: "Action-paced", label: "Fast Action" },
  { value: "Cinematic", label: "Cinematic" },
  { value: "Minimalistic", label: "Subtle & Minimal" },
];

const VOICE_ACTORS = [
  { value: "Epic Trailer Narrator", label: "🎙️ Epic Trailer (Deep Male)" },
  { value: "Anime Protagonist (Male)", label: "🔥 Anime Protagonist" },
  { value: "Deep Fantasy Narrator", label: "🏰 Deep Fantasy (Cinematic)" },
  { value: "Soft Female Storyteller", label: "🌸 Soft Female Storyteller" },
  { value: "Cinematic Male", label: "🎬 Cinematic Male" },
];

const BGM_STYLES = [
  { value: "Dark Action Hybrid", label: "⚡ Dark Action Hybrid" },
  { value: "Epic Orchestral", label: "🎻 Epic Orchestral" },
  { value: "Lo-Fi Recaps", label: "🎧 Lo-Fi Chill" },
  { value: "Cyberpunk Synthwave", label: "🌆 Cyberpunk Synthwave" },
  { value: "None", label: "🔇 None (Voice Only)" },
];

const STATUS_OPTIONS = [
  { value: "Draft", label: "🔒 Private Draft" },
  { value: "Review", label: "👀 Ready for Review" },
  { value: "Published", label: "🌐 Published (Public)" },
];

const SENSITIVITY_OPTIONS = [
  { value: "Conservative", label: "Conservative" },
  { value: "Balanced", label: "Balanced" },
  { value: "Aggressive", label: "Aggressive" },
];

const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Korean", label: "Korean" },
  { value: "Japanese", label: "Japanese" },
  { value: "Spanish", label: "Spanish" },
  { value: "Chinese", label: "Chinese" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
];

const SUBTITLE_OPTIONS = [
  { value: "None", label: "None" },
  ...LANGUAGE_OPTIONS,
];

const PLATFORM_OPTIONS = [
  "YouTube Shorts",
  "TikTok",
  "Instagram Reels",
  "YouTube Video",
];

const AI_TASK_DEFINITIONS = [
  {
    key: "generateScript" as const,
    icon: FileText,
    label: "Script Extraction",
    sub: "OCR & Clean Dialogue",
  },
  {
    key: "generateVoice" as const,
    icon: Mic,
    label: "AI Voiceover",
    sub: "Text-to-Speech Narration",
  },
  {
    key: "generateSFX" as const,
    icon: Music,
    label: "SFX & Soundtrack",
    sub: "Ambient & Impact Audio",
  },
];

export default function ProjectConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  onAutoExtractCover,
  initialDetails,
}: ProjectConfirmModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("metadata");

  // Form states initialized dynamically from initialDetails or clean defaults
  const [seriesTitle, setSeriesTitle] = useState("");
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [scrapedGenre, setScrapedGenre] = useState("");
  const [seriesAuthor, setSeriesAuthor] = useState("");
  const [seriesCoverImage, setSeriesCoverImage] = useState("");
  const [seriesSynopsis, setSeriesSynopsis] = useState("");
  const [projectStatus, setProjectStatus] = useState("Draft");
  const [aiTasks, setAiTasks] = useState({
    generateScript: true,
    generateVoice: true,
    generateSFX: true,
  });
  const [submittingAction, setSubmittingAction] = useState<"draft" | "ai" | null>(null);
  const isSavingDraft = submittingAction === "draft";
  const isLaunchingAI = submittingAction === "ai";
  const isSubmitting = submittingAction !== null;
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
  const [voiceActor, setVoiceActor] = useState("Epic Trailer Narrator");
  const [bgmStyle, setBgmStyle] = useState("Dark Action Hybrid");
  const [targetPlatforms, setTargetPlatforms] = useState<string[]>([
    "YouTube Shorts",
    "TikTok",
  ]);

  const isSubmittingRef = useRef(false);

  const toggleTask = (taskKey: keyof typeof aiTasks) => {
    setAiTasks((prev) => ({ ...prev, [taskKey]: !prev[taskKey] }));
  };

  const togglePlatform = (platform: string) => {
    setTargetPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  // Dynamically generate tags strictly from user's current series and genre data
  const handleAutoGenerateTags = () => {
    const generated: string[] = [];
    if (scrapedGenre) {
      scrapedGenre.split(",").forEach((g) => {
        const clean = g.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "");
        if (clean && !generated.includes(`#${clean}`)) {
          generated.push(`#${clean}`);
        }
      });
    }
    if (seriesTitle) {
      const titleTag = seriesTitle.trim().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "");
      if (titleTag && !generated.includes(`#${titleTag}`)) {
        generated.push(`#${titleTag}`);
      }
    }
    if (chapterNumber) {
      generated.push(`#ch${chapterNumber.trim()}`);
    }
    setCustomTags(Array.from(new Set([...customTags, ...generated])));
  };

  const applyPreset = (presetId: "shorts" | "movie" | "reel") => {
    const selected = PRESETS.find((p) => p.id === presetId);
    if (!selected) return;
    setTargetLayout(selected.config.targetLayout);
    setNarrationTone(selected.config.narrationTone);
    setVoiceActor(selected.config.voiceActor);
    setBgmStyle(selected.config.bgmStyle);
    setTargetPlatforms(selected.config.targetPlatforms);
  };

  // Sync state dynamically from initialDetails or activeProjectData fallback
  useEffect(() => {
    const container = document.getElementById("main-scroll-container");
    if (isOpen) {
      const activeData = useProjectStore.getState().activeProjectData;
      const fallbackCover =
        initialDetails?.seriesCoverImage ||
        activeData?.project?.cover_image ||
        activeData?.project?.first_panel_image ||
        activeData?.panels?.[0]?.image_url ||
        activeData?.scrapedImages?.[0] ||
        "";

      setSeriesTitle(initialDetails?.seriesTitle || activeData?.project?.title || "");
      setChapterNumber(initialDetails?.chapterNumber || activeData?.project?.chapterNumber || "");
      setChapterTitle(initialDetails?.chapterTitle || activeData?.project?.chapterTitle || "");
      setScrapedGenre(initialDetails?.scrapedGenre || activeData?.project?.genre || "");
      setSeriesAuthor(initialDetails?.seriesAuthor || activeData?.project?.author || "");
      setSeriesCoverImage(fallbackCover);
      setSeriesSynopsis(initialDetails?.seriesSynopsis || activeData?.project?.synopsis || "");
      setProjectStatus(initialDetails?.status || activeData?.project?.status || "Draft");
      setActiveTab("metadata");
      document.body.style.overflow = "hidden";
      if (container) container.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      if (container) container.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (container) container.style.overflow = "";
    };
  }, [isOpen, initialDetails]);

  const activeProjectData = useProjectStore((s) => s.activeProjectData);
  const availableImages = React.useMemo(() => {
    const list: string[] = [];
    if (activeProjectData?.scrapedImages?.length) {
      list.push(...activeProjectData.scrapedImages);
    }
    if (activeProjectData?.panels?.length) {
      activeProjectData.panels.forEach((p) => {
        if (p.image_url && !list.includes(p.image_url)) {
          list.push(p.image_url);
        }
      });
    }
    return list.slice(0, 10);
  }, [activeProjectData]);

  const displayCoverUrl = React.useMemo(() => {
    if (localCoverImage) return localCoverImage;
    if (!seriesCoverImage) return "";
    if (
      seriesCoverImage.startsWith("data:") ||
      seriesCoverImage.startsWith("blob:") ||
      isApiUrl(seriesCoverImage) ||
      isProxyUrl(seriesCoverImage)
    ) {
      return seriesCoverImage;
    }
    return getProxyImageUrl(seriesCoverImage);
  }, [localCoverImage, seriesCoverImage]);

  if (!isOpen) return null;

  const handleConfirm = async (shouldGenerate: boolean) => {
    if (isSubmitting || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmittingAction(shouldGenerate ? "ai" : "draft");

    // Defer heavy async operations by 1 frame so the button loading spinner paints immediately and smoothly
    setTimeout(async () => {
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
        if (success) onClose();
      } catch (err) {
        console.error("[ProjectConfirm] Error during confirmation:", err);
      } finally {
        setSubmittingAction(null);
        isSubmittingRef.current = false;
      }
    }, 16);
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

  const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "metadata", label: "Metadata & Details", icon: BookOpen },
    { key: "ai", label: "AI & Audio Studio", icon: Sparkles },
    { key: "distribution", label: "Distribution & Tags", icon: Globe },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex project-confirm-modal-overlay"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="relative ml-auto h-full w-full max-w-[660px] bg-[#09090f]/95 backdrop-blur-2xl border-l border-white/[0.07] shadow-2xl overflow-hidden z-10 animate-in slide-in-from-right-4 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3B82F6] via-[#60A5FA] to-[#3B82F6]" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3.5">
            <SonikomaLogo
              size="sm"
              badge="Studio"
            />
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Project Confirmation
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                Review information before starting the AI pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] p-2 rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="px-6 py-2.5 bg-[#0a0a14] border-b border-white/[0.06] flex items-center gap-2 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                  isActive
                    ? "bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/35 shadow-sm shadow-[#1e3a5f]/40"
                    : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#3B82F6]" : "text-neutral-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content Area ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#3B82F6]/40">
          
          {/* TAB 1: METADATA & DETAILS */}
          {activeTab === "metadata" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl">
                    <BookOpen className="h-3.5 w-3.5 text-[#3B82F6]" />
                  </div>
                  <span className="text-xs font-bold text-white">Title &amp; Chapter Information</span>
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>
                    <BookOpen className="h-3 w-3 text-[#3B82F6]" />
                    Series Title <span className="text-rose-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    value={seriesTitle}
                    onChange={(e) => setSeriesTitle(e.target.value)}
                    placeholder="Enter series title..."
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <Hash className="h-3 w-3 text-[#3B82F6]" />
                      Chapter Number <span className="text-rose-500 ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={chapterNumber}
                      onChange={(e) => setChapterNumber(e.target.value)}
                      placeholder="Chapter number..."
                      className={`${inputCls} font-mono`}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <FileText className="h-3 w-3 text-[#3B82F6]" />
                      Chapter Title
                    </label>
                    <input
                      type="text"
                      value={chapterTitle}
                      onChange={(e) => setChapterTitle(e.target.value)}
                      placeholder="Chapter title (optional)..."
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <Tags className="h-3 w-3 text-[#3B82F6]" />
                      Genre
                    </label>
                    <input
                      type="text"
                      value={scrapedGenre}
                      onChange={(e) => setScrapedGenre(e.target.value)}
                      placeholder="e.g. Action, Fantasy..."
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <User className="h-3 w-3 text-[#3B82F6]" />
                      Author / Studio
                    </label>
                    <input
                      type="text"
                      value={seriesAuthor}
                      onChange={(e) => setSeriesAuthor(e.target.value)}
                      placeholder="Author or artist name..."
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                    <ImageIcon className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Cover Art &amp; Visibility</span>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-[80px] h-[108px] shrink-0 rounded-2xl overflow-hidden border border-white/[0.08] bg-[#0a0a12] flex items-center justify-center relative group">
                    {displayCoverUrl ? (
                      <>
                        <img
                          src={displayCoverUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        {isExtractingCover && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-neutral-600 gap-1 text-center p-2">
                        {isExtractingCover ? (
                          <Loader2 className="h-5 w-5 animate-spin text-[#3B82F6]" />
                        ) : (
                          <>
                            <ImageIcon className="h-5 w-5 text-neutral-500" />
                            <span className="text-[9px] font-mono">No cover</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={seriesCoverImage}
                        onChange={(e) => {
                          setSeriesCoverImage(e.target.value);
                          if (e.target.value) setLocalCoverImage(null);
                        }}
                        placeholder="Paste image URL..."
                        className={`${inputCls} text-xs font-mono`}
                      />
                      {onAutoExtractCover ? (
                        <button
                          type="button"
                          onClick={handleAutoExtract}
                          disabled={isExtractingCover}
                          className="px-3 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/25 text-[#60A5FA] rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Auto
                        </button>
                      ) : availableImages.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (availableImages[0]) {
                              setSeriesCoverImage(availableImages[0]);
                              setLocalCoverImage(null);
                            }
                          }}
                          className="px-3 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/25 text-[#60A5FA] rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          First Panel
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer px-3 py-2 bg-white/[0.04] hover:bg-white/[0.07] text-neutral-400 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border border-white/[0.07] w-fit">
                        <Upload className="w-3 h-3 text-[#3B82F6]" />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      {localCoverImage && (
                        <span className="text-[10px] text-emerald-400 font-mono">✓ File uploaded</span>
                      )}
                    </div>

                    {availableImages.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] text-neutral-500 font-mono block mb-1.5">
                          Quick Select from Storyboard:
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                          {availableImages.slice(0, 6).map((imgUrl, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSeriesCoverImage(imgUrl);
                                setLocalCoverImage(null);
                              }}
                              className={`w-10 h-10 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer ${
                                seriesCoverImage === imgUrl && !localCoverImage
                                  ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/30 scale-105"
                                  : "border-white/10 hover:border-white/30 opacity-70 hover:opacity-100"
                              }`}
                            >
                              <img
                                src={
                                  imgUrl.startsWith("data:") ||
                                  imgUrl.startsWith("blob:") ||
                                  isApiUrl(imgUrl) ||
                                  isProxyUrl(imgUrl)
                                    ? imgUrl
                                    : getProxyImageUrl(imgUrl)
                                }
                                alt={`Asset ${i + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>
                    <AlignLeft className="h-3 w-3 text-indigo-400" />
                    Series Synopsis
                  </label>
                  <textarea
                    value={seriesSynopsis}
                    onChange={(e) => setSeriesSynopsis(e.target.value)}
                    rows={3}
                    placeholder="Enter series summary or story overview..."
                    className={`${inputCls} resize-none leading-relaxed`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelCls}>
                    <Eye className="h-3 w-3 text-indigo-400" />
                    Visibility Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value)}
                    className={selectCls}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI & AUDIO STUDIO */}
          {activeTab === "ai" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Presets */}
              <div className="bg-[#0e0f19]/80 border border-white/[0.07] rounded-2xl p-4 flex items-center justify-between gap-2 overflow-x-auto">
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Quick Presets:
                </span>
                <div className="flex items-center gap-2">
                  {PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className={`px-3 py-1.5 bg-${preset.color}-500/10 hover:bg-${preset.color}-500/20 border border-${preset.color}-500/25 text-${preset.color}-300 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer`}
                      >
                        <Icon className={`w-3 h-3 text-${preset.color}-400`} />
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Layout & Narration */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl">
                    <Video className="h-3.5 w-3.5 text-cyan-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Video Format &amp; Tone</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Target Video Ratio</label>
                    <select
                      value={targetLayout}
                      onChange={(e) => setTargetLayout(e.target.value)}
                      className={selectCls}
                    >
                      {LAYOUT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Narration Tone</label>
                    <select
                      value={narrationTone}
                      onChange={(e) => setNarrationTone(e.target.value)}
                      className={selectCls}
                    >
                      {TONE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* AI Pipeline Toggles */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl">
                    <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
                  </div>
                  <span className="text-xs font-bold text-white">AI Automation Pipeline</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {AI_TASK_DEFINITIONS.map(({ key, icon: Icon, label, sub }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleTask(key)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        aiTasks[key]
                          ? "bg-[#3B82F6]/15 border-[#3B82F6]/40 text-[#60A5FA]"
                          : "bg-white/[0.03] border-white/[0.06] text-neutral-600 hover:text-neutral-400"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="w-4 h-4" />
                        {aiTasks[key] && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                        )}
                      </div>
                      <p className="text-xs font-bold leading-tight">{label}</p>
                      <p className="text-[10px] text-neutral-500 font-mono mt-1">{sub}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <Mic className="h-3 w-3 text-[#3B82F6]" />
                      Voice Character
                    </label>
                    <select
                      value={voiceActor}
                      onChange={(e) => setVoiceActor(e.target.value)}
                      className={selectCls}
                    >
                      {VOICE_ACTORS.map((actor) => (
                        <option key={actor.value} value={actor.value}>
                          {actor.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>
                      <Music className="h-3 w-3 text-[#3B82F6]" />
                      Soundtrack Style
                    </label>
                    <select
                      value={bgmStyle}
                      onChange={(e) => setBgmStyle(e.target.value)}
                      className={selectCls}
                    >
                      {BGM_STYLES.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISTRIBUTION & TAGS */}
          {activeTab === "distribution" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Platforms */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <Globe className="h-3.5 w-3.5 text-teal-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Target Platforms</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PLATFORM_OPTIONS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={`py-3 px-3.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer text-left flex items-center justify-between ${
                        targetPlatforms.includes(platform)
                          ? "bg-[#3B82F6]/15 border-[#3B82F6]/35 text-[#60A5FA] shadow-sm"
                          : "bg-white/[0.03] border-white/[0.06] text-neutral-600 hover:text-neutral-400"
                      }`}
                    >
                      <span>{platform}</span>
                      {targetPlatforms.includes(platform) && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className={cardCls}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <Tags className="h-3.5 w-3.5 text-amber-400" />
                    </div>
                    <span className="text-xs font-bold text-white">Tags &amp; Keywords</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoGenerateTags}
                    className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/25 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3 h-3" />
                    Auto-Generate
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 p-3 bg-[#0a0a12] border border-white/[0.07] rounded-2xl min-h-[46px]">
                  {customTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/25 text-xs font-mono"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={customTags.length === 0 ? "Type tag & press Enter..." : ""}
                    className="bg-transparent border-none outline-none text-sm text-neutral-300 flex-1 min-w-[120px] placeholder:text-neutral-700"
                  />
                </div>
              </div>

              {/* Organization & Processing settings */}
              <div className={cardCls}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <Sliders className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <span className="text-xs font-bold text-white">Processing &amp; Workspace</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Folder / Season</label>
                    <input
                      type="text"
                      value={workspaceFolder}
                      onChange={(e) => setWorkspaceFolder(e.target.value)}
                      placeholder="Folder or series grouping..."
                      className={inputCls}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Episode Prefix</label>
                    <input
                      type="text"
                      value={episodePrefix}
                      onChange={(e) => setEpisodePrefix(e.target.value)}
                      placeholder="Episode numbering prefix..."
                      className={`${inputCls} font-mono`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Crop Sensitivity</label>
                    <select
                      value={cropSensitivity}
                      onChange={(e) => setCropSensitivity(e.target.value)}
                      className={selectCls}
                    >
                      {SENSITIVITY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelCls}>Primary Language</label>
                    <select
                      value={primaryLanguage}
                      onChange={(e) => setPrimaryLanguage(e.target.value)}
                      className={selectCls}
                    >
                      {LANGUAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3 shrink-0 bg-[#09090f]/90 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.07] text-neutral-500 hover:text-neutral-300 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-white/[0.07]"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            {activeTab !== "distribution" ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === "metadata") setActiveTab("ai");
                  else if (activeTab === "ai") setActiveTab("distribution");
                }}
                className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.14] rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Next Tab</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => handleConfirm(false)}
              disabled={!seriesTitle.trim() || isSubmitting}
              className="px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] text-neutral-300 hover:text-white border border-white/[0.08] hover:border-white/[0.14] rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSavingDraft ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>Save Draft</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleConfirm(true)}
              disabled={!seriesTitle.trim() || isSubmitting}
              className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLaunchingAI ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Initializing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Launch AI Studio</span>
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
