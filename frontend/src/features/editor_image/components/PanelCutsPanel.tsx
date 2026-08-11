import React from "react";
import CutsRegistry from "@/features/editor_cuts_registry";
import AutoSlicer from "@/features/editor_auto_crop/components/AutoSlicer";

interface Props {
  slices: any[];
  setSlices: any;
  selectedSliceId: string | null;
  setSelectedSliceId: any;
  editCropTop: number;
  setEditCropTop: (v: number) => void;
  editCropBottom: number;
  setEditCropBottom: (v: number) => void;
  editCropLeft: number;
  setEditCropLeft: (v: number) => void;
  editCropRight: number;
  setEditCropRight: (v: number) => void;
  editAutoTrim: boolean;
  handlePushToSlices: any;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: any;
  handleClearAllSlices: any;
  handleNudge: any;
  handleSelectSlice: any;
  handleDeleteSlice: any;
  handleCropSingleSlice: any;
  isCroppingSlice: string | null;
  isSavingEdit: boolean;
  handleDetectPanels: any;
  handleCancelDetect: () => void;
  isDetecting: boolean;
  handleCommitDetectedBoxes: any;
  detectedBoxes: any[];
  handleClearDetectedBoxes: any;
}

export const PanelCutsPanel: React.FC<Props> = ({
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
  handleDetectPanels,
  handleCancelDetect,
  isDetecting,
  handleCommitDetectedBoxes,
  detectedBoxes,
  handleClearDetectedBoxes,
}) => {
  return (
    <div className="space-y-4">
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
        handleCancelDetect={handleCancelDetect}
        isDetecting={isDetecting}
        onCommitCuts={handleCommitDetectedBoxes}
        hasDetectedBoxes={detectedBoxes && detectedBoxes.length > 0}
        detectedCount={detectedBoxes?.length || 0}
        clearDetectedBoxes={handleClearDetectedBoxes}
      />
    </div>
  );
};

export default PanelCutsPanel;
