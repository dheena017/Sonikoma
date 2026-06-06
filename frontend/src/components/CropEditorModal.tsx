import React, { useState, useRef, useEffect, useCallback } from "react";
import { Scissors, X, RefreshCw, Crop, Layers, Move, Undo2 } from "lucide-react";
import { Slice, Slot } from "./crop/types";
import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";

import EnhancementsPanel from "./crop/EnhancementsPanel";
import CleanBubblesPanel from "./crop/CleanBubblesPanel";
import HorizontalSplitter from "./crop/HorizontalSplitter";
import CutsRegistry from "./crop/CutsRegistry";
import AutoSlicer from "./crop/AutoSlicer";
import CropCanvas from "./crop/CropCanvas";

interface CropEditorModalProps {
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
  fetchWithInterceptor?: typeof fetch;
  setErrorPopup?: (err: ErrorPopupDetail | null) => void;
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
}: CropEditorModalProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragType, setDragType] = useState<"draw" | "move" | "split" | null>(
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
  >([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isAiDetecting, setIsAiDetecting] = useState<boolean>(false);

  // Sidebar Tab Configuration
  const [activeTab, setActiveTab] = useState<"adjust" | "slice" | "cuts">("adjust");

  // Multiple Cut List
  const [slices, setSlices] = useState<Slice[]>([]);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(null);
  const [autoPushOnDraw, setAutoPushOnDraw] = useState<boolean>(false);

  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [splitLines, setSplitLines] = useState<number[]>([]);
  const [showSplitPosition, setShowSplitPosition] = useState<boolean>(false);

  const [isCroppingSlice, setIsCroppingSlice] = useState<string | null>(null);
  const [slicesCroppedCount, setSlicesCroppedCount] = useState(0);

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
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

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

  // Clear states when transitioning editing frames
  useEffect(() => {
    setDetectedBoxes([]);
    setSlices([]);
    setSelectedSliceId(null);
    setSlicesCroppedCount(0);
    setSplitPosition(50);
    setSplitLines([]);
    setShowSplitPosition(false);
    setHistory([]);
  }, [editingImageIdx]);

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
          setEditingImageIdx(null); // Close the modal
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

  const handleDetectPanels = async () => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsDetecting(true);
    try {
      const response = await activeFetch("/api/detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });
      if (!response.ok) throw new Error("Failed to detect panels");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels)) {
        setDetectedBoxes(data.panels);
        if (data.panels.length > 0) {
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

    if (showSplitPosition && dragType === "split") {
      setSplitPosition(parseFloat(Math.max(5, Math.min(95, y)).toFixed(1)));
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

      const width = 105 - originalCropBounds.left - originalCropBounds.right;
      const height = 105 - originalCropBounds.top - originalCropBounds.bottom;

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
          autoTrim: editAutoTrim,
        },
        {
          cropTop: splitPosition,
          cropBottom: 0,
          cropLeft: 0,
          cropRight: 0,
          autoTrim: editAutoTrim,
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
      autoTrim: editAutoTrim,
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      cuts.push({
        cropTop: sorted[i],
        cropBottom: 100 - sorted[i + 1],
        cropLeft: 0,
        cropRight: 0,
        autoTrim: editAutoTrim,
      });
    }

    cuts.push({
      cropTop: sorted[sorted.length - 1],
      cropBottom: 0,
      cropLeft: 0,
      cropRight: 0,
      autoTrim: editAutoTrim,
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
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingImageIdx, slices, editCropTop, editCropBottom, editCropLeft, editCropRight, handleUndo]);

  if (editingImageIdx === null) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xl flex justify-center py-6 px-4 md:py-10 animate-[fadeIn_0.2s_ease-out]">
      <div
        className="relative bg-neutral-950 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col w-full max-w-7xl h-fit my-auto"
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
                Advanced Drop & Drag Multiple-Cut Generator
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Slicing and Trimming Frame #{editingImageIdx + 1} with custom
                coordinates drag-and-drop
              </p>
            </div>
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
        <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto select-none">
          {/* Left side: Visual Preview Area (Canvas) */}
          <div className="lg:col-span-7 flex flex-col space-y-2">
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
            />

            <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
              Drag on unpopulated image space to draw new panels. Grab and shift
              any box selection to drag-and-drop it.
            </span>
          </div>

          {/* Right side: Tabbed controls sidebar */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            {/* Sidebar Navigation Tabs */}
            <div className="flex gap-1 bg-black/40 backdrop-blur-sm p-1.5 rounded-2xl border border-white/5">
              {([
                { key: "adjust", label: "Adjust & Clean", emoji: "✨" },
                { key: "slice", label: "Slicing Tools", emoji: "✂️" },
                { key: "cuts", label: `Cuts (${slices.length})`, emoji: "🎯" },
              ] as { key: "adjust" | "slice" | "cuts"; label: string; emoji: string }[]).map((tab) => (
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
              {activeTab === "adjust" && (
                <div className="space-y-4 animate-fadeIn">
                  <EnhancementsPanel
                    activeStoryboardPanel={activeStoryboardPanel}
                    handleModifyBrightness={handleModifyBrightness}
                    handleModifyContrast={handleModifyContrast}
                    handleModifySaturation={handleModifySaturation}
                    handleModifyFilterPreset={handleModifyFilterPreset}
                  />
                  <CleanBubblesPanel
                    imgUrl={scrapedImages[editingImageIdx]}
                    editingImageIdx={editingImageIdx}
                    setScrapedImages={setScrapedImages}
                    setPanels={setPanels}
                    addNotification={addNotification}
                    fetchWithInterceptor={fetchWithInterceptor}
                    setConsoleLogs={setConsoleLogs}
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
                  />
                  <AutoSlicer
                    handleDetectPanels={handleDetectPanels}
                    isDetecting={isDetecting}
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
              onClick={handleExecuteSave}
              disabled={isSavingEdit}
              className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
              style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
            >
              {isSavingEdit ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing Cuts...</span>
                </>
              ) : slices.length > 0 ? (
                <>
                  <Layers className="h-4 w-4 text-purple-200" />
                  <span>Execute {slices.length} Cuts</span>
                </>
              ) : (
                <>
                  <Crop className="h-3.5 w-3.5" />
                  <span>Execute Single Crop</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
