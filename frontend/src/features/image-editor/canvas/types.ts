export interface Slot {
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  autoTrim: boolean;
}

export interface Slice {
  id: string;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  autoTrim: boolean;
}

export interface DetectedPanel {
  id?: string;
  index?: number;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  croppedUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  area?: number;
  areaPct?: number;
  aspectRatio?: number;
  aspectRatioLabel?: string;
  panelType?: string;
  confidence?: number;
  isHeader?: boolean;
}
