export interface AutoCropSettings {
  engine: "opencv" | "aiSmart";
  opencv: OpenCVSettings;
  aiSmart: AISmartSettings;
}

export interface OpenCVSettings {
  sensitivity: number;
  paddingPx: number;
  backgroundMode: string;
  autoSplitTallStrips: boolean;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  minHeightPx: number;
  cannyLow: number;
  cannyHigh: number;
  closeKernelSize: number;
  aspectRatioLock: string;
}

export interface AISmartSettings {
  model: string;
  guidance: string;
  focusMode: string;
}
