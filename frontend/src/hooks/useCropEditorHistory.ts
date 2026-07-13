import React, { useState, useEffect, useCallback } from "react";
import { Slice } from "@/components/Feature/editor/shared";

interface UseCropEditorHistoryProps {
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  slices: Slice[];
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  splitLines: number[];
  setSplitLines: React.Dispatch<React.SetStateAction<number[]>>;
  selectedSliceId: string | null;
  setSelectedSliceId: (id: string | null) => void;
  savedState: any;
}

export type HistorySnapshot = {
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  slices: Slice[];
  splitLines: number[];
  selectedSliceId: string | null;
};

export function useCropEditorHistory({
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  slices,
  setSlices,
  splitLines,
  setSplitLines,
  selectedSliceId,
  setSelectedSliceId,
  savedState,
}: UseCropEditorHistoryProps) {
  const [history, setHistory] = useState<HistorySnapshot[]>(
    savedState?.history || []
  );
  const [redoHistory, setRedoHistory] = useState<HistorySnapshot[]>([]);

  const pushHistory = useCallback(() => {
    console.log("[ImageEditorHistory] Pushing state to history");
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
  }, [
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    slices,
    splitLines,
    selectedSliceId,
  ]);

  const handleUndo = useCallback(() => {
    console.log("[ImageEditorHistory] Undo triggered");
    if (history.length === 0) return;

    const snap = history[history.length - 1];

    // Save current state to redo stack BEFORE applying snapshot
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

    // Apply snapshot
    setEditCropTop(snap.cropTop);
    setEditCropBottom(snap.cropBottom);
    setEditCropLeft(snap.cropLeft);
    setEditCropRight(snap.cropRight);
    setSlices(snap.slices);
    setSplitLines(snap.splitLines);
    setSelectedSliceId(snap.selectedSliceId);

    // Remove last entry from undo history
    setHistory((prev) => prev.slice(0, -1));
  }, [
    history,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    slices,
    splitLines,
    selectedSliceId,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    setSlices,
    setSplitLines,
    setSelectedSliceId,
  ]);

  const handleRedo = useCallback(() => {
    console.log("[ImageEditorHistory] Redo triggered");
    if (redoHistory.length === 0) return;

    const snap = redoHistory[redoHistory.length - 1];

    // Save current state to undo stack BEFORE applying snapshot
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

    // Apply snapshot
    setEditCropTop(snap.cropTop);
    setEditCropBottom(snap.cropBottom);
    setEditCropLeft(snap.cropLeft);
    setEditCropRight(snap.cropRight);
    setSlices(snap.slices);
    setSplitLines(snap.splitLines);
    setSelectedSliceId(snap.selectedSliceId);

    // Remove last entry from redo stack
    setRedoHistory((prev) => prev.slice(0, -1));
  }, [
    redoHistory,
    editCropTop,
    editCropBottom,
    editCropLeft,
    editCropRight,
    slices,
    splitLines,
    selectedSliceId,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    setSlices,
    setSplitLines,
    setSelectedSliceId,
  ]);

  return {
    history,
    setHistory,
    redoHistory,
    setRedoHistory,
    pushHistory,
    handleUndo,
    handleRedo,
  };
}
