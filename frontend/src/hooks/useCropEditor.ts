import { normalizeLog } from "../types/logs";
import { useRef, useEffect, useCallback } from "react";
import { Slice, Slot, DetectedPanel } from "@/components/Feature/editor/crop";
import { NotificationType } from "../components/notification/NotificationStack.js";
import { useCropEditorState } from "./useCropEditorState.js";
import { useCropEditorHistory } from "./useCropEditorHistory.js";
import { useCropEditorDrag } from "./useCropEditorDrag.js";
import { useCropEditorPipelines } from "./useCropEditorPipelines.js";
import { useAppLogic } from "./useAppLogic.js";
import * as api from "../api/index.js";

interface UseCropEditorProps {
  appLogic: ReturnType<typeof useAppLogic>;
}

export function useCropEditor({ appLogic }: UseCropEditorProps) {
  const {
    editingImageIdx,
    setEditingImageIdx,
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    setEditAutoTrim,
    scrapedImages,
    setScrapedImages,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    setConsoleLogs,
    addNotification,
    panels,
    setPanels,
    fetchWithInterceptor,
    imageEditStates,
    setImageEditStates,
    addPanelsToStoryboard,
  } = appLogic;

  const activeFetch = (fetchWithInterceptor || fetch) as typeof fetch;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMaskRef = useRef<HTMLCanvasElement>(null);

  const state = useCropEditorState({
    scrapedImages,
    editingImageIdx,
    imageEditStates,
  });

  const {
    history,
    setHistory,
    redoHistory,
    setRedoHistory,
    pushHistory,
    handleUndo,
    handleRedo,
  } = useCropEditorHistory({
    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    slices: state.slices,
    setSlices: state.setSlices,
    splitLines: state.splitLines,
    setSplitLines: state.setSplitLines,
    selectedSliceId: state.selectedSliceId,
    setSelectedSliceId: state.setSelectedSliceId,
    savedState: state.savedState,
  });

  const {
    handleTransform,
    handleMergeWithNext,
    handleCleanSingleBubble,
    handleDeleteSlice,
    handleCropSingleSlice,
    handleAiCrop,
    handleDetectPanels,
    handleCancelDetect,
  } = useCropEditorPipelines({
    activeFetch,
    editingImageIdx,
    setEditingImageIdx,
    imageUrl: state.imageUrl,
    scrapedImages,
    setScrapedImages,
    setPanels,
    setConsoleLogs,
    addNotification,

    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,
    editAutoTrim,
    addPanelsToStoryboard,

    eraseMethod: state.eraseMethod,
    sensitivity: state.sensitivity,
    dilation: state.dilation,
    inpaintRadius: state.inpaintRadius,
    detectionStyle: state.detectionStyle,
    debugMode: state.debugMode,
    fillColor: state.fillColor,
    gpu: state.gpu,

    setIsTransforming: state.setIsTransforming,
    setIsMerging: state.setIsMerging,
    setIsCleaning: state.setIsCleaning,
    setIsCroppingSlice: state.setIsCroppingSlice,
    setSlicesCroppedCount: state.setSlicesCroppedCount,
    slicesCroppedCount: state.slicesCroppedCount,
    setIsDetecting: state.setIsDetecting,
    setDetectedBoxes: state.setDetectedBoxes,
    setIsAiDetecting: state.setIsAiDetecting,
    setEditMode: state.setEditMode,
    setSlices: state.setSlices,
    setSelectedSliceId: state.setSelectedSliceId,

    pushHistory,
  });

  const handleSelectSlice = (slice: Slice) => {
    state.setSelectedSliceId(slice.id);
    setEditCropTop(slice.cropTop);
    setEditCropBottom(slice.cropBottom);
    setEditCropLeft(slice.cropLeft);
    setEditCropRight(slice.cropRight);
  };

  const {
    isPointInsideSelection,
    onResizeStart,
    handleSelectAndDragSlice,
    handleStart,
    handleMove,
    handleEnd,
    handleNudge,
  } = useCropEditorDrag({
    containerRef,
    dragStart: state.dragStart,
    setDragStart: state.setDragStart,
    dragType: state.dragType,
    setDragType: state.setDragType,
    dragStartPercent: state.dragStartPercent,
    setDragStartPercent: state.setDragStartPercent,
    originalCropBounds: state.originalCropBounds,
    setOriginalCropBounds: state.setOriginalCropBounds,
    draggingSplitLineIdx: state.draggingSplitLineIdx,
    setDraggingSplitLineIdx: state.setDraggingSplitLineIdx,

    editCropTop,
    setEditCropTop,
    editCropBottom,
    setEditCropBottom,
    editCropLeft,
    setEditCropLeft,
    editCropRight,
    setEditCropRight,

    showSplitPosition: state.showSplitPosition,
    splitPosition: state.splitPosition,
    setSplitPosition: state.setSplitPosition,
    splitLines: state.splitLines,
    setSplitLines: state.setSplitLines,
    magneticSnap: state.magneticSnap,
    detectedGutters: state.detectedGutters,

    slices: state.slices,
    setSlices: state.setSlices,
    setSelectedSliceId: state.setSelectedSliceId,
    selectedSliceId: state.selectedSliceId,
    autoPushOnDraw: state.autoPushOnDraw,
    editAutoTrim,
    activeTab: state.activeTab,

    pushHistory,
    handleSelectSlice,
    handlePushToSlices: () => {
      pushHistory();
      const newSlice: Slice = {
        id: `slice-${Date.now()}`,
        cropTop: editCropTop,
        cropBottom: editCropBottom,
        cropLeft: editCropLeft,
        cropRight: editCropRight,
        autoTrim: editAutoTrim,
      };
      state.setSlices((prev) => [...prev, newSlice]);

      // Reset active selection after saving
      setEditCropTop(0);
      setEditCropBottom(0);
      setEditCropLeft(0);
      setEditCropRight(0);
      state.setSelectedSliceId(null);

      addNotification("Saved crop tool", "success");
    },
  });

  const handleClearBrushMask = () => {
    const canvas = canvasMaskRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleClearBrushMaskCallback = useCallback(() => {
    handleClearBrushMask();
  }, []);

  const handleSaveMultipleCutsCallback = useCallback(
    (cuts: Slot[]) => {
      return handleSaveMultipleCuts(cuts);
    },
    [handleSaveMultipleCuts]
  );

  const handleSaveEditedImageCallback = useCallback(() => {
    return handleSaveEditedImage();
  }, [handleSaveEditedImage]);

  const lastImageUrlRef = useRef<string | null>(null);

  // Handle resetting and loading states when the active image changes
  useEffect(() => {
    if (state.imageUrl) {
      const saved = imageEditStates?.[state.imageUrl];
      state.setSlices(saved?.slices || []);
      state.setSelectedSliceId(saved?.selectedSliceId || null);
      state.setSplitLines(saved?.splitLines || []);
      state.setDetectedBoxes(saved?.detectedBoxes || []);
      state.setZoom(1);

      // Reset history
      setHistory(saved?.history || []);
      setRedoHistory([]);

      // Reset active crop bounds in parent
      setEditCropTop(0);
      setEditCropBottom(0);
      setEditCropLeft(0);
      setEditCropRight(0);
      setEditAutoTrim(true);
    }
  }, [
    state.imageUrl,
    imageEditStates,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    setEditAutoTrim,
    setHistory,
    setRedoHistory,
  ]);

  // Sync state back to parent container if needed
  useEffect(() => {
    // If imageUrl changed, don't sync stale data of the old image into the new image's slot!
    if (state.imageUrl !== lastImageUrlRef.current) {
      lastImageUrlRef.current = state.imageUrl;
      return;
    }

    if (state.imageUrl && setImageEditStates) {
      setImageEditStates((prev) => ({
        ...prev,
        [state.imageUrl!]: {
          history,
          slices: state.slices,
          selectedSliceId: state.selectedSliceId,
          splitLines: state.splitLines,
          activeTab: state.activeTab,
          detectedBoxes: state.detectedBoxes,
        },
      }));
    }
  }, [
    state.imageUrl,
    history,
    state.slices,
    state.selectedSliceId,
    state.splitLines,
    state.activeTab,
    state.detectedBoxes,
    setImageEditStates,
  ]);

  const handlePushToSlices = () => {
    pushHistory();
    const newSlice: Slice = {
      id: `slice-${Date.now()}`,
      cropTop: editCropTop,
      cropBottom: editCropBottom,
      cropLeft: editCropLeft,
      cropRight: editCropRight,
      autoTrim: editAutoTrim,
    };
    state.setSlices((prev) => [...prev, newSlice]);

    // Reset active selection after saving
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    state.setSelectedSliceId(null);

    addNotification("Saved crop tool", "success");
  };

  const handleClearAllSlices = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmClear = await (window as any).confirmAsync(
      "Are you sure you want to clear all crop tools/slices?",
      "Clear Crop Tools",
      "red"
    );
    if (!confirmClear) return;
    pushHistory();
    state.setSlices([]);
    state.setSelectedSliceId(null);
    addNotification("Cleared all crop tools", "info");
  };

  const handleResetCropBounds = () => {
    console.log(
      `[Image Editor] Resetting crop bounds for image #${editingImageIdx + 1}`
    );
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    setEditAutoTrim(true);
    addNotification("Crop bounds reset", "info");
  };

  const handlePrevImage = () => {
    if (editingImageIdx === null || editingImageIdx <= 0) return;
    const activeTabVal = window.location.pathname.split("/")[2] || "adjust";
    const nextIdx = editingImageIdx - 1;
    window.history.pushState({}, "", `/editor/${activeTabVal}?idx=${nextIdx}`);
    window.dispatchEvent(new Event("popstate"));
  };

  const handleNextImage = () => {
    if (editingImageIdx === null || editingImageIdx >= scrapedImages.length - 1)
      return;
    const activeTabVal = window.location.pathname.split("/")[2] || "adjust";
    const nextIdx = editingImageIdx + 1;
    window.history.pushState({}, "", `/editor/${activeTabVal}?idx=${nextIdx}`);
    window.dispatchEvent(new Event("popstate"));
  };

  const handleApplyEqualSplits = (count: number) => {
    pushHistory();
    const newLines: number[] = [];
    const step = 100 / count;
    for (let i = 1; i < count; i++) {
      newLines.push(parseFloat((step * i).toFixed(1)));
    }
    state.setSplitLines(newLines);
    addNotification(`Generated ${count} equal split boundaries`, "success");
  };

  const handleAddSplitLine = () => {
    pushHistory();
    state.setSplitLines((prev) =>
      [...prev, state.splitPosition].sort((a, b) => a - b)
    );
    addNotification("Split line added", "success");
  };

  const handleRemoveSplitLine = (lineY: number) => {
    pushHistory();
    state.setSplitLines((prev) => prev.filter((y) => y !== lineY));
    addNotification("Split line removed", "info");
  };

  const handleExecuteHorizontalSplit = async () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const currentUrl = scrapedImages[editingImageIdx];
    console.log(
      `[Split] Executing horizontal splits on image #${
        editingImageIdx + 1
      } with lines:`,
      state.splitLines
    );
    appLogic.setIsSavingEdit(true);

    try {
      const data = await api.splitImage(activeFetch, {
        url: currentUrl,
        splitLines: state.splitLines,
      });
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        addPanelsToStoryboard(data.urls);
        addNotification(
          `Successfully split panel into ${data.urls.length} images and added to Timeline!`,
          "success"
        );
        setEditingImageIdx(null);
        window.history.pushState({}, "");
        window.dispatchEvent(new Event("popstate"));
      }
    } catch (err: any) {
      addNotification(`Split execution failed: ${err.message}`, "error");
    } finally {
      appLogic.setIsSavingEdit(false);
    }
  };

  const handleExecuteSave = async () => {
    console.log(
      `[Image Editor] Executing save for image #${
        editingImageIdx + 1
      }. Slices: ${state.slices.length}, Selected: ${state.selectedSliceId}`
    );
    if (state.selectedSliceId) {
      // If a specific slice is selected, only execute that one
      const selectedSlice = state.slices.find(
        (s) => s.id === state.selectedSliceId
      );
      if (selectedSlice) {
        await handleSaveEditedImageCallback();
      }
    } else if (state.slices.length > 0) {
      // If no slice selected but multiple exist, execute all
      await handleSaveMultipleCutsCallback(state.slices);
    } else {
      // Default single frame crop
      await handleSaveEditedImageCallback();
    }
    window.history.pushState({}, "");
    window.dispatchEvent(new Event("popstate"));
  };

  const handleDeleteCurrentImage = async () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmDelete = await (window as any).confirmAsync(
      `Are you sure you want to delete Panel #${
        editingImageIdx + 1
      } from your deck?`,
      "Delete Panel",
      "red"
    );
    if (!confirmDelete) return;

    const currentIdx = editingImageIdx;
    setScrapedImages((prev) => {
      const filtered = prev.filter((_, i) => i !== currentIdx);

      // Only close editor if no images left
      if (filtered.length === 0) {
        window.history.pushState({}, "");
        window.dispatchEvent(new Event("popstate"));
        return filtered;
      }

      // Auto-navigate to next image, or previous if it was the last one
      const nextIdx =
        currentIdx >= filtered.length ? currentIdx - 1 : currentIdx;
      const activeTabVal = window.location.pathname.split("/")[2] || "adjust";
      window.history.pushState(
        {},
        "",
        `/editor/${activeTabVal}?idx=${nextIdx}`
      );
      window.dispatchEvent(new Event("popstate"));

      return filtered;
    });

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[GUI] Deleted extracted frame #${
          currentIdx + 1
        } from deck via Editor.`,
        ...prev,
      ]);
    }
    console.log(`[GUI] Deleted extracted frame #${currentIdx + 1} from deck`);
    addNotification(`Panel #${currentIdx + 1} deleted from deck`, "info");
  };

  return {
    ...state,
    containerRef,
    canvasMaskRef,
    history,
    redoHistory,
    pushHistory,
    handleUndo,
    handleRedo,
    handleTransform,
    handleResetCropBounds,
    handleMergeWithNext,
    handlePrevImage,
    handleNextImage,
    handleCleanSingleBubble,
    handleDeleteCurrentImage,
    handleSelectSlice,
    handleDeleteSlice,
    handleCropSingleSlice,
    handleAiCrop,
    handleCommitDetectedBoxes: () => {
      if (state.detectedBoxes.length === 0) {
        addNotification("No detected boxes to apply.", "warning");
        return;
      }
      const initialSlices = state.detectedBoxes.map(
        (box: DetectedPanel, index: number) => ({
          id: `detected-${index}-${Date.now()}`,
          cropTop: box.cropTop,
          cropBottom: box.cropBottom,
          cropLeft: box.cropLeft,
          cropRight: box.cropRight,
          autoTrim: editAutoTrim,
        })
      );
      state.setSlices(initialSlices);

      if (initialSlices.length > 0) {
        const first = initialSlices[0];
        state.setSelectedSliceId(first.id);
        setEditCropLeft(first.cropLeft);
        setEditCropRight(first.cropRight);
        setEditCropTop(first.cropTop);
        setEditCropBottom(first.cropBottom);
      }

      addNotification(
        `Applied ${state.detectedBoxes.length} cuts to Target list!`,
        "success"
      );
    },
    handleClearDetectedBoxes: () => {
      state.setDetectedBoxes([]);
      addNotification("Preview cleared", "info");
    },
    handleDetectPanels,
    handleCancelDetect,
    isPointInsideSelection,
    onResizeStart,
    handleSelectAndDragSlice,
    handleStart,
    handleMove,
    handleEnd,
    handlePushToSlices,
    handleApplyEqualSplits,
    handleClearAllSlices,
    handleNudge,
    handleAddSplitLine,
    handleRemoveSplitLine,
    handleExecuteHorizontalSplit,
    handleExecuteSave,
    handleClearBrushMask: handleClearBrushMaskCallback,
  };
}
