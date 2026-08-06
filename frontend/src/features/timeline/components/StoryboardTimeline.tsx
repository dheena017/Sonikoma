import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Sparkles } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { useStoryboardOperations } from "@/features/workspace/hooks/useStoryboardOperations";
import { processWithConcurrency, chunkArray } from "@/utils/batchUtils";
import * as api from "@/api";
import { updateSelection } from "@/utils/selection";

import TimelineEmptyState from "@/features/timeline/components/TimelineEmptyState";
import TimelineHeader from "@/features/timeline/components/TimelineHeader";
import TimelineBulkOps from "@/features/timeline/components/TimelineBulkOps";
import TimelineCard from "@/features/timeline/components/TimelineCard";
import { TimelineSelectionBar } from "@/features/editor/components/select";
import { formatDisplayEpisodeLabel, getSortedEpisodeGroups } from "@/features/scraper/components/LiveScraperDeck";

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
    const [selectedTimelineEp, setSelectedTimelineEp] = useState<number | "all">("all");
    const [timelineEpSearchQuery, setTimelineEpSearchQuery] = useState("");
    const [timelineEpSortAscending, setTimelineEpSortAscending] = useState(true);
    const [hoveredTimelineEpIdx, setHoveredTimelineEpIdx] = useState<number | null>(null);

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
          // Single-click (no modifiers) does NOT select/deselect the panel or change selected items.
          // It strictly sets/updates lastSelectedIndex.
          setLastSelectedIndex(idx);
        }
      },
      [lastSelectedIndex, panels, setSelectedPanelIds]
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
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
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
          <TimelineHeader panelsLength={0} />
          <TimelineEmptyState hasScrapedImages={hasScrapedImages} />
        </div>
      );
    }

    const selectedCount = selectedPanelIds.size;

    return (
      <div
        id="panels_timeline_section"
        className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 transition-all pb-24 relative"
      >
        {isAnalyzingAll && (
          <div className="bg-indigo-950/70 border border-indigo-500/40 rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-lg shadow-indigo-950/40 my-2">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center shrink-0">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
                <Sparkles className="w-3 h-3 text-indigo-300 absolute animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                  Generating Narrative Sequence
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    AI Active
                  </span>
                </h4>
                <p className="text-[11px] text-indigo-200/80 mt-0.5">
                  AI is composing story narrative and synthesizing TTS voiceover for sequence cards...
                </p>
              </div>
            </div>
            {handleCancelAnalysis && (
              <button
                type="button"
                onClick={handleCancelAnalysis}
                className="text-[10px] font-bold text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-750 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
        )}
        <TimelineHeader
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
        />

        {/* Bulk Operations Menu */}
        {showBulkOps && (
          <TimelineBulkOps
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

        {/* Storyboard Split Layout with In-Panel Left Sidebar */}
        {(() => {
          const episodeGroups =
            ((window as any).__scrapeEpisodeGroups as Array<{
              episodeLabel: string;
              startIndex: number;
              count: number;
            }>) || [];

          return (
            <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
              {/* IN-PANEL LEFT SIDEBAR: TIMELINE SEQUENCE & EPISODES (Only rendered during multi-episode batch) */}
              {episodeGroups.length > 0 && (
                <aside className="w-full lg:w-56 bg-neutral-955 border border-neutral-850 rounded-2xl p-4 shrink-0 space-y-3 shadow-xl lg:sticky lg:top-24 self-start">
                  {/* Header with Sort Toggle */}
                  <div className="flex items-center justify-between border-b border-neutral-850/80 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                        Timeline Sequence
                      </h4>
                    </div>
                    {episodeGroups.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setTimelineEpSortAscending((prev) => !prev)}
                        title="Toggle Sort Order (Ascending / Descending)"
                        className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-850 text-purple-300 border border-neutral-800 rounded-lg transition-all cursor-pointer"
                      >
                        {timelineEpSortAscending ? "1 → N" : "N → 1"}
                      </button>
                    )}
                  </div>

                  {/* Search & Filter Input */}
                  {episodeGroups.length > 0 && (
                    <div className="relative">
                      <input
                        type="text"
                        value={timelineEpSearchQuery}
                        onChange={(e) => setTimelineEpSearchQuery(e.target.value)}
                        placeholder="Filter sequence..."
                        className="w-full bg-neutral-900/80 border border-neutral-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60 font-mono transition-all"
                      />
                      {timelineEpSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setTimelineEpSearchQuery("")}
                          className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-white text-xs font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}

                  {(() => {
                    const totalTimelineCount = episodeGroups.length > 0
                      ? episodeGroups.reduce((acc, g) => acc + g.count, 0)
                      : panels.length;

                    return (
                      <div className="space-y-1.5 font-mono text-xs">
                        {/* All Scenes Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedTimelineEp("all")}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
                            selectedTimelineEp === "all"
                              ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                              : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
                          }`}
                        >
                          <span className="truncate">All Scenes</span>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-955 text-purple-300 border border-purple-900/40 shrink-0">
                            {totalTimelineCount}f
                          </span>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Filter Episode Section */}
                  <div className="pt-2 border-t border-neutral-850 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono">
                      <span>Sequence Filter</span>
                      <span>({episodeGroups.length})</span>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto overflow-x-hidden p-1 pt-2 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {(() => {
                        const rawSorted = getSortedEpisodeGroups(episodeGroups);
                        const sorted = timelineEpSortAscending ? rawSorted : [...rawSorted].reverse();
                        const filtered = sorted.filter(({ grp }) => {
                          if (!timelineEpSearchQuery.trim()) return true;
                          return formatDisplayEpisodeLabel(grp.episodeLabel)
                            .toLowerCase()
                            .includes(timelineEpSearchQuery.toLowerCase());
                        });

                        return filtered.map(({ grp, originalIdx }) => {
                          const isSelected = selectedTimelineEp === originalIdx;
                          const epPanels = panels.filter((panel, globalIdx) => {
                            if (panel.episode_label) {
                              return panel.episode_label === grp.episodeLabel;
                            }
                            return globalIdx >= grp.startIndex && globalIdx < grp.startIndex + grp.count;
                          });

                          const durationStr = `${grp.count * 4}s`;

                          return (
                            <div key={`timeline-ep-wrapper-${originalIdx}`} className="relative group/ep">
                              <button
                                type="button"
                                title={`${formatDisplayEpisodeLabel(grp.episodeLabel)} — ${grp.count} frames · ${durationStr} · ${epPanels.length} panels`}
                                onClick={() => {
                                  setSelectedTimelineEp(originalIdx);
                                  if (grp.startIndex !== undefined) {
                                    setCurrentPanelIndex(grp.startIndex);
                                  }
                                }}
                                onMouseEnter={() => setHoveredTimelineEpIdx(originalIdx)}
                                onMouseLeave={() => setHoveredTimelineEpIdx(null)}
                                className={`w-full flex flex-col gap-1 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left border cursor-pointer ${
                                  isSelected
                                    ? "bg-purple-600/25 border-purple-400 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                                    : "bg-neutral-900/50 border-neutral-850 text-neutral-350 hover:text-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1.5 w-full">
                                  <div className="flex items-center gap-2 truncate">
                                    <span
                                      className={`h-2 w-2 rounded-full shrink-0 ${
                                        isSelected ? "bg-purple-400 animate-pulse" : "bg-emerald-500/80"
                                      }`}
                                    />
                                    <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-955 text-purple-300 border border-purple-900/40 shrink-0">
                                    {grp.count}f
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[9px] text-neutral-400 font-normal pl-4 pt-0.5">
                                  <span>⏱️ {durationStr}</span>
                                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">✓ Sequenced</span>
                                </div>
                              </button>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Quick Tools */}
                  <div className="pt-2 border-t border-neutral-850">
                    <button
                      type="button"
                      onClick={() => {
                        addNotification?.("All Timeline panels selected", "info");
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-xs font-mono font-bold text-neutral-300 border border-neutral-800 text-center transition-all cursor-pointer truncate"
                    >
                      ✅ Select All Scenes
                    </button>
                  </div>
                </aside>
              )}

              {/* RIGHT MAIN AREA: TIMELINE CARDS */}
              <div className="flex-1 w-full min-w-0 space-y-6">
                {(() => {
                  if (episodeGroups.length > 0) {
                    const sortedGroups = getSortedEpisodeGroups(episodeGroups);
                    const visibleGroups =
                      selectedTimelineEp === "all"
                        ? sortedGroups.map(({ grp, originalIdx }) => ({ grp, gIdx: originalIdx }))
                        : episodeGroups[selectedTimelineEp]
                        ? [{ grp: episodeGroups[selectedTimelineEp], gIdx: selectedTimelineEp as number }]
                        : sortedGroups.map(({ grp, originalIdx }) => ({ grp, gIdx: originalIdx }));

                    return visibleGroups.map(({ grp, gIdx }) => {
                      const grpPanels = panels.filter((panel, globalIdx) => {
                        if (panel.episode_label) {
                          return panel.episode_label === grp.episodeLabel;
                        }
                        return globalIdx >= grp.startIndex && globalIdx < grp.startIndex + grp.count;
                      });

                      return (
                        <div
                          key={`timeline-ep-${gIdx}`}
                          className="bg-neutral-955 border border-neutral-850 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl"
                        >
                          {/* Episode Banner */}
                          <div className="flex items-center justify-between border-b border-neutral-850/80 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="px-3 py-1 rounded-xl bg-purple-950/90 border border-purple-800/60 text-purple-200 font-mono text-xs font-bold flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                {formatDisplayEpisodeLabel(grp.episodeLabel)}
                              </div>
                              <span className="text-[10px] font-mono font-bold bg-neutral-900 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-800">
                                {grpPanels.length} PANELS
                              </span>
                            </div>
                            {isAnalyzingAll && (
                              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-[10px] font-bold font-mono tracking-wide animate-pulse">
                                ANALYZING ALL...
                              </div>
                            )}
                          </div>

                          {/* Episode Horizontal Timeline Grid */}
                          <div
                            className={`w-full max-w-full flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-thin px-1 pt-3 ${
                              selectedCount > 0 ? "pb-2" : "pb-4"
                            }`}
                          >
                            {grpPanels.map((panel, localIdx) => {
                              const globalIdx = grp.startIndex + localIdx;
                              return (
                                <TimelineCard
                                  key={panel.id}
                                  panel={panel}
                                  idx={globalIdx}
                                  currentPanelIndex={currentPanelIndex}
                                  activePreviewTab={activePreviewTab}
                                  setCurrentPanelIndex={setCurrentPanelIndex}
                                  setActivePreviewTab={setActivePreviewTab}
                                  setPlaybackTime={setPlaybackTime}
                                  analyzingPanelId={analyzingPanelId}
                                  isAnalyzingAll={isAnalyzingAll}
                                  handleShiftPanel={handleShiftPanel}
                                  panelsLength={panels.length}
                                  handleModifySpeechText={handleModifySpeechText}
                                  handleModifyMotion={handleModifyMotion}
                                  handleModifyDuration={handleModifyDuration}
                                  handleModifySFX={handleModifySFX}
                                  handleModifyVisualDescription={handleModifyVisualDescription}
                                  handleModifyNarrative={handleModifyNarrative}
                                  handleAnalyzePanel={handleAnalyzePanel}
                                  handleCancelAnalysis={handleCancelAnalysis}
                                  isSelected={selectedPanelIds.has(panel.id)}
                                  onToggleSelect={() => togglePanelSelection(panel.id)}
                                  onPanelClick={handlePanelClick}
                                  onPanelDoubleClick={handlePanelDoubleClick}
                                  playStoryboardAudio={playStoryboardAudio}
                                  autoPlayAudio={autoPlayAudio}
                                  addNotification={addNotification}
                                  setPanels={setPanels}
                                  fetchWithInterceptor={fetchWithInterceptor}
                                  voiceActor={voiceActor}
                                  speechRate={speechRate}
                                  speechPitch={speechPitch}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  }

                  return (
                    <div
                      className={`w-full max-w-full flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-thin px-2 md:px-4 pt-3 ${
                        selectedCount > 0 ? "pb-2" : "pb-4"
                      }`}
                    >
                      {panels.map((panel, idx) => (
                        <TimelineCard
                          key={panel.id}
                          panel={panel}
                          idx={idx}
                          currentPanelIndex={currentPanelIndex}
                          activePreviewTab={activePreviewTab}
                          setCurrentPanelIndex={setCurrentPanelIndex}
                          setActivePreviewTab={setActivePreviewTab}
                          setPlaybackTime={setPlaybackTime}
                          analyzingPanelId={analyzingPanelId}
                          isAnalyzingAll={isAnalyzingAll}
                          handleShiftPanel={handleShiftPanel}
                          panelsLength={panels.length}
                          handleModifySpeechText={handleModifySpeechText}
                          handleModifyMotion={handleModifyMotion}
                          handleModifyDuration={handleModifyDuration}
                          handleModifySFX={handleModifySFX}
                          handleModifyVisualDescription={handleModifyVisualDescription}
                          handleModifyNarrative={handleModifyNarrative}
                          handleAnalyzePanel={handleAnalyzePanel}
                          handleCancelAnalysis={handleCancelAnalysis}
                          isSelected={selectedPanelIds.has(panel.id)}
                          onToggleSelect={() => togglePanelSelection(panel.id)}
                          onPanelClick={handlePanelClick}
                          onPanelDoubleClick={handlePanelDoubleClick}
                          playStoryboardAudio={playStoryboardAudio}
                          autoPlayAudio={autoPlayAudio}
                          addNotification={addNotification}
                          setPanels={setPanels}
                          fetchWithInterceptor={fetchWithInterceptor}
                          voiceActor={voiceActor}
                          speechRate={speechRate}
                          speechPitch={speechPitch}
                        />
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {/* Delete Panels Confirmation Modal */}
        {showDeleteConfirm &&
          createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
                onClick={() => setShowDeleteConfirm(false)}
              />
              <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
                {/* Glow Accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 blur-[1px]" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                      <Trash2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Delete Selected Panels?
                      </h2>
                      <p className="text-[10px] text-neutral-450 font-mono">
                        Warning: This action cannot be undone
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    Are you sure you want to delete the{" "}
                    <strong>{selectedPanelIds.size}</strong> selected panel(s)
                    from your timeline?
                  </p>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      setShowDeleteConfirm(false);
                      await executeDeleteSelected();
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 border border-red-550/30 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Confirm & Delete</span>
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        {/* Floating Selection Bar — appears at bottom when panels are selected */}
        <TimelineSelectionBar
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
