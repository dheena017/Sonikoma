import React, { useState, useCallback } from "react";
import { Slice } from "../components/crop/types";

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
    console.log("[CropEditorHistory] Pushing state to history");
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
    console.log("[CropEditorHistory] Undo triggered");
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
  }, [
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
    console.log("[CropEditorHistory] Redo triggered");
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
  }, [
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
