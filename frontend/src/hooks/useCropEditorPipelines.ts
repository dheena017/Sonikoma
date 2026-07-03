import React from "react";
import { Slice } from "@/components/Feature/editor/crop";
import { NotificationType } from "../components/notification/NotificationStack";
import { usePanelDetection } from "./usePanelDetection";
import { useImageTransform } from "./useImageTransform";

interface UseCropEditorPipelinesProps {
  activeFetch: typeof fetch;
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  imageUrl: string | null;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;

  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;

  eraseMethod: string;
  sensitivity: number;
  dilation: number;
  inpaintRadius: number;
  detectionStyle: string;
  debugMode: boolean;
  fillColor: string;
  gpu: boolean;

  setIsTransforming: (val: boolean) => void;
  setIsMerging: (val: boolean) => void;
  setIsCleaning: (val: boolean) => void;
  setIsCroppingSlice: (id: string | null) => void;
  setSlicesCroppedCount: React.Dispatch<React.SetStateAction<number>>;
  slicesCroppedCount: number;
  setIsDetecting: (val: boolean) => void;
  setDetectedBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  setIsAiDetecting: (val: boolean) => void;
  setEditMode: (
    mode: "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices"
  ) => void;
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  setSelectedSliceId: (id: string | null) => void;

  pushHistory: () => void;
}

export function useCropEditorPipelines(props: UseCropEditorPipelinesProps) {
  const { handleAiCrop, handleDetectPanels, handleCancelDetect } =
    usePanelDetection({
      activeFetch: props.activeFetch,
      editingImageIdx: props.editingImageIdx,
      scrapedImages: props.scrapedImages,
      setIsDetecting: props.setIsDetecting,
      setIsAiDetecting: props.setIsAiDetecting,
      setDetectedBoxes: props.setDetectedBoxes,
      setSlices: props.setSlices,
      setSelectedSliceId: props.setSelectedSliceId,
      setEditCropLeft: props.setEditCropLeft,
      setEditCropRight: props.setEditCropRight,
      setEditCropTop: props.setEditCropTop,
      setEditCropBottom: props.setEditCropBottom,
      addNotification: props.addNotification,
      setScrapedImages: props.setScrapedImages,
      setConsoleLogs: props.setConsoleLogs,
      editAutoTrim: props.editAutoTrim,
      addPanelsToStoryboard: props.addPanelsToStoryboard,
      setEditingImageIdx: props.setEditingImageIdx,
    });

  const {
    handleTransform,
    handleMergeWithNext,
    handleCleanSingleBubble,
    handleDeleteSlice,
    handleCropSingleSlice,
  } = useImageTransform({
    activeFetch: props.activeFetch,
    editingImageIdx: props.editingImageIdx,
    imageUrl: props.imageUrl,
    scrapedImages: props.scrapedImages,
    setScrapedImages: props.setScrapedImages,
    setPanels: props.setPanels,
    setConsoleLogs: props.setConsoleLogs,
    addNotification: props.addNotification,
    setIsTransforming: props.setIsTransforming,
    setIsMerging: props.setIsMerging,
    setIsCleaning: props.setIsCleaning,
    setIsCroppingSlice: props.setIsCroppingSlice,
    setSlicesCroppedCount: props.setSlicesCroppedCount,
    slicesCroppedCount: props.slicesCroppedCount,
    setSlices: props.setSlices,
    setSelectedSliceId: props.setSelectedSliceId,
    pushHistory: props.pushHistory,
    eraseMethod: props.eraseMethod,
    sensitivity: props.sensitivity,
    dilation: props.dilation,
    inpaintRadius: props.inpaintRadius,
    detectionStyle: props.detectionStyle,
    debugMode: props.debugMode,
    fillColor: props.fillColor,
    gpu: props.gpu,
    addPanelsToStoryboard: props.addPanelsToStoryboard,
  });

  return {
    handleTransform,
    handleMergeWithNext,
    handleCleanSingleBubble,
    handleDeleteSlice,
    handleCropSingleSlice,
    handleAiCrop,
    handleDetectPanels,
    handleCancelDetect,
  };
}
