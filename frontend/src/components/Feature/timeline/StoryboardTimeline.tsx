import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { useStoryboardOperations } from "@/hooks/useStoryboardOperations";
import { processWithConcurrency, chunkArray } from "@/utils/batchUtils";
import * as api from "@/api";

import TimelineEmptyState from "./TimelineEmptyState";
import TimelineHeader from "./TimelineHeader";
import TimelineBulkOps from "./TimelineBulkOps";
import TimelineCard from "./TimelineCard";
import { TimelineSelectionBar } from "@/components/Feature/editor/seloect";

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
  narrationStyle?: string;
  bubbleSensitivity?: number;
  bubbleDetectionStyle?: string;
  bubbleEraseMethod?: string;
  bubbleDilation?: number;
  bubbleInpaintRadius?: number;
  cropSensitivity?: number;
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
  playStoryboardAudio?: (idx: number, forcePlay?: boolean) => void;
  autoPlayAudio?: boolean;
  saveProject?: (customPanels?: GeneratedPanel[]) => Promise<boolean>;
  handleCancelBatch?: () => void;
  audioFeedback?: any;
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
    narrationStyle = "long",
    bubbleSensitivity = 50,
    bubbleDetectionStyle = "all",
    bubbleEraseMethod = "auto",
    bubbleDilation = -1,
    bubbleInpaintRadius = 3,
    cropSensitivity = 30,
    cropBackgroundMode = "auto",
    aspectRatioLock = "free",
    minPanelAreaPct = 2,
    overlapMergeThreshold = 20,
    useLocalCV = true,
    cropModel = "gemini-2.5-flash",
    cropMinHeightPx = 60,
    cropCannyLow = 20,
    cropCannyHigh = 100,
    cropCloseKernelSize = 15,
    autoSplitTallStrips = true,
    playStoryboardAudio,
    autoPlayAudio,
    saveProject,
    handleCancelBatch,
    audioFeedback,
    selectedPanelIds: propSelectedPanelIds,
    setSelectedPanelIds: propSetSelectedPanelIds,
  }: StoryboardTimelineProps) => {
    // ── Panel selection state ────────────────────────────────────────────────
    const [localSelectedPanelIds, setLocalSelectedPanelIds] = useState<Set<number>>(
      new Set()
    );
    const selectedPanelIds = propSelectedPanelIds ?? localSelectedPanelIds;
    const setSelectedPanelIds = propSetSelectedPanelIds ?? setLocalSelectedPanelIds;

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, idx: number) => {
      setDraggedIndex(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", idx.toString());
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === idx) return;
      setDragOverIndex(idx);
    };

    const handleDragEnd = () => {
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, targetIdx: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === targetIdx) return;

      setPanels((prev) => {
        const nextPanels = [...prev];
        const [draggedItem] = nextPanels.splice(draggedIndex, 1);
        nextPanels.splice(targetIdx, 0, draggedItem);
        return nextPanels;
      });

      // Adjust active currentPanelIndex to follow the dragged card
      if (currentPanelIndex === draggedIndex) {
        setCurrentPanelIndex(targetIdx);
      } else if (
        currentPanelIndex > draggedIndex &&
        currentPanelIndex <= targetIdx
      ) {
        setCurrentPanelIndex(currentPanelIndex - 1);
      } else if (
        currentPanelIndex < draggedIndex &&
        currentPanelIndex >= targetIdx
      ) {
        setCurrentPanelIndex(currentPanelIndex + 1);
      }

      addNotification?.("Reordered timeline cards successfully!", "success");
      setDraggedIndex(null);
      setDragOverIndex(null);
    };

    const [isBatchCropping, setIsBatchCropping] = useState(false);
    const [isCleaningBubbles, setIsCleaningBubbles] = useState(false);
    const [isBatchMerging, setIsBatchMerging] = useState(false);

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
    }, []);

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
        `Deleted ${selectedPanelIds.size} selected panels`,
        "info"
      );
      if (saveProject) {
        addNotification?.("Saving timeline changes...", "info");
        await saveProject(remainingPanels);
      }
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
                        const cropData = await api.editImage(activeFetch, {
                          url: originalPanel.image_url,
                          cropTop: box.cropTop,
                          cropBottom: box.cropBottom,
                          cropLeft: box.cropLeft,
                          cropRight: box.cropRight,
                          autoTrim: true,
                          padding: 10,
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
              (sum, p) => sum + (p.duration || 4.5),
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
        className="bg-neutral-900/60 rounded-2xl border border-neutral-800 p-4 sm:p-6 space-y-4 transition-all pb-24"
      >
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
          />
        )}

        {/* Storyboard grid */}
        <div
          className={`w-full max-w-full flex gap-3 sm:gap-4 overflow-x-auto scrollbar-thin px-4 md:px-6 ${
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
              handleShiftPanel={handleShiftPanel}
              panelsLength={panels.length}
              handleModifySpeechText={handleModifySpeechText}
              handleModifyMotion={handleModifyMotion}
              handleModifyDuration={handleModifyDuration}
              handleModifySFX={handleModifySFX}
              handleModifyVisualDescription={handleModifyVisualDescription}
              handleAnalyzePanel={handleAnalyzePanel}
              handleCancelAnalysis={handleCancelAnalysis}
              isSelected={selectedPanelIds.has(panel.id)}
              onToggleSelect={() => togglePanelSelection(panel.id)}
              playStoryboardAudio={playStoryboardAudio}
              autoPlayAudio={autoPlayAudio}
              addNotification={addNotification}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggedIndex === idx}
              isDragOver={dragOverIndex === idx}
            />
          ))}
        </div>

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
        />
      </div>
    );
  }
);

export default StoryboardTimeline;
