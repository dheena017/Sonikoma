import React from "react";
import { Cut } from "../components/crop/types";

interface UseCropEditorDragProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dragStart: { x: number; y: number } | null;
  setDragStart: (val: { x: number; y: number } | null) => void;
  dragType: any;
  setDragType: (val: any) => void;
  dragStartPercent: { x: number; y: number } | null;
  setDragStartPercent: (val: { x: number; y: number } | null) => void;
  originalCropBounds: { top: number; bottom: number; left: number; right: number } | null;
  setOriginalCropBounds: (val: { top: number; bottom: number; left: number; right: number } | null) => void;
  draggingSplitLineIdx: number | null;
  setDraggingSplitLineIdx: (idx: number | null) => void;
  
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  
  showSplitPosition: boolean;
  splitPosition: number;
  setSplitPosition: (val: number) => void;
  splitLines: number[];
  setSplitLines: React.Dispatch<React.SetStateAction<number[]>>;
  magneticSnap: boolean;
  detectedGutters: number[];
  
  cuts: Cut[];
  setCuts: React.Dispatch<React.SetStateAction<Cut[]>>;
  setSelectedCutId: (id: string | null) => void;
  selectedCutId: string | null;
  autoPushOnDraw: boolean;
  editAutoTrim: boolean;
  
  pushHistory: () => void;
  handleSelectCut: (cut: Cut) => void;
  handlePushToCuts: () => void;
}

export function useCropEditorDrag({
  containerRef,
  dragStart,
  setDragStart,
  dragType,
  setDragType,
  dragStartPercent,
  setDragStartPercent,
  originalCropBounds,
  setOriginalCropBounds,
  draggingSplitLineIdx,
  setDraggingSplitLineIdx,

  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,

  showSplitPosition,
  splitPosition,
  setSplitPosition,
  splitLines,
  setSplitLines,
  magneticSnap,
  detectedGutters,

  cuts,
  setCuts,
  setSelectedCutId,
  selectedCutId,
  autoPushOnDraw,
  editAutoTrim,

  pushHistory,
  handleSelectCut,
  handlePushToCuts,
}: UseCropEditorDragProps) {

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

  const handleSelectAndDragCut = (cut: Cut, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    handleSelectCut(cut);
    pushHistory();
    setDragType("move");
    setDragStartPercent({ x, y });
    setOriginalCropBounds({
      top: cut.cropTop,
      bottom: cut.cropBottom,
      left: cut.cropLeft,
      right: cut.cropRight,
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
      setSelectedCutId(null);
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
      return;
    }

    if (dragType === "move" && dragStartPercent && originalCropBounds) {
      const dx = x - dragStartPercent.x;
      const dy = y - dragStartPercent.y;

      let newLeft = parseFloat(Math.max(0, Math.min(100, originalCropBounds.left + dx)).toFixed(1));
      let newRight = parseFloat(Math.max(0, Math.min(100, originalCropBounds.right - dx)).toFixed(1));
      let newTop = parseFloat(Math.max(0, Math.min(100, originalCropBounds.top + dy)).toFixed(1));
      let newBottom = parseFloat(Math.max(0, Math.min(100, originalCropBounds.bottom - dy)).toFixed(1));

      const width = 100 - newLeft - newRight;
      if (width < 5) {
        if (dx > 0) {
          newLeft = 100 - newRight - 5;
        } else {
          newRight = 100 - newLeft - 5;
        }
      }

      const height = 100 - newTop - newBottom;
      if (height < 5) {
        if (dy > 0) {
          newTop = 100 - newBottom - 5;
        } else {
          newBottom = 100 - newTop - 5;
        }
      }

      setEditCropLeft(newLeft);
      setEditCropRight(newRight);
      setEditCropTop(newTop);
      setEditCropBottom(newBottom);

      if (selectedCutId) {
        setCuts((prev) =>
          prev.map((s) =>
            s.id === selectedCutId
              ? {
                  ...s,
                  cropLeft: newLeft,
                  cropRight: newRight,
                  cropTop: newTop,
                  cropBottom: newBottom,
                }
              : s
          )
        );
      }
      return;
    }

    if (dragType?.startsWith("resize-") && dragStartPercent && originalCropBounds) {
      const handle = dragType.replace("resize-", "");
      const dx = x - dragStartPercent.x;
      const dy = y - dragStartPercent.y;

      let newLeft = originalCropBounds.left;
      let newRight = originalCropBounds.right;
      let newTop = originalCropBounds.top;
      let newBottom = originalCropBounds.bottom;

      if (handle.includes("w")) newLeft = parseFloat(Math.max(0, Math.min(95 - newRight, originalCropBounds.left + dx)).toFixed(1));
      if (handle.includes("e")) newRight = parseFloat(Math.max(0, Math.min(95 - newLeft, originalCropBounds.right - dx)).toFixed(1));
      if (handle.includes("n")) newTop = parseFloat(Math.max(0, Math.min(95 - newBottom, originalCropBounds.top + dy)).toFixed(1));
      if (handle.includes("s")) newBottom = parseFloat(Math.max(0, Math.min(95 - newTop, originalCropBounds.bottom - dy)).toFixed(1));

      setEditCropLeft(newLeft);
      setEditCropRight(newRight);
      setEditCropTop(newTop);
      setEditCropBottom(newBottom);

      if (selectedCutId) {
        setCuts((prev) =>
          prev.map((s) =>
            s.id === selectedCutId
              ? {
                  ...s,
                  cropLeft: newLeft,
                  cropRight: newRight,
                  cropTop: newTop,
                  cropBottom: newBottom,
                }
              : s
          )
        );
      }
    }
  };

  const handleEnd = () => {
    if (dragType === "draw" && autoPushOnDraw) {
      handlePushToCuts();
    }
    setDragStart(null);
    setDragType(null);
    setDragStartPercent(null);
    setOriginalCropBounds(null);
    setDraggingSplitLineIdx(null);
  };

  const handleNudge = (direction: "top" | "bottom" | "left" | "right", amount: number) => {
    pushHistory();
    let updatedTop = editCropTop;
    let updatedBottom = editCropBottom;
    let updatedLeft = editCropLeft;
    let updatedRight = editCropRight;

    if (direction === "top") updatedTop = parseFloat(Math.max(0, Math.min(95, editCropTop + amount)).toFixed(1));
    if (direction === "bottom") updatedBottom = parseFloat(Math.max(0, Math.min(95, editCropBottom + amount)).toFixed(1));
    if (direction === "left") updatedLeft = parseFloat(Math.max(0, Math.min(95, editCropLeft + amount)).toFixed(1));
    if (direction === "right") updatedRight = parseFloat(Math.max(0, Math.min(95, editCropRight + amount)).toFixed(1));

    setEditCropTop(updatedTop);
    setEditCropBottom(updatedBottom);
    setEditCropLeft(updatedLeft);
    setEditCropRight(updatedRight);

    if (selectedCutId) {
      setCuts((prev) =>
        prev.map((s) =>
          s.id === selectedCutId
            ? {
                ...s,
                cropTop: updatedTop,
                cropBottom: updatedBottom,
                cropLeft: updatedLeft,
                cropRight: updatedRight,
              }
            : s
        )
      );
    }
  };

  return {
    isPointInsideSelection,
    onResizeStart,
    handleSelectAndDragCut,
    handleStart,
    handleMove,
    handleEnd,
    handleNudge,
  };
}
