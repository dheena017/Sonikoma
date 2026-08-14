import React, { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { useStoryboardOperations } from "@/features/editor_timeline/hooks/useStoryboardOperations";
import { processWithConcurrency, chunkArray } from "@/shared/utils/batchUtils";
import * as api from "@/api";
import { updateSelection } from "@/shared/utils/selection";

import StoryboardEmptyState from "@/features/editor_timeline/components/StoryboardEmptyState";
import StoryboardHeader from "@/features/editor_timeline/components/StoryboardHeader";
import StoryboardBulkOps from "@/features/editor_timeline/components/StoryboardBulkOps";
import StoryboardCard from "@/features/editor_timeline/components/StoryboardCard";
import StoryboardSidebar from "@/features/editor_timeline/components/StoryboardSidebar";
import StoryboardEpisodeGroup from "@/features/editor_timeline/components/StoryboardEpisodeGroup";
import StoryboardAnalysisBanner from "@/features/editor_timeline/components/StoryboardAnalysisBanner";
import DeleteConfirmModal from "@/shared/ui/modal/DeleteConfirmModal";
import { StoryboardSelectionBar } from "@/features/editor_studio/components/select";

type EpisodeGroupRecord = {
  episodeLabel: string;
  startIndex: number;
  count: number;
};

interface StoryboardTimelineProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setPlaybackTime: (time: number) => void;
  hasScrapedImages?: boolean;
  setVideoUrl?: React.Dispatch<React.SetStateAction<string>>;
  addNotification?: (message: string, type: any) => void;
  targetUrl?: string;
  fetchWithInterceptor?: typeof fetch;
  selectedModel?: string;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  voiceActor?: string;
  musicTheme?: string;
  speechRate?: number;
  speechPitch?: number;
  narrationStyle?: string;
  bubbleSensitivity?: number;
  bubbleDetectionStyle?: string;
  bubbleEraseMethod?: string;
  bubbleDilation?: number;
  bubbleInpaintRadius?: number;
  cropSensitivity?: number;
  cropPaddingPx?: number;
  cropBackgroundMode?: string;
  aspectRatioLock?: string;
  minPanelAreaPct?: number;
  overlapMergeThreshold?: number;
  useLocalCV?: boolean;
  cropModel?: string;
  cropMinHeightPx?: number;
  cropCannyLow?: number;
  cropCannyHigh?: number;
  cropCloseKernelSize?: number;
  autoSplitTallStrips?: boolean;
  cropGuidance?: string;
  cropFocusMode?: string;
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
  autoPlayAudio?: boolean;
  saveProject?: (customPanels?: GeneratedPanel[]) => Promise<boolean>;
  handleCancelBatch?: () => void;
  audioFeedback?: any;
  showAutoCropModal?: boolean;
  setShowAutoCropModal?: (show: boolean) => void;
  selectedPanelIds?: Set<number>;
  setSelectedPanelIds?: React.Dispatch<React.SetStateAction<Set<number>>>;
}

const StoryboardTimeline = React.memo(
  ({
    panels,
    setPanels,
    currentPanelIndex,
    setCurrentPanelIndex,
    activePreviewTab,
    setActivePreviewTab,
    setPlaybackTime,
    hasScrapedImages = false,
    setVideoUrl,
    addNotification,
    targetUrl,
    fetchWithInterceptor,
    selectedModel,
    setConsoleLogs,
    voiceActor,
    musicTheme,
    speechRate = 1.0,
    speechPitch = 1.0,
    narrationStyle = "long",
    bubbleSensitivity = 50,
    bubbleDetectionStyle = "all",
    bubbleEraseMethod = "auto",
    bubbleDilation = -1,
    bubbleInpaintRadius = 3,
    cropSensitivity = 30,
    cropPaddingPx = 10,
    cropBackgroundMode = "auto",
    aspectRatioLock = "free",
    minPanelAreaPct = 2,
    overlapMergeThreshold = 20,
    useLocalCV = true,
    cropModel = "",
    cropMinHeightPx = 60,
    cropCannyLow = 20,
    cropCannyHigh = 100,
    cropCloseKernelSize = 15,
    autoSplitTallStrips = true,
    cropGuidance = "",
    cropFocusMode = "standard",
    playStoryboardAudio,
    autoPlayAudio,
    saveProject,
    handleCancelBatch,
    audioFeedback,
    showAutoCropModal,
    setShowAutoCropModal,
    selectedPanelIds: propSelectedPanelIds,
    setSelectedPanelIds: propSetSelectedPanelIds,
  }: StoryboardTimelineProps) => {
    // ── Panel selection state ────────────────────────────────────────────────
    const [localSelectedPanelIds, setLocalSelectedPanelIds] = useState<Set<number>>(
      new Set()
    );
    const selectedPanelIds = propSelectedPanelIds ?? localSelectedPanelIds;
    const setSelectedPanelIds = propSetSelectedPanelIds ?? setLocalSelectedPanelIds;

    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
    const [selectedStoryboardEp, setSelectedStoryboardEp] = useState<number | "all">("all");
    const [storyboardEpSearchQuery, setStoryboardEpSearchQuery] = useState("");
    const [storyboardEpSortAscending, setStoryboardEpSortAscending] = useState(true);
    const [hoveredStoryboardEpIdx, setHoveredStoryboardEpIdx] = useState<number | null>(null);
    const [storyboardViewLayout, setStoryboardViewLayout] = useState<"scroll" | "grid">("scroll");
    const [selectedTimelineEp, setSelectedTimelineEp] = useState<number | "all">("all");
    const [hoveredTimelineEpIdx, setHoveredTimelineEpIdx] = useState<number | null>(null);
    const [timelineEpSearchQuery, setTimelineEpSearchQuery] = useState("");
    const [timelineEpSortAscending, setTimelineEpSortAscending] = useState(true);

    const handlePanelClick = useCallback(
      (idx: number, panelId: number, shiftKey: boolean, ctrlOrMeta: boolean) => {
        if (shiftKey && lastSelectedIndex !== null) {
          const lo = Math.min(lastSelectedIndex, idx);
          const hi = Math.max(lastSelectedIndex, idx);
          const rangeIds = panels.slice(lo, hi + 1).map((p) => p.id);
          setSelectedPanelIds((prev) =>
            updateSelection(prev, { type: "range", items: rangeIds }) as Set<number>
          );
        } else if (ctrlOrMeta) {
          setSelectedPanelIds((prev) =>
            updateSelection(prev, { type: "toggle", item: panelId }) as Set<number>
          );
          setLastSelectedIndex(idx);
        } else {
          // Single-click (no modifiers): jump the monitor to this panel in Storyboard Live view
          setLastSelectedIndex(idx);
          setCurrentPanelIndex(idx);
          setActivePreviewTab("timeline");
        }
      },
      [lastSelectedIndex, panels, setSelectedPanelIds, setCurrentPanelIndex, setActivePreviewTab]
    );

    const handlePanelDoubleClick = useCallback(
      (idx: number, panelId: number) => {
        setSelectedPanelIds((prev) =>
          updateSelection(prev, { type: "double", item: panelId }) as Set<number>
        );
        setLastSelectedIndex(idx);
      },
      [setSelectedPanelIds]
    );

    const [isBatchCropping, setIsBatchCropping] = useState(false);
    const [isCleaningBubbles, setIsCleaningBubbles] = useState(false);
    const [isBatchMerging, setIsBatchMerging] = useState(false);

    const [isBatchMagicProcessing, setIsBatchMagicProcessing] = useState(false);
    const [batchMagicProgress, setBatchMagicProgress] = useState<{ current: number; total: number } | null>(null);

    const handleBatchMagicMotion = async () => {
      if (selectedPanelIds.size === 0) {
        addNotification?.("Please select at least one panel to apply Batch Magic Motion.", "info");
        return;
      }

      const selectedIds = Array.from(selectedPanelIds);
      const targetPanels = panels.filter((p) => selectedPanelIds.has(p.id));

      const missingText = targetPanels.some(p => !p.speech_text?.trim());
      if (missingText) {
        addNotification?.("Some selected panels are missing Dialogue Subtitle text. All panels must have text to align audio sync.", "warning");
        return;
      }

      setIsBatchMagicProcessing(true);
      setBatchMagicProgress({ current: 0, total: targetPanels.length });
      addNotification?.(`Starting Batch Magic Motion on ${selectedIds.length} panels...`, "info");

      let completed = 0;
      const chunks = chunkArray(targetPanels, 3); // process in chunks of 3 max to prevent rate-limiting or memory issues
      const activeFetch = fetchWithInterceptor || fetch;

      try {
        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (panel) => {
              try {
                // 1. Separate Layers
                const layerRes = await activeFetch(`/api/image/process-layers/${panel.id}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ url: panel.image_url }),
                });
                const layerData = await layerRes.json();
                let layersObj = null;
                if (layerData.success && layerData.layers) {
                  layersObj = {
                    background_url: layerData.layers.background_url,
                    character_url: layerData.layers.character_url,
                    text_url: layerData.layers.text_url,
                    bg_visible: true,
                    char_visible: true,
                    text_visible: true,
                  };
                }

                // 2. Generate Audio TTS
                const ttsRes = await api.generateTts(activeFetch, {
                  panel_id: panel.id,
                  text: panel.speech_text,
                  dialogue_list: [panel.speech_text],
                  target_duration: panel.duration && panel.duration > 0 ? panel.duration : undefined,
                  voice: voiceActor || undefined,
                  speech_rate: speechRate,
                  speech_pitch: speechPitch,
                });
                let audioUrl = null;
                // Audio may come back as a cached URL or as base64
                if (ttsRes && ttsRes.success && ttsRes.audio_url) {
                  audioUrl = ttsRes.audio_url;
                } else if (ttsRes && ttsRes.success && ttsRes.audio_base64) {
                  const binary = atob(ttsRes.audio_base64);
                  const bytes = new Uint8Array(binary.length);
                  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                  audioUrl = URL.createObjectURL(new Blob([bytes], { type: "audio/mpeg" }));
                }

                // Capture actual audio duration for precise timing sync
                const audioDuration: number =
                  ttsRes && ttsRes.duration_actual_s && ttsRes.duration_actual_s > 0
                    ? Math.round(ttsRes.duration_actual_s * 10) / 10
                    : 0;

                // 3. Dialogue Sync Alignment
                let syncMapObj = null;
                if (audioUrl) {
                  const ocr_texts = panel.speech_text.split("\n").map((s) => s.trim()).filter(Boolean);
                  const alignRes = await activeFetch(`/api/audio/align-dialogue/${panel.id}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      audio_url: audioUrl,
                      ocr_texts: ocr_texts.length > 0 ? ocr_texts : [panel.speech_text],
                    }),
                  });
                  const alignData = await alignRes.json();
                  if (alignData.success && alignData.dialogue_map) {
                    syncMapObj = {
                      dialogue_map: alignData.dialogue_map,
                      audio_peaks: alignData.audio_peaks || [],
                      peaks_fps: alignData.peaks_fps,
                    };
                  }
                }

                // Update this panel state incrementally.
                // - TIMING: sync to actual audio duration (never estimate).
                // - CAM MOTION: preserve the AI-decided motion from "Analyze Image".
                //   Only fall back to "zoom_in" when the panel has no motion set yet.
                setPanels((prev) =>
                  prev.map((p) =>
                    p.id === panel.id
                      ? {
                          ...p,
                          // Preserve AI-decided motion; only default if completely unset
                          motion_type: p.motion_type && p.motion_type.trim().length > 0
                            ? p.motion_type
                            : "",
                          // Sync timing to actual audio length
                          duration: audioDuration > 0 ? audioDuration : p.duration,
                          audio_url: audioUrl || p.audio_url,
                          layers: layersObj || p.layers,
                          syncMap: syncMapObj || p.syncMap,
                        }
                      : p
                  )
                );
              } catch (err) {
                console.error(`[Batch Magic] Failed for panel #${panel.id}:`, err);
              } finally {
                completed++;
                setBatchMagicProgress({ current: completed, total: targetPanels.length });
              }
            })
          );
        }

        addNotification?.(`Batch Magic Motion successfully completed on ${targetPanels.length} panels!`, "success");
      } catch (err: any) {
        console.error("[Batch Magic] Critical error:", err);
      } finally {
        setIsBatchMagicProcessing(false);
        setBatchMagicProgress(null);
        clearSelection();
      }
    };

    const [cropProgress, setCropProgress] = useState<{
      current: number;
      total: number;
    } | null>(null);
    const [cleanProgress, setCleanProgress] = useState<{
      current: number;
      total: number;
    } | null>(null);

    const togglePanelSelection = useCallback((id: number) => {
      setSelectedPanelIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }, [setSelectedPanelIds]);

    const selectAllPanels = useCallback(() => {
      setSelectedPanelIds(new Set(panels.map((p) => p.id)));
    }, [panels]);

    const clearSelection = useCallback(() => {
      setSelectedPanelIds(new Set());
    }, []);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    React.useEffect(() => {
      const container = document.getElementById("main-scroll-container");
      if (showDeleteConfirm) {
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
    }, [showDeleteConfirm]);

    const executeDeleteSelected = async () => {
      const remainingPanels = panels.filter((p) => !selectedPanelIds.has(p.id));
      setPanels(remainingPanels);
      clearSelection();
      addNotification?.(
        `Deleted ${selectedPanelIds.size} selected panel(s). Unsaved changes — click "Save Project" to save.`,
        "warning"
      );
    };

    const handleDeleteSelected = () => {
      if (selectedPanelIds.size === 0) return;
      setShowDeleteConfirm(true);
    };

    const handleBulkModifyDuration = (val: number) => {
      if (selectedPanelIds.size === 0) return;
      setPanels((prev) =>
        prev.map((p) =>
          selectedPanelIds.has(p.id) ? { ...p, duration: val } : p
        )
      );
      addNotification?.(
        `Set duration of selected panels to ${val}s`,
        "success"
      );
    };

    const handleBulkModifyMotion = (val: string) => {
      if (selectedPanelIds.size === 0) return;
      setPanels((prev) =>
        prev.map((p) =>
          selectedPanelIds.has(p.id) ? { ...p, motion_type: val } : p
        )
      );
      addNotification?.(
        `Set motion style of selected panels to '${val}'`,
        "success"
      );
    };

    const handleCleanBubblesSelected = async () => {
      if (selectedPanelIds.size === 0) return;
      const selectedIds = Array.from(selectedPanelIds);
      const targetPanels = panels.filter((p) => selectedPanelIds.has(p.id));

      setIsCleaningBubbles(true);
      setCleanProgress({ current: 0, total: targetPanels.length });
      setConsoleLogs?.((prev) => [
        `[Speech Bubbles] Starting clean bubbles on ${selectedIds.length} timeline panels...`,
        ...prev,
      ]);

      let successCount = 0;
      let errorCount = 0;
      const activeFetch = fetchWithInterceptor || fetch;

      try {
        const chunks = chunkArray(targetPanels, 8);
        let completed = 0;

        await processWithConcurrency(chunks, 4, async (chunkPanels) => {
          try {
            const data = await api.removeSpeechBubblesBatch(activeFetch, {
              urls: chunkPanels.map((p) => p.image_url),
              method: bubbleEraseMethod,
              sensitivity: bubbleSensitivity,
              detection_style: bubbleDetectionStyle,
              dilation: bubbleDilation,
              inpaint_radius: bubbleInpaintRadius,
            });

            if (data.success && data.results) {
              setPanels((prev) =>
                prev.map((p) => {
                  const updatedResult = data.results.find(
                    (r: any) => r.url === p.image_url
                  );
                  if (
                    updatedResult &&
                    updatedResult.success &&
                    updatedResult.new_url
                  ) {
                    return { ...p, image_url: updatedResult.new_url };
                  }
                  return p;
                })
              );
              successCount += data.results.filter((r: any) => r.success).length;
              errorCount += data.results.filter((r: any) => !r.success).length;
            } else {
              throw new Error(data.message || "Removal failed");
            }
          } catch (err: any) {
            console.error(`[Speech Bubbles] Error for chunk:`, err);
            errorCount += chunkPanels.length;
          } finally {
            completed += chunkPanels.length;
            setCleanProgress({
              current: completed,
              total: targetPanels.length,
            });
          }
        });

        if (successCount > 0) {
          addNotification?.(
            `Cleaned speech bubbles for ${successCount} panel(s).`,
            "success"
          );
          setConsoleLogs?.((prev) => [
            `[Speech Bubbles] Completed cleaning speech bubbles. Success: ${successCount}, Errors: ${errorCount}`,
            ...prev,
          ]);
        } else {
          addNotification?.(
            "Failed to clean speech bubbles for selected panels.",
            "error"
          );
        }
      } catch (err: any) {
        console.error("[Speech Bubbles] Critical error:", err);
      } finally {
        setIsCleaningBubbles(false);
        setCleanProgress(null);
        clearSelection();
      }
    };

    const handleAutoCropSelected = async () => {
      if (selectedPanelIds.size === 0) return;
      const selectedIds = Array.from(selectedPanelIds);
      const targetPanels = panels.filter((p) => selectedPanelIds.has(p.id));

      setIsBatchCropping(true);
      setCropProgress({ current: 0, total: targetPanels.length });
      setConsoleLogs?.((prev) => [
        `[Auto Cropper] Starting auto-crop on ${selectedIds.length} timeline panels...`,
        ...prev,
      ]);

      const activeFetch = fetchWithInterceptor || fetch;
      let nextId = Math.max(...panels.map((p) => p.id), 0) + 1;

      try {
        let successCount = 0;
        let completed = 0;
        const errors: string[] = [];

        const chunks = chunkArray(targetPanels, 8);

        const results = await processWithConcurrency(
          chunks,
          4,
          async (chunkPanels) => {
            const chunkMap = new Map<number, GeneratedPanel[]>();
            try {
              const data = await api.detectPanelsBatch(activeFetch, {
                urls: chunkPanels.map((p) => p.image_url),
                sensitivity: cropSensitivity,
                backgroundColorMode: cropBackgroundMode,
                aspectRatio: aspectRatioLock,
                minAreaPct: minPanelAreaPct / 100.0,
                mergeThreshold: overlapMergeThreshold,
                strategy: useLocalCV ? "local-cv" : "balanced",
                model: cropModel,
                cannyLow: cropCannyLow,
                cannyHigh: cropCannyHigh,
                closeKernelSize: cropCloseKernelSize,
                minHeightPx: cropMinHeightPx,
                autoSplit: autoSplitTallStrips,
                guidanceInstructions: cropGuidance,
                focusMode: cropFocusMode,
              });

              if (data.success && data.results) {
                for (const result of data.results) {
                  const originalPanel = chunkPanels.find(
                    (p) => p.image_url === result.url
                  );
                  if (!originalPanel) continue;

                  const newSubPanels: GeneratedPanel[] = [];
                  if (
                    result.success &&
                    Array.isArray(result.data?.panels) &&
                    result.data.panels.length > 0
                  ) {
                    for (let i = 0; i < result.data.panels.length; i++) {
                      const box = result.data.panels[i];
                      let croppedUrl = box.croppedUrl;

                      if (!croppedUrl) {
                        const cropData = await api.submitImageEdits(activeFetch, {
                          url: originalPanel.image_url,
                          cropTop: box.cropTop,
                          cropBottom: box.cropBottom,
                          cropLeft: box.cropLeft,
                          cropRight: box.cropRight,
                          autoTrim: false, // detection coordinates are already precise; autoTrim would over-crop artwork
                          padding: cropPaddingPx,
                          sensitivity: cropSensitivity,
                          backgroundColorMode: cropBackgroundMode,
                        });
                        croppedUrl = cropData.url;
                      }

                      newSubPanels.push({
                        ...originalPanel,
                        id: nextId++,
                        image_url: croppedUrl,
                      });
                    }
                    successCount++;
                  } else {
                    newSubPanels.push(originalPanel);
                  }
                  chunkMap.set(originalPanel.id, newSubPanels);
                }
              } else {
                chunkPanels.forEach((p) => chunkMap.set(p.id, [p]));
              }
            } catch (err: any) {
              console.error(`[Auto Cropper] Failed for chunk:`, err);
              chunkPanels.forEach((p) => chunkMap.set(p.id, [p]));
              errors.push(err.message || "Failed to process chunk");
            } finally {
              completed += chunkPanels.length;
              setCropProgress({
                current: completed,
                total: targetPanels.length,
              });
            }
            return chunkMap;
          }
        );

        const updatedPanelsMap = new Map<number, GeneratedPanel[]>();
        for (const chunkMap of results) {
          if (!chunkMap) continue; // skip failed chunks
          for (const [id, newPanelsList] of chunkMap.entries()) {
            updatedPanelsMap.set(id, newPanelsList);
          }
        }

        const updatedPanels = panels.flatMap((p) => {
          if (!selectedPanelIds.has(p.id)) return [p];
          return updatedPanelsMap.get(p.id) || [p];
        });

        setPanels(updatedPanels);

        if (errors.length > 0) {
          addNotification?.(
            `Auto-crop completed with ${errors.length} error(s). Check console.`,
            "error"
          );
          setConsoleLogs?.((prev) => [
            `[Auto Cropper] Finished auto-cropping with errors.`,
            ...prev,
          ]);
        } else {
          addNotification?.(
            `Auto-cropped selected timeline panels!`,
            "success"
          );
          setConsoleLogs?.((prev) => [
            `[Auto Cropper] Finished auto-cropping panels. Slices replaced.`,
            ...prev,
          ]);
        }
      } catch (err: any) {
        console.error("[Auto Cropper] Critical error:", err);
        addNotification?.(
          `Critical error during auto-crop: ${err.message}`,
          "error"
        );
      } finally {
        setIsBatchCropping(false);
        setCropProgress(null);
        clearSelection();
      }
    };

    const handleBatchMergeSelected = async () => {
      if (selectedPanelIds.size < 2) {
        addNotification?.(
          "Select at least 2 panels to stitch together",
          "info"
        );
        return;
      }

      const selectedIds = Array.from(selectedPanelIds);
      const sortedSelectedPanels = panels.filter((p) =>
        selectedPanelIds.has(p.id)
      );
      const urls = sortedSelectedPanels.map((p) => p.image_url);

      setIsBatchMerging(true);
      setConsoleLogs?.((prev) => [
        `[Stitch Generator] Merging ${urls.length} timeline panels vertically...`,
        ...prev,
      ]);

      const activeFetch = fetchWithInterceptor || fetch;

      try {
        const data = await api.mergeImages(activeFetch, {
          urls: urls,
          layout: "vertical",
          spacing: 0,
          spacingColor: "white",
          scaleToFit: true,
          alignMode: "center",
          padding: 0,
        });

        if (data.url) {
          const firstPanelIdx = panels.findIndex((p) =>
            selectedPanelIds.has(p.id)
          );
          const firstPanel = panels[firstPanelIdx];

          const nextId = Math.max(...panels.map((p) => p.id), 0) + 1;
          const stitchedPanel: GeneratedPanel = {
            ...firstPanel,
            id: nextId,
            image_url: data.url,
            speech_text: sortedSelectedPanels
              .map((p) => p.speech_text)
              .filter(Boolean)
              .join(" \n "),
            sfx: sortedSelectedPanels
              .map((p) => p.sfx)
              .filter(Boolean)
              .join(" | "),
            duration: sortedSelectedPanels.reduce(
              (sum, p) => sum + (p.duration ?? 0),
              0
            ),
          };

          setPanels((prev) => {
            const filtered = prev.filter((p) => !selectedPanelIds.has(p.id));
            filtered.splice(
              firstPanelIdx === -1 ? 0 : firstPanelIdx,
              0,
              stitchedPanel
            );
            return filtered;
          });

          setConsoleLogs?.((prev) => [
            `[Stitch Generator] ✓ Timeline stitching completed! URL: ${data.url}`,
            ...prev,
          ]);
          addNotification?.(
            "Stitched selected timeline panels successfully!",
            "success"
          );
        }
      } catch (err: any) {
        console.error("[Stitch Generator] Stitch failed:", err);
        addNotification?.(`Merge failed: ${err.message}`, "error");
      } finally {
        setIsBatchMerging(false);
        clearSelection();
      }
    };

    // ────────────────────────────────────────────────────────────────────────

    const {
      analyzingPanelId,
      isZipping,
      showBulkOps,
      setShowBulkOps,
      bulkDuration,
      setBulkDuration,
      bulkMotion,
      setBulkMotion,
      bulkPreset,
      setBulkPreset,
      handleDownloadZip,
      handleModifySpeechText,
      handleModifyMotion,
      handleModifyDuration,
      handleShiftPanel,
      handleModifySFX,
      handleModifyVisualDescription,
      handleModifyNarrative,
      handleBulkSetDuration,
      handleBulkSetMotion,
      handleBulkSetPreset,
      handleClearTimeline,
      handleAnalyzePanel,
      handleAnalyzeAllPanels,
      handleAnalyzeSelectedPanels,
      isAnalyzingAll,
      handleCancelAnalysis,
    } = useStoryboardOperations({
      panels,
      setPanels,
      setCurrentPanelIndex,
      setActivePreviewTab,
      setVideoUrl,
      addNotification,
      targetUrl,
      fetchWithInterceptor,
      selectedModel,
      setConsoleLogs,
      voiceActor,
      musicTheme,
      narrationStyle,
      audioFeedback,
    });

    if (panels.length === 0) {
      return (
        <div
          id="panels_timeline_section"
          className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4"
        >
          <StoryboardHeader panelsLength={0} />
          <StoryboardEmptyState hasScrapedImages={hasScrapedImages} />
        </div>
      );
    }

    const selectedCount = selectedPanelIds.size;

    return (
      <div
        id="panels_timeline_section"
        className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 transition-all pb-24 relative"
      >
        <StoryboardAnalysisBanner
          isAnalyzingAll={isAnalyzingAll}
          handleCancelAnalysis={handleCancelAnalysis}
        />
        <StoryboardHeader
          showBulkOps={showBulkOps}
          setShowBulkOps={setShowBulkOps}
          isZipping={isZipping}
          panelsLength={panels.length}
          selectedCount={selectedCount}
          totalCount={panels.length}
          handleDownloadZip={handleDownloadZip}
          isAnalyzingAll={isAnalyzingAll}
          handleAnalyzeAllPanels={handleAnalyzeAllPanels}
          handleAnalyzeSelected={() => {
            handleAnalyzeSelectedPanels(Array.from(selectedPanelIds));
            clearSelection();
          }}
          selectAllPanels={selectAllPanels}
          clearSelection={clearSelection}
          handleDeleteSelected={handleDeleteSelected}
          handleAutoCropSelected={handleAutoCropSelected}
          handleCleanBubblesSelected={handleCleanBubblesSelected}
          handleBatchMergeSelected={handleBatchMergeSelected}
          batchProgress={cropProgress}
          cleanProgress={cleanProgress}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
          handleCancelBatch={handleCancelBatch}
          handleCancelAnalysis={handleCancelAnalysis}
          viewLayout={storyboardViewLayout}
          setViewLayout={setStoryboardViewLayout}
        />

        {/* Bulk Operations Menu */}
        {showBulkOps && (
          <StoryboardBulkOps
            bulkDuration={bulkDuration}
            setBulkDuration={setBulkDuration}
            handleBulkSetDuration={handleBulkSetDuration}
            bulkMotion={bulkMotion}
            setBulkMotion={setBulkMotion}
            handleBulkSetMotion={handleBulkSetMotion}
            bulkPreset={bulkPreset}
            setBulkPreset={setBulkPreset}
            handleBulkSetPreset={handleBulkSetPreset}
            handleClearTimeline={handleClearTimeline}
            selectedCount={selectedCount}
            isBatchMagicProcessing={isBatchMagicProcessing}
            batchMagicProgress={batchMagicProgress}
            handleBatchMagicMotion={handleBatchMagicMotion}
          />
        )}

        {(() => {
          const episodeGroups =
            ((window as any).__scrapeEpisodeGroups as EpisodeGroupRecord[]) || [];

          return (
            <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
              <StoryboardSidebar
                episodeGroups={episodeGroups}
                panels={panels}
                selectedTimelineEp={selectedTimelineEp}
                setSelectedTimelineEp={setSelectedTimelineEp}
                setCurrentPanelIndex={setCurrentPanelIndex}
                timelineEpSearchQuery={timelineEpSearchQuery}
                setTimelineEpSearchQuery={setTimelineEpSearchQuery}
                timelineEpSortAscending={timelineEpSortAscending}
                setTimelineEpSortAscending={setTimelineEpSortAscending}
                addNotification={addNotification}
                hoveredTimelineEpIdx={hoveredTimelineEpIdx}
                setHoveredTimelineEpIdx={setHoveredTimelineEpIdx}
              />

              <StoryboardEpisodeGroup
                episodeGroups={episodeGroups}
                selectedTimelineEp={selectedTimelineEp}
                panels={panels}
                currentPanelIndex={currentPanelIndex}
                activePreviewTab={activePreviewTab}
                setCurrentPanelIndex={setCurrentPanelIndex}
                setActivePreviewTab={setActivePreviewTab}
                setPlaybackTime={setPlaybackTime}
                isAnalyzingAll={isAnalyzingAll}
                analyzingPanelId={analyzingPanelId}
                selectedPanelIds={selectedPanelIds}
                togglePanelSelection={togglePanelSelection}
                handlePanelClick={handlePanelClick}
                handlePanelDoubleClick={handlePanelDoubleClick}
                handleShiftPanel={handleShiftPanel}
                handleModifySpeechText={handleModifySpeechText}
                handleModifyMotion={handleModifyMotion}
                handleModifyDuration={handleModifyDuration}
                handleModifySFX={handleModifySFX}
                handleModifyVisualDescription={handleModifyVisualDescription}
                handleModifyNarrative={handleModifyNarrative}
                handleAnalyzePanel={handleAnalyzePanel}
                handleCancelAnalysis={handleCancelAnalysis}
                playStoryboardAudio={playStoryboardAudio}
                autoPlayAudio={autoPlayAudio}
                addNotification={addNotification}
                setPanels={setPanels}
                fetchWithInterceptor={fetchWithInterceptor}
                voiceActor={voiceActor}
                speechRate={speechRate}
                speechPitch={speechPitch}
                storyboardViewLayout={storyboardViewLayout}
              />
            </div>
          );
        })()}

        {showDeleteConfirm && (
          <DeleteConfirmModal
            title="Delete Selected Panels?"
            message={`Are you sure you want to delete the ${selectedPanelIds.size} selected panel(s) from your storyboard?`}
            confirmText="Confirm & Delete"
            onConfirm={async () => {
              setShowDeleteConfirm(false);
              await executeDeleteSelected();
            }}
            onCancel={() => setShowDeleteConfirm(false)}
          />
        )}
        {/* Floating Selection Bar — appears at bottom when panels are selected */}
        <StoryboardSelectionBar
          selectedCount={selectedCount}
          totalCount={panels.length}
          isAnalyzingAll={isAnalyzingAll}
          handleAnalyzeSelected={() => {
            handleAnalyzeSelectedPanels(Array.from(selectedPanelIds));
            clearSelection();
          }}
          selectAllPanels={selectAllPanels}
          clearSelection={clearSelection}
          handleDeleteSelected={handleDeleteSelected}
          isBatchCropping={isBatchCropping}
          isCleaningBubbles={isCleaningBubbles}
          isBatchMerging={isBatchMerging}
          handleAutoCropSelected={handleAutoCropSelected}
          handleCleanBubblesSelected={handleCleanBubblesSelected}
          handleBatchMergeSelected={handleBatchMergeSelected}
          batchProgress={cropProgress}
          cleanProgress={cleanProgress}
          handleCancelAnalysis={handleCancelAnalysis}
          handleCancelBatch={handleCancelBatch}
          panels={panels}
          setPanels={setPanels}
          selectedPanelIds={selectedPanelIds}
          fetchWithInterceptor={fetchWithInterceptor}
          addNotification={addNotification}
          showAutoCropModal={showAutoCropModal}
          setShowAutoCropModal={setShowAutoCropModal}
        />
      </div>
    );
  }
);

export default StoryboardTimeline;
