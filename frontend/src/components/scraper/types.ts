import React from "react";
import { GeneratedPanel } from "../../types";
import { NotificationType } from "../NotificationStack";
import { ErrorPopupDetail } from "../ErrorPopupModal";

export interface ScraperDeckProps {
  scrapedImages: string[];
  isScraping: boolean;
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  mergingIndices: number[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  currentPanelIndex: number;
  handleMergeWithNext: (idx: number) => Promise<void>;
  setEditingImageIdx: (idx: number | null) => void;
  openEditingImageIdx: (idx: number | null) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setEditAutoTrim: (val: boolean) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor?: typeof fetch;
  setErrorPopup?: (err: ErrorPopupDetail | null) => void;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  // Bubble Cleaner (managed at App level)
  showBubbleModal: boolean;
  setShowBubbleModal: (v: boolean) => void;
  isCleaningBubbles: boolean;
  cleanProgress: { current: number; total: number } | null;
  bubbleCroppingImgUrl: string | null;
  // Auto Crop (managed at App level)
  showAutoCropModal: boolean;
  setShowAutoCropModal: (v: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: { current: number; total: number } | null;
  croppingImgUrl: string | null;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  isDashboardOnly?: boolean;
}

export type LiveScraperDeckProps = ScraperDeckProps;
