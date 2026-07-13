import { normalizeLog } from "../types/logs";
import { useRef, useEffect, useCallback } from "react";
import { Slice, Slot, DetectedPanel } from "@/components/Feature/editor/shared";
import { useImageEditorState, useImageEditorStore } from "./useImageEditorState.js";
import { useCropEditorHistory } from "./useCropEditorHistory.js";
import { useCropEditorDrag } from "./useCropEditorDrag.js";
import { useCropEditorPipelines } from "./useCropEditorPipelines.js";
import { useAppLogic } from "./useAppLogic.js";
import * as api from "../api/index.js";

interface UseCropEditorProps {
  appLogic: ReturnType<typeof useAppLogic>;
}

export function useImageEditor({ appLogic }: UseCropEditorProps) {
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

  const state = useImageEditorState({
    scrapedImages,
    editingImageIdx,
    imageEditStates,
  });

  const { activeTool } = useImageEditorStore();

  useEffect(() => {
    if (activeTool === "slice") {
      state.setEditMode("crop");
      state.setShowSplitPosition(true);
    } else if (activeTool === "crop") {
      state.setEditMode("crop");
      state.setShowSplitPosition(false);
    } else {
      state.setEditMode("crop");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTool]);

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

      // Mark local state as loaded for this active image
      state.setLoadedImageUrl(state.imageUrl);
    } else {
      state.setLoadedImageUrl(null);
    }
  }, [
    state.imageUrl,
    imageEditStates,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    setEditAutoTrim,
    state.setSlices,
    state.setSelectedSliceId,
    state.setSplitLines,
    state.setDetectedBoxes,
    state.setZoom,
    setHistory,
    setRedoHistory,
    state.setLoadedImageUrl,
  ]);

  // Sync state back to parent container if needed
  useEffect(() => {
    // If local state hasn't finished loading/synchronizing for this imageUrl, don't sync back!
    if (!state.imageUrl || state.imageUrl !== state.loadedImageUrl) {
      return;
    }

    if (setImageEditStates) {
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
    state.loadedImageUrl,
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
    const currentImageNumber = editingImageIdx !== null ? editingImageIdx + 1 : 1;
    console.log(
      `[Image Editor] Resetting crop bounds for image #${currentImageNumber}`
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
    const nextIdx = editingImageIdx - 1;
    const isProjectScoped = window.location.pathname.includes("/workspace/editor/series/");
    let target = "";
    if (isProjectScoped) {
      target = `${window.location.pathname}?idx=${nextIdx}`;
    } else {
      const activeTabVal = window.location.pathname.split("/")[2] || "adjust";
      target = `/editor/${activeTabVal}?idx=${nextIdx}`;
    }
    window.history.pushState({}, "", target);
    window.dispatchEvent(new Event("popstate"));
  };

  const handleNextImage = () => {
    if (editingImageIdx === null || editingImageIdx >= scrapedImages.length - 1)
      return;
    const nextIdx = editingImageIdx + 1;
    const isProjectScoped = window.location.pathname.includes("/workspace/editor/series/");
    let target = "";
    if (isProjectScoped) {
      target = `${window.location.pathname}?idx=${nextIdx}`;
    } else {
      const activeTabVal = window.location.pathname.split("/")[2] || "adjust";
      target = `/editor/${activeTabVal}?idx=${nextIdx}`;
    }
    window.history.pushState({}, "", target);
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
        editingImageIdx !== null ? editingImageIdx + 1 : 1
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

  const handleSaveTrainingData = async () => {
    if (editingImageIdx === null) return;
    const canvas = canvasMaskRef.current;
    if (!canvas) {
      addNotification("Eraser canvas not initialized.", "error");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      addNotification("Failed to get 2D context from canvas.", "error");
      return;
    }

    const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hasDrawing = false;
    for (let i = 3; i < canvasData.data.length; i += 4) {
      if (canvasData.data[i] > 10) {
        hasDrawing = true;
        break;
      }
    }

    if (!hasDrawing) {
      addNotification("Please highlight text or speech bubbles on the image first.", "warning");
      return;
    }

    appLogic.setIsSavingEdit(true);
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[Data Flywheel] Extracting original image and human-corrected mask...`,
        ...prev,
      ]);
    }

    try {
      const originalUrl = scrapedImages[editingImageIdx];

      // Fetch original panel as blob via proxy to avoid CORS
      const proxyUrl = api.getProxyImageUrl(originalUrl);
      const imgRes = await fetch(proxyUrl);
      if (!imgRes.ok) throw new Error(`Failed to fetch original panel: ${imgRes.statusText}`);
      const originalBlob = await imgRes.blob();

      // Determine natural dimensions from alt='Preview' image
      const imgElement = document.querySelector("img[alt='Preview']") as HTMLImageElement;
      const naturalWidth = imgElement?.naturalWidth || canvas.width;
      const naturalHeight = imgElement?.naturalHeight || canvas.height;

      // Generate binary mask scaled to natural dimensions
      const offscreen = document.createElement("canvas");
      offscreen.width = naturalWidth;
      offscreen.height = naturalHeight;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) throw new Error("Could not create offscreen canvas context");

      // Draw mask on offscreen canvas
      offCtx.drawImage(canvas, 0, 0, naturalWidth, naturalHeight);

      const offData = offCtx.getImageData(0, 0, naturalWidth, naturalHeight);
      const px = offData.data;
      for (let i = 0; i < px.length; i += 4) {
        const alpha = px[i + 3];
        if (alpha > 10) {
          px[i] = 255;
          px[i + 1] = 255;
          px[i + 2] = 255;
          px[i + 3] = 255;
        } else {
          px[i] = 0;
          px[i + 1] = 0;
          px[i + 2] = 0;
          px[i + 3] = 255;
        }
      }
      offCtx.putImageData(offData, 0, 0);

      const maskBlob = await new Promise<Blob>((resolve, reject) => {
        offscreen.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to convert offscreen canvas to blob"));
        }, "image/png");
      });

      // Submit to backend
      const res = await api.saveTrainingData(activeFetch, originalBlob, maskBlob);
      if (res.success) {
        addNotification("Correction pair successfully saved to the dataset inside training_data/!", "success");
        if (setConsoleLogs) {
          setConsoleLogs((prev) => [
            `[Data Flywheel] [SUCCESS] Saved correction pair!`,
            `  - Original: ${res.original_panel_url}`,
            `  - Mask: ${res.corrected_text_mask_url}`,
            ...prev,
          ]);
        }
        handleClearBrushMaskCallback();
      } else {
        throw new Error(res.message || "Failed to save pair");
      }
    } catch (err: any) {
      console.error("[Data Flywheel] Error saving training pair:", err);
      addNotification(`Failed to save correction: ${err.message}`, "error");
      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Data Flywheel] [ERROR] Failed: ${err.message}`,
          ...prev,
        ]);
      }
    } finally {
      appLogic.setIsSavingEdit(false);
    }
  };

  const handleExecuteSave = async () => {
    console.log(
      `[Image Editor] Executing save for image #${
        editingImageIdx !== null ? editingImageIdx + 1 : 1
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

    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    const match = path.match(
      /^\/workspace\/editor\/series\/([^\/]+)\/chapters\/([^\/]+)(?:\/image-editor)?\/?$/
    );
    const series = match ? match[1] : params.get("series");
    const chapter = match ? match[2] : params.get("chapter");
    if (series && chapter) {
      const target = `/workspace/editor/series/${series}/chapters/${chapter}`;
      if ((window as any).navigateTo) {
        (window as any).navigateTo(target);
      } else {
        window.history.pushState({}, "", target);
        window.dispatchEvent(new Event("popstate"));
      }
    } else {
      window.history.pushState({}, "");
      window.dispatchEvent(new Event("popstate"));
    }
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
    handleSaveTrainingData,
    handleClearBrushMask: handleClearBrushMaskCallback,
  };
}

export const useCropEditor = useImageEditor;
