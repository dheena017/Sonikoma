import React from "react";
import { Cut } from "../shared/types.js";
import { CutsRegistryHeader } from "./CutsRegistryHeader.js";
import { CutsRegistrySelector } from "./CutsRegistrySelector.js";
import { CutsRegistryFineTune } from "./CutsRegistryFineTune.js";
import { CutsRegistryList } from "./CutsRegistryList.js";

interface CutsRegistryProps {
  cuts: Cut[];
  setCuts: React.Dispatch<React.SetStateAction<Cut[]>>;
  selectedCutId: string | null;
  setSelectedCutId: (id: string | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  handlePushToCuts: () => void;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: (v: boolean) => void;
  handleClearAllCuts: () => void;
  handleNudge: (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => void;
  handleSelectCut: (cut: Cut) => void;
  handleDeleteCut: (id: string, e: React.MouseEvent) => void;
  handleCropSingleCut: (cut: Cut, e: React.MouseEvent) => Promise<void>;
  isCroppingCut: string | null;
  isSavingEdit: boolean;
}

export default function CutsRegistry({
  cuts,
  setCuts,
  selectedCutId,
  setSelectedCutId,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,
  handlePushToCuts,
  autoPushOnDraw,
  setAutoPushOnDraw,
  handleClearAllCuts,
  handleNudge,
  handleSelectCut,
  handleDeleteCut,
  handleCropSingleCut,
  isCroppingCut,
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
        cuts={cuts}
        handleClearAllCuts={handleClearAllCuts}
      />

      <CutsRegistrySelector
        hasSelection={hasSelection}
        handlePushToCuts={handlePushToCuts}
        autoPushOnDraw={autoPushOnDraw}
        setAutoPushOnDraw={setAutoPushOnDraw}
      />

      {hasSelection && (
        <CutsRegistryFineTune
          selectedCutId={selectedCutId}
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
        cuts={cuts}
        selectedCutId={selectedCutId}
        handleSelectCut={handleSelectCut}
        handleCropSingleCut={handleCropSingleCut}
        handleDeleteCut={handleDeleteCut}
        isCroppingCut={isCroppingCut}
        isSavingEdit={isSavingEdit}
      />
    </div>
  );
}
