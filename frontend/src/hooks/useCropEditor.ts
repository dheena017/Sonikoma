import { useRef, useEffect, useCallback } from "react";
import { Slice, Slot } from "../components/crop/types.js";
import { NotificationType } from "../components/NotificationStack.js";
import { useCropEditorState } from "./useCropEditorState.js";
import { useCropEditorHistory } from "./useCropEditorHistory.js";
import { useCropEditorDrag } from "./useCropEditorDrag.js";
import { useCropEditorPipelines } from "./useCropEditorPipelines.js";
import { useAppLogic } from "./useAppLogic.js";

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
  } = appLogic;

  const activeFetch = (fetchWithInterceptor || fetch) as typeof fetch;
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMaskRef = useRef<HTMLCanvasElement>(null);

  const state = useCropEditorState({ scrapedImages, editingImageIdx, imageEditStates });

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

  const handleSaveMultipleCutsCallback = useCallback((cuts: Slot[]) => {
    return handleSaveMultipleCuts(cuts);
  }, [handleSaveMultipleCuts]);

  const handleSaveEditedImageCallback = useCallback(() => {
    return handleSaveEditedImage();
  }, [handleSaveEditedImage]);

  // Sync state back to parent container if needed
  useEffect(() => {
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
  }, [state.imageUrl, history, state.slices, state.selectedSliceId, state.splitLines, state.activeTab, state.detectedBoxes, setImageEditStates]);

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

  const handleClearAllSlices = () => {
    pushHistory();
    state.setSlices([]);
    state.setSelectedSliceId(null);
    addNotification("Cleared all crop tools", "info");
  };

  const handleResetCropBounds = () => {
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    setEditAutoTrim(true);
    addNotification("Crop bounds reset", "info");
  };

  const handlePrevImage = () => {
    if (editingImageIdx === null || editingImageIdx <= 0) return;
    setEditingImageIdx(editingImageIdx - 1);
  };

  const handleNextImage = () => {
    if (editingImageIdx === null || editingImageIdx >= scrapedImages.length - 1) return;
    setEditingImageIdx(editingImageIdx + 1);
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
    state.setSplitLines(prev => [...prev, state.splitPosition].sort((a, b) => a - b));
    addNotification("Split line added", "success");
  };

  const handleRemoveSplitLine = (lineY: number) => {
    pushHistory();
    state.setSplitLines(prev => prev.filter(y => y !== lineY));
    addNotification("Split line removed", "info");
  };

  const handleExecuteHorizontalSplit = async () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const currentUrl = scrapedImages[editingImageIdx];
    appLogic.setIsSavingEdit(true);

    try {
      const response = await activeFetch("/api/execute-splits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, splitLines: state.splitLines }),
      });
      if (!response.ok) throw new Error("Splits execution failed");
      const data = await response.json();
      if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy.splice(editingImageIdx, 1, ...data.urls);
          return copy;
        });
        addNotification(`Successfully split panel into ${data.urls.length} images!`, "success");
        setEditingImageIdx(null);
      }
    } catch (err: any) {
      addNotification(`Split execution failed: ${err.message}`, "error");
    } finally {
      appLogic.setIsSavingEdit(false);
    }
  };

  const handleExecuteSave = async () => {
    if (state.slices.length > 0) {
      await handleSaveMultipleCutsCallback(state.slices);
    } else {
      await handleSaveEditedImageCallback();
    }
    setEditingImageIdx(null);
  };

  const handleDeleteCurrentImage = () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Panel #${editingImageIdx + 1} from your deck?`
    );
    if (!confirmDelete) return;

    const currentIdx = editingImageIdx;
    setScrapedImages((prev) => {
      const filtered = prev.filter((_, i) => i !== currentIdx);
      
      // Only close editor if no images left
      if (filtered.length === 0) {
        setEditingImageIdx(null);
        return filtered;
      }

      // Auto-navigate to next image, or previous if it was the last one
      if (currentIdx >= filtered.length) {
        setEditingImageIdx(currentIdx - 1);
      } else {
        setEditingImageIdx(currentIdx);
      }

      return filtered;
    });

    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[GUI] Deleted extracted frame #${currentIdx + 1} from deck via Editor.`,
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
      const initialSlices = state.detectedBoxes.map((box: any, index: number) => ({
        id: `detected-${index}-${Date.now()}`,
        cropTop: box.cropTop,
        cropBottom: box.cropBottom,
        cropLeft: box.cropLeft,
        cropRight: box.cropRight,
        autoTrim: editAutoTrim,
      }));
      state.setSlices(initialSlices);

      if (initialSlices.length > 0) {
        const first = initialSlices[0];
        state.setSelectedSliceId(first.id);
        setEditCropLeft(first.cropLeft);
        setEditCropRight(first.cropRight);
        setEditCropTop(first.cropTop);
        setEditCropBottom(first.cropBottom);
      }
      
      addNotification(`Applied ${state.detectedBoxes.length} cuts to Target list!`, "success");
    },
    handleClearDetectedBoxes: () => {
      state.setDetectedBoxes([]);
      addNotification("Preview cleared", "info");
    },
    handleDetectPanels,
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
