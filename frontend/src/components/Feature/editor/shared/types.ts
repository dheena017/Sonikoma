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
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  croppedUrl?: string;
  width?: number;
  height?: number;
  area?: number;
}
