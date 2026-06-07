import { useState, useRef, useEffect, useCallback } from "react";
import { Slice, Slot } from "../components/crop/types";
import { NotificationType } from "../components/NotificationStack";

interface UseCropEditorProps {
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
  handleSaveEditedImage: () => Promise<void>;
  handleSaveMultipleCuts: (cuts: Slot[]) => Promise<void>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchWithInterceptor?: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  imageEditStates?: Record<string, any>;
  setImageEditStates?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

export function useCropEditor({
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
}: UseCropEditorProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragType, setDragType] = useState<"draw" | "move" | "split" | "drag-split-line" | `resize-${'nw'|'ne'|'sw'|'se'|'n'|'s'|'w'|'e'}` | null>(null);
  const [dragStartPercent, setDragStartPercent] = useState<{ x: number; y: number } | null>(null);
  const [originalCropBounds, setOriginalCropBounds] = useState<{ top: number; bottom: number; left: number; right: number } | null>(null);
  const [draggingSplitLineIdx, setDraggingSplitLineIdx] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<"crop" | "clean_auto" | "clean_manual" | "typeset" | "slices">("crop");
  const [detectedBubbles, setDetectedBubbles] = useState<Array<{ box: [number, number, number, number]; text: string; category?: string }>>([]);
  const [selectedBubbleIdx, setSelectedBubbleIdx] = useState<number | null>(null);
  const [brushSize, setBrushSize] = useState(20);
  const [brushAction, setBrushAction] = useState<"paint" | "erase">("paint");
  const canvasMaskRef = useRef<HTMLCanvasElement>(null);

  // Lifted Clean Bubbles Parameters States
  const [detectionStyle, setDetectionStyle] = useState<"all" | "white_only" | "text_only">("all");
  const [eraseMethod, setEraseMethod] = useState<"auto" | "inpaint" | "inpaint_ns" | "blur" | "solid_white" | "solid_black" | "solid_color" | "transparent" | "ocr">("auto");
  const [sensitivity, setSensitivity] = useState<number>(50);
  const [dilation, setDilation] = useState<number>(-1);
  const [inpaintRadius, setInpaintRadius] = useState<number>(3);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [ocrLang, setOcrLang] = useState<string>("en");
  const [gpu, setGpu] = useState<boolean>(false);
  const [morphKernelSize, setMorphKernelSize] = useState<number>(15);
  const [morphShape, setMorphShape] = useState<string>("ellipse");
  const [useCustomColorTarget, setUseCustomColorTarget] = useState<boolean>(false);
  const [customColorTarget, setCustomColorTarget] = useState<string>("#ffffcc");
  const [customColorTolerance, setCustomColorTolerance] = useState<number>(25);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

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
  const savedActiveTab = savedState?.activeTab;
  const [activeTab, setActiveTab] = useState<"adjust" | "edit" | "eraser" | "slice" | "cuts" | "merge">(
    savedActiveTab === "adjust" ||
    savedActiveTab === "slice" ||
    savedActiveTab === "cuts" ||
    savedActiveTab === "edit" ||
    savedActiveTab === "merge" ||
    savedActiveTab === "eraser"
      ? savedActiveTab
      : savedActiveTab === "tools"
      ? "edit"
      : "adjust"
  );

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

  // --- Undo/Redo History ---
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
  const [redoHistory, setRedoHistory] = useState<HistorySnapshot[]>([]);

  const pushHistory = useCallback(() => {
    setHistory((prev) => [
      ...prev.slice(-30),
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
    setRedoHistory([]);
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, slices, splitLines, selectedSliceId]);

  const handleUndo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const snap = prev[prev.length - 1];

      setRedoHistory((prevRedo) => [
        ...prevRedo,
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

      setEditCropTop(snap.cropTop);
      setEditCropBottom(snap.cropBottom);
      setEditCropLeft(snap.cropLeft);
      setEditCropRight(snap.cropRight);
      setSlices(snap.slices);
      setSplitLines(snap.splitLines);
      setSelectedSliceId(snap.selectedSliceId);
      return prev.slice(0, -1);
    });
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, slices, splitLines, selectedSliceId, setEditCropTop, setEditCropBottom, setEditCropLeft, setEditCropRight]);

  const handleRedo = useCallback(() => {
    setRedoHistory((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const snap = prevRedo[prevRedo.length - 1];

      setHistory((prevUndo) => [
        ...prevUndo,
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

      setEditCropTop(snap.cropTop);
      setEditCropBottom(snap.cropBottom);
      setEditCropLeft(snap.cropLeft);
      setEditCropRight(snap.cropRight);
      setSlices(snap.slices);
      setSplitLines(snap.splitLines);
      setSelectedSliceId(snap.selectedSliceId);
      return prevRedo.slice(0, -1);
    });
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, slices, splitLines, selectedSliceId, setEditCropTop, setEditCropBottom, setEditCropLeft, setEditCropRight]);

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

  const handleCleanSingleBubble = async (
    ymin: number,
    xmin: number,
    ymax: number,
    xmax: number,
    text: string
  ) => {
    if (editingImageIdx === null || !imageUrl) return;
    setIsCleaning(true);
    try {
      const response = await activeFetch("/api/remove-speech-bubble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
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
        if (setScrapedImages) {
          setScrapedImages((prev) => {
            const copy = [...prev];
            copy[editingImageIdx] = data.url;
            return copy;
          });
        }
        if (setPanels) {
          setPanels((prev) =>
            prev.map((p) =>
              p.image_url === imageUrl ? { ...p, image_url: data.url } : p
            )
          );
        }
        addNotification("Cleaned single bubble successfully", "success");
      }
    } catch (err: any) {
      console.error(err);
      addNotification(err.message || "Failed to clean bubble", "error");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeleteCurrentImage = () => {
    if (editingImageIdx === null || !setScrapedImages) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Panel #${editingImageIdx + 1} from your deck?`
    );
    if (!confirmDelete) return;

    const imgUrl = scrapedImages[editingImageIdx];
    setScrapedImages((prev) => prev.filter((_, i) => i !== editingImageIdx));
    if (setConsoleLogs) {
      setConsoleLogs((prev) => [
        `[GUI] Deleted extracted frame #${editingImageIdx + 1} from deck via Editor.`,
        ...prev,
      ]);
    }
    addNotification(`Panel #${editingImageIdx + 1} deleted from deck`, "info");
    setEditingImageIdx(null);
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

          setScrapedImages((prev) => {
            const copy = [...prev];
            copy.splice(editingImageIdx, 1, ...croppedUrls);
            return copy;
          });

          addNotification(
            `AI Smart Crop automatically isolated ${croppedUrls.length} panels!`,
            "success"
          );
          return;
        }

        const newSlices = data.panels.map((box: any, index: number) => ({
          id: `ai-${index}-${Date.now()}`,
          cropTop: box.cropTop,
          cropBottom: box.cropBottom,
          cropLeft: box.cropLeft,
          cropRight: box.cropRight,
          autoTrim: editAutoTrim,
        }));

        setSlices((prev) => [...prev, ...newSlices]);

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
    if (editCropTop === 0 && editCropBottom === 0 && editCropLeft === 0 && editCropRight === 0) {
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
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    if (showSplitPosition) {
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
      setSelectedSliceId(null);
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

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

      setEditCropLeft(parseFloat(Math.max(0, Math.min(85, left)).toFixed(1)));
      setEditCropRight(parseFloat(Math.max(0, Math.min(85, right)).toFixed(1)));
      setEditCropTop(parseFloat(Math.max(0, Math.min(85, top)).toFixed(1)));
      setEditCropBottom(parseFloat(Math.max(0, Math.min(85, bottom)).toFixed(1)));
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

      setEditCropLeft(parseFloat(Math.max(0, Math.min(100, newLeft)).toFixed(1)));
      setEditCropRight(parseFloat(Math.max(0, Math.min(100, newRight)).toFixed(1)));
      setEditCropTop(parseFloat(Math.max(0, Math.min(100, newTop)).toFixed(1)));
      setEditCropBottom(parseFloat(Math.max(0, Math.min(100, newBottom)).toFixed(1)));
    } else if (dragType && dragType.startsWith("resize-") && dragStartPercent && originalCropBounds) {
      const handle = dragType.replace("resize-", "");
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
        setSplitLines((prev) => [...prev, splitPosition].sort((a, b) => a - b));
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

  const handleNudge = (direction: "top" | "bottom" | "left" | "right", amount: number) => {
    pushHistory();
    if (direction === "top") {
      setEditCropTop(Math.max(0, Math.min(100, parseFloat((editCropTop + amount).toFixed(1)))));
    } else if (direction === "bottom") {
      setEditCropBottom(Math.max(0, Math.min(100, parseFloat((editCropBottom + amount).toFixed(1)))));
    } else if (direction === "left") {
      setEditCropLeft(Math.max(0, Math.min(100, parseFloat((editCropLeft + amount).toFixed(1)))));
    } else if (direction === "right") {
      setEditCropRight(Math.max(0, Math.min(100, parseFloat((editCropRight + amount).toFixed(1)))));
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
        { cropTop: 0, cropBottom: 100 - splitPosition, cropLeft: 0, cropRight: 0, autoTrim: false },
        { cropTop: splitPosition, cropBottom: 0, cropLeft: 0, cropRight: 0, autoTrim: false },
      ];
      await handleSaveMultipleCuts(cuts);
      return;
    }

    const sorted = [...splitLines].sort((a, b) => a - b);
    const cuts = [];

    cuts.push({ cropTop: 0, cropBottom: 100 - sorted[0], cropLeft: 0, cropRight: 0, autoTrim: false });

    for (let i = 0; i < sorted.length - 1; i++) {
      cuts.push({ cropTop: sorted[i], cropBottom: 100 - sorted[i + 1], cropLeft: 0, cropRight: 0, autoTrim: false });
    }

    cuts.push({ cropTop: sorted[sorted.length - 1], cropBottom: 0, cropLeft: 0, cropRight: 0, autoTrim: false });

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

  // Sync state back to parent cache
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

  // Sync selected slice coordinate updates
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

  // Toggle split line overlay visibility
  useEffect(() => {
    if (activeTab === "slice") {
      setShowSplitPosition(true);
    } else {
      setShowSplitPosition(false);
    }
  }, [activeTab]);

  return {
    containerRef,
    dragType,
    editMode,
    setEditMode,
    detectedBubbles,
    selectedBubbleIdx,
    setSelectedBubbleIdx,
    brushSize,
    setBrushSize,
    brushAction,
    setBrushAction,
    canvasMaskRef,
    detectionStyle,
    setDetectionStyle,
    eraseMethod,
    setEraseMethod,
    sensitivity,
    setSensitivity,
    dilation,
    setDilation,
    inpaintRadius,
    setInpaintRadius,
    debugMode,
    setDebugMode,
    fillColor,
    setFillColor,
    ocrLang,
    setOcrLang,
    gpu,
    setGpu,
    morphKernelSize,
    setMorphKernelSize,
    morphShape,
    setMorphShape,
    useCustomColorTarget,
    setUseCustomColorTarget,
    customColorTarget,
    setCustomColorTarget,
    customColorTolerance,
    setCustomColorTolerance,
    isCleaning,
    detectedBoxes,
    isDetecting,
    isAiDetecting,
    activeTab,
    setActiveTab,
    zoom,
    setZoom,
    isTransforming,
    isMerging,
    slices,
    setSlices,
    selectedSliceId,
    setSelectedSliceId,
    autoPushOnDraw,
    setAutoPushOnDraw,
    splitPosition,
    setSplitPosition,
    splitLines,
    setSplitLines,
    showSplitPosition,
    setShowSplitPosition,
    magneticSnap,
    setMagneticSnap,
    detectedGutters,
    setDetectedGutters,
    isCroppingSlice,
    slicesCroppedCount,
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
    handleCommitDetectedBoxes,
    handleClearDetectedBoxes,
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
    imageUrl,
  };
}
