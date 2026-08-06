import { normalizeLog } from "@/types/logs";
import React from "react";
import { Slice, DetectedPanel } from "@/features/image_editor/components/shared";
import { NotificationType } from "@/features/notification";
import * as api from "@/api/index";

interface UsePanelDetectionProps {
  activeFetch: typeof fetch;
  editingImageIdx: number | null;
  scrapedImages: string[];
  setIsDetecting: (val: boolean) => void;
  setIsAiDetecting: (val: boolean) => void;
  setDetectedBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  setSelectedSliceId: (id: string | null) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  addNotification: (message: string, type: NotificationType) => void;
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<any[]>>;
  editAutoTrim: boolean;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  setEditingImageIdx: (idx: number | null) => void;
  autoSplitTallStrips?: boolean;
}

export interface UsePanelDetectionReturn {
  handleAiCrop: () => Promise<void>;
  handleDetectPanels: (settings?: any) => Promise<void>;
  handleCancelDetect: () => void;
}

export function usePanelDetection({
  activeFetch,
  editingImageIdx,
  scrapedImages,
  setIsDetecting,
  setIsAiDetecting,
  setDetectedBoxes,
  setSlices,
  setSelectedSliceId,
  setEditCropLeft,
  setEditCropRight,
  setEditCropTop,
  setEditCropBottom,
  addNotification,
  setScrapedImages,
  setConsoleLogs,
  editAutoTrim,
  addPanelsToStoryboard,
  setEditingImageIdx,
  autoSplitTallStrips,
}: UsePanelDetectionProps): UsePanelDetectionReturn {
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleCancelDetect = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      addNotification("Detection cancelled.", "info");
    }
  };

  const handleAiCrop = async () => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    console.log(
      `[Smart Crop] Requesting Smart Scanner detection for image #${
        editingImageIdx + 1
      }`
    );
    setIsAiDetecting(true);
    try {
      abortControllerRef.current = new AbortController();
      const data = await api.aiDetectPanels(
        activeFetch,
        { url: currentUrl },
        { signal: abortControllerRef.current.signal }
      );
      if (
        data.success &&
        Array.isArray(data.panels) &&
        data.panels.length > 0
      ) {
        const hasCroppedUrls = data.panels.every(
          (p: DetectedPanel) => p.croppedUrl
        );
        if (hasCroppedUrls) {
          const croppedUrls = data.panels.map(
            (p: DetectedPanel) => p.croppedUrl
          );

          if (setConsoleLogs) {
            setConsoleLogs((prev) => [
              `[Smart Crop] Segmented original image into ${croppedUrls.length} pre-cropped panels and added to Timeline...`,
              ...prev,
            ]);
          }

          // Add directly to Timeline only
          addPanelsToStoryboard(croppedUrls);

          addNotification(
            `✨ AI Smart Crop added ${croppedUrls.length} panels to Timeline!`,
            "success"
          );

          // Close editor and navigate home
          setEditingImageIdx(null);
          window.history.pushState({}, "");
          window.dispatchEvent(new Event("popstate"));
          return;
        }

        const newSlices = data.panels.map(
          (box: DetectedPanel, index: number) => ({
            id: `ai-${index}-${Date.now()}`,
            cropTop: box.cropTop,
            cropBottom: box.cropBottom,
            cropLeft: box.cropLeft,
            cropRight: box.cropRight,
            autoTrim: editAutoTrim,
          })
        );

        setSlices((prev) => [...prev, ...newSlices]);

        const firstNew = newSlices[0];
        setSelectedSliceId(firstNew.id);
        setEditCropLeft(firstNew.cropLeft);
        setEditCropRight(firstNew.cropRight);
        setEditCropTop(firstNew.cropTop);
        setEditCropBottom(firstNew.cropBottom);

        addNotification(
          `✨ AI Smart Crop isolated ${newSlices.length} panels!`,
          "success"
        );
      } else {
        addNotification(
          "AI Smart Scanner could not detect any panels. Try adjusting your guidance prompt or switch to OpenCV engine.",
          "warning"
        );
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Smart crop detection cancelled by user");
        return;
      }
      console.error("Smart crop detection failed:", err);
      addNotification(
        err.message || "Smart crop detection failed. Please try again.",
        "error"
      );
    } finally {
      setIsAiDetecting(false);
    }
  };

  const handleDetectPanels = async (settings?: {
    sensitivity?: number;
    backgroundMode?: string;
    aspectRatio?: string;
    strategy?: string;
    model?: string;
    minAreaPct?: number;
    mergeThreshold?: number;
    cannyLow?: number;
    cannyHigh?: number;
    closeKernelSize?: number;
    minHeightPx?: number;
    paddingPx?: number;
    autoSplit?: boolean;
    useYolo?: boolean;
    dryRun?: boolean;
  }) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    console.log(
      `[Panel Detection] Requesting detection for image #${
        editingImageIdx + 1
      }`,
      settings
    );
    setIsDetecting(true);
    try {
      abortControllerRef.current = new AbortController();
      const data = await api.detectPanels(
        activeFetch,
        {
          url: currentUrl,
          sensitivity: settings?.sensitivity ?? 30,
          backgroundColorMode: settings?.backgroundMode ?? "auto",
          aspectRatio: settings?.aspectRatio ?? "free",
          minAreaPct: settings?.minAreaPct ?? 0.15,
          mergeThreshold: settings?.mergeThreshold ?? 20,
          strategy: settings?.strategy ?? "local-cv",
          model: settings?.model || undefined,
          cannyLow: settings?.cannyLow ?? 20,
          cannyHigh: settings?.cannyHigh ?? 100,
          closeKernelSize: settings?.closeKernelSize ?? 15,
          minHeightPx: settings?.minHeightPx ?? 60,
          paddingPx: settings?.paddingPx ?? 10,
          autoSplit: settings?.autoSplit ?? autoSplitTallStrips ?? true,
          useYolo: settings?.useYolo ?? true,
        },
        { signal: abortControllerRef.current.signal }
      );
      if (data.success && Array.isArray(data.panels)) {
        if (data.fallback) {
          addNotification(
            data.message ||
              "Smart panel detection fell back to local CV.",
            "warning"
          );
          if (setConsoleLogs) {
            setConsoleLogs((prev) => [
              `[Panel Detection Fallback] ${
                data.message || "Fell back to local CV detection."
              }`,
              ...prev,
            ]);
          }
        }

        setDetectedBoxes(data.panels);

        if (settings?.dryRun) {
          addNotification(
            `Dry Run: Detected ${data.panels.length} panel outlines!`,
            "success"
          );
        } else if (data.panels.length > 0) {
          addNotification(
            `Successfully sliced ${data.panels.length} panel cuts!`,
            "success"
          );
          const initialSlices = data.panels.map(
            (box: DetectedPanel, index: number) => ({
              id: `detected-${index}-${Date.now()}`,
              cropTop: box.cropTop,
              cropBottom: box.cropBottom,
              cropLeft: box.cropLeft,
              cropRight: box.cropRight,
              autoTrim: editAutoTrim,
            })
          );
          setSlices(initialSlices);

          const first = initialSlices[0];
          setSelectedSliceId(first.id);
          setEditCropLeft(first.cropLeft);
          setEditCropRight(first.cropRight);
          setEditCropTop(first.cropTop);
          setEditCropBottom(first.cropBottom);
        } else {
          addNotification(
            "No panels detected in this image. Try adjusting sensitivity or using the AI Smart Engine.",
            "warning"
          );
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Panel detection cancelled by user");
        return;
      }
      console.error("Panel detection failed:", err);
      addNotification(
        err.message || "Panel detection failed. Please check your settings and try again.",
        "error"
      );
    } finally {
      setIsDetecting(false);
    }
  };

  return {
    handleAiCrop,
    handleDetectPanels,
    handleCancelDetect,
  };
}
