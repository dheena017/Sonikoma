import React from "react";
import { Slice } from "../shared";
import {
  CutsRegistryHeader,
  CutsRegistrySelector,
  CutsRegistryFineTune,
  CutsRegistryList,
} from "./";

interface CutsRegistryProps {
  slices: Slice[];
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  selectedSliceId: string | null;
  setSelectedSliceId: (id: string | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  handlePushToSlices: () => void;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: (v: boolean) => void;
  handleClearAllSlices: () => void;
  handleNudge: (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => void;
  handleSelectSlice: (slice: Slice) => void;
  handleDeleteSlice: (id: string, e: React.MouseEvent) => void;
  handleCropSingleSlice: (slice: Slice, e: React.MouseEvent) => Promise<void>;
  isCroppingSlice: string | null;
  isSavingEdit: boolean;
}

export default function CutsRegistry({
  slices,
  setSlices,
  selectedSliceId,
  setSelectedSliceId,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,
  handlePushToSlices,
  autoPushOnDraw,
  setAutoPushOnDraw,
  handleClearAllSlices,
  handleNudge,
  handleSelectSlice,
  handleDeleteSlice,
  handleCropSingleSlice,
  isCroppingSlice,
  isSavingEdit,
}: CutsRegistryProps) {
  const hasSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  return (
    <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      <CutsRegistryHeader
        slices={slices}
        handleClearAllSlices={handleClearAllSlices}
      />

      <CutsRegistrySelector
        hasSelection={hasSelection}
        handlePushToSlices={handlePushToSlices}
        autoPushOnDraw={autoPushOnDraw}
        setAutoPushOnDraw={setAutoPushOnDraw}
      />

      {hasSelection && (
        <CutsRegistryFineTune
          selectedSliceId={selectedSliceId}
          editCropTop={editCropTop}
          setEditCropTop={setEditCropTop}
          editCropBottom={editCropBottom}
          setEditCropBottom={setEditCropBottom}
          editCropLeft={editCropLeft}
          setEditCropLeft={setEditCropLeft}
          editCropRight={editCropRight}
          setEditCropRight={setEditCropRight}
          handleNudge={handleNudge}
        />
      )}

      <CutsRegistryList
        slices={slices}
        selectedSliceId={selectedSliceId}
        handleSelectSlice={handleSelectSlice}
        handleCropSingleSlice={handleCropSingleSlice}
        handleDeleteSlice={handleDeleteSlice}
        isCroppingSlice={isCroppingSlice}
        isSavingEdit={isSavingEdit}
      />
    </div>
  );
}
