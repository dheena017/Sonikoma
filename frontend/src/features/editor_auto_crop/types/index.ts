import * as api from "@/api";
import { DetectTypeResponse, ReadingFlow } from "@/api/endpoints/crop";

export interface AutoCropSettings {
  [key: string]: any;
}

export interface OpenCVSettings {
  [key: string]: any;
}

export interface AISmartSettings {
  [key: string]: any;
}

export interface AutoCropPreviewPageProps {
  onClose: () => void;
  onConfirm: (confirmedResults?: Record<string, string[]>) => void;
  scrapedImages: string[];
  selectedScraped: string[];
  fetchWithInterceptor?: typeof fetch;
  addNotification?: (message: string, type: any) => void;
  sensitivity?: number;
  padding?: number;
  backgroundColorMode?: string;
  autoSplitTallStrips?: boolean;
  aspectRatioLock?: string;
  minPanelHeightPx?: number;
  overlapMergeThreshold?: number;
  isApplying?: boolean;
  isModal?: boolean;
}

export interface PreviewItem {
  sourceUrl: string;
  panelUrls: string[];
  originalPanelUrls?: string[];
  boxes?: api.PanelBoundingBoxInput[];
  originalBoxes?: api.PanelBoundingBoxInput[];
  typeInfo: DetectTypeResponse | null;
  layout: string;
  readingFlow?: ReadingFlow;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  confidence?: number;
  estimatedCount?: number;
  status?: "loading" | "success" | "error";
  errorMessage?: string;
  errorDetails?: string;
}
