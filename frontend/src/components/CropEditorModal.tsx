import React, { useState, useRef, useEffect, useCallback } from "react";
import { Scissors, X, RefreshCw, Crop, Layers, Move, Undo2, Sparkles, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Slice, Slot } from "./crop/types";
import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";

import EnhancementsPanel from "./crop/EnhancementsPanel";
import CleanBubblesPanel from "./crop/CleanBubblesPanel";
import HorizontalSplitter from "./crop/HorizontalSplitter";
import CutsRegistry from "./crop/CutsRegistry";
import AutoSlicer from "./crop/AutoSlicer";
import CropCanvas from "./crop/CropCanvas";
import CropToolsPanel from "./crop/CropToolsPanel";
import MergePanel from "./crop/MergePanel";

interface CropEditorModalProps {
  key?: any;
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  setEditAutoTrim: (val: boolean) => void;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  isSavingEdit: boolean;
  handleSaveEditedImage: () => Promise<void>;
  handleSaveMultipleCuts: (cuts: Slot[]) => Promise<void>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchWithInterceptor?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  setErrorPopup?: React.Dispatch<React.SetStateAction<ErrorPopupDetail | null>>;
  imageEditStates?: Record<string, any>;
  setImageEditStates?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export default function CropEditorModal({
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
  isSavingEdit,
  handleSaveEditedImage,
  handleSaveMultipleCuts,
  setConsoleLogs,
  addNotification,
  panels,
  setPanels,
  fetchWithInterceptor,
  imageEditStates,
  setImageEditStates,
  selectedScraped,
  setSelectedScraped,
  setErrorPopup,
}: CropEditorModalProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragType, setDragType] = useState<"draw" | "move" | "split" | "drag-split-line" | `resize-${'nw'|'ne'|'sw'|'se'|'n'|'s'|'w'|'e'}` | null>(
    null
  );
  const [dragStartPercent, setDragStartPercent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [originalCropBounds, setOriginalCropBounds] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);
  const [draggingSplitLineIdx, setDraggingSplitLineIdx] = useState<number | null>(null);
const [editMode, setEditMode] = useState<"crop" | "clean_auto" | "clean_manual" | "typeset" | "slices">("crop");
const [detectedBubbles, setDetectedBubbles] = useState<Array<{ box: [number, number, number, number]; text: string; category?: string }>>([]);
const [selectedBubbleIdx, setSelectedBubbleIdx] = useState<number | null>(null);
const [brushSize, setBrushSize] = useState(20);
const [brushAction, setBrushAction] = useState<"paint" | "erase">("paint");
const canvasMaskRef = useRef<HTMLCanvasElement>(null);

  const handleClearBrushMask = () => {
    const canvas = canvasMaskRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const imageUrl = editingImageIdx !== null ? scrapedImages[editingImageIdx] : null;
  const savedState = imageUrl && imageEditStates ? imageEditStates[imageUrl] : null;

  const [detectedBoxes, setDetectedBoxes] = useState<
    Array<{
      cropTop: number;
      cropBottom: number;
      cropLeft: number;
      cropRight: number;
      width: number;
      height: number;
      area: number;
    }>
  >(savedState?.detectedBoxes || []);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isAiDetecting, setIsAiDetecting] = useState<boolean>(false);

  // Sidebar Tab Configuration
  const [activeTab, setActiveTab] = useState<"adjust" | "slice" | "cuts" | "tools" | "merge">(savedState?.activeTab || "adjust");

  // Zoom & Transform
  const [zoom, setZoom] = useState<number>(1);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);

  // Merge
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Multiple Cut List
  const [slices, setSlices] = useState<Slice[]>(savedState?.slices || []);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(savedState?.selectedSliceId || null);
  const [autoPushOnDraw, setAutoPushOnDraw] = useState<boolean>(false);

  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [splitLines, setSplitLines] = useState<number[]>(savedState?.splitLines || []);
  const [showSplitPosition, setShowSplitPosition] = useState<boolean>(savedState?.activeTab === "slice" || false);
  const [magneticSnap, setMagneticSnap] = useState<boolean>(true);
  const [detectedGutters, setDetectedGutters] = useState<number[]>([]);

  const [isCroppingSlice, setIsCroppingSlice] = useState<string | null>(null);
  const [slicesCroppedCount, setSlicesCroppedCount] = useState(0);

  const handleTransform = async (type: "rotate" | "flip", value: string) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsTransforming(true);
    try {
      const response = await activeFetch("/api/transform-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, type, value }),
      });
      if (!response.ok) throw new Error("Transform failed: " + response.status);
      const data = await response.json();
      if (data.url && setScrapedImages) {
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy[editingImageIdx] = data.url;
          return copy;
        });
        addNotification(
          type === "rotate" ? `Rotated ${value}°` : `Flipped ${value === "h" ? "Horizontally" : "Vertically"}`,
          "success"
        );
      }
    } catch (err: any) {
      addNotification(`Transform failed: ${err.message}`, "error");
    } finally {
      setIsTransforming(false);
    }
  };

  const handleResetCropBounds = () => {
    pushHistory();
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    addNotification("Crop bounds reset to full frame", "success");
  };

  const handleMergeWithNext = async (
    count: number,
    config: { direction: "next" | "prev"; layout: "vertical" | "horizontal"; spacing: number; spacingColor: string; scaleToFit: boolean; alignMode: "center" | "start" | "end"; padding: number; } = { direction: "next", layout: "vertical", spacing: 0, spacingColor: "white", scaleToFit: true, alignMode: "center", padding: 0 }
  ) => {
    if (editingImageIdx === null) return;
    
    let urlsToMerge: string[] = [];
    let spliceStart = editingImageIdx;
    
    if (config.direction === "next") {
      urlsToMerge = scrapedImages.slice(editingImageIdx, editingImageIdx + count + 1);
    } else {
      spliceStart = Math.max(0, editingImageIdx - count);
      urlsToMerge = scrapedImages.slice(spliceStart, editingImageIdx + 1);
    }

    if (urlsToMerge.length < 2) return;
    setIsMerging(true);
    try {
      const response = await activeFetch("/api/stitch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          urls: urlsToMerge,
          layout: config.layout,
          spacing: config.spacing,
          spacingColor: config.spacingColor,
          scaleToFit: config.scaleToFit,
          alignMode: config.alignMode,
          padding: config.padding
        }),
      });
      if (!response.ok) throw new Error("Merge failed: " + response.status);
      const data = await response.json();
      if (data.url && setScrapedImages) {
        const stitchedUrl = data.url;
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy.splice(spliceStart, count + 1, stitchedUrl);
          return copy;
        });
        addNotification(
          `Merged ${count + 1} frames into 1 panel successfully!`,
          "success"
        );
        // Do not close the modal; let the user continue editing the merged frame
      }
    } catch (err: any) {
      addNotification(`Merge failed: ${err.message}`, "error");
    } finally {
      setIsMerging(false);
    }
  };

  const handlePrevImage = () => {
    if (editingImageIdx !== null && editingImageIdx > 0) {
      setEditingImageIdx(editingImageIdx - 1);
    }
  };

  const handleNextImage = () => {
    if (editingImageIdx !== null && editingImageIdx < scrapedImages.length - 1) {
      setEditingImageIdx(editingImageIdx + 1);
    }
  };

  // Handler for cleaning a single detected bubble
const handleCleanSingleBubble = async (
  ymin: number,
  xmin: number,
  ymax: number,
  xmax: number,
  text: string
) => {
  // Simple wrapper around the bulk clean endpoint for a single bubble
  setIsCleaning(true);
  try {
    const response = await activeFetch("/api/remove-speech-bubble", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: imgUrl,
        box: { ymin, xmin, ymax, xmax },
        text,
        method: eraseMethod,
        sensitivity,
        dilation,
        inpaint_radius: inpaintRadius,
        detection_style: detectionStyle,
        debug_mode: debugMode,
        fill_color: eraseMethod === "solid_color" ? fillColor : "",
        gpu,
      }),
    });
    if (!response.ok) throw new Error(`Single bubble clean failed: ${response.status}`);
    const data = await response.json();
    if (data.success && data.url) {
      // Update image URL and history
      updateImageUrl(data.url);
      const newHistory = history.slice(0, historyPointer + 1);
      newHistory.push(data.url);
      setHistory(newHistory);
      setHistoryPointer(newHistory.length - 1);
      addNotification("Cleaned single bubble successfully", "success");
    }
  } catch (err: any) {
    console.error(err);
    addNotification(err.message || "Failed to clean bubble", "error");
  } finally {
    setIsCleaning(false);
  }
};

// Updated CropCanvas component with Phase 4 props
<CropCanvas
  imgUrl={scrapedImages[editingImageIdx]}
  containerRef={containerRef}
  editCropTop={editCropTop}
  editCropBottom={editCropBottom}
  editCropLeft={editCropLeft}
  editCropRight={editCropRight}
  slices={slices}
  selectedSliceId={selectedSliceId}
  showSplitPosition={showSplitPosition}
  splitPosition={splitPosition}
  splitLines={splitLines}
  handleStart={handleStart}
  handleMove={handleMove}
  handleEnd={handleEnd}
  isPointInsideSelection={isPointInsideSelection}
  handleSelectSlice={handleSelectSlice}
  handleDeleteSlice={handleDeleteSlice}
  handleRemoveSplitLine={handleRemoveSplitLine}
  dragType={dragType as any}
  onResizeStart={onResizeStart}
  handleSelectAndDragSlice={handleSelectAndDragSlice}
  zoom={zoom}
  detectedBoxes={detectedBoxes}
  // Phase 4 integration
  editMode={editMode}
  detectedBubbles={detectedBubbles}
  selectedBubbleIdx={selectedBubbleIdx}
  setSelectedBubbleIdx={setSelectedBubbleIdx}
  brushSize={brushSize}
  canvasMaskRef={canvasMaskRef}
  onCleanSingleBubble={handleCleanSingleBubble}
/>

  const handleDeleteCurrentImage = () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Panel #${editingImageIdx + 1} from your deck?`
    );
    if (!confirmDelete) return;

    const imgUrl = scrapedImages[editingImageIdx];
    setScrapedImages((prev) => prev.filter((_, i) => i !== editingImageIdx));
    if (setSelectedScraped) {
      setSelectedScraped((prev) => prev.filter((img) => img !== imgUrl));
    }
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[GUI] Deleted extracted frame #${editingImageIdx + 1} from deck via Editor.`,
        ...prev,
      ]);
    }
    addNotification(`Panel #${editingImageIdx + 1} deleted from deck`, "info");
    setEditingImageIdx(null); // Close editor
  };

  // --- Undo History ---
  type HistorySnapshot = {
    cropTop: number;
    cropBottom: number;
    cropLeft: number;
    cropRight: number;
    slices: Slice[];
    splitLines: number[];
    selectedSliceId: string | null;
  };
  const [history, setHistory] = useState<HistorySnapshot[]>(savedState?.history || []);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30), // cap history to 30 steps
      {
        cropTop: editCropTop,
        cropBottom: editCropBottom,
        cropLeft: editCropLeft,
        cropRight: editCropRight,
        slices,
        splitLines,
        selectedSliceId,
      },
    ]);
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, slices, splitLines, selectedSliceId]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const snap = prev[prev.length - 1];
      setEditCropTop(snap.cropTop);
      setEditCropBottom(snap.cropBottom);
      setEditCropLeft(snap.cropLeft);
      setEditCropRight(snap.cropRight);
      setSlices(snap.slices);
      setSplitLines(snap.splitLines);
      setSelectedSliceId(snap.selectedSliceId);
      return prev.slice(0, -1);
    });
  }, [setEditCropTop, setEditCropBottom, setEditCropLeft, setEditCropRight]);

  const activeStoryboardPanel = panels?.find(
    (p) => p.image_url === scrapedImages[editingImageIdx!]
  );

  const handleModifyBrightness = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, brightness: val } : p))
    );
  };
  const handleModifyContrast = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, contrast: val } : p))
    );
  };
  const handleModifySaturation = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, saturation: val } : p))
    );
  };
  const handleModifyFilterPreset = (panelId: number, preset: string) => {
    setPanels?.((prev) =>
      prev.map((p) =>
        p.id === panelId ? { ...p, filter_preset: preset } : p
      )
    );
  };

  const handleModifyGrayscale = (panelId: number, val: boolean) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, grayscale: val } : p))
    );
  };

  const handleModifyDuration = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, duration: val } : p))
    );
  };

  const handleModifyMotionType = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, motion_type: val } : p))
    );
  };

  const handleModifySpeechText = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, speech_text: val } : p))
    );
  };

  const handleModifySfx = (panelId: number, val: string) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, sfx: val } : p))
    );
  };

  const handleModifyCropPadding = (panelId: number, val: number) => {
    setPanels?.((prev) =>
      prev.map((p) => (p.id === panelId ? { ...p, crop_padding: val } : p))
    );
  };

  // Sync state back to the parent cache whenever it changes
  useEffect(() => {
    if (editingImageIdx === null || !setImageEditStates) return;
    const currentUrl = scrapedImages[editingImageIdx];
    if (!currentUrl) return;

    setImageEditStates((prev) => ({
      ...prev,
      [currentUrl]: {
        cropTop: editCropTop,
        cropBottom: editCropBottom,
        cropLeft: editCropLeft,
        cropRight: editCropRight,
        autoTrim: editAutoTrim,
        slices,
        selectedSliceId,
        splitLines,
        activeTab,
        history,
        detectedBoxes,
      },
    }));
  }, [
    editingImageIdx,
    scrapedImages,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    editAutoTrim,
    slices,
    selectedSliceId,
    splitLines,
    activeTab,
    history,
    detectedBoxes,
    setImageEditStates,
  ]);

  // Sync active coordinates state into the currently selected slice to support on-canvas fine-tuning
  useEffect(() => {
    if (selectedSliceId) {
      setSlices((prev) =>
        prev.map((s) =>
          s.id === selectedSliceId
            ? {
                ...s,
                cropTop: editCropTop,
                cropBottom: editCropBottom,
                cropLeft: editCropLeft,
                cropRight: editCropRight,
              }
            : s
        )
      );
    }
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, selectedSliceId]);

  // Automatically switch mouse mode based on selected tab: "slice" (cut) turns split line on, others turn it off
  useEffect(() => {
    if (activeTab === "slice") {
      setShowSplitPosition(true);
    } else {
      setShowSplitPosition(false);
    }
  }, [activeTab]);

  const handleAiCrop = async () => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsAiDetecting(true);
    try {
      const response = await activeFetch("/api/ai-detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });
      if (!response.ok) throw new Error("AI analysis failed");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels) && data.panels.length > 0) {
        const hasCroppedUrls = data.panels.every((p: any) => p.croppedUrl);
        if (hasCroppedUrls && setScrapedImages) {
          const croppedUrls = data.panels.map((p: any) => p.croppedUrl);

          if (setConsoleLogs) {
            setConsoleLogs((prev) => [
              `[AI Smart Crop] Segmented original image into ${croppedUrls.length} pre-cropped panels...`,
              ...prev,
            ]);
          }

          // Replace original with the cropped segments
          setScrapedImages((prev) => {
            const copy = [...prev];
            copy.splice(editingImageIdx, 1, ...croppedUrls);
            return copy;
          });

          addNotification(
            `AI Smart Crop automatically isolated ${croppedUrls.length} panels!`,
            "success"
          );
          // Do not close the modal
          return;
        }

        // Fallback: Populate all panels into the slices list
        const newSlices = data.panels.map((box: any, index: number) => ({
          id: `ai-${index}-${Date.now()}`,
          cropTop: box.cropTop,
          cropBottom: box.cropBottom,
          cropLeft: box.cropLeft,
          cropRight: box.cropRight,
          autoTrim: editAutoTrim,
        }));

        setSlices((prev) => [...prev, ...newSlices]);

        // Select the first of the newly added slices
        const firstNew = newSlices[0];
        setSelectedSliceId(firstNew.id);
        setEditCropLeft(firstNew.cropLeft);
        setEditCropRight(firstNew.cropRight);
        setEditCropTop(firstNew.cropTop);
        setEditCropBottom(firstNew.cropBottom);
      }
    } catch (err: any) {
      console.error("AI crop detection failed:", err);
      addNotification(
        err.message || "AI crop detection failed. Please try again.",
        "error"
      );
    } finally {
      setIsAiDetecting(false);
    }
  };

  const handleCommitDetectedBoxes = () => {
    if (detectedBoxes.length === 0) {
      addNotification("No detected boxes to apply.", "warning");
      return;
    }
    const initialSlices = detectedBoxes.map((box: any, index: number) => ({
      id: `detected-${index}-${Date.now()}`,
      cropTop: box.cropTop,
      cropBottom: box.cropBottom,
      cropLeft: box.cropLeft,
      cropRight: box.cropRight,
      autoTrim: editAutoTrim,
    }));
    setSlices(initialSlices);

    if (initialSlices.length > 0) {
      const first = initialSlices[0];
      setSelectedSliceId(first.id);
      setEditCropLeft(first.cropLeft);
      setEditCropRight(first.cropRight);
      setEditCropTop(first.cropTop);
      setEditCropBottom(first.cropBottom);
    }
    
    addNotification(`Applied ${detectedBoxes.length} cuts to Target list!`, "success");
  };

  const handleClearDetectedBoxes = () => {
    setDetectedBoxes([]);
    addNotification("Preview cleared", "info");
  };

  const handleDetectPanels = async (settings?: { 
    sensitivity?: number; 
    backgroundMode?: string; 
    aspectRatio?: string; 
    strategy?: string;
    model?: string;
    minAreaPct?: number; 
    mergeThreshold?: number;
    cannyLow?: number;
    cannyHigh?: number;
    closeKernelSize?: number;
    minHeightPx?: number;
    dryRun?: boolean;
  }) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsDetecting(true);
    try {
      const response = await activeFetch("/api/detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: currentUrl,
          sensitivity: settings?.sensitivity ?? 30,
          backgroundColorMode: settings?.backgroundMode ?? "auto",
          aspectRatio: settings?.aspectRatio ?? "free",
          minAreaPct: settings?.minAreaPct ?? 0.15,
          mergeThreshold: settings?.mergeThreshold ?? 20,
          strategy: settings?.strategy ?? "local-cv",
          model: settings?.model ?? "gemini-2.5-flash",
          cannyLow: settings?.cannyLow ?? 20,
          cannyHigh: settings?.cannyHigh ?? 100,
          closeKernelSize: settings?.closeKernelSize ?? 15,
          minHeightPx: settings?.minHeightPx ?? 60
        }),
      });
      if (!response.ok) throw new Error("Failed to detect panels");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels)) {
        setDetectedBoxes(data.panels);
        
        if (settings?.dryRun) {
          addNotification(
            `Dry Run: Detected ${data.panels.length} panel outlines!`,
            "success"
          );
        } else if (data.panels.length > 0) {
          addNotification(
            `Successfully sliced ${data.panels.length} panel cuts!`,
            "success"
          );
          const initialSlices = data.panels.map((box: any, index: number) => ({
            id: `detected-${index}-${Date.now()}`,
            cropTop: box.cropTop,
            cropBottom: box.cropBottom,
            cropLeft: box.cropLeft,
            cropRight: box.cropRight,
            autoTrim: editAutoTrim,
          }));
          setSlices(initialSlices);

          // Default select the first panel
          const first = initialSlices[0];
          setSelectedSliceId(first.id);
          setEditCropLeft(first.cropLeft);
          setEditCropRight(first.cropRight);
          setEditCropTop(first.cropTop);
          setEditCropBottom(first.cropBottom);
        } else {
          addNotification("No panels detected.", "warning");
        }
      }
    } catch (err: any) {
      console.error("Detect panels failed, trying AI fallback:", err);
      addNotification(
        "Panel detection failed, trying AI-based detection...",
        "info"
      );
      await handleAiCrop();
    } finally {
      setIsDetecting(false);
    }
  };

  const isPointInsideSelection = (x: number, y: number) => {
    if (
      editCropTop === 0 &&
      editCropBottom === 0 &&
      editCropLeft === 0 &&
      editCropRight === 0
    ) {
      return false;
    }
    const top = editCropTop;
    const bottom = 100 - editCropBottom;
    const left = editCropLeft;
    const right = 100 - editCropRight;
    return x >= left && x <= right && y >= top && y <= bottom;
  };

  const onResizeStart = (handle: string, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    pushHistory();
    setDragType(`resize-${handle}` as any);
    setDragStartPercent({ x, y });
    setOriginalCropBounds({
      top: editCropTop,
      bottom: editCropBottom,
      left: editCropLeft,
      right: editCropRight,
    });
  };

  const handleSelectAndDragSlice = (slice: Slice, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    // Select and start moving this slice
    handleSelectSlice(slice);
    pushHistory();
    setDragType("move");
    setDragStartPercent({ x, y });
    setOriginalCropBounds({
      top: slice.cropTop,
      bottom: slice.cropBottom,
      left: slice.cropLeft,
      right: slice.cropRight,
    });
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((clientY - rect.top) / rect.height) * 100)
    );

    if (showSplitPosition) {
      // Check if clicking near an existing split line for dragging
      const nearLineIdx = splitLines.findIndex(lineY => Math.abs(lineY - y) < 2.5);
      if (nearLineIdx !== -1) {
        pushHistory();
        setDragType("drag-split-line" as any);
        setDraggingSplitLineIdx(nearLineIdx);
        return;
      }
      pushHistory();
      setDragType("split");
      setSplitPosition(parseFloat(Math.max(5, Math.min(95, y)).toFixed(1)));
      return;
    }

    if (isPointInsideSelection(x, y)) {
      pushHistory();
      setDragType("move");
      setDragStartPercent({ x, y });
      setOriginalCropBounds({
        top: editCropTop,
        bottom: editCropBottom,
        left: editCropLeft,
        right: editCropRight,
      });
    } else {
      pushHistory();
      setDragType("draw");
      setDragStart({ x, y });
      setSelectedSliceId(null); // Clear selected slice to create a new selection box
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
    const y = Math.max(
      0,
      Math.min(100, ((clientY - rect.top) / rect.height) * 100)
    );

    if (dragType === "drag-split-line" && draggingSplitLineIdx !== null) {
      let targetY = y;
      if (magneticSnap && detectedGutters.length > 0) {
        let nearest = y;
        let minDiff = 2.0;
        for (const g of detectedGutters) {
          const diff = Math.abs(g - y);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = g;
          }
        }
        targetY = nearest;
      }
      const newY = parseFloat(Math.max(5, Math.min(95, targetY)).toFixed(1));
      setSplitLines(prev => {
        const updated = [...prev];
        updated[draggingSplitLineIdx] = newY;
        return [...updated].sort((a, b) => a - b);
      });
      return;
    }

    if (showSplitPosition && dragType === "split") {
      let targetY = y;
      if (magneticSnap && detectedGutters.length > 0) {
        let nearest = y;
        let minDiff = 2.0;
        for (const g of detectedGutters) {
          const diff = Math.abs(g - y);
          if (diff < minDiff) {
            minDiff = diff;
            nearest = g;
          }
        }
        targetY = nearest;
      }
      setSplitPosition(parseFloat(Math.max(5, Math.min(95, targetY)).toFixed(1)));
      return;
    }

    if (dragType === "draw" && dragStart) {
      const left = Math.min(dragStart.x, x);
      const right = 100 - Math.max(dragStart.x, x);
      const top = Math.min(dragStart.y, y);
      const bottom = 100 - Math.max(dragStart.y, y);

      setEditCropLeft(
        parseFloat(Math.max(0, Math.min(85, left)).toFixed(1))
      );
      setEditCropRight(
        parseFloat(Math.max(0, Math.min(85, right)).toFixed(1))
      );
      setEditCropTop(
        parseFloat(Math.max(0, Math.min(85, top)).toFixed(1))
      );
      setEditCropBottom(
        parseFloat(Math.max(0, Math.min(85, bottom)).toFixed(1))
      );
    } else if (dragType === "move" && dragStartPercent && originalCropBounds) {
      const deltaX = x - dragStartPercent.x;
      const deltaY = y - dragStartPercent.y;

      let newLeft = originalCropBounds.left + deltaX;
      let newRight = originalCropBounds.right - deltaX;
      let newTop = originalCropBounds.top + deltaY;
      let newBottom = originalCropBounds.bottom - deltaY;

      const width = 100 - originalCropBounds.left - originalCropBounds.right;
      const height = 100 - originalCropBounds.top - originalCropBounds.bottom;

      if (newLeft < 0) {
        newLeft = 0;
        newRight = 100 - width;
      } else if (newRight < 0) {
        newRight = 0;
        newLeft = 100 - width;
      }

      if (newTop < 0) {
        newTop = 0;
        newBottom = 100 - height;
      } else if (newBottom < 0) {
        newBottom = 0;
        newTop = 100 - height;
      }

      setEditCropLeft(
        parseFloat(Math.max(0, Math.min(100, newLeft)).toFixed(1))
      );
      setEditCropRight(
        parseFloat(Math.max(0, Math.min(100, newRight)).toFixed(1))
      );
      setEditCropTop(
        parseFloat(Math.max(0, Math.min(100, newTop)).toFixed(1))
      );
      setEditCropBottom(
        parseFloat(Math.max(0, Math.min(100, newBottom)).toFixed(1))
      );
    } else if (dragType && dragType.startsWith("resize-") && dragStartPercent && originalCropBounds) {
      const handle = dragType.replace("resize-", "");
      // For resizing, we adjust only the relevant edge(s)
      let newTop = originalCropBounds.top;
      let newBottom = originalCropBounds.bottom;
      let newLeft = originalCropBounds.left;
      let newRight = originalCropBounds.right;

      if (handle.includes("n")) {
        newTop = parseFloat(Math.max(0, Math.min(y, 100 - originalCropBounds.bottom - 1.5)).toFixed(1));
      }
      if (handle.includes("s")) {
        newBottom = parseFloat(Math.max(0, Math.min(100 - y, 100 - originalCropBounds.top - 1.5)).toFixed(1));
      }
      if (handle.includes("w")) {
        newLeft = parseFloat(Math.max(0, Math.min(x, 100 - originalCropBounds.right - 1.5)).toFixed(1));
      }
      if (handle.includes("e")) {
        newRight = parseFloat(Math.max(0, Math.min(100 - x, 100 - originalCropBounds.left - 1.5)).toFixed(1));
      }

      setEditCropTop(newTop);
      setEditCropBottom(newBottom);
      setEditCropLeft(newLeft);
      setEditCropRight(newRight);
    }
  };

  const handleEnd = () => {
    if (dragType === "split") {
      if (!splitLines.includes(splitPosition)) {
        setSplitLines((prev) =>
          [...prev, splitPosition].sort((a, b) => a - b)
        );
        addNotification(`Added split line at Y: ${splitPosition}%`, "success");
      }
    }
    if (dragType === "drag-split-line") {
      addNotification("Split line repositioned!", "success");
    }
    if (dragType === "draw" && autoPushOnDraw) {
      const width = 100 - editCropLeft - editCropRight;
      const height = 100 - editCropTop - editCropBottom;
      if (width > 1.5 && height > 1.5) {
        const newSlice: Slice = {
          id: `slice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          cropTop: editCropTop,
          cropBottom: editCropBottom,
          cropLeft: editCropLeft,
          cropRight: editCropRight,
          autoTrim: editAutoTrim,
        };
        setSlices((prev) => [...prev, newSlice]);

        // Reset active coordinates
        setEditCropTop(0);
        setEditCropBottom(0);
        setEditCropLeft(0);
        setEditCropRight(0);
        setSelectedSliceId(null);
        addNotification("Cut added!", "success");
      }
    }
    setDragStart(null);
    setDragType(null);
    setDragStartPercent(null);
    setOriginalCropBounds(null);
    setDraggingSplitLineIdx(null);
  };

  const handlePushToSlices = () => {
    pushHistory();
    const newSlice: Slice = {
      id: `slice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cropTop: editCropTop,
      cropBottom: editCropBottom,
      cropLeft: editCropLeft,
      cropRight: editCropRight,
      autoTrim: editAutoTrim,
    };
    setSlices((prev) => [...prev, newSlice]);
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
  };

  const handleApplyEqualSplits = (numCuts: number) => {
    const newSlices: Slice[] = [];
    const heightPerCut = 100 / numCuts;
    for (let i = 0; i < numCuts; i++) {
      const top = i * heightPerCut;
      const bottom = 100 - (i + 1) * heightPerCut;
      newSlices.push({
        id: `preset-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        cropTop: parseFloat(top.toFixed(1)),
        cropBottom: parseFloat(bottom.toFixed(1)),
        cropLeft: 0,
        cropRight: 0,
        autoTrim: editAutoTrim,
      });
    }
    setSlices(newSlices);
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    addNotification(`Applied equal ${numCuts}-segment split!`, "success");
  };

  const handleClearAllSlices = () => {
    pushHistory();
    setSlices([]);
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    addNotification("Cleared all defined cuts.", "info");
  };

  const handleNudge = (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => {
    pushHistory();
    if (direction === "top") {
      setEditCropTop(
        Math.max(0, Math.min(100, parseFloat((editCropTop + amount).toFixed(1))))
      );
    } else if (direction === "bottom") {
      setEditCropBottom(
        Math.max(
          0,
          Math.min(100, parseFloat((editCropBottom + amount).toFixed(1)))
        )
      );
    } else if (direction === "left") {
      setEditCropLeft(
        Math.max(
          0,
          Math.min(100, parseFloat((editCropLeft + amount).toFixed(1)))
        )
      );
    } else if (direction === "right") {
      setEditCropRight(
        Math.max(
          0,
          Math.min(100, parseFloat((editCropRight + amount).toFixed(1)))
        )
      );
    }
  };

  const handleSelectSlice = (slice: Slice) => {
    setSelectedSliceId(slice.id);
    setEditCropTop(slice.cropTop);
    setEditCropBottom(slice.cropBottom);
    setEditCropLeft(slice.cropLeft);
    setEditCropRight(slice.cropRight);
  };

  const handleDeleteSlice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory();
    setSlices((prev) => prev.filter((s) => s.id !== id));
    if (selectedSliceId === id) {
      setSelectedSliceId(null);
    }
  };

  const handleCropSingleSlice = async (slice: Slice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingImageIdx === null || !setScrapedImages) return;
    const originalUrl = scrapedImages[editingImageIdx];

    setIsCroppingSlice(slice.id);
    try {
      const response = await activeFetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: originalUrl,
          cropTop: slice.cropTop,
          cropBottom: slice.cropBottom,
          cropLeft: slice.cropLeft,
          cropRight: slice.cropRight,
          autoTrim: slice.autoTrim,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (setScrapedImages) {
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy.splice(editingImageIdx + 1 + slicesCroppedCount, 0, data.url);
          return copy;
        });
      }

      setSlicesCroppedCount((prev) => prev + 1);

      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Image Editor] Extracted cut from Frame #${editingImageIdx + 1}`,
          ...prev,
        ]);
      }

      handleDeleteSlice(slice.id, e);
      addNotification("Extracted Cut!", "success");
    } catch (err: any) {
      addNotification(`Failed to crop: ${err.message}`, "error");
    } finally {
      setIsCroppingSlice(null);
    }
  };

  const handleAddSplitLine = () => {
    if (splitLines.includes(splitPosition)) return;
    setSplitLines((prev) => [...prev, splitPosition].sort((a, b) => a - b));
    addNotification(`Added split line at Y: ${splitPosition}%`, "success");
  };

  const handleRemoveSplitLine = (yVal: number) => {
    setSplitLines((prev) => prev.filter((y) => y !== yVal));
  };

  const handleExecuteHorizontalSplit = async () => {
    if (splitLines.length === 0) {
      const cuts = [
        {
          cropTop: 0,
          cropBottom: 100 - splitPosition,
          cropLeft: 0,
          cropRight: 0,
          autoTrim: false,
        },
        {
          cropTop: splitPosition,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
          autoTrim: false,
        },
      ];
      await handleSaveMultipleCuts(cuts);
      return;
    }

    const sorted = [...splitLines].sort((a, b) => a - b);
    const cuts = [];

    cuts.push({
      cropTop: 0,
      cropBottom: 100 - sorted[0],
      cropLeft: 0,
      cropRight: 0,
      autoTrim: false,
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      cuts.push({
        cropTop: sorted[i],
        cropBottom: 100 - sorted[i + 1],
        cropLeft: 0,
        cropRight: 0,
        autoTrim: false,
      });
    }

    cuts.push({
      cropTop: sorted[sorted.length - 1],
      cropBottom: 0,
      cropLeft: 0,
      cropRight: 0,
      autoTrim: false,
    });

    await handleSaveMultipleCuts(cuts);
  };

  const handleExecuteSave = () => {
    if (slices.length > 0) {
      const sortedSlices = [...slices].sort((a, b) => a.cropTop - b.cropTop);
      const cuts = sortedSlices.map((s) => ({
        cropTop: s.cropTop,
        cropBottom: s.cropBottom,
        cropLeft: s.cropLeft,
        cropRight: s.cropRight,
        autoTrim: s.autoTrim,
      }));
      handleSaveMultipleCuts(cuts);
    } else {
      handleSaveEditedImage();
    }
  };

  useEffect(() => {
    if (editingImageIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "Escape") {
        setEditingImageIdx(null);
      } else if (e.key === "Enter") {
        handleExecuteSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "ArrowLeft" || e.key === "[") {
        handlePrevImage();
      } else if (e.key === "ArrowRight" || e.key === "]") {
        handleNextImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingImageIdx, slices, editCropTop, editCropBottom, editCropLeft, editCropRight, handleUndo]);

  // Global mouse listeners while dragging — keeps the drag alive even when
  // the mouse moves outside the image element boundaries.
  useEffect(() => {
    if (!dragType) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = () => handleEnd();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragType, handleMove, handleEnd]);

  if (editingImageIdx === null) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 animate-[fadeIn_0.2s_ease-out]">
      <div
        className="relative bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full max-w-7xl h-[90vh] my-auto"
        style={{ boxShadow: "0 0 60px rgba(139,92,246,0.12), 0 30px 60px rgba(0,0,0,0.7)" }}
      >
        {/* Subtle top-edge glow line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-neutral-950 via-neutral-950/95 to-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/15 border border-purple-500/20">
              <Scissors className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">
                Advanced Drop & Drag Crop Tools Generator
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Cutting and Trimming Frame #{editingImageIdx + 1} with custom
                coordinates drag-and-drop
              </p>
            </div>
          </div>
          
          {/* Panel Navigation Group */}
          <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 rounded-2xl p-1 select-none">
            <button
              onClick={handlePrevImage}
              disabled={editingImageIdx === 0}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
              title="Previous Panel (ArrowLeft or [)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Prev</span>
            </button>
            
            <div className="px-2.5 py-1 text-[10px] font-mono text-purple-300 font-bold bg-black/40 rounded-lg border border-white/5">
              Panel {editingImageIdx + 1} of {scrapedImages.length}
            </div>

            <button
              onClick={handleNextImage}
              disabled={editingImageIdx === scrapedImages.length - 1}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold font-mono"
              title="Next Panel (ArrowRight or ])"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Undo Button in header */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              title="Undo last action (Ctrl+Z)"
              className="relative flex items-center gap-1.5 text-neutral-400 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed px-2.5 py-1.5 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 transition-all cursor-pointer"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold font-mono hidden sm:block">Undo</span>
              {history.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                  {history.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentImage}
              title="Delete Panel from deck"
              className="flex items-center gap-1.5 text-neutral-400 hover:text-red-400 px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500/70 hover:text-red-400" />
              <span className="text-[10px] font-semibold font-mono hidden sm:block">Delete</span>
            </button>
            <div className="w-px h-5 bg-white/10" />
            <button
              onClick={() => setEditingImageIdx(null)}
              className="text-neutral-400 hover:text-white p-1.5 rounded-xl hover:bg-neutral-800/80 border border-transparent hover:border-neutral-700/60 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Pane */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 overflow-hidden select-none items-stretch">
          {/* Left side: Visual Preview Area (Canvas) */}
          <div className="lg:col-span-7 flex flex-col space-y-2 h-full overflow-hidden">
            <div className="flex justify-between items-center bg-white/[0.02] backdrop-blur-sm p-2.5 rounded-xl border border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-purple-500/10">
                  <Move className="h-3 w-3 text-purple-400" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-widest">
                  Interactive Viewport Canvas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleAiCrop}
                  disabled={isAiDetecting}
                  className="flex items-center gap-1.5 bg-purple-900/30 text-purple-300 hover:bg-purple-800/50 hover:text-purple-200 px-2.5 py-1 rounded-lg border border-purple-700/30 text-[9px] font-mono font-bold cursor-pointer transition-all"
                >
                  {isAiDetecting ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Layers className="h-3 w-3" />
                  )}
                  <span>AI Smart Crop</span>
                </button>
                <span className="text-[9px] bg-purple-950/80 text-purple-400 font-mono font-bold px-2 py-1 rounded-lg border border-purple-800/30">
                  Draw
                </span>
                <span className="text-[9px] bg-emerald-950/80 text-emerald-400 font-mono font-bold px-2 py-1 rounded-lg border border-emerald-800/30">
                  Move
                </span>
              </div>
            </div>

            <CropCanvas
              imgUrl={scrapedImages[editingImageIdx]}
              containerRef={containerRef}
              editCropTop={editCropTop}
              editCropBottom={editCropBottom}
              editCropLeft={editCropLeft}
              editCropRight={editCropRight}
              slices={slices}
              selectedSliceId={selectedSliceId}
              showSplitPosition={showSplitPosition}
              splitPosition={splitPosition}
              splitLines={splitLines}
              handleStart={handleStart}
              handleMove={handleMove}
              handleEnd={handleEnd}
              isPointInsideSelection={isPointInsideSelection}
              handleSelectSlice={handleSelectSlice}
              handleDeleteSlice={handleDeleteSlice}
              handleRemoveSplitLine={handleRemoveSplitLine}
              dragType={dragType as any}
              onResizeStart={onResizeStart}
              handleSelectAndDragSlice={handleSelectAndDragSlice}
              zoom={zoom}
              editMode={editMode}
              detectedBubbles={detectedBubbles}
              selectedBubbleIdx={selectedBubbleIdx}
              setSelectedBubbleIdx={setSelectedBubbleIdx}
              brushSize={brushSize}
              brushAction={brushAction}
              canvasMaskRef={canvasMaskRef}
            />

            <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
              Draw to create panels · Drag to move · Drag corners/edges to resize · Drag split lines to reposition
            </span>
          </div>

          {/* Right side: Tabbed controls sidebar */}
          <div className="lg:col-span-5 flex flex-col space-y-3 h-full overflow-y-auto pr-1.5 scrollbar-thin">
            {/* Sidebar Navigation Tabs */}
            <div className="flex gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/5">
              {([
                { key: "adjust", label: "Adjust", emoji: "✨" },
                { key: "tools", label: "Tools", emoji: "🔧" },
                { key: "slice", label: "Cut", emoji: "✂️" },
                { key: "cuts", label: `Cuts (${slices.length})`, emoji: "🎯" },
                { key: "merge", label: "Merge", emoji: "🔗" },
              ] as { key: "adjust" | "tools" | "slice" | "cuts" | "merge"; label: string; emoji: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 rounded-xl font-bold text-[10px] font-mono transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-900/50"
                      : "text-neutral-500 hover:text-neutral-300 hover:bg-white/5"
                  }`}
                >
                  <span className="hidden sm:block">{tab.emoji}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="space-y-4">
              {activeTab === "merge" && editingImageIdx !== null && (
                <div className="animate-fadeIn">
                  <MergePanel
                    editingImageIdx={editingImageIdx}
                    scrapedImages={scrapedImages}
                    isMerging={isMerging}
                    onMerge={handleMergeWithNext}
                  />
                </div>
              )}

              {activeTab === "tools" && (
                <div className="animate-fadeIn">
                  <CropToolsPanel
                    editCropTop={editCropTop}
                    editCropBottom={editCropBottom}
                    editCropLeft={editCropLeft}
                    editCropRight={editCropRight}
                    setEditCropTop={(v) => { pushHistory(); setEditCropTop(v); }}
                    setEditCropBottom={(v) => { pushHistory(); setEditCropBottom(v); }}
                    setEditCropLeft={(v) => { pushHistory(); setEditCropLeft(v); }}
                    setEditCropRight={(v) => { pushHistory(); setEditCropRight(v); }}
                    zoom={zoom}
                    setZoom={setZoom}
                    isTransforming={isTransforming}
                    onRotate={(deg) => handleTransform("rotate", String(deg))}
                    onFlip={(axis) => handleTransform("flip", axis)}
                    onReset={handleResetCropBounds}
                  />
                </div>
              )}

              {activeTab === "adjust" && (
                <div className="space-y-4 animate-fadeIn">
                  <EnhancementsPanel
                    activeStoryboardPanel={activeStoryboardPanel}
                    handleModifyBrightness={handleModifyBrightness}
                    handleModifyContrast={handleModifyContrast}
                    handleModifySaturation={handleModifySaturation}
                    handleModifyFilterPreset={handleModifyFilterPreset}
                    handleModifyGrayscale={handleModifyGrayscale}
                    handleModifyDuration={handleModifyDuration}
                    handleModifyMotionType={handleModifyMotionType}
                    handleModifySpeechText={handleModifySpeechText}
                    handleModifySfx={handleModifySfx}
                    handleModifyCropPadding={handleModifyCropPadding}
                  />
                  <CleanBubblesPanel
                    imgUrl={scrapedImages[editingImageIdx]}
                    editingImageIdx={editingImageIdx}
                    setScrapedImages={setScrapedImages}
                    setPanels={setPanels}
                    addNotification={addNotification}
                    fetchWithInterceptor={fetchWithInterceptor}
                    setConsoleLogs={setConsoleLogs}
                    editMode={editMode}
                    setEditMode={setEditMode}
                    brushSize={brushSize}
                    setBrushSize={setBrushSize}
                    brushAction={brushAction}
                    setBrushAction={setBrushAction}
                    handleClearBrushMask={handleClearBrushMask}
                  />
                </div>
              )}

              {activeTab === "slice" && (
                <div className="space-y-4 animate-fadeIn">
                  <HorizontalSplitter
                    splitPosition={splitPosition}
                    setSplitPosition={setSplitPosition}
                    splitLines={splitLines}
                    setSplitLines={setSplitLines}
                    showSplitPosition={showSplitPosition}
                    setShowSplitPosition={setShowSplitPosition}
                    setEditCropTop={setEditCropTop}
                    setEditCropBottom={setEditCropBottom}
                    setEditCropLeft={setEditCropLeft}
                    setEditCropRight={setEditCropRight}
                    setSelectedSliceId={setSelectedSliceId}
                    handleAddSplitLine={handleAddSplitLine}
                    handleRemoveSplitLine={handleRemoveSplitLine}
                    handleExecuteHorizontalSplit={handleExecuteHorizontalSplit}
                    isSavingEdit={isSavingEdit}
                    imageUrl={imageUrl}
                    magneticSnap={magneticSnap}
                    setMagneticSnap={setMagneticSnap}
                    detectedGutters={detectedGutters}
                    setDetectedGutters={setDetectedGutters}
                  />
                </div>
              )}

              {activeTab === "cuts" && (
                <div className="space-y-4 animate-fadeIn">
                  <CutsRegistry
                    slices={slices}
                    setSlices={setSlices}
                    selectedSliceId={selectedSliceId}
                    setSelectedSliceId={setSelectedSliceId}
                    editCropTop={editCropTop}
                    setEditCropTop={setEditCropTop}
                    editCropBottom={editCropBottom}
                    setEditCropBottom={setEditCropBottom}
                    editCropLeft={editCropLeft}
                    setEditCropLeft={setEditCropLeft}
                    editCropRight={editCropRight}
                    setEditCropRight={setEditCropRight}
                    editAutoTrim={editAutoTrim}
                    handlePushToSlices={handlePushToSlices}
                    autoPushOnDraw={autoPushOnDraw}
                    setAutoPushOnDraw={setAutoPushOnDraw}
                    handleClearAllSlices={handleClearAllSlices}
                    handleNudge={handleNudge}
                    handleSelectSlice={handleSelectSlice}
                    handleDeleteSlice={handleDeleteSlice}
                    handleCropSingleSlice={handleCropSingleSlice}
                    isCroppingSlice={isCroppingSlice}
                    isSavingEdit={isSavingEdit}
                  />
                  <AutoSlicer
                    handleDetectPanels={handleDetectPanels}
                    isDetecting={isDetecting}
                    onCommitCuts={handleCommitDetectedBoxes}
                    hasDetectedBoxes={detectedBoxes && detectedBoxes.length > 0}
                    clearDetectedBoxes={handleClearDetectedBoxes}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-4 bg-gradient-to-r from-neutral-950/95 via-neutral-950 to-purple-950/10 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 hidden sm:flex">
            <span className="text-[10px] text-neutral-500 font-mono italic max-w-[50%]">
              {slices.length > 0
                ? `Multi-cut: ${slices.length} new scenes will be created on your deck`
                : "Single-frame crop mode — drag canvas to set bounds"}
            </span>
            {history.length > 0 && (
              <span className="text-[9px] text-purple-500/80 font-mono">
                {history.length} undo step{history.length !== 1 ? "s" : ""} available · Ctrl+Z
              </span>
            )}
            <span className="text-[9px] text-neutral-600 font-mono mt-0.5">
              Hotkeys: [ Prev · ] Next · Esc Close · Enter Save · Ctrl+Z Undo
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Undo Button in footer */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0 || isSavingEdit}
              title="Undo last action (Ctrl+Z)"
              className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-600/50 disabled:opacity-25 disabled:cursor-not-allowed px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all"
            >
              <Undo2 className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Undo</span>
              {history.length > 0 && (
                <span className="bg-purple-900/60 text-purple-300 text-[9px] font-bold px-1.5 rounded">
                  {history.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEditingImageIdx(null)}
              disabled={isSavingEdit}
              className="bg-neutral-900/80 border border-white/5 text-neutral-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentImage}
              disabled={isSavingEdit}
              className="bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 hover:border-red-900/50 text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
              <span>Delete Panel</span>
            </button>
            {activeTab === "tools" && (
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingEdit || isTransforming}
                className="relative bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-cyan-900/40 active:scale-95"
              >
                {isSavingEdit || isTransforming ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <Crop className="h-3.5 w-3.5" />
                    <span>Apply Crop</span>
                  </>
                )}
              </button>
            )}
            {activeTab === "adjust" && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    addNotification("Style adjustments applied successfully!", "success");
                  }}
                  className="bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/25 text-indigo-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Apply Styles</span>
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSave}
                  disabled={isSavingEdit}
                  className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
                  style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Processing Crop...</span>
                    </>
                  ) : (
                    <>
                      <Crop className="h-3.5 w-3.5" />
                      <span>Crop Image</span>
                    </>
                  )}
                </button>
              </>
            )}

            {activeTab === "slice" && (
              <button
                type="button"
                onClick={handleExecuteHorizontalSplit}
                disabled={isSavingEdit}
                className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
                style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Split...</span>
                  </>
                ) : (
                  <>
                    <Scissors className="h-3.5 w-3.5 text-purple-200" />
                    <span>Apply Split</span>
                  </>
                )}
              </button>
            )}

            {activeTab === "cuts" && (
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingEdit}
                className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
                style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Crops...</span>
                  </>
                ) : (
                  <>
                    <Layers className="h-4 w-4 text-purple-200" />
                    <span>Execute {slices.length} Crops</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
