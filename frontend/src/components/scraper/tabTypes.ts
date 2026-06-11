// ─── Shared types for BubbleCleaner tab sub-components ───────────────────────

export type DetectionStyle = "all" | "white_only" | "text_only";
export type EraseMethod = "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";

export interface CustomBubblePreset {
  name: string;
  detectionStyle: DetectionStyle;
  eraseMethod: EraseMethod;
  sensitivity: number;
  bubbleDilation: number;
  bubbleInpaintRadius: number;
}

/** Props shared by every BubbleCleaner sub-tab */
export interface BubbleCleanerSharedProps {
  detectionStyle: DetectionStyle;
  setDetectionStyle: (v: DetectionStyle) => void;
  eraseMethod: EraseMethod;
  setEraseMethod: (v: EraseMethod) => void;
  sensitivity: number;
  setSensitivity: (v: number) => void;
  bubbleDilation: number;
  setBubbleDilation: (v: number) => void;
  bubbleInpaintRadius: number;
  setBubbleInpaintRadius: (v: number) => void;
  selectedCount: number;
  scrapedImages: string[];
  selectedScraped: string[];
  addNotification?: (msg: string, type: any) => void;
}

// ─── Shared types for AutoCrop tab sub-components ────────────────────────────

export interface CustomCropPreset {
  name: string;
  useLocalCV: boolean;
  cropModel: string;
  autoSplitTallStrips: boolean;
  cropSensitivity: number;
  cropPaddingPx: number;
  cropBackgroundMode: string;
  aspectRatioLock: string;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  cropMinHeightPx: number;
  cropCannyLow: number;
  cropCannyHigh: number;
  cropCloseKernelSize: number;
}

/** Props shared by every AutoCrop sub-tab */
export interface AutoCropSharedProps {
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  cropModel: string;
  setCropModel: (v: string) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (v: boolean) => void;
  cropSensitivity: number;
  setCropSensitivity: (v: number) => void;
  cropPaddingPx: number;
  setCropPaddingPx: (v: number) => void;
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  cropMinHeightPx: number;
  setCropMinHeightPx: (v: number) => void;
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
  scrapedImages: string[];
  selectedScraped: string[];
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification?: (msg: string, type: any) => void;
}
