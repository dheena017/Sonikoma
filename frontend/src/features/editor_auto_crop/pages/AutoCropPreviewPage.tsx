import React, { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  Image as ImageIcon,
  Loader2,
  Scissors,
  Sliders,
  Sparkles,
  Layers,
  ArrowDown,
  ArrowLeft as ArrowLeftIcon,
  ArrowRight as ArrowRightIcon,
  Eye,
  RefreshCw,
  Trash2,
  Maximize2,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Copy,
  Combine,
  RotateCw,
  ZoomIn,
  Crop,
  Edit3,
  Undo2,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Smartphone,
  BookOpen,
  Film,
  Zap,
  ZoomOut,
  Minimize2,
  Expand,
  MoveVertical,
  Plus,
  GripHorizontal,
  Split,
  MousePointer,
  FileWarning,
  MoreHorizontal,
  Move,
  Square,
  EyeOff,
  Settings2,
  Box,
} from "lucide-react";
import * as api from "@/api";
import { getProxiedImageUrl } from "@/utils";
import { DetectTypeResponse, ReadingFlow } from "@/api/endpoints/crop";

export interface AutoCropPreviewPageProps {
  onClose: () => void;
  onConfirm: (confirmedResults?: Record<string, string[]>) => void;
  scrapedImages: string[];
  selectedScraped: string[];
  fetchWithInterceptor?: typeof fetch;
  addNotification?: (message: string, type: any) => void;
  sensitivity?: number;
  padding?: number;
  backgroundColorMode?: string;
  autoSplitTallStrips?: boolean;
  aspectRatioLock?: string;
  minPanelHeightPx?: number;
  overlapMergeThreshold?: number;
  isApplying?: boolean;
  isModal?: boolean;
}

export interface PreviewItem {
  sourceUrl: string;
  panelUrls: string[];
  originalPanelUrls?: string[];
  boxes?: api.PanelBoundingBoxInput[];
  originalBoxes?: api.PanelBoundingBoxInput[];
  typeInfo: DetectTypeResponse | null;
  layout: string;
  readingFlow?: ReadingFlow;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  confidence?: number;
  estimatedCount?: number;
  status?: "loading" | "success" | "error";
  errorMessage?: string;
  errorDetails?: string;
}

// ── SAFE IMAGE COMPONENT WITH RETRY FALLBACK ────────────────────────────────
function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const proxied = getProxiedImageUrl(src);
  const finalSrc = retryKey > 0 ? `${proxied}${proxied.includes("?") ? "&" : "?"}_retry=${retryKey}` : proxied;

  if (hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-3 text-center bg-neutral-900 border border-neutral-800 rounded-xl select-none ${
          fallbackClassName || "w-full h-full min-h-[140px]"
        }`}
      >
        <AlertTriangle className="h-6 w-6 text-amber-400 mb-1.5 shrink-0" />
        <span className="text-[11px] text-neutral-300 font-semibold truncate max-w-full">
          Slice preview failed
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setHasError(false);
            setRetryKey((k) => k + 1);
          }}
          className="mt-2 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 hover:text-emerald-300 text-[10px] font-medium transition-colors flex items-center gap-1 border border-neutral-700 active:scale-95"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reload</span>
        </button>
      </div>
    );
  }

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      onError={() => {
        if (retryKey < 1) {
          setRetryKey(1);
        } else {
          setHasError(true);
        }
      }}
    />
  );
}

// ── FULL-HEIGHT CYBER SCANNER & SKELETON LOADER ─────────────────────────────
function AutoCropFullLoadingSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="w-full h-full min-h-[500px] sm:min-h-[560px] flex-1 flex flex-col justify-between rounded-3xl border border-neutral-800/90 bg-neutral-950/70 p-4 sm:p-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Animated Scanner & Step Indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-xl mx-auto pt-2 sm:pt-4">
        <div className="relative">
          {/* Outer glowing pulsing aura */}
          <div className="absolute -inset-3 bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-sky-500/30 rounded-full blur-xl animate-pulse" />

          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-emerald-400" />
            <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Analyzing Comic Layout & Auto-Cropping Panels...
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold animate-pulse">
              AI Vision
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed">
            Scanning gutter seams, bounding dialog bubbles, and generating precision lossless cuts for {count} source image{count > 1 ? "s" : ""}.
          </p>
        </div>

        {/* Animated Cyber Progress Bar */}
        <div className="w-full max-w-md h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 relative">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full w-2/3 animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Live Processing Steps Badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap pt-1 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>1. Seam Gutter Detection</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            <span>2. Bounding Panel Frames</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-neutral-900/90 border border-neutral-800 text-neutral-500 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-neutral-500" />
            <span>3. Slice Optimization</span>
          </span>
        </div>
      </div>

      {/* Full-Height Shimmering Skeleton Mockup Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full flex-1 pt-2">
        {/* Left Strip Skeleton */}
        <div className="lg:col-span-5 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-3 flex flex-col gap-3 min-h-[260px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-32 bg-neutral-800/80 rounded-md animate-pulse" />
            <div className="h-3.5 w-16 bg-neutral-800/80 rounded-md animate-pulse" />
          </div>
          <div className="flex-1 w-full bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-900/90 rounded-xl border border-neutral-800/50 flex flex-col justify-around p-3 relative overflow-hidden">
            {/* Animated scanning light bar */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent animate-bounce opacity-75" />
            <div className="h-16 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
            <div className="h-20 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
            <div className="h-16 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
          </div>
        </div>

        {/* Right Slices Grid Skeleton */}
        <div className="lg:col-span-7 rounded-2xl border border-neutral-800/80 bg-neutral-950/70 p-3 flex flex-col gap-3 min-h-[260px]">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-36 bg-neutral-800/80 rounded-md animate-pulse" />
            <div className="h-3.5 w-20 bg-neutral-800/80 rounded-md animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div
                key={k}
                className="rounded-xl bg-neutral-900/70 border border-neutral-800/60 p-2 flex flex-col justify-between aspect-[3/4] animate-pulse"
                style={{ animationDelay: `${k * 150}ms` }}
              >
                <div className="h-3 w-8 bg-neutral-800 rounded" />
                <div className="w-8 h-8 rounded-full bg-neutral-800/50 mx-auto" />
                <div className="h-3 w-full bg-neutral-800/60 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AutoCropPreviewPage({
  onClose,
  onConfirm,
  scrapedImages,
  selectedScraped,
  fetchWithInterceptor,
  addNotification,
  sensitivity: initialSensitivity = 45,
  padding: initialPadding = 6,
  backgroundColorMode: initialBgMode = "auto",
  autoSplitTallStrips: initialAutoSplit = true,
  aspectRatioLock: initialAspectRatio = "free",
  minPanelHeightPx: initialMinHeight = 60,
  overlapMergeThreshold = 10,
  isApplying = false,
  isModal = false,
}: AutoCropPreviewPageProps) {
  const targets = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
  const [activeIndex, setActiveIndex] = useState(0);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(targets.length > 0);
  const [isReCropping, setIsReCropping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPanelIndex, setSelectedPanelIndex] = useState<number | null>(null);
  const [inspectModalUrl, setInspectModalUrl] = useState<string | null>(null);

  // View & UX Controls
  const [activeTab, setActiveTab] = useState<"slices" | "compare" | "tuning">("slices");
  const [viewMode, setViewMode] = useState<"grid" | "reel">("grid");
  const [sourceViewMode, setSourceViewMode] = useState<"scroll" | "fit">("scroll");
  const [showCutLines, setShowCutLines] = useState(true);

  // Inspect Modal Controls
  const [inspectZoom, setInspectZoom] = useState<number>(100);
  const [inspectFitMode, setInspectFitMode] = useState<"width" | "contain" | "actual">("width");
  const [inspectIsFullscreen, setInspectIsFullscreen] = useState(false);

  // Live adjustment controls state
  const [sensitivity, setSensitivity] = useState(initialSensitivity);
  const [padding, setPadding] = useState(initialPadding);
  const [backgroundColorMode, setBackgroundColorMode] = useState(initialBgMode);
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState(initialAutoSplit);
  const [aspectRatioLock, setAspectRatioLock] = useState(initialAspectRatio);
  const [minPanelHeightPx, setMinPanelHeightPx] = useState(initialMinHeight);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ── PRESETS ─────────────────────────────────────────────────────────────
  const applyPreset = (preset: "webtoon" | "manga" | "shorts") => {
    if (preset === "webtoon") {
      setSensitivity(55);
      setPadding(4);
      setAutoSplitTallStrips(true);
      setAspectRatioLock("free");
      setBackgroundColorMode("auto");
      addNotification?.("Applied Webtoon Strip preset (Vertical cuts & auto-split)", "info");
    } else if (preset === "manga") {
      setSensitivity(40);
      setPadding(8);
      setAutoSplitTallStrips(false);
      setAspectRatioLock("free");
      setBackgroundColorMode("white");
      addNotification?.("Applied Manga Page preset (White gutters & framed panels)", "info");
    } else if (preset === "shorts") {
      setSensitivity(50);
      setPadding(6);
      setAutoSplitTallStrips(true);
      setAspectRatioLock("9:16");
      setBackgroundColorMode("auto");
      addNotification?.("Applied 9:16 Vertical Video preset", "info");
    }
  };

  const typeInfoCacheRef = useRef<Map<string, DetectTypeResponse>>(new Map());

  const analyzeAndCropSingle = useCallback(
    async (
      url: string,
      currentOptions: {
        sensitivity: number;
        padding: number;
        backgroundColorMode: string;
        autoSplitTallStrips: boolean;
        aspectRatioLock: string;
        minPanelHeightPx: number;
      },
      signal: AbortSignal
    ): Promise<PreviewItem> => {
      const fetcher = fetchWithInterceptor || fetch;
      const reqOptions = { signal };

      let typeInfo: DetectTypeResponse | null = null;
      let panelUrls: string[] = [];
      let detectedPanels: api.PanelBoundingBoxInput[] = [];
      let status: "success" | "error" = "success";
      let errorMessage: string | undefined = undefined;
      let errorDetails: string | undefined = undefined;

      // Check client-side layout cache first to avoid redundant network round-trips
      if (typeInfoCacheRef.current.has(url)) {
        typeInfo = typeInfoCacheRef.current.get(url)!;
      } else {
        try {
          const res = await api.detectPanelCropType(fetcher, { url }, reqOptions);
          if (res && res.success) {
            typeInfo = res;
            typeInfoCacheRef.current.set(url, res);
          }
        } catch (err: any) {
          if (err.name === "AbortError") throw err;
          console.warn("[AutoCropPreview] detectPanelCropType warning:", err);
        }
      }

      const isTallStrip =
        typeInfo?.crop_type === "long_panels" ||
        typeInfo?.crop_type === "four_koma" ||
        (typeInfo?.aspect_ratio ?? 0) >= 2.0;

      try {
        if (isTallStrip) {
          // Route A: Long Tall Webtoon Strips & 4-Koma Vertical Stacks
          const detected = await api.detectLongPanels(
            fetcher,
            {
              url,
              sensitivity: currentOptions.sensitivity,
              background_mode: currentOptions.backgroundColorMode || "auto",
              min_panel_height: currentOptions.minPanelHeightPx,
              overlap_merge_threshold: overlapMergeThreshold,
              auto_split: currentOptions.autoSplitTallStrips,
              bleed_padding_px: currentOptions.padding,
            },
            reqOptions
          );

          if (detected?.panels && detected.panels.length > 0) {
            detectedPanels = [...detected.panels].sort((a, b) => {
              const dy = (a.y ?? 0) - (b.y ?? 0);
              if (Math.abs(dy) > 20) return dy;
              return (a.x ?? 0) - (b.x ?? 0);
            });

            const cropped = await api.cropLongPanels(
              fetcher,
              {
                url,
                panels: detectedPanels,
                bleed_guard_px: currentOptions.padding,
                background_mode: currentOptions.backgroundColorMode || "auto",
                output_format: "webp",
                quality: 90,
              },
              reqOptions
            );

            panelUrls = (cropped?.slices || [])
              .sort((a, b) => a.index - b.index)
              .map((slice) => slice.url);
          } else if (detected && !detected.success) {
            status = "error";
            errorMessage = detected.message || "Detection algorithm returned no valid comic panels.";
          }
        } else {
          // Route B: Small Images, 2D Manga Pages, Grid Layouts
          const detected = await api.detectSmallPanels(
            fetcher,
            {
              url,
              aspect_ratio:
                currentOptions.aspectRatioLock && currentOptions.aspectRatioLock !== "free"
                  ? currentOptions.aspectRatioLock
                  : "free",
              auto_trim: true,
              snap_to_frame: true,
              merge_speech_bubbles: true,
              filter_gutter_sfx: true,
              bleed_padding_px: currentOptions.padding,
            },
            reqOptions
          );

          if (detected?.panels && detected.panels.length > 1) {
            detectedPanels = detected.panels;
            const cropped = await api.cropLongPanels(
              fetcher,
              {
                url,
                panels: detected.panels,
                bleed_guard_px: currentOptions.padding,
                background_mode: currentOptions.backgroundColorMode || "auto",
                output_format: "webp",
                quality: 90,
              },
              reqOptions
            );
            panelUrls = (cropped?.slices || [])
              .sort((a, b) => a.index - b.index)
              .map((slice) => slice.url);
          } else {
            const margins = detected?.margins || {};
            const cropped = await api.cropSmallPanels(
              fetcher,
              {
                url,
                crop_top: margins.crop_top || 0,
                crop_bottom: margins.crop_bottom || 0,
                crop_left: margins.crop_left || 0,
                crop_right: margins.crop_right || 0,
                unit: margins.unit === "percent" ? "percent" : "pixels",
                aspect_ratio:
                  currentOptions.aspectRatioLock && currentOptions.aspectRatioLock !== "free"
                    ? (currentOptions.aspectRatioLock as any)
                    : "free",
                auto_trim: true,
                padding_px: currentOptions.padding,
                output_format: "webp",
                quality: 90,
              },
              reqOptions
            );
            if (cropped?.url) {
              panelUrls = [cropped.url];
            }
          }
        }
      } catch (cropErr: any) {
        if (cropErr.name === "AbortError") throw cropErr;
        console.warn("[AutoCropPreview] crop error:", cropErr);
        status = "error";
        errorMessage = cropErr?.message || "Failed to process panel detection.";
        errorDetails = cropErr?.stack || String(cropErr);
      }

      // Fallback if no slices were produced
      if (panelUrls.length === 0) {
        panelUrls = [url];
      }

      // Fallback default boxes if none detected
      if (detectedPanels.length === 0) {
        const imgH = typeInfo?.height || 1200;
        const imgW = typeInfo?.width || 800;
        const sliceCount = panelUrls.length || 1;
        const sliceH = Math.round(imgH / sliceCount);
        detectedPanels = Array.from({ length: sliceCount }).map((_, i) => ({
          id: i + 1,
          x: 0,
          y: i * sliceH,
          width: imgW,
          height: i === sliceCount - 1 ? imgH - i * sliceH : sliceH,
        }));
      }

      return {
        sourceUrl: url,
        panelUrls,
        originalPanelUrls: [...panelUrls],
        boxes: detectedPanels,
        originalBoxes: [...detectedPanels],
        typeInfo,
        layout: typeInfo?.type_label || (isTallStrip ? "Tall Webtoon Strip" : "Manga Page"),
        readingFlow: typeInfo?.reading_flow,
        dimensions: typeInfo ? { width: typeInfo.width, height: typeInfo.height } : undefined,
        aspectRatio: typeInfo?.aspect_ratio,
        confidence: typeInfo?.confidence,
        estimatedCount: typeInfo?.estimated_panel_count || panelUrls.length,
        status,
        errorMessage,
        errorDetails,
      };
    },
    [fetchWithInterceptor, overlapMergeThreshold]
  );

  const targetsKey = targets.join("|||");
  const processedTargetsKeyRef = useRef<string>("");

  const runPreview = useCallback(async (targetList?: string[]) => {
    const listToProcess = targetList || targets;
    if (listToProcess.length === 0) {
      setIsPreviewing(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsPreviewing(true);
    const optionsSnapshot = {
      sensitivity,
      padding,
      backgroundColorMode,
      autoSplitTallStrips,
      aspectRatioLock,
      minPanelHeightPx,
    };

    try {
      const results = await Promise.all(
        listToProcess.map((url) => analyzeAndCropSingle(url, optionsSnapshot, controller.signal))
      );
      setPreviews(results);
      processedTargetsKeyRef.current = listToProcess.join("|||");
    } catch (error: any) {
      if (error.name !== "AbortError") {
        addNotification?.(error?.message || "Could not generate auto-crop preview.", "error");
      }
    } finally {
      setIsPreviewing(false);
    }
  }, [
    targets,
    analyzeAndCropSingle,
    sensitivity,
    padding,
    backgroundColorMode,
    autoSplitTallStrips,
    aspectRatioLock,
    minPanelHeightPx,
    addNotification,
  ]);

  // Only trigger initial preview run when the target image URLs actually change
  useEffect(() => {
    if (targets.length === 0) return;
    if (processedTargetsKeyRef.current !== targetsKey) {
      void runPreview(targets);
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [targetsKey, runPreview]);

  // ── ERROR RECOVERY & RETRY HANDLERS ────────────────────────────────────────

  const handleRetrySingle = async (idx: number) => {
    const item = previews[idx];
    if (!item) return;

    setPreviews((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], status: "loading", errorMessage: undefined, errorDetails: undefined };
      return next;
    });

    const controller = new AbortController();
    const optionsSnapshot = {
      sensitivity,
      padding,
      backgroundColorMode,
      autoSplitTallStrips,
      aspectRatioLock,
      minPanelHeightPx,
    };

    try {
      const updated = await analyzeAndCropSingle(item.sourceUrl, optionsSnapshot, controller.signal);
      setPreviews((prev) => {
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      addNotification?.(`Image #${idx + 1} re-analyzed successfully!`, "info");
    } catch (err: any) {
      setPreviews((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          status: "error",
          errorMessage: err.message || "Retry failed. Could not process image.",
        };
        return next;
      });
      addNotification?.(`Retry for image #${idx + 1} failed: ${err.message || "Unknown error"}`, "error");
    }
  };

  const handleRetryAllFailed = async () => {
    const failedIndices = previews
      .map((p, i) => (p.status === "error" ? i : -1))
      .filter((i) => i !== -1);

    if (failedIndices.length === 0) return;

    addNotification?.(`Retrying ${failedIndices.length} failed image(s)...`, "info");
    await Promise.all(failedIndices.map((idx) => handleRetrySingle(idx)));
  };

  const handleExcludeImage = (idx: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
    if (activeIndex >= previews.length - 1) {
      setActiveIndex(Math.max(0, previews.length - 2));
    }
    setSelectedPanelIndex(null);
    addNotification?.(`Image #${idx + 1} excluded from auto-crop.`, "info");
  };

  const handleExcludeAllFailed = () => {
    const errorCount = previews.filter((p) => p.status === "error").length;
    setPreviews((prev) => prev.filter((p) => p.status !== "error"));
    setActiveIndex(0);
    setSelectedPanelIndex(null);
    addNotification?.(`Excluded ${errorCount} failed image(s).`, "info");
  };

  const handleUseDefaultFallback = (idx: number, splitCount = 4) => {
    const item = previews[idx];
    if (!item) return;
    const imgH = item.dimensions?.height || 1600;
    const imgW = item.dimensions?.width || 800;
    const sliceH = Math.round(imgH / splitCount);

    const fallbackBoxes: api.PanelBoundingBoxInput[] = Array.from({ length: splitCount }).map((_, i) => ({
      id: i + 1,
      x: 0,
      y: i * sliceH,
      width: imgW,
      height: i === splitCount - 1 ? imgH - i * sliceH : sliceH,
    }));

    setPreviews((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        boxes: fallbackBoxes,
        status: "success",
        errorMessage: undefined,
      };
      return next;
    });

    void handleRecropWithCustomBoxes(idx, fallbackBoxes);
    addNotification?.(`Applied ${splitCount}-panel manual slice fallback.`, "info");
  };

  // ── EDITABLE SLICE OPERATIONS (Instant Local Editing without Blocking Canvas) ──

  const handleRecropWithCustomBoxes = useCallback(
    async (previewIdx: number, newBoxes?: api.PanelBoundingBoxInput[]) => {
      const fetcher = fetchWithInterceptor || fetch;
      const targetPreview = previews[previewIdx];
      const targetBoxes = newBoxes || targetPreview?.boxes || [];
      if (!targetPreview || !targetPreview.sourceUrl || targetBoxes.length === 0) return;

      setIsReCropping(true);
      try {
        const cropped = await api.cropLongPanels(
          fetcher,
          {
            url: targetPreview.sourceUrl,
            panels: targetBoxes,
            bleed_guard_px: padding,
            background_mode: backgroundColorMode || "auto",
            output_format: "webp",
            quality: 90,
          }
        );

        if (cropped?.slices && cropped.slices.length > 0) {
          const newUrls = cropped.slices.sort((a, b) => a.index - b.index).map((s) => s.url);
          setPreviews((prev) => {
            const next = [...prev];
            next[previewIdx] = {
              ...next[previewIdx],
              panelUrls: newUrls,
              boxes: targetBoxes,
              status: "success",
              errorMessage: undefined,
            };
            return next;
          });
          addNotification?.(`Applied ${newUrls.length} customized panel cuts!`, "info");
        }
      } catch (err: any) {
        console.error("Failed to recrop with custom boxes:", err);
        addNotification?.(`Failed to slice with custom boxes: ${err.message || "Unknown error"}`, "error");
      } finally {
        setIsReCropping(false);
      }
    },
    [fetchWithInterceptor, padding, backgroundColorMode, previews, addNotification]
  );

  const handleMoveCutLine = (previewIdx: number, cutIdx: number, newY: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || cutIdx < 0 || cutIdx >= item.boxes.length - 1) return;

    const updated = item.boxes.map((b) => ({ ...b }));
    const prevBox = updated[cutIdx];
    const nextBox = updated[cutIdx + 1];
    const originalNextBottom = (nextBox.y ?? 0) + (nextBox.height ?? 0);

    const minH = 25;
    const clampedY = Math.max((prevBox.y ?? 0) + minH, Math.min(originalNextBottom - minH, Math.round(newY)));

    prevBox.height = clampedY - (prevBox.y ?? 0);
    nextBox.y = clampedY;
    nextBox.height = originalNextBottom - clampedY;

    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });
  };

  const handleNudgeCutLine = (previewIdx: number, cutIdx: number, deltaPx: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || cutIdx < 0 || cutIdx >= item.boxes.length - 1) return;

    const currentY = (item.boxes[cutIdx].y ?? 0) + (item.boxes[cutIdx].height ?? 0);
    handleMoveCutLine(previewIdx, cutIdx, currentY + deltaPx);
  };

  const handleUpdateBox = (previewIdx: number, boxIdx: number, updatedBox: api.PanelBoundingBoxInput) => {
    const item = previews[previewIdx];
    if (!item?.boxes || boxIdx < 0 || boxIdx >= item.boxes.length) return;

    const updated = item.boxes.map((b, i) => (i === boxIdx ? { ...updatedBox } : { ...b }));
    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });
  };

  const handleBatchUpdateBoxes = (previewIdx: number, newBoxes: api.PanelBoundingBoxInput[]) => {
    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: newBoxes };
      return next;
    });
  };

  const handleDeletePanel = (previewIdx: number, boxIdx: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || item.boxes.length <= 1) {
      addNotification?.("Cannot delete the only remaining panel.", "warning");
      return;
    }
    const updated = item.boxes.filter((_, i) => i !== boxIdx);
    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });
    setSelectedPanelIndex(null);
    addNotification?.(`Panel #${boxIdx + 1} removed.`, "info");
  };

  const handleNudgePanel = (previewIdx: number, boxIdx: number, deltaY: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || boxIdx < 0 || boxIdx >= item.boxes.length) return;
    const box = item.boxes[boxIdx];
    const totalH = item.dimensions?.height || 1200;
    const newY = Math.max(0, Math.min(totalH - (box.height ?? 100), (box.y ?? 0) + deltaY));
    handleUpdateBox(previewIdx, boxIdx, { ...box, y: newY });
  };

  const handleAddBox = (previewIdx: number, newBox: api.PanelBoundingBoxInput) => {
    const item = previews[previewIdx];
    if (!item) return;

    const currentBoxes = item.boxes || [];
    const updated = [...currentBoxes, { ...newBox, id: `box_${Date.now()}` }];
    updated.sort((a, b) => (a.y ?? 0) - (b.y ?? 0));

    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });

    const newIdx = updated.findIndex((b) => b.y === newBox.y && b.x === newBox.x);
    if (newIdx !== -1) {
      setSelectedPanelIndex(newIdx);
    }
    addNotification?.(`Added panel box (${newBox.width}×${newBox.height}px).`, "info");
  };

  const handleAddCutLine = (previewIdx: number, yPosition: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || item.boxes.length === 0) return;

    const roundY = Math.round(yPosition);
    const updated: api.PanelBoundingBoxInput[] = [];
    let splitDone = false;

    for (const box of item.boxes) {
      const boxTop = box.y ?? 0;
      const boxBottom = boxTop + (box.height ?? 0);

      if (!splitDone && roundY > boxTop + 25 && roundY < boxBottom - 25) {
        updated.push({
          ...box,
          id: `${box.id ?? 1}_a`,
          height: roundY - boxTop,
        });
        updated.push({
          ...box,
          id: `${box.id ?? 1}_b`,
          y: roundY,
          height: boxBottom - roundY,
        });
        splitDone = true;
      } else {
        updated.push({ ...box });
      }
    }

    if (splitDone) {
      setPreviews((prev) => {
        const next = [...prev];
        next[previewIdx] = { ...next[previewIdx], boxes: updated };
        return next;
      });
      addNotification?.("Added new cut line! Re-slicing panels...", "info");
      void handleRecropWithCustomBoxes(previewIdx, updated);
    }
  };

  const handleDeleteCutLine = (previewIdx: number, cutIdx: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || cutIdx < 0 || cutIdx >= item.boxes.length - 1) return;

    const updated: api.PanelBoundingBoxInput[] = [];
    for (let i = 0; i < item.boxes.length; i++) {
      if (i === cutIdx) {
        const current = item.boxes[i];
        const next = item.boxes[i + 1];
        const mergedBottom = (next.y ?? 0) + (next.height ?? 0);
        updated.push({
          ...current,
          height: mergedBottom - (current.y ?? 0),
        });
        i++; // skip next merged box
      } else {
        updated.push({ ...item.boxes[i] });
      }
    }

    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });
    addNotification?.("Cut line removed and panels merged. Re-slicing...", "info");
    void handleRecropWithCustomBoxes(previewIdx, updated);
  };

  const handleEvenSplit = (previewIdx: number, splitCount: number) => {
    const item = previews[previewIdx];
    if (!item) return;

    const imgH = item.dimensions?.height || (item.boxes && item.boxes.length > 0 ? (item.boxes[item.boxes.length - 1].y ?? 0) + (item.boxes[item.boxes.length - 1].height ?? 0) : 1600);
    const imgW = item.dimensions?.width || (item.boxes && item.boxes.length > 0 ? item.boxes[0].width ?? 800 : 800);
    const sliceH = Math.round(imgH / splitCount);

    const newBoxes: api.PanelBoundingBoxInput[] = Array.from({ length: splitCount }).map((_, i) => ({
      id: i + 1,
      x: 0,
      y: i * sliceH,
      width: imgW,
      height: i === splitCount - 1 ? imgH - i * sliceH : sliceH,
    }));

    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: newBoxes };
      return next;
    });

    addNotification?.(`Divided into ${splitCount} equal panels. Re-slicing...`, "info");
    void handleRecropWithCustomBoxes(previewIdx, newBoxes);
  };

  const handleSplitPanelInHalf = (previewIdx: number, sliceIdx: number) => {
    const item = previews[previewIdx];
    if (!item?.boxes || sliceIdx < 0 || sliceIdx >= item.boxes.length) return;

    const targetBox = item.boxes[sliceIdx];
    const halfH = Math.round((targetBox.height ?? 100) / 2);

    const updated: api.PanelBoundingBoxInput[] = [];
    for (let i = 0; i < item.boxes.length; i++) {
      if (i === sliceIdx) {
        updated.push({
          ...targetBox,
          id: `${targetBox.id ?? sliceIdx}_1`,
          height: halfH,
        });
        updated.push({
          ...targetBox,
          id: `${targetBox.id ?? sliceIdx}_2`,
          y: (targetBox.y ?? 0) + halfH,
          height: (targetBox.height ?? 100) - halfH,
        });
      } else {
        updated.push({ ...item.boxes[i] });
      }
    }

    setPreviews((prev) => {
      const next = [...prev];
      next[previewIdx] = { ...next[previewIdx], boxes: updated };
      return next;
    });

    addNotification?.(`Split panel #${sliceIdx + 1} into two equal slices.`, "info");
    void handleRecropWithCustomBoxes(previewIdx, updated);
  };

  const handleMergeWithNext = (previewIdx: number, sliceIdx: number) => {
    handleDeleteCutLine(previewIdx, sliceIdx);
  };

  const handleMergeWithPrev = (previewIdx: number, sliceIdx: number) => {
    if (sliceIdx <= 0) return;
    handleDeleteCutLine(previewIdx, sliceIdx - 1);
  };

  const handleRemoveSlice = (previewIdx: number, sliceIdx: number) => {
    setPreviews((prev) => {
      const next = [...prev];
      const item = { ...next[previewIdx] };
      item.panelUrls = item.panelUrls.filter((_, i) => i !== sliceIdx);
      if (item.boxes) {
        item.boxes = item.boxes.filter((_, i) => i !== sliceIdx);
      }
      next[previewIdx] = item;
      return next;
    });
    setSelectedPanelIndex(null);
    addNotification?.(`Panel slice #${sliceIdx + 1} excluded.`, "info");
  };

  const handleMoveSlice = (previewIdx: number, fromIdx: number, direction: "left" | "right") => {
    setPreviews((prev) => {
      const next = [...prev];
      const item = { ...next[previewIdx] };
      const toIdx = direction === "left" ? fromIdx - 1 : fromIdx + 1;
      if (toIdx < 0 || toIdx >= item.panelUrls.length) return prev;

      const updatedUrls = [...item.panelUrls];
      const tempUrl = updatedUrls[fromIdx];
      updatedUrls[fromIdx] = updatedUrls[toIdx];
      updatedUrls[toIdx] = tempUrl;
      item.panelUrls = updatedUrls;

      if (item.boxes && item.boxes.length === item.panelUrls.length) {
        const updatedBoxes = [...item.boxes];
        const tempBox = updatedBoxes[fromIdx];
        updatedBoxes[fromIdx] = updatedBoxes[toIdx];
        updatedBoxes[toIdx] = tempBox;
        item.boxes = updatedBoxes;
      }

      next[previewIdx] = item;
      return next;
    });
    setSelectedPanelIndex(direction === "left" ? fromIdx - 1 : fromIdx + 1);
  };

  const handleDuplicateSlice = (previewIdx: number, sliceIdx: number) => {
    setPreviews((prev) => {
      const next = [...prev];
      const item = { ...next[previewIdx] };
      const updatedUrls = [...item.panelUrls];
      updatedUrls.splice(sliceIdx + 1, 0, updatedUrls[sliceIdx]);
      item.panelUrls = updatedUrls;

      if (item.boxes && item.boxes[sliceIdx]) {
        const updatedBoxes = [...item.boxes];
        updatedBoxes.splice(sliceIdx + 1, 0, { ...item.boxes[sliceIdx], id: `${item.boxes[sliceIdx].id ?? sliceIdx}_copy` });
        item.boxes = updatedBoxes;
      }

      next[previewIdx] = item;
      return next;
    });
    addNotification?.(`Panel slice #${sliceIdx + 1} duplicated.`, "info");
  };

  const handleResetSlices = (previewIdx: number) => {
    setPreviews((prev) => {
      const next = [...prev];
      const item = { ...next[previewIdx] };
      if (item.originalPanelUrls) {
        item.panelUrls = [...item.originalPanelUrls];
      }
      if (item.originalBoxes) {
        item.boxes = [...item.originalBoxes];
      }
      next[previewIdx] = item;
      return next;
    });
    setSelectedPanelIndex(null);
    addNotification?.("Panel slices restored to original detection.", "info");
  };

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    const fetcher = fetchWithInterceptor || fetch;
    const confirmedMap: Record<string, string[]> = {};

    try {
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        if (!p.sourceUrl) continue;

        if (p.boxes && p.boxes.length > 0) {
          try {
            const cropped = await api.cropLongPanels(fetcher, {
              url: p.sourceUrl,
              panels: p.boxes,
              bleed_guard_px: padding,
              background_mode: backgroundColorMode || "auto",
              output_format: "webp",
              quality: 90,
            });
            if (cropped?.slices && cropped.slices.length > 0) {
              const urls = cropped.slices.sort((a, b) => a.index - b.index).map((s) => s.url);
              confirmedMap[p.sourceUrl] = urls;
              continue;
            }
          } catch (e) {
            console.warn("Fallback to cached panelUrls for", p.sourceUrl, e);
          }
        }

        if (p.panelUrls && p.panelUrls.length > 0) {
          confirmedMap[p.sourceUrl] = p.panelUrls;
        }
      }
      onConfirm(confirmedMap);
    } catch (err: any) {
      console.error("Error during final crop confirmation:", err);
      addNotification?.(`Error finalizing crops: ${err.message || "Unknown error"}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePreview = previews[activeIndex];
  const totalPanelsDetected = previews.reduce((acc, p) => acc + (p.panelUrls?.length || 0), 0);
  const errorCount = previews.filter((p) => p.status === "error").length;
  const hasErrors = errorCount > 0;

  const renderReadingFlowBadge = (flow?: ReadingFlow) => {
    if (flow === "top_to_bottom") {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] sm:text-xs font-semibold shadow-sm">
          <ArrowDown className="h-3.5 w-3.5 text-sky-400 animate-bounce" />
          <span>Top-to-Bottom (Webtoon)</span>
        </div>
      );
    }
    if (flow === "right_to_left") {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[11px] sm:text-xs font-semibold shadow-sm">
          <ArrowLeftIcon className="h-3.5 w-3.5 text-purple-400" />
          <span>Right-to-Left (Manga)</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] sm:text-xs font-semibold shadow-sm">
        <ArrowRightIcon className="h-3.5 w-3.5 text-emerald-400" />
        <span>Left-to-Right (Comic)</span>
      </div>
    );
  };

  const getLayoutBadgeStyle = (cropType?: string) => {
    switch (cropType) {
      case "long_panels":
      case "ultra_long_panels":
        return "bg-emerald-500/15 border-emerald-500/40 text-emerald-300";
      case "four_koma":
        return "bg-amber-500/15 border-amber-500/40 text-amber-300";
      case "multi_grid_page":
        return "bg-indigo-500/15 border-indigo-500/40 text-indigo-300";
      case "double_page_spread":
        return "bg-rose-500/15 border-rose-500/40 text-rose-300";
      default:
        return "bg-blue-500/15 border-blue-500/40 text-blue-300";
    }
  };

  const containerClasses = isModal
    ? "fixed inset-0 z-[99999] flex items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden"
    : "w-full min-h-full bg-[#050508] text-white p-2 sm:p-6 md:p-8";

  const cardClasses = isModal
    ? "w-full max-w-6xl h-[100dvh] sm:h-auto sm:max-h-[92vh] bg-[#09090D] border-0 sm:border sm:border-neutral-800/90 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white relative z-10"
    : "max-w-6xl mx-auto space-y-6";

  const modalContent = (
    <div className={containerClasses} data-modal="true">
      <div className={cardClasses}>
        {/* ── HEADER (Mobile & Desktop) ────────────────────────────────────── */}
        {/* ── HEADER (Mobile & Desktop) ────────────────────────────────────── */}
        <header className="flex flex-col gap-3 border-b border-neutral-800/90 p-3 sm:p-4 md:p-5 bg-neutral-950/95 shrink-0 backdrop-blur-lg">
          <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
            {/* Left Title Area */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors shrink-0 active:scale-95 !cursor-pointer"
                title="Close"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate text-white">
                    Auto-Crop Preview
                  </h1>
                  <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                    CV Slicer
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block truncate">
                  Inspect detected comic layout, 2D panel boxes, reorder slices, and confirm.
                </p>
              </div>
            </div>

            {/* Right Global Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Re-analyze Button */}
              <button
                type="button"
                onClick={() => void runPreview()}
                disabled={isPreviewing}
                className="p-2 sm:px-3.5 sm:py-2 text-xs font-medium rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1.5 disabled:opacity-50 !cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-sm"
                title="Re-run panel analysis"
              >
                <RefreshCw className={`h-4 w-4 ${isPreviewing ? "animate-spin text-emerald-400" : "text-neutral-400"}`} />
                <span className="hidden sm:inline">Re-analyze</span>
              </button>
            </div>
          </div>

          {/* ── 3 SEPARATE TABS (Slices, Compare, Tuning) ──────────────────── */}
          <div className="flex items-center justify-center w-full pt-1 border-t border-neutral-800/60">
            <div className="grid grid-cols-3 gap-1 bg-neutral-900/90 border border-neutral-800 p-1 rounded-2xl w-full max-w-xl text-xs font-semibold shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("slices")}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 !cursor-pointer active:scale-95 ${
                  activeTab === "slices"
                    ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Layers className="h-4 w-4" />
                <span>Slices ({activePreview?.panelUrls?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("compare")}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 !cursor-pointer active:scale-95 ${
                  activeTab === "compare"
                    ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>Compare</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tuning")}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-2 !cursor-pointer active:scale-95 ${
                  activeTab === "tuning"
                    ? "bg-emerald-500 text-black font-bold shadow-lg shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Tuning</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── MAIN BODY CONTENT (Scrollable & Responsive) ───────────────────── */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
          {targets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-800 p-12 sm:p-16 text-center text-xs sm:text-sm text-neutral-500 flex flex-col items-center justify-center gap-3">
              <ImageIcon className="h-10 w-10 text-neutral-600" />
              <span>No images selected for auto-crop. Select frames in the editor to proceed.</span>
            </div>
          ) : isPreviewing ? (
            <AutoCropFullLoadingSkeleton count={targets.length} />
          ) : (
            <>
              {/* GLOBAL ERROR NOTIFICATION BANNER */}
              {hasErrors && (
                <div className="p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5 text-rose-300 min-w-0">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold block sm:inline">
                        {errorCount} of {previews.length} image(s) encountered detection issues.
                      </span>
                      <span className="text-rose-400/80 text-[11px] block">
                        You can retry detection, manually slice with fallback cuts, or exclude them.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleRetryAllFailed}
                      className="px-3 py-1.5 rounded-xl bg-rose-500 text-black font-bold text-xs hover:bg-rose-400 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Failed ({errorCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExcludeAllFailed}
                      className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-rose-500/40 text-rose-300 hover:text-white hover:bg-rose-950/50 font-medium text-xs transition-colors"
                    >
                      <span>Exclude Failed</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SOURCE SELECTOR CAROUSEL (If multiple targets) */}
              {targets.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-300 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Source Images ({targets.length})</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      Selected: #{activeIndex + 1}
                    </span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {previews.map((item, index) => {
                      const isSel = activeIndex === index;
                      const isItemError = item.status === "error";
                      const isItemLoading = item.status === "loading";

                      return (
                        <button
                          key={item.sourceUrl || index}
                          type="button"
                          onClick={() => {
                            setActiveIndex(index);
                            setSelectedPanelIndex(null);
                          }}
                          className={`relative w-20 sm:w-24 h-24 sm:h-28 shrink-0 rounded-2xl overflow-hidden border-2 transition-all group flex flex-col bg-neutral-950 text-left !cursor-pointer active:scale-95 shadow-sm ${
                            isItemError
                              ? "border-rose-500 ring-2 ring-rose-500/30"
                              : isItemLoading
                              ? "border-emerald-500/40 ring-2 ring-emerald-500/20 bg-neutral-900 animate-pulse"
                              : isSel
                              ? "border-emerald-400 ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/20 bg-emerald-950/20 scale-[1.02]"
                              : "border-neutral-800 hover:border-neutral-700 opacity-80 hover:opacity-100"
                          }`}
                        >
                          {isItemLoading ? (
                            <div className="w-full h-16 sm:h-20 bg-neutral-900/90 flex flex-col items-center justify-center gap-1.5 p-2">
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                              <span className="text-[9px] font-mono text-emerald-300 font-semibold">Scanning</span>
                            </div>
                          ) : (
                            <img
                              src={getProxiedImageUrl(item.sourceUrl)}
                              alt={`Source ${index + 1}`}
                              className="w-full h-16 sm:h-20 object-cover"
                            />
                          )}

                          <div
                            className={`p-1.5 text-[10px] font-mono flex items-center justify-between mt-auto border-t ${
                              isItemError
                                ? "bg-rose-950/90 text-rose-300 border-rose-900/60"
                                : isSel
                                ? "bg-emerald-950/90 text-emerald-200 border-emerald-900/60 font-bold"
                                : "bg-neutral-900/90 text-neutral-400 border-neutral-800"
                            }`}
                          >
                            <span>#{index + 1}</span>
                            {isItemLoading ? (
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
                            ) : isItemError ? (
                              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertCircle className="h-2.5 w-2.5" /> Err
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-bold">{item.panelUrls.length}p</span>
                            )}
                          </div>

                          {isSel && !isItemError && !isItemLoading && (
                            <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-black p-0.5 rounded-full shadow-md">
                              <Check className="h-3 w-3 stroke-[3]" />
                            </div>
                          )}
                          {isItemError && (
                            <div className="absolute top-1.5 right-1.5 bg-rose-500 text-white p-0.5 rounded-full shadow-md">
                              <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTIVE PREVIEW CONTENT */}
              {activePreview ? (
                activePreview.status === "loading" ? (
                  /* ── DEDICATED SKELETON LOADER FOR CURRENT IMAGE ──────────── */
                  <div className="rounded-3xl border border-neutral-800 bg-neutral-950/70 p-8 text-center flex flex-col items-center justify-center gap-4 min-h-[360px] animate-in fade-in">
                    <div className="relative">
                      <div className="absolute -inset-3 bg-emerald-500/20 rounded-full blur-lg animate-pulse" />
                      <div className="relative w-14 h-14 rounded-2xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center">
                        <Loader2 className="h-7 w-7 animate-spin text-emerald-400" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">Analyzing Image #{activeIndex + 1}...</h3>
                      <p className="text-xs text-neutral-400">Detecting gutter seams and 2D panel bounding boxes...</p>
                    </div>
                  </div>
                ) : activePreview.status === "error" ? (
                  /* ── DEDICATED ERROR STATE SCREEN FOR ACTIVE ITEM ─────────── */
                  <div className="rounded-3xl border border-rose-500/40 bg-rose-950/20 p-6 sm:p-8 space-y-5 text-left shadow-2xl animate-in fade-in duration-150">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 shrink-0">
                        <FileWarning className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                          Panel Auto-Detection Failed for Image #{activeIndex + 1}
                        </h3>
                        <p className="text-xs sm:text-sm text-rose-300/90 leading-relaxed">
                          {activePreview.errorMessage ||
                            "The automated vision detector could not identify clear seams or gutter lines for this image."}
                        </p>
                        {activePreview.errorDetails && (
                          <details className="text-[11px] text-neutral-400 mt-2 bg-black/40 p-2.5 rounded-xl border border-neutral-800/80">
                            <summary className="cursor-pointer text-neutral-300 font-mono text-[10px] hover:text-white">
                              Technical Diagnostics
                            </summary>
                            <pre className="mt-2 text-[10px] font-mono text-rose-300/80 whitespace-pre-wrap overflow-x-auto">
                              {activePreview.errorDetails}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>

                    {/* Recovery Action Options */}
                    <div className="pt-3 border-t border-rose-500/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleRetrySingle(activeIndex)}
                        className="p-3 rounded-2xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 active:scale-95 !cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        <span>Retry Auto-Detection</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUseDefaultFallback(activeIndex, 4)}
                        className="p-3 rounded-2xl bg-neutral-900 border border-neutral-700 hover:border-emerald-500/50 text-neutral-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 !cursor-pointer"
                      >
                        <Scissors className="h-4 w-4 text-emerald-400" />
                        <span>Split 4 Slices (Manual Cut)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcludeImage(activeIndex)}
                        className="p-3 rounded-2xl bg-neutral-900 border border-rose-500/30 hover:bg-rose-950/50 text-rose-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 active:scale-95 sm:col-span-2 md:col-span-1 !cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Exclude This Image</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── NORMAL DETECTED PREVIEW VIEW ─────────────────────────── */
                  <div className="space-y-4 sm:space-y-5">
                    {/* METADATA & ANALYSIS BANNER */}
                    <div className="p-3 sm:p-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Primary: Comic Layout Type Badge */}
                        <div
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold flex items-center gap-1.5 ${getLayoutBadgeStyle(
                            activePreview.typeInfo?.crop_type
                          )}`}
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{activePreview.layout}</span>
                        </div>

                        {/* Reading Flow Badge */}
                        {renderReadingFlowBadge(activePreview.readingFlow)}

                        {/* Dimensions Tag */}
                        {activePreview.dimensions && (
                          <div className="hidden sm:flex px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px] font-mono items-center gap-1">
                            <span>{activePreview.dimensions.width} × {activePreview.dimensions.height}px</span>
                            {activePreview.aspectRatio && (
                              <span className="text-neutral-500">
                                ({activePreview.aspectRatio.toFixed(2)}:1)
                              </span>
                            )}
                          </div>
                        )}

                        {/* AI Confidence */}
                        {activePreview.confidence && (
                          <div className="hidden md:flex px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                            {Math.round(activePreview.confidence * 100)}% Confidence
                          </div>
                        )}
                      </div>

                      {/* Right: Quick actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResetSlices(activeIndex)}
                          className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-900 border border-neutral-800 rounded-lg flex items-center gap-1 transition-colors !cursor-pointer active:scale-95"
                          title="Reset cuts to original"
                        >
                          <Undo2 className="h-3.5 w-3.5 text-neutral-400" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>

                    {/* ── TAB 1: SLICES (CROP CARD VIEW) ───────────────────── */}
                    {activeTab === "slices" && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        {/* Slices Header & Toolbar */}
                        <div className="p-3 sm:p-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <Scissors className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-bold text-white">
                              Extracted Panels ({activePreview.panelUrls.length})
                            </span>
                            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
                              · Tap cards to inspect, ½ split, merge, or reorder
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Layout switcher */}
                            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setViewMode("grid")}
                                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 !cursor-pointer ${
                                  viewMode === "grid" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                                }`}
                                title="Grid View"
                              >
                                <LayoutGrid className="h-3.5 w-3.5 text-emerald-400" />
                                <span>Grid</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setViewMode("reel")}
                                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1.5 !cursor-pointer ${
                                  viewMode === "reel" ? "bg-neutral-800 text-white font-bold" : "text-neutral-400 hover:text-white"
                                }`}
                                title="Reel View"
                              >
                                <List className="h-3.5 w-3.5 text-sky-400" />
                                <span>Reel</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Slices Cards Grid / Reel */}
                        <div
                          className={`p-3 sm:p-4 rounded-2xl border border-neutral-800 bg-neutral-950/70 max-h-[600px] overflow-y-auto scrollbar-thin ${
                            viewMode === "reel"
                              ? "flex flex-col gap-4"
                              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                          }`}
                        >
                          {activePreview.panelUrls.map((url, sliceIdx) => {
                            const isSelected = selectedPanelIndex === sliceIdx;
                            const isFirst = sliceIdx === 0;
                            const isLast = sliceIdx === activePreview.panelUrls.length - 1;
                            const box = activePreview.boxes?.[sliceIdx];
                            const boxH = box?.height || 0;
                            const boxW = box?.width || 0;
                            const boxRatio = boxW > 0 && boxH > 0 ? (boxW / boxH).toFixed(2) : undefined;

                            return (
                              <div
                                key={url + sliceIdx}
                                onClick={() => setSelectedPanelIndex(sliceIdx)}
                                className={`relative group rounded-2xl overflow-hidden border-2 transition-all !cursor-pointer bg-neutral-900 flex flex-col ${
                                  isSelected
                                    ? "border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/15 scale-[1.01]"
                                    : "border-neutral-800 hover:border-neutral-700"
                                } ${viewMode === "reel" ? "max-w-md mx-auto w-full" : ""}`}
                              >
                                <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/50">
                                  <SafeImage
                                    src={url}
                                    alt={`Panel ${sliceIdx + 1}`}
                                    className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
                                  />

                                  {/* Panel Number Pill & Dimensions */}
                                  <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none flex-wrap">
                                    <span className="px-2 py-0.5 rounded-lg bg-black/85 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 border border-emerald-500/30 shadow-md">
                                      #{sliceIdx + 1}
                                    </span>
                                    {boxH > 0 && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-[9px] font-mono text-neutral-300 border border-neutral-700">
                                        {boxH}px {boxRatio ? `(${boxRatio}:1)` : ""}
                                      </span>
                                    )}
                                  </div>

                                  {/* Top Right Quick Actions */}
                                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    {/* Inspect Zoom */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setInspectFitMode("contain");
                                        setInspectZoom(100);
                                        setInspectModalUrl(url);
                                      }}
                                      className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
                                      title="Inspect Zoom"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Duplicate */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDuplicateSlice(activeIndex, sliceIdx);
                                      }}
                                      className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
                                      title="Duplicate Slice"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Remove / Exclude */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveSlice(activeIndex, sliceIdx);
                                      }}
                                      className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-rose-400 hover:bg-rose-950/70 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
                                      title="Exclude Slice"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  {/* Bottom Reorder Buttons */}
                                  <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      type="button"
                                      disabled={isFirst}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveSlice(activeIndex, sliceIdx, "left");
                                      }}
                                      className="p-1.5 sm:p-2 rounded-xl bg-black/90 text-neutral-200 hover:text-white disabled:opacity-20 border border-neutral-700 shadow-lg active:scale-90 transition-all flex items-center justify-center !cursor-pointer disabled:cursor-not-allowed"
                                      title="Move earlier"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isLast}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMoveSlice(activeIndex, sliceIdx, "right");
                                      }}
                                      className="p-1.5 sm:p-2 rounded-xl bg-black/90 text-neutral-200 hover:text-white disabled:opacity-20 border border-neutral-700 shadow-lg active:scale-90 transition-all flex items-center justify-center !cursor-pointer disabled:cursor-not-allowed"
                                      title="Move later"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Panel Slice Card Footer Toolbar */}
                                <div className="p-2 bg-neutral-950 border-t border-neutral-800/90 flex items-center justify-between gap-1 text-[10px] font-mono">
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSplitPanelInHalf(activeIndex, sliceIdx);
                                      }}
                                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors active:scale-95 !cursor-pointer"
                                      title="Split this panel into two equal halves"
                                    >
                                      <Scissors className="h-2.5 w-2.5" />
                                      <span>½ Split</span>
                                    </button>

                                    {!isLast && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMergeWithNext(activeIndex, sliceIdx);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center gap-0.5 transition-colors active:scale-95 !cursor-pointer"
                                        title="Merge with next panel below"
                                      >
                                        <Combine className="h-2.5 w-2.5 text-sky-400" />
                                        <span>Merge ▼</span>
                                      </button>
                                    )}
                                  </div>

                                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" /> Ready
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {activePreview.panelUrls.length === 0 && (
                            <div className="col-span-full py-12 text-center text-xs text-neutral-500 flex flex-col items-center justify-center gap-2">
                              <AlertCircle className="h-6 w-6 text-neutral-600" />
                              <span>No panel boxes detected. Switch to "Compare" tab to draw or add boxes.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── TAB 2: COMPARE (CROP EDIT CARD VIEW) ──────────────── */}
                    {activeTab === "compare" && (
                      <div className="space-y-3 animate-in fade-in duration-150">
                        {/* Header & Mode Controls */}
                        <div className="p-3 sm:p-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 flex items-center justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-2">
                            <Box className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm font-bold text-white">
                              Panel Box Editor ({activePreview.boxes?.length || 0} Panels)
                            </span>
                            <span className="text-xs font-mono text-neutral-400 hidden sm:inline">
                              · Move boxes, resize 4 edges & corners, or add new boxes
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Box Overlay Toggle */}
                            <button
                              type="button"
                              onClick={() => setShowCutLines(!showCutLines)}
                              className={`px-2.5 py-1 rounded-lg text-xs border transition-colors flex items-center gap-1 !cursor-pointer ${
                                showCutLines
                                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                                  : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white"
                              }`}
                              title="Toggle Panel Bounding Boxes on Strip"
                            >
                              <Box className="h-3.5 w-3.5" />
                              <span>{showCutLines ? "Boxes Visible" : "Boxes Hidden"}</span>
                            </button>

                            {/* View Mode Toggle for Strip */}
                            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs">
                              <button
                                type="button"
                                onClick={() => setSourceViewMode("scroll")}
                                className={`px-2 py-1 rounded transition-colors !cursor-pointer ${
                                  sourceViewMode === "scroll"
                                    ? "bg-emerald-500/20 text-emerald-300 font-bold"
                                    : "text-neutral-500 hover:text-white"
                                }`}
                                title="Scrollable Strip"
                              >
                                ↕ Scroll
                              </button>
                              <button
                                type="button"
                                onClick={() => setSourceViewMode("fit")}
                                className={`px-2 py-1 rounded transition-colors !cursor-pointer ${
                                  sourceViewMode === "fit"
                                    ? "bg-neutral-800 text-white font-bold"
                                    : "text-neutral-500 hover:text-white"
                                }`}
                                title="Fit Whole Image in Box"
                              >
                                ⊡ Fit All
                              </button>
                            </div>

                            {/* Big Screen Inspector Trigger */}
                            <button
                              type="button"
                              onClick={() => {
                                setInspectFitMode("width");
                                setInspectZoom(100);
                                setInspectModalUrl(activePreview.sourceUrl);
                              }}
                              className="text-xs px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-emerald-400 hover:text-emerald-300 hover:bg-neutral-800 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 font-medium !cursor-pointer"
                            >
                              <ZoomIn className="h-3.5 w-3.5" />
                              <span>Big Screen</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive Canvas Container */}
                        <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden flex flex-col items-center shadow-md">
                          <div
                            className={`w-full p-3 sm:p-5 overflow-auto scroll-smooth overscroll-contain scrollbar-thin ${
                              sourceViewMode === "scroll"
                                ? "max-h-[580px]"
                                : "max-h-[580px] flex items-center justify-center"
                            }`}
                          >
                            <div className="mx-auto w-full max-w-2xl">
                              <InteractiveCutOverlay
                                imageUrl={activePreview.sourceUrl}
                                boxes={activePreview.boxes || []}
                                selectedPanelIndex={selectedPanelIndex}
                                onSelectPanel={(idx) => setSelectedPanelIndex(idx)}
                                onMoveCutLine={(cutIdx, newY) => handleMoveCutLine(activeIndex, cutIdx, newY)}
                                onNudgeCutLine={(cutIdx, deltaPx) => handleNudgeCutLine(activeIndex, cutIdx, deltaPx)}
                                onAddCutLine={(yPos) => handleAddCutLine(activeIndex, yPos)}
                                onDeleteCutLine={(cutIdx) => handleDeleteCutLine(activeIndex, cutIdx)}
                                onUpdateBox={(boxIdx, updatedBox) => handleUpdateBox(activeIndex, boxIdx, updatedBox)}
                                onAddBox={(newBox) => handleAddBox(activeIndex, newBox)}
                                onSplitPanel={(boxIdx) => handleSplitPanelInHalf(activeIndex, boxIdx)}
                                onDeletePanel={(boxIdx) => handleDeletePanel(activeIndex, boxIdx)}
                                onNudgePanel={(boxIdx, deltaY) => handleNudgePanel(activeIndex, boxIdx, deltaY)}
                                onApplyCrop={() => handleRecropWithCustomBoxes(activeIndex)}
                                isReCropping={isReCropping}
                                dimensions={activePreview.dimensions}
                                showCutLines={showCutLines}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ── TAB 3: TUNING (TUNING PARAMETERS CARD VIEW) ────────── */}
                    {activeTab === "tuning" && (
                      <div className="p-4 sm:p-6 rounded-3xl border border-neutral-800 bg-neutral-950/80 space-y-6 animate-in fade-in duration-150">
                        {/* Quick Presets */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-900">
                          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-emerald-400" />
                            <span>Detection Presets:</span>
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => applyPreset("webtoon")}
                              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-emerald-500 text-xs font-medium text-neutral-300 hover:text-emerald-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
                            >
                              <Smartphone className="h-3.5 w-3.5 text-emerald-400" />
                              <span>Webtoon Vertical</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("manga")}
                              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-xs font-medium text-neutral-300 hover:text-purple-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
                            >
                              <BookOpen className="h-3.5 w-3.5 text-purple-400" />
                              <span>Manga Page</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPreset("shorts")}
                              className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-sky-500 text-xs font-medium text-neutral-300 hover:text-sky-300 transition-colors flex items-center gap-1.5 !cursor-pointer active:scale-95 shadow-sm"
                            >
                              <Film className="h-3.5 w-3.5 text-sky-400" />
                              <span>9:16 Shorts</span>
                            </button>
                          </div>
                        </div>

                        {/* Sliders and Selects */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                                Bleed Padding
                              </label>
                              <span className="text-xs font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                                {padding}px
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={padding}
                              onChange={(e) => setPadding(parseInt(e.target.value, 10))}
                              className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] text-neutral-500 block">Expands boundary to preserve border art</span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                                Gutter Sensitivity
                              </label>
                              <span className="text-xs font-mono text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                                {sensitivity}%
                              </span>
                            </div>
                            <input
                              type="range"
                              min="10"
                              max="90"
                              value={sensitivity}
                              onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
                              className="w-full accent-emerald-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                            />
                            <span className="text-[10px] text-neutral-500 block">Higher = cuts more granular panel slices</span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                              Aspect Ratio Lock
                            </label>
                            <select
                              value={aspectRatioLock}
                              onChange={(e) => setAspectRatioLock(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="free">Free / Natural Frame</option>
                              <option value="16:9">16:9 (Landscape Video)</option>
                              <option value="9:16">9:16 (Vertical Shorts / Reels)</option>
                              <option value="1:1">1:1 (Square Feed)</option>
                              <option value="4:3">4:3 (Classic TV)</option>
                            </select>
                            <span className="text-[10px] text-neutral-500 block">Locks output slices to aspect ratio</span>
                          </div>

                          <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-2">
                            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
                              Background Palette
                            </label>
                            <select
                              value={backgroundColorMode}
                              onChange={(e) => setBackgroundColorMode(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="auto">Auto Detect Palette</option>
                              <option value="white">White Gutter Seams</option>
                              <option value="black">Dark / Black Gutter</option>
                              <option value="transparent">Transparent Channels</option>
                            </select>
                            <span className="text-[10px] text-neutral-500 block">Auto detects seam gutter color</span>
                          </div>
                        </div>

                        {/* Apply Tuning Button */}
                        <div className="flex justify-end pt-3 border-t border-neutral-900">
                          <button
                            type="button"
                            onClick={() => {
                              void runPreview();
                              setActiveTab("slices");
                            }}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 flex items-center gap-2 transition-all !cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Apply Settings & Re-Crop</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <AutoCropFullLoadingSkeleton count={targets.length} />
              )}
            </>
          )}
        </div>

        {/* ── STICKY FOOTER ACTIONS (Mobile Touch Optimized) ────────────────── */}
        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-neutral-800/90 p-3 sm:p-5 bg-neutral-950/95 shrink-0 backdrop-blur-lg pb-safe">
          <div className="text-[11px] sm:text-xs text-neutral-400 flex items-center gap-2 w-full sm:w-auto">
            <Info className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Ready to import{" "}
              <strong className="text-emerald-300 font-bold">{totalPanelsDetected} panels</strong> directly into project.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying || isSubmitting}
              className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl border border-neutral-800 bg-neutral-900 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-center active:scale-95"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isApplying || isSubmitting || isPreviewing || isReCropping || totalPanelsDetected === 0}
              className="w-full sm:w-auto px-5 sm:px-7 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold disabled:opacity-40 disabled:hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer text-center active:scale-95"
            >
              {isApplying || isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Confirm ({totalPanelsDetected})</span>
                </>
              )}
            </button>
          </div>
        </footer>

        {/* ── FULL-RES BIG-SCREEN INSPECTION MODAL (With Draggable Cut Lines) ── */}
        {inspectModalUrl && (
          <div
            className={`fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-150 ${
              inspectIsFullscreen ? "p-0" : ""
            }`}
            onClick={() => setInspectModalUrl(null)}
          >
            <div
              className={`relative w-full ${
                inspectIsFullscreen
                  ? "h-screen max-w-none rounded-none"
                  : "max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[94vh] rounded-none sm:rounded-3xl"
              } bg-[#09090D] border-0 sm:border sm:border-neutral-800/90 shadow-2xl flex flex-col overflow-hidden text-white`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Inspection Header Toolbar */}
              <div className="w-full flex items-center justify-between p-3 sm:p-4 border-b border-neutral-800/90 bg-neutral-950/90 backdrop-blur-lg shrink-0 gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <Scissors className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate block">
                      Cut Line Editor & Inspector
                    </span>
                    <span className="text-[10px] text-neutral-400 hidden sm:block">
                      Drag green handles to adjust cuts, click anywhere on the strip to add a cut
                    </span>
                  </div>
                </div>

                {/* Center Controls: View Modes & Zoom (Desktop) */}
                <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {/* Mode Toggles */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectFitMode("width");
                        setInspectZoom(100);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        inspectFitMode === "width"
                          ? "bg-emerald-500 text-black font-bold shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                      title="Webtoon Strip Mode - Full readable width, vertical scroll"
                    >
                      <MoveVertical className="h-3.5 w-3.5" />
                      <span>Fit Width</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInspectFitMode("contain");
                        setInspectZoom(100);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        inspectFitMode === "contain"
                          ? "bg-emerald-500 text-black font-bold shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                      title="Fit Window Mode - Scale to fit screen"
                    >
                      <span>⊡</span>
                      <span>Fit Screen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setInspectFitMode("actual");
                        setInspectZoom(100);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        inspectFitMode === "actual"
                          ? "bg-emerald-500 text-black font-bold shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                      title="1:1 Native Resolution"
                    >
                      <span>1:1</span>
                      <span>Actual</span>
                    </button>
                  </div>

                  {/* Zoom Stepper */}
                  <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setInspectZoom((z) => Math.max(25, z - 25))}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-1.5 font-mono text-[11px] text-emerald-400 font-bold min-w-[42px] text-center">
                      {inspectZoom}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setInspectZoom((z) => Math.min(300, z + 25))}
                      className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Actions: Responsive Overflow Menu + Fullscreen & Close */}
                <div className="flex items-center gap-1.5">
                  {/* 3-Dot Responsive Overflow for Small Screens */}
                  <div className="relative group block sm:hidden">
                    <button
                      type="button"
                      className="p-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center"
                      title="Display & Zoom Options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    <div className="absolute right-0 top-full mt-2 w-52 p-2.5 bg-neutral-900/95 border border-neutral-800 rounded-2xl shadow-2xl backdrop-blur-xl z-50 hidden group-hover:block group-focus-within:block space-y-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 border-b border-neutral-800 pb-1">
                        View Modes
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectFitMode("width");
                            setInspectZoom(100);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                            inspectFitMode === "width" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>Fit Width (Webtoon)</span>
                          <MoveVertical className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectFitMode("contain");
                            setInspectZoom(100);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                            inspectFitMode === "contain" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>Fit Screen</span>
                          <span>⊡</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectFitMode("actual");
                            setInspectZoom(100);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer ${
                            inspectFitMode === "actual" ? "bg-emerald-500/20 text-emerald-300" : "hover:bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          <span>1:1 Actual Size</span>
                          <span>1:1</span>
                        </button>
                      </div>

                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1 border-b border-neutral-800 pb-1 pt-1">
                        Zoom Scale
                      </div>
                      <div className="flex items-center justify-between bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setInspectZoom((z) => Math.max(25, z - 25))}
                          className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                        >
                          <ZoomOut className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono text-xs text-emerald-400 font-bold">{inspectZoom}%</span>
                        <button
                          type="button"
                          onClick={() => setInspectZoom((z) => Math.min(300, z + 25))}
                          className="p-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer"
                        >
                          <ZoomIn className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectIsFullscreen(!inspectIsFullscreen)}
                    className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title={inspectIsFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    {inspectIsFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Expand className="h-4 w-4" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectModalUrl(null)}
                    className="p-1.5 sm:p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                    title="Close Viewer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* High-Resolution Scrollable Canvas with Cut Lines */}
              <div
                className="overflow-auto flex-1 w-full bg-[#050508] p-3 sm:p-6 flex justify-center items-start scrollbar-thin scroll-smooth overscroll-contain"
                onWheel={(e) => {
                  if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    setInspectZoom((prev) => {
                      const delta = e.deltaY < 0 ? 15 : -15;
                      return Math.max(25, Math.min(300, prev + delta));
                    });
                  }
                }}
              >
                <div
                  style={{
                    width: `${inspectZoom}%`,
                    maxWidth:
                      inspectFitMode === "width"
                        ? inspectIsFullscreen
                          ? "1000px"
                          : "780px"
                        : inspectFitMode === "contain"
                        ? "580px"
                        : "none",
                  }}
                  className="mx-auto transition-all duration-150 py-2"
                >
                  <InteractiveCutOverlay
                    imageUrl={inspectModalUrl}
                    boxes={activePreview?.boxes || []}
                    selectedPanelIndex={selectedPanelIndex}
                    onSelectPanel={(idx) => setSelectedPanelIndex(idx)}
                    onMoveCutLine={(cutIdx, newY) => handleMoveCutLine(activeIndex, cutIdx, newY)}
                    onNudgeCutLine={(cutIdx, deltaPx) => handleNudgeCutLine(activeIndex, cutIdx, deltaPx)}
                    onAddCutLine={(yPos) => handleAddCutLine(activeIndex, yPos)}
                    onDeleteCutLine={(cutIdx) => handleDeleteCutLine(activeIndex, cutIdx)}
                    onUpdateBox={(boxIdx, updatedBox) => handleUpdateBox(activeIndex, boxIdx, updatedBox)}
                    onAddBox={(newBox) => handleAddBox(activeIndex, newBox)}
                    onSplitPanel={(boxIdx) => handleSplitPanelInHalf(activeIndex, boxIdx)}
                    onDeletePanel={(boxIdx) => handleDeletePanel(activeIndex, boxIdx)}
                    onNudgePanel={(boxIdx, deltaY) => handleNudgePanel(activeIndex, boxIdx, deltaY)}
                    onApplyCrop={() => handleRecropWithCustomBoxes(activeIndex)}
                    isReCropping={isReCropping}
                    dimensions={activePreview?.dimensions}
                    showCutLines={true}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isModal && typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}

// ── INTERACTIVE CUT OVERLAY COMPONENT ──────────────────────────────────────

interface InteractiveCutOverlayProps {
  imageUrl: string;
  boxes: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  onSelectPanel: (idx: number) => void;
  onMoveCutLine?: (cutIdx: number, newY: number) => void;
  onNudgeCutLine?: (cutIdx: number, deltaPx: number) => void;
  onAddCutLine?: (yPosition: number) => void;
  onDeleteCutLine?: (cutIdx: number) => void;
  onUpdateBox?: (boxIdx: number, updatedBox: api.PanelBoundingBoxInput) => void;
  onAddBox?: (newBox: api.PanelBoundingBoxInput) => void;
  onSplitPanel?: (boxIdx: number) => void;
  onDeletePanel?: (boxIdx: number) => void;
  onNudgePanel?: (boxIdx: number, deltaY: number) => void;
  onApplyCrop?: () => void;
  isReCropping?: boolean;
  dimensions?: { width: number; height: number };
  showCutLines?: boolean;
}

type ToolMode = "box" | "select";

type DragAction =
  | {
      type: "move-box";
      boxIdx: number;
      startPointerX: number;
      startPointerY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      currentX: number;
      currentY: number;
    }
  | {
      type: "resize-box";
      boxIdx: number;
      handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
      startPointerX: number;
      startPointerY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      currentX: number;
      currentY: number;
      currentW: number;
      currentH: number;
    }
  | {
      type: "draw-box";
      startPointerX: number;
      startPointerY: number;
      currentPointerX: number;
      currentPointerY: number;
    };

function InteractiveCutOverlay({
  imageUrl,
  boxes,
  selectedPanelIndex,
  onSelectPanel,
  onUpdateBox,
  onAddBox,
  onSplitPanel,
  onDeletePanel,
  onNudgePanel,
  onApplyCrop,
  isReCropping,
  dimensions,
  showCutLines = true,
}: InteractiveCutOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [dragAction, setDragAction] = useState<DragAction | null>(null);
  const [hoverPixelY, setHoverPixelY] = useState<number | null>(null);
  const [hoverPixelX, setHoverPixelX] = useState<number | null>(null);
  const lastDragEndTimeRef = useRef<number>(0);

  // Tool mode: "box" (draw/add box), "select" (select, move & 4-side resize)
  const [toolMode, setToolMode] = useState<ToolMode>("box");
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);

  // ── Full Customization Display Toggles (User can enable/disable everything) ──
  const [showPanelBoxes, setShowPanelBoxes] = useState<boolean>(true);
  const [showEdgeHandles, setShowEdgeHandles] = useState<boolean>(true);
  const [showCornerHandles, setShowCornerHandles] = useState<boolean>(true);
  const [showMoveBadges, setShowMoveBadges] = useState<boolean>(true);
  const [showHoverGuide, setShowHoverGuide] = useState<boolean>(true);
  const [showDimensionTags, setShowDimensionTags] = useState<boolean>(true);
  const [showPanelBadges, setShowPanelBadges] = useState<boolean>(true);
  const [showQuickToolbar, setShowQuickToolbar] = useState<boolean>(true);

  const totalWidth =
    naturalWidth ||
    dimensions?.width ||
    (boxes.length > 0 ? (boxes[0].width ?? 800) : 800);

  const totalHeight =
    naturalHeight ||
    dimensions?.height ||
    (boxes.length > 0
      ? (boxes[boxes.length - 1].y ?? 0) + (boxes[boxes.length - 1].height ?? 0)
      : 1200);

  const dragRef = useRef<DragAction | null>(null);

  // Helper to find scrollable parent container for smooth auto-scrolling
  const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
    if (!node) return null;
    let parent = node.parentElement;
    while (parent) {
      const { overflowY } = window.getComputedStyle(parent);
      if (overflowY === "auto" || overflowY === "scroll") {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  };

  // Smooth scroll into view when a panel is selected
  useEffect(() => {
    if (selectedPanelIndex === null || dragAction !== null || !containerRef.current) return;
    const targetBox = containerRef.current.querySelector(`[data-panel-idx="${selectedPanelIndex}"]`);
    if (targetBox) {
      targetBox.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
  }, [selectedPanelIndex, dragAction]);

  // Drag start for moving entire bounding box
  const handleBoxMoveStart = (boxIdx: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectPanel(boxIdx);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const box = boxes[boxIdx];
    const origX = box.x ?? 0;
    const origY = box.y ?? 0;
    const origW = box.width ?? totalWidth;
    const origH = box.height ?? Math.round(totalHeight / Math.max(1, boxes.length));

    const action: DragAction = {
      type: "move-box",
      boxIdx,
      startPointerX: pointerX,
      startPointerY: pointerY,
      origX,
      origY,
      origW,
      origH,
      currentX: origX,
      currentY: origY,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Drag start for 4-sided edge and corner resizing
  const handleBoxResizeStart = (
    boxIdx: number,
    handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectPanel(boxIdx);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const box = boxes[boxIdx];
    const origX = box.x ?? 0;
    const origY = box.y ?? 0;
    const origW = box.width ?? totalWidth;
    const origH = box.height ?? Math.round(totalHeight / Math.max(1, boxes.length));

    const action: DragAction = {
      type: "resize-box",
      boxIdx,
      handle,
      startPointerX: pointerX,
      startPointerY: pointerY,
      origX,
      origY,
      origW,
      origH,
      currentX: origX,
      currentY: origY,
      currentW: origW,
      currentH: origH,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Start drawing a new 2D box
  const handleCanvasPointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (toolMode !== "box" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const action: DragAction = {
      type: "draw-box",
      startPointerX: pointerX,
      startPointerY: pointerY,
      currentPointerX: pointerX,
      currentPointerY: pointerY,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Window pointer move and pointer up handlers with dynamic auto-scrolling
  useEffect(() => {
    if (!dragAction) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Auto-scroll when dragging near container boundaries
      const scrollParent = getScrollParent(containerRef.current);
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const edgeBuffer = 50;
        if (clientY < parentRect.top + edgeBuffer) {
          const factor = (parentRect.top + edgeBuffer - clientY) / edgeBuffer;
          scrollParent.scrollTop -= Math.round(factor * 16);
        } else if (clientY > parentRect.bottom - edgeBuffer) {
          const factor = (clientY - (parentRect.bottom - edgeBuffer)) / edgeBuffer;
          scrollParent.scrollTop += Math.round(factor * 16);
        }
      }

      const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const pixelX = (relX / rect.width) * totalWidth;
      const pixelY = (relY / rect.height) * totalHeight;

      const current = dragRef.current;

      if (current.type === "draw-box") {
        const updated: DragAction = {
          ...current,
          currentPointerX: pixelX,
          currentPointerY: pixelY,
        };
        dragRef.current = updated;
        setDragAction(updated);
      } else if (current.type === "move-box") {
        const deltaX = pixelX - current.startPointerX;
        const deltaY = pixelY - current.startPointerY;
        const clampedX = Math.max(0, Math.min(totalWidth - current.origW, Math.round(current.origX + deltaX)));
        const clampedY = Math.max(0, Math.min(totalHeight - current.origH, Math.round(current.origY + deltaY)));

        const updated: DragAction = {
          ...current,
          currentX: clampedX,
          currentY: clampedY,
        };
        dragRef.current = updated;
        setDragAction(updated);
      } else if (current.type === "resize-box") {
        const deltaX = pixelX - current.startPointerX;
        const deltaY = pixelY - current.startPointerY;
        let nextX = current.origX;
        let nextY = current.origY;
        let nextW = current.origW;
        let nextH = current.origH;
        const minDim = 25;

        // North (top edge)
        if (current.handle.includes("n")) {
          const maxY = current.origY + current.origH - minDim;
          const clampedY = Math.max(0, Math.min(maxY, current.origY + deltaY));
          nextY = Math.round(clampedY);
          nextH = Math.round(current.origY + current.origH - nextY);
        }
        // South (bottom edge)
        if (current.handle.includes("s")) {
          const maxH = totalHeight - current.origY;
          const clampedH = Math.max(minDim, Math.min(maxH, current.origH + deltaY));
          nextH = Math.round(clampedH);
        }
        // West (left edge)
        if (current.handle.includes("w")) {
          const maxX = current.origX + current.origW - minDim;
          const clampedX = Math.max(0, Math.min(maxX, current.origX + deltaX));
          nextX = Math.round(clampedX);
          nextW = Math.round(current.origX + current.origW - nextX);
        }
        // East (right edge)
        if (current.handle.includes("e")) {
          const maxW = totalWidth - current.origX;
          const clampedW = Math.max(minDim, Math.min(maxW, current.origX + deltaX));
          nextW = Math.round(clampedW);
        }

        const updated: DragAction = {
          ...current,
          currentX: nextX,
          currentY: nextY,
          currentW: nextW,
          currentH: nextH,
        };
        dragRef.current = updated;
        setDragAction(updated);
      }
    };

    const handlePointerUp = () => {
      const finalAction = dragRef.current;
      dragRef.current = null;
      setDragAction(null);
      lastDragEndTimeRef.current = Date.now();

      if (!finalAction) return;

      if (finalAction.type === "draw-box") {
        const x1 = Math.min(finalAction.startPointerX, finalAction.currentPointerX);
        const y1 = Math.min(finalAction.startPointerY, finalAction.currentPointerY);
        const w = Math.abs(finalAction.currentPointerX - finalAction.startPointerX);
        const h = Math.abs(finalAction.currentPointerY - finalAction.startPointerY);

        if (w >= 30 && h >= 30) {
          onAddBox?.({
            x: Math.round(x1),
            y: Math.round(y1),
            width: Math.round(w),
            height: Math.round(h),
          });
        } else {
          // Quick box creation on single click
          const defaultH = 240;
          onAddBox?.({
            x: 0,
            y: Math.max(0, Math.min(totalHeight - defaultH, Math.round(y1 - defaultH / 2))),
            width: totalWidth,
            height: defaultH,
          });
        }
      } else if (finalAction.type === "move-box") {
        const targetBox = boxes[finalAction.boxIdx];
        if (targetBox && onUpdateBox) {
          onUpdateBox(finalAction.boxIdx, {
            ...targetBox,
            x: finalAction.currentX,
            y: finalAction.currentY,
            width: finalAction.origW,
            height: finalAction.origH,
          });
        }
      } else if (finalAction.type === "resize-box") {
        const targetBox = boxes[finalAction.boxIdx];
        if (targetBox && onUpdateBox) {
          onUpdateBox(finalAction.boxIdx, {
            ...targetBox,
            x: finalAction.currentX,
            y: finalAction.currentY,
            width: finalAction.currentW,
            height: finalAction.currentH,
          });
        }
      }
    };

    window.addEventListener("mousemove", handlePointerMove, { passive: true });
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: true });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [dragAction, boxes, totalWidth, totalHeight, onUpdateBox, onAddBox]);

  // Hover guide tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (dragAction !== null || !containerRef.current) {
      setHoverPixelY(null);
      setHoverPixelX(null);
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const relativeY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const pixelX = (relativeX / rect.width) * totalWidth;
    const pixelY = (relativeY / rect.height) * totalHeight;

    setHoverPixelX(Math.round(pixelX));
    setHoverPixelY(Math.round(pixelY));
  };

  const handleMouseLeave = () => {
    setHoverPixelY(null);
    setHoverPixelX(null);
  };

  // Quick Append Box Helper
  const handleQuickAddBoxAtEnd = () => {
    const lastBox = boxes[boxes.length - 1];
    const newY = lastBox ? (lastBox.y ?? 0) + (lastBox.height ?? 0) + 10 : 0;
    const defaultH = 260;
    onAddBox?.({
      x: 0,
      y: Math.min(Math.max(0, newY), Math.max(0, totalHeight - defaultH)),
      width: totalWidth,
      height: defaultH,
    });
  };

  // Canvas root cursor calculation
  const getCanvasCursorClass = () => {
    if (dragAction !== null) {
      if (dragAction.type === "move-box") return "!cursor-grabbing";
      if (dragAction.type === "draw-box") return "!cursor-crosshair";
      if (dragAction.type === "resize-box") {
        if (dragAction.handle === "n" || dragAction.handle === "s") return "!cursor-ns-resize";
        if (dragAction.handle === "e" || dragAction.handle === "w") return "!cursor-ew-resize";
        if (dragAction.handle === "nw" || dragAction.handle === "se") return "!cursor-nwse-resize";
        if (dragAction.handle === "ne" || dragAction.handle === "sw") return "!cursor-nesw-resize";
      }
      return "!cursor-crosshair";
    }
    if (toolMode === "box") return "!cursor-crosshair";
    return "!cursor-default";
  };

  // Enable/Disable All toggles helper
  const setAllCustomizations = (state: boolean) => {
    setShowPanelBoxes(state);
    setShowEdgeHandles(state);
    setShowCornerHandles(state);
    setShowMoveBadges(state);
    setShowHoverGuide(state);
    setShowDimensionTags(state);
    setShowPanelBadges(state);
    setShowQuickToolbar(state);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* ── INTERACTIVE CANVAS CONTROL & CUSTOMIZATION BAR ── */}
      <div className="w-full mb-2.5 p-2 bg-neutral-950/95 border border-neutral-800 rounded-xl flex items-center justify-between gap-2.5 flex-wrap text-xs shadow-xl backdrop-blur-md">
        {/* Tool Mode Selectors */}
        <div className="flex items-center gap-1.5 bg-neutral-900/90 p-1 rounded-lg border border-neutral-800 shadow-inner">
          <button
            type="button"
            onClick={() => setToolMode("box")}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all !cursor-pointer ${
              toolMode === "box"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title="Draw rectangle or click anywhere to add a panel bounding box"
          >
            <Box className="h-3.5 w-3.5" />
            <span>Add Box</span>
          </button>

          <button
            type="button"
            onClick={() => setToolMode("select")}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all !cursor-pointer ${
              toolMode === "select"
                ? "bg-emerald-400 text-black shadow-md shadow-emerald-500/25 ring-1 ring-emerald-300"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title="Select, reposition, and 4-side resize panels without accidental box creation"
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select & Move</span>
          </button>
        </div>

        {/* Action Buttons: Add Box, Apply & Re-Slice, Customization */}
        <div className="flex items-center gap-2 flex-wrap">
          {onAddBox && (
            <button
              type="button"
              onClick={handleQuickAddBoxAtEnd}
              className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-emerald-500/20 text-neutral-300 hover:text-emerald-300 border border-neutral-800 hover:border-emerald-500/50 text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all !cursor-pointer shadow-sm active:scale-95"
              title="Add a new panel box at bottom"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-400" />
              <span>+ Box</span>
            </button>
          )}

          {onApplyCrop && (
            <button
              type="button"
              onClick={onApplyCrop}
              disabled={isReCropping}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all !cursor-pointer shadow-md active:scale-95 ${
                isReCropping
                  ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed"
                  : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-black border border-emerald-500/50"
              }`}
              title="Re-slice panel thumbnails with current box positions"
            >
              {isReCropping ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                  <span>Slicing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Re-Slice</span>
                </>
              )}
            </button>
          )}

          <span className="text-[11px] font-mono text-neutral-400 font-semibold hidden md:inline px-2 py-1 bg-neutral-900 rounded-md border border-neutral-800">
            {boxes.length} Panels
          </span>

          {/* Customization & Preferences Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-medium flex items-center gap-1.5 transition-all !cursor-pointer shadow-sm ${
                showSettingsMenu
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-emerald-500/20"
                  : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800 hover:text-white"
              }`}
              title="Enable or disable any overlay elements for complete customization"
            >
              <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Customization</span>
              <ChevronDown className="h-3 w-3 opacity-70" />
            </button>

            {/* Customization Settings Menu Popover */}
            {showSettingsMenu && (
              <div
                className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-neutral-950/98 border border-neutral-700 rounded-xl shadow-2xl backdrop-blur-2xl z-50 space-y-3 animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase tracking-wider">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Overlay Customization</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettingsMenu(false)}
                    className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 !cursor-pointer transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Bulk Enable/Disable buttons */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-900">
                  <button
                    type="button"
                    onClick={() => setAllCustomizations(true)}
                    className="flex-1 py-1 rounded bg-neutral-900 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-medium border border-neutral-800 hover:border-emerald-500/40 !cursor-pointer transition-colors"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllCustomizations(false)}
                    className="flex-1 py-1 rounded bg-neutral-900 hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 text-[10px] font-mono font-medium border border-neutral-800 hover:border-rose-500/40 !cursor-pointer transition-colors"
                  >
                    Disable All
                  </button>
                </div>

                {/* Individual Customization Toggles */}
                <div className="space-y-1.5 text-[11px] max-h-72 overflow-y-auto pr-1">
                  {/* Show Panel Boxes */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Panel Boxes & Glow</span>
                    <input
                      type="checkbox"
                      checked={showPanelBoxes}
                      onChange={(e) => setShowPanelBoxes(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show 4-Side Edge Handles */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">4-Side Edge Handles</span>
                    <input
                      type="checkbox"
                      checked={showEdgeHandles}
                      onChange={(e) => setShowEdgeHandles(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show 4 Corner Handles */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">4 Corner Resize Handles</span>
                    <input
                      type="checkbox"
                      checked={showCornerHandles}
                      onChange={(e) => setShowCornerHandles(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show Move Badges */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Move Drag Handles</span>
                    <input
                      type="checkbox"
                      checked={showMoveBadges}
                      onChange={(e) => setShowMoveBadges(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show Hover Guides */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Live Hover Guide</span>
                    <input
                      type="checkbox"
                      checked={showHoverGuide}
                      onChange={(e) => setShowHoverGuide(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show Dimension Tags */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Dimensions & Ratio Tags</span>
                    <input
                      type="checkbox"
                      checked={showDimensionTags}
                      onChange={(e) => setShowDimensionTags(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show Panel # Badges */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Panel Number Badges (#1)</span>
                    <input
                      type="checkbox"
                      checked={showPanelBadges}
                      onChange={(e) => setShowPanelBadges(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>

                  {/* Show Quick Floating Toolbar */}
                  <label className="flex items-center justify-between p-1.5 rounded-lg hover:bg-neutral-900/80 !cursor-pointer transition-colors">
                    <span className="text-neutral-300 font-medium">Floating Action Toolbar</span>
                    <input
                      type="checkbox"
                      checked={showQuickToolbar}
                      onChange={(e) => setShowQuickToolbar(e.target.checked)}
                      className="w-4 h-4 rounded accent-emerald-500 !cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN INTERACTIVE IMAGE CANVAS ── */}
      <div
        ref={containerRef}
        onMouseDown={handleCanvasPointerDown}
        onTouchStart={handleCanvasPointerDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative w-full select-none group/canvas rounded-xl overflow-hidden shadow-2xl transition-all ${getCanvasCursorClass()}`}
      >
        <img
          src={getProxiedImageUrl(imageUrl)}
          alt="Comic Strip Canvas"
          onLoad={(e) => {
            if (e.currentTarget.naturalHeight) {
              setNaturalHeight(e.currentTarget.naturalHeight);
            }
            if (e.currentTarget.naturalWidth) {
              setNaturalWidth(e.currentTarget.naturalWidth);
            }
          }}
          className="w-full h-auto block object-contain pointer-events-none select-none"
        />

        {/* 2D Panel Bounding Box Zones */}
        {showCutLines &&
          boxes.map((box, idx) => {
            const isBeingMoved = dragAction?.type === "move-box" && dragAction.boxIdx === idx;
            const isBeingResized = dragAction?.type === "resize-box" && dragAction.boxIdx === idx;

            const curX = isBeingMoved ? dragAction.currentX : isBeingResized ? dragAction.currentX : (box.x ?? 0);
            const curY = isBeingMoved ? dragAction.currentY : isBeingResized ? dragAction.currentY : (box.y ?? 0);
            const curW = isBeingResized ? dragAction.currentW : (box.width ?? totalWidth);
            const curH = isBeingResized ? dragAction.currentH : (box.height ?? Math.round(totalHeight / Math.max(1, boxes.length)));

            const leftPercent = (curX / totalWidth) * 100;
            const topPercent = (curY / totalHeight) * 100;
            const widthPercent = (curW / totalWidth) * 100;
            const heightPercent = (curH / totalHeight) * 100;

            const isSelected = selectedPanelIndex === idx;
            const ratio = curW > 0 && curH > 0 ? (curW / curH).toFixed(2) : undefined;

            return (
              <div
                key={box.id ?? idx}
                data-panel-idx={idx}
                onClick={(e) => {
                  if (dragAction !== null || Date.now() - lastDragEndTimeRef.current < 250) return;
                  e.stopPropagation();
                  onSelectPanel(idx);
                }}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                }}
                className={`absolute pointer-events-auto transition-[border-color,box-shadow,background-color] select-none ${
                  showPanelBoxes
                    ? isSelected
                      ? "border-2 border-emerald-400 bg-emerald-500/15 ring-2 ring-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] z-20"
                      : "border-2 border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400 hover:bg-emerald-500/10 z-10"
                    : isSelected
                    ? "border-2 border-dashed border-emerald-400 z-20"
                    : "z-10"
                }`}
              >
                {/* Selected Floating Quick Actions Toolbar */}
                {isSelected && showQuickToolbar && !isBeingMoved && !isBeingResized && (
                  <div
                    className={`absolute -top-11 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-950/95 border border-emerald-500/70 shadow-2xl backdrop-blur-md transition-all duration-150 pointer-events-auto ${
                      topPercent < 6 ? "top-2" : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {showPanelBadges && (
                      <span className="text-[10px] font-mono font-bold text-emerald-300 pr-1.5 border-r border-neutral-700 select-none">
                        Panel #{idx + 1}
                      </span>
                    )}

                    {/* Move Handle Pill in Toolbar */}
                    {showMoveBadges && (
                      <div
                        onMouseDown={(e) => handleBoxMoveStart(idx, e)}
                        onTouchStart={(e) => handleBoxMoveStart(idx, e)}
                        className="px-2 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500 hover:text-black text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/40 !cursor-move active:!cursor-grabbing transition-colors shadow-sm"
                        title="Drag to move panel anywhere"
                      >
                        <Move className="h-3 w-3 pointer-events-none" />
                        <span className="pointer-events-none select-none">Move</span>
                      </div>
                    )}

                    {/* Nudge Controls */}
                    {onNudgePanel && (
                      <div className="flex items-center gap-0.5 border-l border-r border-neutral-800 px-1">
                        <button
                          type="button"
                          onClick={() => onNudgePanel(idx, -5)}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-emerald-300 transition-colors !cursor-pointer active:scale-90"
                          title="Nudge Up 5px"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onNudgePanel(idx, 5)}
                          className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-emerald-300 transition-colors !cursor-pointer active:scale-90"
                          title="Nudge Down 5px"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    )}

                    {/* Split in Half */}
                    {onSplitPanel && (
                      <button
                        type="button"
                        onClick={() => onSplitPanel(idx)}
                        className="px-2 py-0.5 rounded-full hover:bg-neutral-800 text-neutral-300 hover:text-emerald-300 text-[10px] font-mono flex items-center gap-1 transition-colors !cursor-pointer active:scale-95"
                        title="Split this panel in half"
                      >
                        <Split className="h-3 w-3" />
                        <span className="hidden sm:inline">Split</span>
                      </button>
                    )}

                    {/* Delete Panel */}
                    {onDeletePanel && boxes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeletePanel(idx)}
                        className="p-1 rounded-md hover:bg-rose-950 text-neutral-400 hover:text-rose-400 transition-colors !cursor-pointer active:scale-90"
                        title="Delete this panel"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Header: Panel Number Badge, Move Drag Handle & Dimension Tag */}
                <div className="absolute top-1.5 inset-x-1.5 sm:inset-x-2 flex items-center justify-between z-30 pointer-events-auto gap-1">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {showPanelBadges && (
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-neutral-950/90 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 border border-emerald-500/40 shadow-md select-none">
                        #{idx + 1}
                      </span>
                    )}

                    {/* 4-Way Full Move Button / Drag Handle */}
                    {showMoveBadges && (
                      <div
                        onMouseDown={(e) => handleBoxMoveStart(idx, e)}
                        onTouchStart={(e) => handleBoxMoveStart(idx, e)}
                        className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 border transition-all !cursor-move active:!cursor-grabbing select-none shadow-md ${
                          isBeingMoved
                            ? "bg-emerald-400 text-black border-white ring-2 ring-emerald-400/50 scale-105"
                            : "bg-neutral-900/95 text-emerald-300 border-neutral-700 hover:bg-emerald-500 hover:text-black hover:border-emerald-400"
                        }`}
                        title="Click and drag to move panel anywhere"
                      >
                        <Move className="h-3 w-3 pointer-events-none" />
                        <span className="pointer-events-none font-semibold hidden sm:inline">Move</span>
                      </div>
                    )}
                  </div>

                  {/* Dimension & Coordinates Display */}
                  {showDimensionTags && (
                    <div className="flex items-center gap-1">
                      {(isBeingMoved || isBeingResized) && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950/95 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-500/60 shadow-md">
                          X:{curX} Y:{curY}
                        </span>
                      )}
                      {curH > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-black/85 text-[9px] font-mono text-neutral-300 border border-neutral-700 shadow-sm">
                          {curW}×{curH}px {ratio ? `· ${ratio}:1` : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Interior Draggable Move Zone (Without overlapping center badges) */}
                <div
                  onMouseDown={(e) => handleBoxMoveStart(idx, e)}
                  onTouchStart={(e) => handleBoxMoveStart(idx, e)}
                  className="absolute inset-4 sm:inset-6 !cursor-move active:!cursor-grabbing z-10"
                  title="Drag anywhere inside to move panel"
                />

                {/* ── 4-SIDED EDGE RESIZE HANDLES ── */}
                {showEdgeHandles && (
                  <>
                    {/* Top Edge Handle (North) */}
                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "n", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "n", e)}
                      className="absolute -top-2.5 inset-x-8 h-5 !cursor-ns-resize z-30 flex items-center justify-center group/h-top pointer-events-auto"
                      title="Drag to resize top edge"
                    >
                      <div className="w-20 h-1.5 rounded-full bg-emerald-400 group-hover/h-top:h-2 group-hover/h-top:w-28 group-hover/h-top:bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)] transition-all" />
                    </div>

                    {/* Bottom Edge Handle (South) */}
                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "s", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "s", e)}
                      className="absolute -bottom-2.5 inset-x-8 h-5 !cursor-ns-resize z-30 flex items-center justify-center group/h-bottom pointer-events-auto"
                      title="Drag to resize bottom edge"
                    >
                      <div className="w-20 h-1.5 rounded-full bg-emerald-400 group-hover/h-bottom:h-2 group-hover/h-bottom:w-28 group-hover/h-bottom:bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)] transition-all" />
                    </div>

                    {/* Left Edge Handle (West) */}
                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "w", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "w", e)}
                      className="absolute -left-2.5 inset-y-8 w-5 !cursor-ew-resize z-30 flex items-center justify-center group/h-left pointer-events-auto"
                      title="Drag to resize left edge"
                    >
                      <div className="h-20 w-1.5 rounded-full bg-emerald-400 group-hover/h-left:w-2 group-hover/h-left:h-28 group-hover/h-left:bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)] transition-all" />
                    </div>

                    {/* Right Edge Handle (East) */}
                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "e", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "e", e)}
                      className="absolute -right-2.5 inset-y-8 w-5 !cursor-ew-resize z-30 flex items-center justify-center group/h-right pointer-events-auto"
                      title="Drag to resize right edge"
                    >
                      <div className="h-20 w-1.5 rounded-full bg-emerald-400 group-hover/h-right:w-2 group-hover/h-right:h-28 group-hover/h-right:bg-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.9)] transition-all" />
                    </div>
                  </>
                )}

                {/* ── 4 CORNER RESIZE HANDLES ── */}
                {showCornerHandles && (
                  <>
                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "nw", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "nw", e)}
                      className="absolute -top-2 -left-2 w-4 h-4 rounded-sm bg-emerald-400 hover:bg-emerald-300 border-2 border-white !cursor-nwse-resize z-40 shadow-xl transition-transform hover:scale-125 pointer-events-auto"
                      title="Resize Top-Left"
                    />

                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "ne", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "ne", e)}
                      className="absolute -top-2 -right-2 w-4 h-4 rounded-sm bg-emerald-400 hover:bg-emerald-300 border-2 border-white !cursor-nesw-resize z-40 shadow-xl transition-transform hover:scale-125 pointer-events-auto"
                      title="Resize Top-Right"
                    />

                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "sw", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "sw", e)}
                      className="absolute -bottom-2 -left-2 w-4 h-4 rounded-sm bg-emerald-400 hover:bg-emerald-300 border-2 border-white !cursor-nesw-resize z-40 shadow-xl transition-transform hover:scale-125 pointer-events-auto"
                      title="Resize Bottom-Left"
                    />

                    <div
                      onMouseDown={(e) => handleBoxResizeStart(idx, "se", e)}
                      onTouchStart={(e) => handleBoxResizeStart(idx, "se", e)}
                      className="absolute -bottom-2 -right-2 w-4 h-4 rounded-sm bg-emerald-400 hover:bg-emerald-300 border-2 border-white !cursor-nwse-resize z-40 shadow-xl transition-transform hover:scale-125 pointer-events-auto"
                      title="Resize Bottom-Right"
                    />
                  </>
                )}
              </div>
            );
          })}

        {/* Live Draw Box Preview (When User is Dragging to Draw a New Box) */}
        {dragAction?.type === "draw-box" && (
          <div
            style={{
              left: `${(Math.min(dragAction.startPointerX, dragAction.currentPointerX) / totalWidth) * 100}%`,
              top: `${(Math.min(dragAction.startPointerY, dragAction.currentPointerY) / totalHeight) * 100}%`,
              width: `${(Math.abs(dragAction.currentPointerX - dragAction.startPointerX) / totalWidth) * 100}%`,
              height: `${(Math.abs(dragAction.currentPointerY - dragAction.startPointerY) / totalHeight) * 100}%`,
            }}
            className="absolute border-2 border-emerald-400 bg-emerald-500/20 ring-4 ring-emerald-400/40 z-50 pointer-events-none flex items-center justify-center"
          >
            <div className="px-2.5 py-1 rounded-full bg-neutral-950/95 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500 shadow-2xl">
              {Math.round(Math.abs(dragAction.currentPointerX - dragAction.startPointerX))}×
              {Math.round(Math.abs(dragAction.currentPointerY - dragAction.startPointerY))}px
            </div>
          </div>
        )}

        {/* Live Hover Box Preview in "Add Box" Mode (Rectangle instead of just a line) */}
        {toolMode === "box" && showHoverGuide && hoverPixelY !== null && dragAction === null && (
          <div
            style={{
              top: `${Math.max(0, Math.min(100 - 18, (hoverPixelY / totalHeight) * 100 - 9))}%`,
              height: `${Math.min(18, (240 / totalHeight) * 100)}%`,
            }}
            className="absolute inset-x-2 border-2 border-emerald-400/70 border-dashed bg-emerald-500/10 z-20 pointer-events-none flex items-center justify-center rounded-lg backdrop-blur-[1px]"
          >
            <div className="px-3 py-1 rounded-full bg-neutral-950/95 text-emerald-300 border border-emerald-500/70 text-[10px] font-bold font-mono shadow-2xl backdrop-blur-md flex items-center gap-1.5">
              <Box className="h-3.5 w-3.5 text-emerald-400" />
              <span>Click or Drag to Add Panel Box</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono border border-emerald-500/30">
                {hoverPixelY}px
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


