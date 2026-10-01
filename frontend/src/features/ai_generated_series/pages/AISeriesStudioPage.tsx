import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Sparkles,
  Layers,
  Tv,
  BookOpen,
  Swords,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Film,
  Users,
  Globe,
  SlidersHorizontal,
  Headphones,
  Check,
  ArrowLeft,
  Download,
  Share2,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Edit3,
  MessageSquare,
  Camera,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  Sliders,
  Clock,
} from "lucide-react";
import {
  aiSeriesApi,
  AISeriesProject,
  ChapterSession,
  AISeriesPanel,
  InteractiveSpeechBubble,
  CharacterDNA,
} from "@/api/endpoints/aiSeries";
import { NotificationType } from "@/features/app_notification";
import ShotDirectorInspector from "../components/studio/ShotDirectorInspector";
import RouteLoadingFallback from "@/components/feedback/RouteLoadingFallback";
import { SonikomaLogo } from "@/shared/ui/branding";

// ── Stateful Studio Image Components with Dynamic Processing State ───────
interface StudioPanelImageProps {
  src?: string;
  alt: string;
  shotIndex: number;
  cameraAngle?: string;
  prompt?: string;
  isRegenerating?: boolean;
  screentoneFilter?: boolean;
  fitMode?: "contain" | "cover";
  aspectRatioClass?: string;
  imageModel?: string;
  onOpenInspector?: () => void;
  onReload?: () => void | Promise<void>;
}

const StudioPanelImage: React.FC<StudioPanelImageProps> = ({
  src,
  alt,
  shotIndex,
  cameraAngle,
  prompt,
  isRegenerating = false,
  screentoneFilter = false,
  fitMode = "contain",
  aspectRatioClass = "aspect-[2/3]",
  imageModel,
  onOpenInspector,
  onReload,
}) => {
  // Short display names for AI model watermark
  const MODEL_LABELS: Record<string, string> = {
    turbo: "⚡ Turbo",
    flux: "⚡ Flux",
    "flux-anime": "🎨 Flux Anime",
    "flux-realism": "📸 Flux Real",
    "stable-diffusion": "🖼️ SDXL",
    sana: "🌟 Sana",
  };
  const modelLabel = imageModel ? (MODEL_LABELS[imageModel] ?? imageModel) : null;
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );
  const [isLocalReloading, setIsLocalReloading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const isActuallyProcessing = isRegenerating || isLocalReloading;

  // Active generation elapsed timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActuallyProcessing) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
      setIsLocalReloading(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActuallyProcessing]);

  // Handle external src prop updates
  useEffect(() => {
    if (!src) {
      setImageState("error");
      return;
    }
    setImageState("loading");
    let isCancelled = false;

    // Remote CDN URLs (Pollinations.ai fallback) — skip JS preload, let the <img> element
    // handle loading natively. JS Image() preload has no timeout & fails on slow CDN responses.
    const isRemoteUrl = src.startsWith("http://") || src.startsWith("https://");
    if (isRemoteUrl) {
      // For remote URLs: just mark as loaded immediately so the <img> renders.
      // The <img> element's own onError will handle failures.
      setImageState("loaded");
      return () => { isCancelled = true; };
    }

    // Local /media/ URLs — use preload for instant feedback
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (!isCancelled) {
        setImageState("loaded");
        setIsLocalReloading(false);
      }
    };
    img.onerror = () => {
      if (!isCancelled) {
        setImageState("error");
        setIsLocalReloading(false);
      }
    };
    // 30s timeout for local media that may not exist yet
    const timeout = setTimeout(() => {
      if (!isCancelled) setImageState("error");
    }, 30000);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [src]);

  // Active AI Diffusion Generation / Processing State (Simplest Design with Website Logo)
  if (isActuallyProcessing) {
    const progressPercent = Math.min(96, Math.max(10, Math.round((elapsedSeconds / 22) * 90) + 10));

    return (
      <div
        className={`w-full h-full min-h-[280px] ${aspectRatioClass} flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#0e101d] to-[#07080e] relative overflow-hidden select-none border border-cyan-500/20`}
      >
        {/* Ambient Glow & Website Logo with Spinner Ring */}
        <div className="relative mb-3 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-cyan-500/10 blur-xl absolute pointer-events-none animate-pulse" />
          <div className="relative z-10">
            <SonikomaLogo iconOnly size="md" />
          </div>
          <div className="absolute -inset-1.5 rounded-full border border-cyan-400/30 border-t-cyan-400 animate-spin pointer-events-none" />
        </div>

        {/* Simplest Header */}
        <div className="mb-3 space-y-0.5">
          <span className="text-xs font-mono font-bold text-white block">
            Creating Shot #{shotIndex + 1}...
          </span>
          {cameraAngle && (
            <span className="text-[10px] font-mono text-neutral-400 block capitalize">
              {cameraAngle.replace(/_/g, " ")}
            </span>
          )}
        </div>

        {/* Minimal Progress Bar & Seconds */}
        <div className="w-36 space-y-1.5">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span className="text-cyan-400 font-semibold">{elapsedSeconds}s</span>
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Visual Asset In-Flight Download / Loading State (Simplest Design with Website Logo)
  if (imageState === "loading") {
    return (
      <div
        className={`w-full h-full min-h-[280px] ${aspectRatioClass} flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#10111D] to-[#07080E] relative overflow-hidden select-none`}
      >
        <div className="relative mb-3 flex items-center justify-center">
          <SonikomaLogo iconOnly size="md" />
          <div className="absolute -inset-1.5 rounded-full border border-blue-400/30 border-t-blue-400 animate-spin pointer-events-none" />
        </div>
        <span className="text-xs font-mono font-medium text-neutral-300 block">
          Loading Visual...
        </span>
      </div>
    );
  }

  // Fallback Storyboard Card (Simplest Empty State with Website Logo, Reload & Inspector)
  if (imageState === "error" || !src) {
    const handleReloadClick = async (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsLocalReloading(true);
      try {
        if (onReload) {
          await onReload();
        }
      } catch (err) {
        setIsLocalReloading(false);
      }
    };

    return (
      <div
        className={`w-full h-full min-h-[280px] ${aspectRatioClass} flex flex-col items-center justify-center p-5 text-center bg-gradient-to-b from-[#10111D] to-[#07080E] border border-white/5 relative group select-none`}
      >
        {/* Website Logo in Empty State */}
        <div className="mb-3 transform group-hover:scale-105 transition-transform duration-300">
          <SonikomaLogo iconOnly size="md" />
        </div>

        <div className="mb-4">
          <span className="text-xs font-mono font-medium text-neutral-400 block">
            Empty Shot
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onReload && (
            <button
              type="button"
              onClick={handleReloadClick}
              disabled={isActuallyProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-mono font-semibold transition-all cursor-pointer shadow-lg shadow-blue-500/25 active:scale-95 disabled:pointer-events-none"
              title="Reload / Generate Visual"
            >
              {isActuallyProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload</span>
                </>
              )}
            </button>
          )}
          {onOpenInspector && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white text-xs font-mono font-medium transition-all cursor-pointer active:scale-95"
              title="Open Inspector"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Inspector</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loaded Artwork Frame
  return (
    <img
      src={src}
      alt={alt}
      className={`w-auto h-full max-h-full max-w-full ${fitMode === "cover" ? "object-cover w-full h-full" : "object-contain"
        } block transition-opacity duration-300 opacity-100 ${screentoneFilter ? "contrast-125 grayscale" : ""
        }`}
      loading="eager"
      onError={() => setImageState("error")}
    />
  );
};

interface FilmstripThumbnailProps {
  src?: string;
  shotIndex: number;
  isSelected: boolean;
  hasAudio?: boolean;
  isRegenerating?: boolean;
  onClick: () => void;
}

const FilmstripThumbnail: React.FC<FilmstripThumbnailProps> = ({
  src,
  shotIndex,
  isSelected,
  hasAudio,
  isRegenerating = false,
  onClick,
}) => {
  const [thumbState, setThumbState] = useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error"
  );

  useEffect(() => {
    if (!src) {
      setThumbState("error");
      return;
    }
    setThumbState("loading");
    let cancelled = false;
    // Remote CDN URLs: mark loaded immediately, let native <img> handle it
    const isRemoteUrl = src.startsWith("http://") || src.startsWith("https://");
    if (isRemoteUrl) {
      setThumbState("loaded");
      return () => { cancelled = true; };
    }
    const img = new Image();
    img.src = src;
    img.onload = () => {
      if (!cancelled) setThumbState("loaded");
    };
    img.onerror = () => {
      if (!cancelled) setThumbState("error");
    };
    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <button
      id={`filmstrip-thumb-${shotIndex}`}
      type="button"
      onClick={onClick}
      className={`relative shrink-0 w-16 h-11 rounded-lg overflow-hidden border transition-all cursor-pointer group bg-[#11121F] flex items-center justify-center ${isSelected
        ? "ring-2 ring-blue-500 border-blue-400 scale-105 shadow-md shadow-blue-500/30"
        : "border-white/10 hover:border-white/30 opacity-75 hover:opacity-100"
        }`}
    >
      {(isRegenerating || thumbState === "loading") && (
        <div className="absolute inset-0 bg-gradient-to-tr from-[#131422] to-[#1E1F30] flex items-center justify-center animate-pulse z-10">
          <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
        </div>
      )}

      {thumbState === "loaded" && src && !isRegenerating && (
        <img
          src={src}
          alt={`#${shotIndex + 1}`}
          className="w-full h-full object-cover relative z-10 transition-opacity duration-200"
          onError={() => setThumbState("error")}
        />
      )}

      {thumbState === "error" && !isRegenerating && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-[#131422] to-[#1E1F30]">
          <Sparkles className="w-3 h-3 text-purple-400/60" />
        </div>
      )}

      <div className="absolute top-0.5 left-0.5 px-1 rounded bg-black/85 text-[7px] font-mono font-bold text-white z-20 shadow">
        #{shotIndex + 1}
      </div>
      {hasAudio && (
        <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 z-20" />
      )}
    </button>
  );
};

export interface AISeriesStudioPageProps {
  seriesIdFromRoute?: string;
  navigateTo: (path: string) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor?: typeof fetch;
}

export const AISeriesStudioPage: React.FC<AISeriesStudioPageProps> = ({
  seriesIdFromRoute,
  navigateTo,
  addNotification,
}) => {
  // ── URL & ID Resolution ──────────────────────────────────────────────
  const resolvedSeriesId = React.useMemo(() => {
    if (seriesIdFromRoute) return seriesIdFromRoute;
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      const qSeriesId = search.get("series_id") || search.get("seriesId");
      if (qSeriesId) return qSeriesId;
      const parts = window.location.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && (lastPart.startsWith("ai_series_") || lastPart.startsWith("ai-series_"))) {
        return lastPart;
      }
      const aiIdx = parts.indexOf("ai-series");
      if (aiIdx !== -1 && parts[aiIdx + 1]) {
        return parts[aiIdx + 1];
      }
    }
    return "";
  }, [seriesIdFromRoute]);

  // ── Core Project State ───────────────────────────────────────────────
  const [project, setProject] = useState<AISeriesProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Navigation & Selection State ─────────────────────────────────────
  const [selectedSessionNum, setSelectedSessionNum] = useState<number>(1);
  const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
  const [currentChapter, setCurrentChapter] = useState<ChapterSession | null>(null);
  const [selectedPanelIdx, setSelectedPanelIdx] = useState<number>(0);

  // ── Viewport Controls ────────────────────────────────────────────────
  const [viewportMode, setViewportMode] = useState<"strip" | "grid" | "video">("strip");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [screentoneFilter, setScreentoneFilter] = useState<boolean>(false);
  const [showSpeechBubbles, setShowSpeechBubbles] = useState<boolean>(true);

  // ── Audio & Video Playback State ─────────────────────────────────────
  const [playingAudioIdx, setPlayingAudioIdx] = useState<number | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // ── Flyouts & Modals ─────────────────────────────────────────────────
  const [isCharacterVaultOpen, setIsCharacterVaultOpen] = useState<boolean>(false);
  const [isWorldBibleOpen, setIsWorldBibleOpen] = useState<boolean>(false);
  const [isPanelInspectorOpen, setIsPanelInspectorOpen] = useState<boolean>(true);

  // ── Custom Episode & Session Dropdown Popover States ─────────────────
  const [isEpisodeMenuOpen, setIsEpisodeMenuOpen] = useState<boolean>(false);
  const [isSessionMenuOpen, setIsSessionMenuOpen] = useState<boolean>(false);
  const episodeDropdownRef = useRef<HTMLDivElement | null>(null);
  const sessionDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close custom dropdown menus on click-outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (episodeDropdownRef.current && !episodeDropdownRef.current.contains(e.target as Node)) {
        setIsEpisodeMenuOpen(false);
      }
      if (sessionDropdownRef.current && !sessionDropdownRef.current.contains(e.target as Node)) {
        setIsSessionMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Synthesis & Generation In-Flight States ───────────────────────────
  const [isSynthesizingVisuals, setIsSynthesizingVisuals] = useState<boolean>(false);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState<boolean>(false);
  const [isRegeneratingPanel, setIsRegeneratingPanel] = useState<boolean>(false);
  const [regeneratingPanelIdx, setRegeneratingPanelIdx] = useState<number | null>(null);

  // ── Editing State for Selected Panel ──────────────────────────────────
  const [editingPrompt, setEditingPrompt] = useState<string>("");
  const [editingSpeechText, setEditingSpeechText] = useState<string>("");
  const [editingSpeaker, setEditingSpeaker] = useState<string>("");

  // ── Fetch Project & Initialize Chapter ───────────────────────────────
  const fetchProjectData = useCallback(async (sId: string) => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const proj = await aiSeriesApi.getSeries(sId);
      setProject(proj);

      // Default format viewport mapping
      const fmt = (proj.format_type || "manhwa").toLowerCase();
      if (fmt === "comic_manga") {
        setViewportMode("grid");
        setScreentoneFilter(true);
      } else if (fmt === "anime") {
        setViewportMode("video");
      } else {
        setViewportMode("strip");
      }

      // Load initial Chapter 1
      const chap = await aiSeriesApi.getChapter(sId, 1, 1);
      setCurrentChapter(chap);
      if (chap.panels && chap.panels.length > 0) {
        setSelectedPanelIdx(0);
        setEditingPrompt(chap.panels[0].prompt || "");
        setEditingSpeechText(chap.panels[0].speech_text || "");
        setEditingSpeaker(chap.panels[0].speech_bubbles?.[0]?.speaker_name || "Hero");
      }
    } catch (err: any) {
      console.error("[AISeriesStudio] Load failure:", err);
      setLoadError(err.message || "Failed to load AI Series project.");
      addNotification("Could not retrieve AI Series project data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    if (resolvedSeriesId) {
      fetchProjectData(resolvedSeriesId);
    } else {
      aiSeriesApi
        .listSeries()
        .then((list) => {
          if (list && list.length > 0) {
            fetchProjectData(list[0].series_id);
          } else {
            setIsLoading(false);
            setLoadError(
              "No AI Series created yet. Use the Workspace to construct your first AI series."
            );
          }
        })
        .catch(() => {
          setIsLoading(false);
          setLoadError(
            "No Series ID specified. Please select an AI Series from the Dashboard."
          );
        });
    }
  }, [resolvedSeriesId, fetchProjectData]);

  // ── Chapter Selector Handler ──────────────────────────────────────────
  const handleSelectChapter = async (sessNum: number, chapNum: number) => {
    if (!resolvedSeriesId) return;
    try {
      setSelectedSessionNum(sessNum);
      setSelectedChapterNum(chapNum);
      const chap = await aiSeriesApi.getChapter(resolvedSeriesId, sessNum, chapNum);
      setCurrentChapter(chap);
      if (chap.panels && chap.panels.length > 0) {
        setSelectedPanelIdx(0);
        setEditingPrompt(chap.panels[0].prompt || "");
        setEditingSpeechText(chap.panels[0].speech_text || "");
        setEditingSpeaker(chap.panels[0].speech_bubbles?.[0]?.speaker_name || "Hero");
      }
      addNotification(`Loaded Chapter ${chapNum}: "${chap.title}"`, "info");
    } catch (err: any) {
      console.error("[AISeriesStudio] Chapter load error:", err);
      addNotification(`Failed to load Chapter ${chapNum}.`, "error");
    }
  };

  // ── Synchronize Selected Panel with Inspector ─────────────────────────
  const activePanel = currentChapter?.panels?.[selectedPanelIdx] || null;

  useEffect(() => {
    if (activePanel) {
      setEditingPrompt(activePanel.prompt || "");
      setEditingSpeechText(activePanel.speech_text || "");
      setEditingSpeaker(activePanel.speech_bubbles?.[0]?.speaker_name || "Hero");
    }
  }, [activePanel]);

  // ── Visual Synthesis Actions ──────────────────────────────────────────
  const handleSynthesizeChapterVisuals = async (model?: string) => {
    if (!resolvedSeriesId || !project) return;
    const chosenModel = model || project.image_model || "flux-anime";
    try {
      setIsSynthesizingVisuals(true);
      addNotification(`Synthesizing visuals with ${chosenModel}...`, "info");
      const updated = await aiSeriesApi.renderChapterImages(
        resolvedSeriesId,
        selectedSessionNum,
        selectedChapterNum,
        chosenModel,
        true
      );
      if (updated) {
        const freshChap = await aiSeriesApi.getChapter(
          resolvedSeriesId,
          selectedSessionNum,
          selectedChapterNum
        );
        setCurrentChapter(freshChap);
        addNotification("Chapter panels synthesized successfully!", "success");
      }
    } catch (err: any) {
      console.error("Visual synthesis failed:", err);
      addNotification(err.message || "Visual synthesis failed.", "error");
    } finally {
      setIsSynthesizingVisuals(false);
    }
  };

  // ── Vocal Dubbing Synthesis Actions ───────────────────────────────────
  const handleSynthesizeAudio = async () => {
    if (!resolvedSeriesId) return;
    try {
      setIsSynthesizingAudio(true);
      addNotification("Synthesizing Edge-TTS vocal audio for all character dialogue...", "info");
      const updated = await aiSeriesApi.synthesizeChapterAudio(
        resolvedSeriesId,
        selectedSessionNum,
        selectedChapterNum
      );
      if (updated) {
        const freshChap = await aiSeriesApi.getChapter(
          resolvedSeriesId,
          selectedSessionNum,
          selectedChapterNum
        );
        setCurrentChapter(freshChap);
        addNotification("Vocal dubbing synthesized successfully!", "success");
      }
    } catch (err: any) {
      console.error("Vocal dubbing failed:", err);
      addNotification(err.message || "Failed to synthesize vocal dubbing.", "error");
    } finally {
      setIsSynthesizingAudio(false);
    }
  };

  // ── Single Panel Regeneration Action by Index ─────────────────────────
  const handleRegeneratePanelByIdx = async (idx: number) => {
    if (!resolvedSeriesId || !panels[idx]) return;
    try {
      setSelectedPanelIdx(idx);
      setRegeneratingPanelIdx(idx);
      setIsRegeneratingPanel(true);
      const targetPanel = panels[idx];
      const panelId = targetPanel.panel_id || targetPanel.id || String(idx + 1);
      addNotification(`Generating Shot #${idx + 1}...`, "info");
      const updatedPanel = await aiSeriesApi.renderPanelImage(
        resolvedSeriesId,
        panelId,
        {
          prompt: targetPanel.prompt || editingPrompt,
          session_number: selectedSessionNum,
          chapter_number: selectedChapterNum,
        }
      );
      if (updatedPanel && currentChapter) {
        const updatedPanels = [...currentChapter.panels];
        updatedPanels[idx] = {
          ...updatedPanels[idx],
          image_url: updatedPanel.image_url,
        };
        setCurrentChapter({
          ...currentChapter,
          panels: updatedPanels,
        });
        addNotification(`Shot #${idx + 1} generated!`, "success");
      }
    } catch (err: any) {
      console.error("Panel render failed:", err);
      addNotification("Failed to generate shot visual.", "error");
    } finally {
      setIsRegeneratingPanel(false);
      setRegeneratingPanelIdx(null);
    }
  };

  const handleRegenerateActivePanel = async () => {
    await handleRegeneratePanelByIdx(selectedPanelIdx);
  };

  // ── Audio Playback Control ────────────────────────────────────────────
  const handlePlayAudioLine = (idx: number, audioUrl?: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (playingAudioIdx === idx) {
      setPlayingAudioIdx(null);
      return;
    }
    if (!audioUrl) {
      addNotification("No synthesized audio URL for this scene line yet.", "info");
      return;
    }
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    setPlayingAudioIdx(idx);
    audio.play().catch((e) => {
      console.warn("Audio playback aborted:", e);
      setPlayingAudioIdx(null);
    });
    audio.onended = () => setPlayingAudioIdx(null);
  };

  // ── Render Loading & Error States ────────────────────────────────────
  if (isLoading) {
    return (
      <RouteLoadingFallback
        status="Constructing AI Series Master Studio..."
        subtitle="Assembling visual sessions, storyboard panels, and dubbing engine..."
      />
    );
  }

  if (loadError || !project) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[70vh] p-6 max-w-lg mx-auto text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl shadow-red-500/10">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-bold text-white">Series Not Available</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {loadError || "The requested AI Series could not be found."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigateTo("/scraper")}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/25"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Scraper & Projects
        </button>
      </div>
    );
  }

  const format = (project.format_type || "manhwa").toLowerCase();
  const isManhwa = format === "manhwa";
  const isComic = format === "comic_manga";
  const isAnime = format === "anime";
  const panels = currentChapter?.panels || [];
  const sessions = project.sessions || [];
  const currentSession = sessions.find((s) => s.session_number === selectedSessionNum) || sessions[0];
  const chapters = currentSession?.chapters || [];

  return (
    <div className="w-full flex-1 flex flex-row bg-[#07080C] text-[#E5E5E5] h-full min-h-0 max-h-full overflow-hidden">
      {/* ── MAIN VISUAL WORKSPACE CANVAS WRAPPER ─────────────────────── */}
      <div className="flex-1 min-w-0 relative h-full min-h-0 overflow-hidden flex flex-col">
        {/* Top Studio Bar: Left (Series Title & Format) | Right (Episode & Session) */}
        <header className="h-12 pl-4 pr-2 bg-[#0A0B12]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-20">
          {/* Left: Format Badge + Series Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {project.format_type && (
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-400/30 shrink-0">
                {project.format_type.replace(/_/g, " ")}
              </span>
            )}
            <h1 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md" title={project.title}>
              {project.title || "AI Series Studio"}
            </h1>
          </div>

          {/* Right: Session and Episode / Chapter Selector */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Session Selector */}
            {sessions.length > 1 ? (
              <div ref={sessionDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSessionMenuOpen((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded-xl bg-[#121322] hover:bg-[#1A1C30] border border-white/15 hover:border-cyan-400/50 text-neutral-200 hover:text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm select-none"
                  aria-haspopup="listbox"
                  aria-expanded={isSessionMenuOpen}
                >
                  <span>Session {selectedSessionNum}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${isSessionMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isSessionMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-[#0E101B]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10">
                      Select Session
                    </div>
                    {sessions.map((s) => {
                      const isSelected = s.session_number === selectedSessionNum;
                      return (
                        <button
                          key={s.session_number}
                          type="button"
                          onClick={() => {
                            const newSess = s.session_number;
                            const targetChap =
                              project?.sessions?.find((sess) => sess.session_number === newSess)?.chapters?.[0]?.chapter_number || 1;
                            handleSelectChapter(newSess, targetChap);
                            setIsSessionMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${isSelected
                            ? "bg-cyan-500/20 text-cyan-200 font-bold border border-cyan-400/30"
                            : "text-neutral-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
                            }`}
                        >
                          <span>Session {s.session_number}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-semibold text-neutral-300 flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Session {selectedSessionNum}</span>
              </div>
            )}

            {/* Episode / Chapter Selector */}
            {chapters.length > 0 && (
              <div ref={episodeDropdownRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEpisodeMenuOpen((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-[#121322] hover:bg-[#1A1C30] border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-200 hover:text-white text-xs font-mono font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm max-w-[280px] select-none"
                  title="Select Episode or Chapter"
                  aria-haspopup="listbox"
                  aria-expanded={isEpisodeMenuOpen}
                >
                  <span className="truncate">
                    {(() => {
                      const cur = chapters.find((c: any) => c.chapter_number === selectedChapterNum);
                      const title =
                        cur?.title?.replace(/^(Chapter|Episode|Ch|Ep)\s*\d+[:\-.]*\s*/i, "").trim() ||
                        cur?.title ||
                        `Episode ${selectedChapterNum}`;
                      return `Ep ${selectedChapterNum}: ${title}`;
                    })()}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-cyan-400 shrink-0 transition-transform duration-200 ${isEpisodeMenuOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {/* Custom Glassmorphism Dropdown Menu */}
                {isEpisodeMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 max-h-80 overflow-y-auto rounded-2xl bg-[#0E101B]/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10 flex items-center justify-between">
                      <span>Episodes & Chapters</span>
                      <span className="text-cyan-400 font-bold">{chapters.length} Total</span>
                    </div>
                    {chapters.map((c: any) => {
                      const isSelected = c.chapter_number === selectedChapterNum;
                      const cleanTitle =
                        c.title?.replace(/^(Chapter|Episode|Ch|Ep)\s*\d+[:\-.]*\s*/i, "").trim() ||
                        c.title ||
                        `Episode ${c.chapter_number}`;

                      return (
                        <button
                          key={c.chapter_number}
                          type="button"
                          onClick={() => {
                            handleSelectChapter(selectedSessionNum, c.chapter_number);
                            setIsEpisodeMenuOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-xl text-left text-xs font-mono transition-all flex items-center justify-between gap-2.5 cursor-pointer ${isSelected
                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-400/40 text-cyan-200 shadow-sm"
                            : "text-neutral-300 hover:text-white hover:bg-white/[0.06] border border-transparent"
                            }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono shrink-0 ${isSelected
                                ? "bg-cyan-500/30 text-cyan-200 border border-cyan-400/40"
                                : "bg-white/10 text-neutral-400"
                                }`}
                            >
                              Ep {c.chapter_number}
                            </span>
                            <span className="truncate">{cleanTitle}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main
          id="ai-series-studio-canvas"
          tabIndex={0}
          className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col items-center p-2 sm:p-3 space-y-2 bg-gradient-to-b from-[#090A10] via-[#07080C] to-[#050608] focus:outline-none relative"
        >
          {/* VIEWPORT 1: Webtoon Continuous Reading Strip (Uncropped, Natural Proportions) */}
          {viewportMode === "strip" && (
            <div
              className="flex flex-col items-center gap-4 transition-all duration-200 shrink-0 pb-3 max-w-full"
            >
              {panels.map((panel, idx) => {
                const isSelected = selectedPanelIdx === idx;
                const isAudioPlayingThis = playingAudioIdx === idx;

                return (
                  <div
                    id={`panel-shot-${idx}`}
                    key={panel.id || idx}
                    onClick={() => setSelectedPanelIdx(idx)}
                    style={{
                      height: zoomLevel === 100 ? "calc(100vh - 135px)" : `${Math.round(88 * (zoomLevel / 100))}vh`,
                      maxHeight: zoomLevel === 100 ? "calc(100vh - 135px)" : undefined,
                    }}
                    className={`relative rounded-2xl bg-[#090A13] border transition-all overflow-hidden shadow-2xl group cursor-pointer flex flex-col items-center justify-center max-w-full ${isManhwa ? "aspect-[2/3]" : isComic ? "aspect-[3/4]" : "aspect-video"
                      } ${isSelected
                        ? "ring-2 ring-blue-500 border-blue-400 z-10 shadow-[0_0_35px_rgba(59,130,246,0.35)]"
                        : "border-white/10 hover:border-white/30"
                      }`}
                  >
                    <StudioPanelImage
                      src={panel.image_url}
                      alt={`Shot #${idx + 1}`}
                      shotIndex={idx}
                      cameraAngle={panel.camera_angle}
                      prompt={panel.prompt}
                      imageModel={project?.image_model}
                      isRegenerating={
                        regeneratingPanelIdx === idx ||
                        (isRegeneratingPanel && isSelected) ||
                        isSynthesizingVisuals
                      }
                      screentoneFilter={screentoneFilter}
                      fitMode="contain"
                      aspectRatioClass={isManhwa ? "aspect-[2/3]" : isComic ? "aspect-[3/4]" : "aspect-video"}
                      onOpenInspector={() => {
                        setSelectedPanelIdx(idx);
                        setIsPanelInspectorOpen(true);
                      }}
                      onReload={() => handleRegeneratePanelByIdx(idx)}
                    />

                    {/* Floating Panel Badge */}
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white shadow-md flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity z-10">
                      <span>#{idx + 1}</span>
                      {panel.camera_angle && (
                        <span className="text-neutral-400 font-normal">| {panel.camera_angle.replace(/_/g, " ")}</span>
                      )}
                    </div>

                    {/* Speech Bubbles Layer */}
                    {showSpeechBubbles && panel.speech_text && (
                      <div className="absolute bottom-6 left-6 right-6 flex flex-col items-center pointer-events-auto z-10">
                        <div className="max-w-[85%] px-4 py-2 rounded-2xl bg-white/95 text-neutral-900 border-2 border-neutral-900 shadow-2xl text-xs font-bold leading-snug tracking-tight text-center relative group-hover:scale-102 transition-transform">
                          {panel.speech_bubbles?.[0]?.speaker_name && (
                            <span className="block text-[9px] font-mono font-extrabold uppercase text-blue-600 mb-0.5">
                              {panel.speech_bubbles[0].speaker_name}
                            </span>
                          )}
                          <span>{panel.speech_text}</span>

                          {/* Sound Effect Pill */}
                          {panel.sound_effects && (
                            <span className="absolute -top-3.5 right-2 px-2 py-0.5 rounded-md bg-amber-500 text-white font-mono text-[9px] font-extrabold uppercase shadow-md rotate-2">
                              {panel.sound_effects}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Audio Play Trigger Floating Button */}
                    {panel.audio_url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAudioLine(idx, panel.audio_url);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md border text-xs shadow-lg transition-all cursor-pointer z-10 ${isAudioPlayingThis
                          ? "bg-emerald-600 border-emerald-400 text-white animate-pulse"
                          : "bg-black/60 hover:bg-black/90 border-white/20 text-neutral-300 hover:text-white"
                          }`}
                        title="Play Scene Vocal Dubbing"
                      >
                        {isAudioPlayingThis ? (
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEWPORT 2: Classic Manga & Comic Grid (See All Panels Overview) */}
          {viewportMode === "grid" && (
            <div
              style={{ maxWidth: `${Math.round(1200 * (zoomLevel / 100))}px` }}
              className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 transition-all duration-200 shrink-0 pb-24"
            >
              {panels.map((panel, idx) => {
                const isSelected = selectedPanelIdx === idx;
                return (
                  <div
                    id={`panel-shot-grid-${idx}`}
                    key={panel.id || idx}
                    onClick={() => {
                      setSelectedPanelIdx(idx);
                      setIsPanelInspectorOpen(true);
                    }}
                    className={`relative rounded-2xl overflow-hidden border bg-[#090A13] cursor-pointer transition-all group flex flex-col ${isSelected
                      ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.35)] ring-2 ring-blue-500/50 scale-[1.02] z-10"
                      : "border-white/10 hover:border-white/30 hover:shadow-xl"
                      }`}
                  >
                    {/* Floating Top Header Badges */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md border border-white/20 text-[10px] font-mono font-bold text-white shadow-md">
                        #{idx + 1}
                      </span>
                      {panel.camera_angle && (
                        <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[9px] font-mono text-neutral-300">
                          {panel.camera_angle.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Image Viewport (Preserves exact 2:3 webtoon proportions) */}
                    <div className="w-full aspect-[2/3] overflow-hidden bg-[#090A13] flex items-center justify-center relative">
                      <StudioPanelImage
                        src={panel.image_url}
                        alt={`Shot #${idx + 1}`}
                        shotIndex={idx}
                        cameraAngle={panel.camera_angle}
                        prompt={panel.prompt}
                        imageModel={project?.image_model}
                        isRegenerating={
                          regeneratingPanelIdx === idx ||
                          (isRegeneratingPanel && selectedPanelIdx === idx) ||
                          isSynthesizingVisuals
                        }
                        screentoneFilter={screentoneFilter}
                        fitMode="cover"
                        aspectRatioClass="aspect-[2/3]"
                        onOpenInspector={() => {
                          setSelectedPanelIdx(idx);
                          setIsPanelInspectorOpen(true);
                        }}
                        onReload={() => handleRegeneratePanelByIdx(idx)}
                      />
                    </div>

                    {/* Dialogue / Action Caption Bar */}
                    <div className="p-3 bg-[#0B0C15] border-t border-white/10 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-blue-400 animate-pulse" : "bg-neutral-500"}`} />
                          Shot #{idx + 1}
                        </span>
                        {panel.audio_url && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Dubbed
                          </span>
                        )}
                      </div>

                      {panel.speech_text ? (
                        <p className="text-[11px] text-neutral-300 font-sans line-clamp-2 italic bg-black/40 px-2 py-1 rounded-md border border-white/5">
                          "{panel.speech_text}"
                        </p>
                      ) : (
                        <p className="text-[10px] text-neutral-500 font-mono truncate">
                          {panel.prompt?.slice(0, 60)}...
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEWPORT 3: Anime Sakuga Video Cinema */}
          {viewportMode === "video" && (
            <div className="w-full max-w-4xl flex flex-col rounded-3xl overflow-hidden bg-black border border-white/15 shadow-2xl shrink-0 pb-16">
              <div className="relative aspect-video w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
                {activePanel ? (
                  <StudioPanelImage
                    src={activePanel.image_url}
                    alt={activePanel.prompt || `Shot #${selectedPanelIdx + 1}`}
                    shotIndex={selectedPanelIdx}
                    cameraAngle={activePanel.camera_angle}
                    prompt={activePanel.prompt}
                    imageModel={project?.image_model}
                    isRegenerating={
                      regeneratingPanelIdx === selectedPanelIdx ||
                      isRegeneratingPanel ||
                      isSynthesizingVisuals
                    }
                    screentoneFilter={screentoneFilter}
                    fitMode="contain"
                    aspectRatioClass="aspect-video"
                    onOpenInspector={() => setIsPanelInspectorOpen(true)}
                    onReload={() => handleRegeneratePanelByIdx(selectedPanelIdx)}
                  />
                ) : (
                  <Tv className="w-16 h-16 text-neutral-700" />
                )}

                {/* Subtitle / Dialogue Bar */}
                {activePanel?.speech_text && (
                  <div className="absolute bottom-6 left-10 right-10 text-center">
                    <span className="px-4 py-1.5 rounded-xl bg-black/80 text-amber-300 font-bold text-sm tracking-wide shadow-lg border border-amber-400/20">
                      {activePanel.speech_text}
                    </span>
                  </div>
                )}
              </div>

              {/* Video Playback Bar */}
              <div className="p-4 bg-[#0E0F17] flex items-center justify-between border-t border-white/10">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (activePanel?.audio_url) {
                        handlePlayAudioLine(selectedPanelIdx, activePanel.audio_url);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <div className="text-xs font-mono text-neutral-300">
                    Shot #{selectedPanelIdx + 1} / {panels.length} • Duration: {activePanel?.duration || 4.0}s
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPanelIdx((idx) => Math.max(0, idx - 1))}
                    disabled={selectedPanelIdx === 0}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Prev Shot
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPanelIdx((idx) => Math.min(panels.length - 1, idx + 1))}
                    disabled={selectedPanelIdx === panels.length - 1}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-white transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Next Shot
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Middle Open Trigger (Portaled directly to document.body on the far right edge of viewport) ── */}
        {!isPanelInspectorOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <button
              type="button"
              onClick={() => setIsPanelInspectorOpen(true)}
              style={{
                position: "fixed",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 9999,
              }}
              className="w-8 h-16 rounded-l-2xl bg-[#0F101D]/95 hover:bg-[#1E2038] border-y border-l border-white/20 hover:border-cyan-400 text-neutral-300 hover:text-cyan-300 flex flex-col items-center justify-center gap-1 shadow-[-4px_0_20px_rgba(0,0,0,0.8)] transition-all cursor-pointer group backdrop-blur-md"
              title="Open Shot Director Inspector"
              aria-label="Open Shot Director Inspector"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-cyan-400 group-hover:text-cyan-300" />
              <Sliders className="w-3.5 h-3.5 text-cyan-400/80 group-hover:text-cyan-300" />
            </button>,
            document.body
          )}
      </div>

      {/* ── RIGHT COLUMN: SHOT DIRECTOR INSPECTOR (FULL HEIGHT) ──────────── */}
      {isPanelInspectorOpen && (
        <ShotDirectorInspector
          seriesId={resolvedSeriesId}
          seriesTitle={project?.title}
          formatType={project?.format_type}
          sessionNumber={selectedSessionNum}
          chapterNumber={selectedChapterNum}
          chapters={project?.sessions?.[0]?.chapters}
          onSelectChapter={(sessNum, chapNum) => handleSelectChapter(sessNum, chapNum)}
          selectedPanelIdx={selectedPanelIdx}
          totalPanels={panels.length}
          panel={activePanel}
          cast={project?.cast}
          imageModel={project?.image_model || "flux-anime"}
          isRegenerating={isRegeneratingPanel}
          onSelectPanelIdx={setSelectedPanelIdx}
          onUpdatePanel={(updated) => {
            if (currentChapter) {
              const updatedPanels = [...currentChapter.panels];
              updatedPanels[selectedPanelIdx] = {
                ...updatedPanels[selectedPanelIdx],
                ...updated,
              };
              setCurrentChapter({
                ...currentChapter,
                panels: updatedPanels,
              });
            }
          }}
          onRegenerateVisual={async (newPrompt, newModel) => {
            setEditingPrompt(newPrompt);
            await handleRegenerateActivePanel();
          }}
          onSynthesizeAudio={async (spk, txt) => {
            if (activePanel?.audio_url) {
              handlePlayAudioLine(selectedPanelIdx, activePanel.audio_url);
            } else {
              addNotification("Synthesizing character vocal line...", "info");
            }
          }}
          onSynthesizeChapterVisuals={handleSynthesizeChapterVisuals}
          isSynthesizingVisuals={isSynthesizingVisuals}
          onSynthesizeChapterAudio={handleSynthesizeAudio}
          isSynthesizingAudio={isSynthesizingAudio}
          onOpenCharacterVault={() => setIsCharacterVaultOpen(true)}
          onOpenWorldBible={() => setIsWorldBibleOpen(true)}
          showSpeechBubbles={showSpeechBubbles}
          onToggleSpeechBubbles={() => setShowSpeechBubbles(!showSpeechBubbles)}
          onClose={() => setIsPanelInspectorOpen(false)}
          addNotification={addNotification}
        />
      )}

      {/* ── MODAL 1: CHARACTER VAULT DNA DRAWER ────────────────────────── */}
      {isCharacterVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0D0E17] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Character DNA Vault</h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Consistent 2D styling, visual lore, and voice models for cast
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCharacterVaultOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {project.cast?.map((char, cIdx) => (
                <div
                  key={char.id || cIdx}
                  className="p-4 rounded-2xl bg-[#131422] border border-white/10 flex items-start gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md shrink-0">
                    {char.name?.charAt(0) || "C"}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{char.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-600/20 text-blue-300 text-[10px] font-mono">
                        {char.role}
                      </span>
                    </div>
                    {char.visual_summary && (
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        {char.visual_summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {char.signature_traits?.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 text-[9px] font-mono text-neutral-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )) || (
                  <p className="text-xs text-neutral-400 text-center py-8">
                    No character DNA registered yet.
                  </p>
                )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: WORLD BIBLE LORE DRAWER ───────────────────────────── */}
      {isWorldBibleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0D0E17] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">World Bible & Setting Lore</h3>
                  <p className="text-xs text-neutral-400 font-mono">
                    Continuity rules, magic systems, and environmental atmosphere
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorldBibleOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-4 rounded-2xl bg-[#131422] border border-white/10 space-y-2">
                <span className="font-mono text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                  Core Logline
                </span>
                <p className="text-neutral-200 leading-relaxed font-sans">
                  {project.logline || "No logline registered."}
                </p>
              </div>

              {project.world_bible && (
                <div className="p-4 rounded-2xl bg-[#131422] border border-white/10 space-y-2">
                  <span className="font-mono text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Continuity & Lore Rules
                  </span>
                  <pre className="text-neutral-300 whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                    {JSON.stringify(project.world_bible, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISeriesStudioPage;
