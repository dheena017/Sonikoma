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
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Undo2,
  FileWarning,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Maximize2,
  Split,
  Plus,
  Minus,
  X,
  Zap,
} from "lucide-react";
import * as api from "@/api";
import { getProxiedImageUrl } from "@/utils";
import { DetectTypeResponse, ReadingFlow } from "@/api/endpoints/crop";
import { AutoCropPreviewPageProps, PreviewItem } from "../types";
import { AutoCropSlicesTab } from "../components/AutoCropSlicesTab";
import { AutoCropCompareTab } from "../components/AutoCropCompareTab";
import { AutoCropTuningTab } from "../components/AutoCropTuningTab";
import { AutoCropBigScreenModal } from "../components/AutoCropBigScreenModal";

// Re-export for external consumers
export type { AutoCropPreviewPageProps, PreviewItem };

// ── FULL-HEIGHT CYBER SCANNER & SKELETON LOADER ─────────────────────────────
function AutoCropFullLoadingSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-3 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in duration-200 select-none max-w-4xl mx-auto">
      {/* Top Animated Scanner & Step Indicator */}
      <div className="flex flex-col items-center justify-center text-center space-y-3 max-w-lg mx-auto">
        <div className="relative">
          <div className="absolute -inset-2.5 bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-sky-500/30 rounded-full blur-lg animate-pulse" />
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-neutral-900 border border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-emerald-400" />
            <Scissors className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-300 absolute inset-0 m-auto animate-pulse" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Auto-Cropping & Detecting Panels...
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 font-bold animate-pulse">
              AI Vision
            </span>
          </div>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
            Scanning gutter seams, bounding dialog bubbles, and generating precision cuts for {count} source image{count > 1 ? "s" : ""}.
          </p>
        </div>

        {/* Animated Cyber Progress Bar */}
        <div className="w-full max-w-xs h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800 relative">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 rounded-full w-3/4 animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>

        {/* Live Processing Steps Badges */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-[10px] sm:text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded-lg bg-neutral-900/90 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>1. Seam Scanning</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-neutral-900/90 border border-emerald-500/30 text-emerald-300 flex items-center gap-1 shadow-sm">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-400" />
            <span>2. Frame Bounds</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-neutral-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-neutral-500" />
            <span>3. Smart Slicing</span>
          </span>
        </div>
      </div>

      {/* Shimmering Skeleton Mockup Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 w-full max-w-2xl flex-1 max-h-[240px]">
        {/* Strip Scan Preview */}
        <div className="md:col-span-4 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-2.5 flex flex-col gap-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="h-2 w-16 bg-neutral-800/80 rounded animate-pulse" />
            <div className="h-2 w-8 bg-neutral-800/80 rounded animate-pulse" />
          </div>
          <div className="flex-1 w-full bg-gradient-to-b from-neutral-900/90 via-neutral-900/50 to-neutral-900/90 rounded-xl border border-neutral-800/50 flex flex-col justify-around p-2 relative overflow-hidden">
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent animate-bounce opacity-75" />
            <div className="h-8 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
            <div className="h-10 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
            <div className="h-8 w-full bg-neutral-800/40 rounded-lg border border-dashed border-emerald-500/20 animate-pulse" />
          </div>
        </div>

        {/* Panel Thumbnails Grid Preview */}
        <div className="md:col-span-8 rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="h-2 w-20 bg-neutral-800/80 rounded animate-pulse" />
            <div className="h-2 w-10 bg-neutral-800/80 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1 overflow-hidden">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((k) => (
              <div
                key={k}
                className="rounded-xl bg-neutral-900/70 border border-neutral-800/60 p-1.5 flex flex-col justify-between aspect-[3/4] animate-pulse"
                style={{ animationDelay: `${k * 100}ms` }}
              >
                <div className="h-1.5 w-6 bg-neutral-800 rounded" />
                <div className="w-5 h-5 rounded-full bg-neutral-800/50 mx-auto" />
                <div className="h-1.5 w-full bg-neutral-800/60 rounded" />
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
  const [showCutLines, setShowCutLines] = useState(true);
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);

  // Live adjustment controls state
  const [engineMode, setEngineMode] = useState<"opencv" | "ai">("opencv");
  const [sensitivity, setSensitivity] = useState(initialSensitivity);
  const [padding, setPadding] = useState(initialPadding);
  const [backgroundColorMode, setBackgroundColorMode] = useState(initialBgMode);
  const [autoSplitTallStrips, setAutoSplitTallStrips] = useState(initialAutoSplit);
  const [aspectRatioLock, setAspectRatioLock] = useState(initialAspectRatio);
  const [minPanelHeightPx, setMinPanelHeightPx] = useState(initialMinHeight);
  const [overlapMergeGap, setOverlapMergeGap] = useState(overlapMergeThreshold || 8);
  const [outputFormat, setOutputFormat] = useState("webp");
  const [outputQuality, setOutputQuality] = useState(90);
  const [filterGutterSfx, setFilterGutterSfx] = useState(true);
  const [mergeSpeechBubbles, setMergeSpeechBubbles] = useState(true);
  const [autoTrimGutter, setAutoTrimGutter] = useState(true);
  const [readingFlow, setReadingFlow] = useState("top_to_bottom");

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
        engineMode?: "opencv" | "ai";
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
        // ── ENGINE 1: GEMINI SMART AI VISION (ZERO HARDCODED CUTS) ──
        if (currentOptions.engineMode === "ai") {
          try {
            const aiRes = await api.aiSmartCrop(
              fetcher,
              {
                url,
                strategy: "ai",
                aspectRatio: currentOptions.aspectRatioLock,
                sensitivity: currentOptions.sensitivity,
                paddingPx: currentOptions.padding,
                backgroundColorMode: currentOptions.backgroundColorMode || "auto",
              },
              reqOptions
            );

            const rawPanels = aiRes?.panels || aiRes?.boxes || [];
            if (Array.isArray(rawPanels) && rawPanels.length > 0) {
              const imgW = typeInfo?.width || aiRes?.imageWidth || 900;
              detectedPanels = rawPanels
                .map((p: any, i: number) => ({
                  id: i + 1,
                  x: Math.max(0, Math.round(p.x ?? 0)),
                  y: Math.max(0, Math.round(p.y ?? 0)),
                  width: Math.round(p.width ?? p.w ?? imgW),
                  height: Math.round(p.height ?? p.h ?? 300),
                }))
                .sort((a: any, b: any) => (a.y ?? 0) - (b.y ?? 0));

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
            }
          } catch (aiErr: any) {
            if (aiErr.name === "AbortError") throw aiErr;
            console.warn("[AutoCropPreview] AI Smart Crop fallback to OpenCV:", aiErr);
          }
        }

        // ── ENGINE 2: OPENCV DEEP-LEARNING GUTTER & FRAME ENGINE ──
        if (detectedPanels.length === 0) {
          if (isTallStrip) {
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
        }
      } catch (cropErr: any) {
        if (cropErr.name === "AbortError") throw cropErr;
        console.warn("[AutoCropPreview] crop error:", cropErr);
        status = "error";
        errorMessage = cropErr?.message || "Failed to process panel detection.";
        errorDetails = cropErr?.stack || String(cropErr);
      }

      if (panelUrls.length === 0) {
        panelUrls = [url];
      }

      if (detectedPanels.length === 0) {
        const imgH = typeInfo?.height || 1280;
        const imgW = typeInfo?.width || 900;
        detectedPanels = [
          {
            id: 1,
            x: 0,
            y: 0,
            width: imgW,
            height: imgH,
          },
        ];
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

  // Keep options in a ref to decouple slider updates from triggering re-scans and aborting active sessions
  const optionsRef = useRef({
    engineMode,
    sensitivity,
    padding,
    backgroundColorMode,
    autoSplitTallStrips,
    aspectRatioLock,
    minPanelHeightPx,
  });

  useEffect(() => {
    optionsRef.current = {
      engineMode,
      sensitivity,
      padding,
      backgroundColorMode,
      autoSplitTallStrips,
      aspectRatioLock,
      minPanelHeightPx,
    };
  }, [engineMode, sensitivity, padding, backgroundColorMode, autoSplitTallStrips, aspectRatioLock, minPanelHeightPx]);

  const targetsKey = targets.join("|||");
  const processedTargetsKeyRef = useRef<string>("");

  const runPreview = useCallback(
    async (targetList?: string[], customOptions?: typeof optionsRef.current) => {
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
      const optionsSnapshot = customOptions || optionsRef.current;

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
    },
    [targets, analyzeAndCropSingle, addNotification]
  );

  // Only trigger automatic preview on initial load or when the target image list itself changes
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetsKey]);

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

  // ── EDITABLE SLICE OPERATIONS ──
  const handleRecropWithCustomBoxes = useCallback(
    async (previewIdx: number, newBoxes?: api.PanelBoundingBoxInput[]) => {
      const fetcher = fetchWithInterceptor || fetch;
      const targetPreview = previews[previewIdx];
      const targetBoxes = newBoxes || targetPreview?.boxes || [];
      if (!targetPreview || !targetPreview.sourceUrl || targetBoxes.length === 0) return;

      setIsReCropping(true);
      try {
        const cropped = await api.cropLongPanels(fetcher, {
          url: targetPreview.sourceUrl,
          panels: targetBoxes,
          bleed_guard_px: padding,
          background_mode: backgroundColorMode || "auto",
          output_format: "webp",
          quality: 90,
        });

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
        i++;
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
        updatedBoxes.splice(sliceIdx + 1, 0, {
          ...item.boxes[sliceIdx],
          id: `${item.boxes[sliceIdx].id ?? sliceIdx}_copy`,
        });
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

  const containerClasses = isModal
    ? "fixed inset-0 z-[99999] w-screen h-screen overflow-hidden bg-[#050508] text-white animate-in fade-in duration-200"
    : "w-full h-screen min-h-screen flex flex-col overflow-hidden bg-[#050508] text-white";

  const cardClasses = "w-full h-full flex flex-col overflow-hidden bg-[#09090D] text-white relative z-10";

  const modalContent = (
    <div className={containerClasses} data-modal="true">
      <div className={cardClasses}>
        {/* ── COMPACT UNIFIED HEADER (Sleek Single Row on Desktop, No Wasted Space) ── */}
        <header className="relative z-40 flex items-center justify-between gap-2 sm:gap-3 border-b border-neutral-800/90 p-1.5 sm:py-2 sm:px-3 bg-neutral-950/95 shrink-0 backdrop-blur-lg flex-wrap sm:flex-nowrap">
          {/* Left: Close & Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors shrink-0 active:scale-95 !cursor-pointer"
              title="Close"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                <Scissors className="h-3.5 w-3.5" />
              </div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate text-white">
                Auto-Crop
              </h1>
              {/* Quick Engine Switcher */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 ml-1">
                <button
                  type="button"
                  onClick={() => {
                    if (engineMode !== "opencv") {
                      setEngineMode("opencv");
                      const updated = { ...optionsRef.current, engineMode: "opencv" as const };
                      optionsRef.current = updated;
                      void runPreview(undefined, updated);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1 !cursor-pointer ${
                    engineMode === "opencv"
                      ? "bg-emerald-500 text-black shadow-sm font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="OpenCV Fast Gutter Engine (Local)"
                >
                  <Zap className="h-3 w-3" />
                  <span>OpenCV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (engineMode !== "ai") {
                      setEngineMode("ai");
                      const updated = { ...optionsRef.current, engineMode: "ai" as const };
                      optionsRef.current = updated;
                      void runPreview(undefined, updated);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all flex items-center gap-1 !cursor-pointer ${
                    engineMode === "ai"
                      ? "bg-sky-500 text-black shadow-sm font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Gemini AI Multimodal Vision Crop"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>AI Crop</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center: Slim Segmented Tab Switcher */}
          <div className="order-last sm:order-none w-full sm:w-auto flex justify-center shrink-0">
            <div className="inline-flex items-center bg-neutral-900/90 border border-neutral-800/90 p-0.5 rounded-lg text-[11px] sm:text-xs font-medium shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("slices")}
                className={`py-1 px-2 sm:px-2.5 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 !cursor-pointer active:scale-95 ${
                  activeTab === "slices"
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Layers className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Slices ({activePreview?.panelUrls?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("compare")}
                className={`py-1 px-2 sm:px-2.5 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 !cursor-pointer active:scale-95 ${
                  activeTab === "compare"
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Compare</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("tuning")}
                className={`py-1 px-2 sm:px-2.5 rounded-md transition-all flex items-center justify-center gap-1 sm:gap-1.5 !cursor-pointer active:scale-95 ${
                  activeTab === "tuning"
                    ? "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
                }`}
              >
                <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Tuning</span>
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {activePreview && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowLayoutDropdown(!showLayoutDropdown)}
                  className="px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-medium rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 !cursor-pointer active:scale-95 shadow-sm"
                  title="Comic Layout & Dimensions Specs"
                >
                  <Layers className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden md:inline max-w-[110px] truncate">{activePreview.layout}</span>
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </button>

                {showLayoutDropdown &&
                  createPortal(
                    <div
                      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
                      onClick={() => setShowLayoutDropdown(false)}
                    >
                      <div
                        className="w-full max-w-sm p-5 bg-neutral-950 border border-neutral-700/90 rounded-3xl shadow-2xl backdrop-blur-2xl space-y-4 animate-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto scrollbar-thin text-white my-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <Layers className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                              Layout & Specs
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowLayoutDropdown(false)}
                            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors !cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Specs List */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                            <span className="text-neutral-400 font-medium">Format:</span>
                            <span className="font-bold text-emerald-300 text-right">
                              {activePreview.layout}
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                            <span className="text-neutral-400 font-medium">Reading Flow:</span>
                            <span className="text-sky-300 font-semibold text-right">
                              {activePreview.readingFlow === "top_to_bottom"
                                ? "Top-to-Bottom (Webtoon)"
                                : activePreview.readingFlow === "right_to_left"
                                ? "Right-to-Left (Manga)"
                                : "Left-to-Right (Comic)"}
                            </span>
                          </div>

                          {activePreview.dimensions && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 font-mono">
                              <span className="text-neutral-400 font-sans">Dimensions:</span>
                              <span className="text-neutral-200 text-right font-medium">
                                {activePreview.dimensions.width} × {activePreview.dimensions.height}px
                                {activePreview.aspectRatio ? ` (${activePreview.aspectRatio.toFixed(2)}:1)` : ""}
                              </span>
                            </div>
                          )}

                          {activePreview.confidence && (
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                              <span className="text-neutral-400 font-medium">AI Confidence:</span>
                              <span className="text-emerald-400 font-mono font-bold">
                                {Math.round(activePreview.confidence * 100)}%
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80">
                            <span className="text-neutral-400 font-medium">Detected Panels:</span>
                            <span className="text-emerald-300 font-mono font-bold">
                              {activePreview.panelUrls?.length || 0} Panels
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 border-t border-neutral-800/80 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              handleResetSlices(activeIndex);
                              setShowLayoutDropdown(false);
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors !cursor-pointer active:scale-95"
                          >
                            <Undo2 className="h-3.5 w-3.5 text-neutral-400" />
                            <span>Reset Slices to Original</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowLayoutDropdown(false)}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all !cursor-pointer active:scale-95 shadow-md shadow-emerald-500/20"
                          >
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    </div>,
                    document.body
                  )}
              </div>
            )}

            <button
              type="button"
              onClick={() => handleResetSlices(activeIndex)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 !cursor-pointer active:scale-95 shadow-sm"
              title="Reset cuts to original"
            >
              <Undo2 className="h-3.5 w-3.5 text-neutral-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            <button
              type="button"
              onClick={() => void runPreview()}
              disabled={isPreviewing}
              className="p-1.5 sm:px-3 sm:py-1.5 text-xs font-medium rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-1 disabled:opacity-50 !cursor-pointer disabled:cursor-not-allowed active:scale-95 shadow-sm"
              title="Re-run panel analysis"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isPreviewing ? "animate-spin text-emerald-400" : "text-neutral-400"}`} />
              <span className="hidden sm:inline">Re-analyze</span>
            </button>
          </div>
        </header>

        {/* ── MAIN BODY CONTENT ── */}
        <div
          className={`flex-1 min-h-0 ${
            activeTab === "compare"
              ? "overflow-hidden flex flex-col h-full p-0"
              : "overflow-y-auto p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6"
          }`}
        >
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
                  <div className={`flex-1 min-h-0 ${activeTab === "compare" ? "flex flex-col h-full" : "space-y-4 sm:space-y-5"}`}>
                    {/* ── TAB 1: SLICES (CROP CARD VIEW) ── */}
                    {activeTab === "slices" && (
                      <AutoCropSlicesTab
                        panelUrls={activePreview.panelUrls}
                        boxes={activePreview.boxes}
                        selectedPanelIndex={selectedPanelIndex}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        onSelectPanel={setSelectedPanelIndex}
                        onInspect={(url) => setInspectModalUrl(url)}
                        onDuplicate={(sliceIdx) => handleDuplicateSlice(activeIndex, sliceIdx)}
                        onRemove={(sliceIdx) => handleRemoveSlice(activeIndex, sliceIdx)}
                        onMoveSlice={(fromIdx, dir) => handleMoveSlice(activeIndex, fromIdx, dir)}
                        onSplitHalf={(sliceIdx) => handleSplitPanelInHalf(activeIndex, sliceIdx)}
                        onMergeNext={(sliceIdx) => handleMergeWithNext(activeIndex, sliceIdx)}
                      />
                    )}

                    {/* ── TAB 2: COMPARE (CROP EDIT CARD VIEW) ── */}
                    {activeTab === "compare" && (
                      <AutoCropCompareTab
                        imageUrl={activePreview.sourceUrl}
                        boxes={activePreview.boxes || []}
                        selectedPanelIndex={selectedPanelIndex}
                        dimensions={activePreview.dimensions}
                        showCutLines={showCutLines}
                        isReCropping={isReCropping}
                        onToggleCutLines={() => setShowCutLines(!showCutLines)}
                        onOpenBigScreen={() => setInspectModalUrl(activePreview.sourceUrl)}
                        onSelectPanel={setSelectedPanelIndex}
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
                      />
                    )}

                    {/* ── TAB 3: TUNING (TUNING PARAMETERS CARD VIEW) ── */}
                    {activeTab === "tuning" && (
                      <AutoCropTuningTab
                        engineMode={engineMode}
                        onEngineModeChange={(mode) => {
                          setEngineMode(mode);
                          const updated = { ...optionsRef.current, engineMode: mode };
                          optionsRef.current = updated;
                          void runPreview(undefined, updated);
                        }}
                        padding={padding}
                        sensitivity={sensitivity}
                        aspectRatioLock={aspectRatioLock}
                        backgroundColorMode={backgroundColorMode}
                        minPanelHeightPx={minPanelHeightPx}
                        overlapMergeThreshold={overlapMergeGap}
                        outputFormat={outputFormat}
                        outputQuality={outputQuality}
                        filterGutterSfx={filterGutterSfx}
                        mergeSpeechBubbles={mergeSpeechBubbles}
                        autoTrimGutter={autoTrimGutter}
                        readingFlow={readingFlow}
                        onPaddingChange={setPadding}
                        onSensitivityChange={setSensitivity}
                        onAspectRatioChange={setAspectRatioLock}
                        onBackgroundColorModeChange={setBackgroundColorMode}
                        onMinPanelHeightChange={setMinPanelHeightPx}
                        onOverlapMergeThresholdChange={setOverlapMergeGap}
                        onOutputFormatChange={setOutputFormat}
                        onOutputQualityChange={setOutputQuality}
                        onFilterGutterSfxChange={setFilterGutterSfx}
                        onMergeSpeechBubblesChange={setMergeSpeechBubbles}
                        onAutoTrimGutterChange={setAutoTrimGutter}
                        onReadingFlowChange={setReadingFlow}
                        onApplyPreset={applyPreset}
                        onApplySettingsAndRecrop={() => {
                          void runPreview();
                          setActiveTab("slices");
                        }}
                      />
                    )}
                  </div>
                )
              ) : (
                <AutoCropFullLoadingSkeleton count={targets.length} />
              )}
            </>
          )}
        </div>

        {/* ── STICKY FOOTER ACTIONS & CENTER CONTROL HUB ── */}
        <footer className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 border-t border-neutral-800/90 p-3 sm:px-5 sm:py-3.5 bg-neutral-950/95 shrink-0 backdrop-blur-lg pb-safe">
          {/* Left: Summary Info */}
          <div className="text-[11px] sm:text-xs text-neutral-400 flex items-center gap-2 w-full md:w-auto shrink-0">
            <Info className="h-4 w-4 text-emerald-400 shrink-0" />
            <span className="truncate">
              Ready to import{" "}
              <strong className="text-emerald-300 font-bold">{totalPanelsDetected} panels</strong> directly into project.
            </span>
          </div>

          {/* Center Hub: Selected Panel Actions OR Strip Specs */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center w-full md:w-auto">
            {selectedPanelIndex !== null &&
            selectedPanelIndex >= 0 &&
            activePreview?.boxes?.[selectedPanelIndex] ? (
              /* Selected Panel Actions Toolbar (Clean Dark Glassmorphic Hub) */
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-neutral-900/95 backdrop-blur-md border border-neutral-700/80 shadow-2xl text-xs animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Panel Step Navigation & Index */}
                <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
                  <button
                    type="button"
                    disabled={selectedPanelIndex <= 0}
                    onClick={() => setSelectedPanelIndex(Math.max(0, selectedPanelIndex - 1))}
                    className="p-1 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors !cursor-pointer"
                    title="Previous Panel (Step Up)"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 px-0.5">
                    #{selectedPanelIndex + 1}
                    <span className="text-neutral-500 font-normal">/{activePreview.boxes?.length || 1}</span>
                  </span>
                  <button
                    type="button"
                    disabled={selectedPanelIndex >= (activePreview.boxes?.length || 1) - 1}
                    onClick={() => setSelectedPanelIndex(Math.min((activePreview.boxes?.length || 1) - 1, selectedPanelIndex + 1))}
                    className="p-1 rounded-lg hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent text-neutral-400 hover:text-white transition-colors !cursor-pointer"
                    title="Next Panel (Step Down)"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* 2. Dimensions Tag */}
                {(() => {
                  const b = activePreview.boxes?.[selectedPanelIndex];
                  if (!b) return null;
                  return (
                    <div className="hidden lg:flex items-center text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700/50 mr-0.5">
                      {Math.round(b.width ?? 0)}×{Math.round(b.height ?? 0)}px
                    </div>
                  );
                })()}

                {/* 3. 4-Way Position Nudge (Y Up/Down & X Left/Right) */}
                <div className="flex items-center gap-0.5 border-r border-neutral-800 pr-2">
                  <button
                    type="button"
                    onClick={() => handleNudgePanel(activeIndex, selectedPanelIndex, -5)}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer"
                    title="Nudge Up 5px (↑)"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNudgePanel(activeIndex, selectedPanelIndex, 5)}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer"
                    title="Nudge Down 5px (↓)"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = activePreview.boxes?.[selectedPanelIndex];
                      if (b) {
                        const newX = Math.max(0, (b.x ?? 0) - 5);
                        handleUpdateBox(activeIndex, selectedPanelIndex, { ...b, x: newX });
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer text-[10px] font-mono"
                    title="Nudge Left 5px (←)"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = activePreview.boxes?.[selectedPanelIndex];
                      if (b) {
                        const maxW = activePreview.dimensions?.width || 800;
                        const newX = Math.min(maxW - (b.width ?? 100), (b.x ?? 0) + 5);
                        handleUpdateBox(activeIndex, selectedPanelIndex, { ...b, x: newX });
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer text-[10px] font-mono"
                    title="Nudge Right 5px (→)"
                  >
                    ▶
                  </button>
                </div>

                {/* 4. Insert Slice Below */}
                <button
                  type="button"
                  onClick={() => {
                    const targetBox = activePreview.boxes?.[selectedPanelIndex];
                    if (targetBox) {
                      const imgH = activePreview.dimensions?.height || 1200;
                      const imgW = activePreview.dimensions?.width || 800;
                      const newY = Math.min(imgH - 100, (targetBox.y ?? 0) + (targetBox.height ?? 200) + 8);
                      const newH = Math.min(240, imgH - newY);
                      handleAddBox(activeIndex, {
                        x: targetBox.x ?? 0,
                        y: newY,
                        width: targetBox.width ?? imgW,
                        height: Math.max(60, newH),
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer"
                  title="Insert New Panel Below"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Add Below</span>
                </button>

                {/* 5. Duplicate Panel */}
                <button
                  type="button"
                  onClick={() => {
                    const targetBox = activePreview.boxes?.[selectedPanelIndex];
                    if (targetBox) {
                      handleAddBox(activeIndex, {
                        x: targetBox.x ?? 0,
                        y: Math.min(
                          (activePreview.dimensions?.height || 1200) - (targetBox.height ?? 200),
                          (targetBox.y ?? 0) + (targetBox.height ?? 200) + 12
                        ),
                        width: targetBox.width ?? (activePreview.dimensions?.width || 800),
                        height: targetBox.height ?? 240,
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer"
                  title="Duplicate Panel (D)"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Duplicate</span>
                </button>

                {/* 6. Snap to Full Width */}
                <button
                  type="button"
                  onClick={() => {
                    const b = activePreview.boxes?.[selectedPanelIndex];
                    if (b) {
                      handleUpdateBox(activeIndex, selectedPanelIndex, {
                        ...b,
                        x: 0,
                        width: activePreview.dimensions?.width || 800,
                      });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer"
                  title="Snap to Full Width (F)"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Full Width</span>
                </button>

                {/* 7. Height Adjust (+20 / -20) */}
                <div className="hidden md:flex items-center gap-0.5 border-l border-neutral-800 pl-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const b = activePreview.boxes?.[selectedPanelIndex];
                      if (b) {
                        const newH = Math.max(40, (b.height ?? 100) - 20);
                        handleUpdateBox(activeIndex, selectedPanelIndex, { ...b, height: newH });
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer text-[10px] font-mono"
                    title="Shrink Height (-20px)"
                  >
                    -H
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const b = activePreview.boxes?.[selectedPanelIndex];
                      if (b) {
                        const maxH = activePreview.dimensions?.height || 2000;
                        const newH = Math.min(maxH - (b.y ?? 0), (b.height ?? 100) + 20);
                        handleUpdateBox(activeIndex, selectedPanelIndex, { ...b, height: newH });
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors !cursor-pointer text-[10px] font-mono"
                    title="Expand Height (+20px)"
                  >
                    +H
                  </button>
                </div>

                {/* 8. Merge with below (if available) */}
                {selectedPanelIndex < (activePreview.boxes?.length || 0) - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const curr = activePreview.boxes?.[selectedPanelIndex];
                      const next = activePreview.boxes?.[selectedPanelIndex + 1];
                      if (curr && next) {
                        const topY = Math.min(curr.y ?? 0, next.y ?? 0);
                        const bottomY = Math.max((curr.y ?? 0) + (curr.height ?? 0), (next.y ?? 0) + (next.height ?? 0));
                        const leftX = Math.min(curr.x ?? 0, next.x ?? 0);
                        const rightX = Math.max((curr.x ?? 0) + (curr.width ?? 800), (next.x ?? 0) + (next.width ?? 800));
                        handleUpdateBox(activeIndex, selectedPanelIndex, {
                          ...curr,
                          x: leftX,
                          y: topY,
                          width: rightX - leftX,
                          height: bottomY - topY,
                        });
                        handleDeletePanel(activeIndex, selectedPanelIndex + 1);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer border-l border-neutral-800 pl-1.5"
                    title="Merge with below"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Merge</span>
                  </button>
                )}

                {/* 9. Split Panel in half */}
                <button
                  type="button"
                  onClick={() => handleSplitPanelInHalf(activeIndex, selectedPanelIndex)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer"
                  title="Split Panel in half (S)"
                >
                  <Split className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Split</span>
                </button>

                {/* 10. Delete Panel */}
                {(activePreview.boxes?.length || 0) > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleDeletePanel(activeIndex, selectedPanelIndex);
                      setSelectedPanelIndex(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-950/80 text-neutral-400 hover:text-rose-400 transition-colors flex items-center gap-1 text-[11px] !cursor-pointer border-l border-neutral-800 pl-1.5"
                    title="Delete Panel (Del)"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                )}

                {/* 11. Deselect Close */}
                <button
                  type="button"
                  onClick={() => setSelectedPanelIndex(null)}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors ml-0.5 border-l border-neutral-800 pl-1.5 !cursor-pointer"
                  title="Deselect Panel (Esc)"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <>
                {/* Active Strip Specs Pill */}
                {activePreview && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300">
                    {activePreview.dimensions && (
                      <span className="text-neutral-400">
                        {activePreview.dimensions.width}×{activePreview.dimensions.height}px
                      </span>
                    )}
                    {activePreview.layout && (
                      <span className="text-emerald-400 font-semibold border-l border-neutral-800 pl-2">
                        {activePreview.layout}
                      </span>
                    )}
                    <span className="text-emerald-300 font-bold border-l border-neutral-800 pl-2">
                      {activePreview.boxes?.length || 0} panels
                    </span>
                  </div>
                )}

                {/* Quick Strip Navigator (if multiple images) */}
                {previews.length > 1 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                      disabled={activeIndex === 0}
                      className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent !cursor-pointer transition-colors"
                      title="Previous Image"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-neutral-300 font-semibold px-1 select-none">
                      Image #{activeIndex + 1}/{previews.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveIndex(Math.min(previews.length - 1, activeIndex + 1))}
                      disabled={activeIndex === previews.length - 1}
                      className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent !cursor-pointer transition-colors"
                      title="Next Image"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Quick Re-detect Button */}
                {activePreview && (
                  <button
                    type="button"
                    onClick={() => handleRetrySingle(activeIndex)}
                    disabled={isReCropping || activePreview.status === "loading"}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:text-white hover:bg-neutral-800 text-[11px] sm:text-xs font-medium flex items-center gap-1.5 transition-colors !cursor-pointer active:scale-95"
                    title="Re-run AI Panel Detection on this image"
                  >
                    <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400 ${isReCropping ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Re-detect</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right: Cancel & Confirm Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying || isSubmitting}
              className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl border border-neutral-800 bg-neutral-900 text-xs sm:text-sm font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-center active:scale-95 !cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleConfirmAction}
              disabled={isApplying || isSubmitting || isPreviewing || isReCropping || totalPanelsDetected === 0}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold disabled:opacity-40 disabled:hover:bg-emerald-500 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all !cursor-pointer text-center active:scale-95"
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

        {/* ── FULL-RES BIG-SCREEN INSPECTION MODAL ── */}
        {inspectModalUrl && (
          <AutoCropBigScreenModal
            imageUrl={inspectModalUrl}
            boxes={activePreview?.boxes || []}
            selectedPanelIndex={selectedPanelIndex}
            dimensions={activePreview?.dimensions}
            isReCropping={isReCropping}
            onClose={() => setInspectModalUrl(null)}
            onSelectPanel={setSelectedPanelIndex}
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
          />
        )}
      </div>
    </div>
  );

  if (isModal && typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
