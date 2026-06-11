import React, { useState, useCallback } from "react";
import { Cut } from "../components/crop/types";

interface UseCropEditorHistoryProps {
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  cuts: Cut[];
  setCuts: React.Dispatch<React.SetStateAction<Cut[]>>;
  splitLines: number[];
  setSplitLines: React.Dispatch<React.SetStateAction<number[]>>;
  selectedCutId: string | null;
  setSelectedCutId: (id: string | null) => void;
  savedState: any;
}

export type HistorySnapshot = {
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  cuts: Cut[];
  splitLines: number[];
  selectedCutId: string | null;
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
  cuts,
  setCuts,
  splitLines,
  setSplitLines,
  selectedCutId,
  setSelectedCutId,
  savedState,
}: UseCropEditorHistoryProps) {
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
        cuts,
        splitLines,
        selectedCutId,
      },
    ]);
    setRedoHistory([]);
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, cuts, splitLines, selectedCutId]);

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
          cuts,
          splitLines,
          selectedCutId,
        },
      ]);

      setEditCropTop(snap.cropTop);
      setEditCropBottom(snap.cropBottom);
      setEditCropLeft(snap.cropLeft);
      setEditCropRight(snap.cropRight);
      setCuts(snap.cuts);
      setSplitLines(snap.splitLines);
      setSelectedCutId(snap.selectedCutId);
      return prev.slice(0, -1);
    });
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, cuts, splitLines, selectedCutId, setEditCropTop, setEditCropBottom, setEditCropLeft, setEditCropRight, setCuts, setSplitLines, setSelectedCutId]);

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
          cuts,
          splitLines,
          selectedCutId,
        },
      ]);

      setEditCropTop(snap.cropTop);
      setEditCropBottom(snap.cropBottom);
      setEditCropLeft(snap.cropLeft);
      setEditCropRight(snap.cropRight);
      setCuts(snap.cuts);
      setSplitLines(snap.splitLines);
      setSelectedCutId(snap.selectedCutId);
      return prevRedo.slice(0, -1);
    });
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, cuts, splitLines, selectedCutId, setEditCropTop, setEditCropBottom, setEditCropLeft, setEditCropRight, setCuts, setSplitLines, setSelectedCutId]);

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
