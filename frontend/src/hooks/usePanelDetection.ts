import React from "react";
import { Slice } from "../components/crop/types";
import { NotificationType } from "../components/NotificationStack";

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
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  editAutoTrim: boolean;
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
}: UsePanelDetectionProps) {

  const handleAiCrop = async () => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsAiDetecting(true);
    try {
      const response = await activeFetch("/api/ai-detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
      });
      if (!response.ok) throw new Error("AI analysis failed");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels) && data.panels.length > 0) {
        const hasCroppedUrls = data.panels.every((p: unknown) => p.croppedUrl);
        if (hasCroppedUrls && setScrapedImages) {
          const croppedUrls = data.panels.map((p: unknown) => p.croppedUrl);

          if (setConsoleLogs) {
            setConsoleLogs((prev) => [
              `[AI Smart Crop] Segmented original image into ${croppedUrls.length} pre-cropped panels...`,
              ...prev,
            ]);
          }

          setScrapedImages((prev) => {
            const copy = [...prev];
            copy.splice(editingImageIdx, 1, ...croppedUrls);
            return copy;
          });

          addNotification(
            `AI Smart Crop automatically isolated ${croppedUrls.length} panels!`,
            "success"
          );
          return;
        }

        const newSlices = data.panels.map((box: unknown, index: number) => ({
          id: `ai-${index}-${Date.now()}`,
          cropTop: box.cropTop,
          cropBottom: box.cropBottom,
          cropLeft: box.cropLeft,
          cropRight: box.cropRight,
          autoTrim: editAutoTrim,
        }));

        setSlices((prev) => [...prev, ...newSlices]);

        const firstNew = newSlices[0];
        setSelectedSliceId(firstNew.id);
        setEditCropLeft(firstNew.cropLeft);
        setEditCropRight(firstNew.cropRight);
        setEditCropTop(firstNew.cropTop);
        setEditCropBottom(firstNew.cropBottom);

        addNotification(
          `AI Smart Crop successfully isolated ${newSlices.length} panels!`,
          "success"
        );
      } else {
        addNotification(
          "AI could not detect any panels. Please draw your crops manually.",
          "warning"
        );
      }
    } catch (err: any) {
      console.error("AI crop detection failed:", err);
      addNotification(
        err.message || "AI crop detection failed. Please try again.",
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
    dryRun?: boolean;
  }) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsDetecting(true);
    try {
      const response = await activeFetch("/api/detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: currentUrl,
          sensitivity: settings?.sensitivity ?? 30,
          backgroundColorMode: settings?.backgroundMode ?? "auto",
          aspectRatio: settings?.aspectRatio ?? "free",
          minAreaPct: settings?.minAreaPct ?? 0.15,
          mergeThreshold: settings?.mergeThreshold ?? 20,
          strategy: settings?.strategy ?? "local-cv",
          model: settings?.model ?? "gemini-2.5-flash",
          cannyLow: settings?.cannyLow ?? 20,
          cannyHigh: settings?.cannyHigh ?? 100,
          closeKernelSize: settings?.closeKernelSize ?? 15,
          minHeightPx: settings?.minHeightPx ?? 60
        }),
      });
      if (!response.ok) throw new Error("Failed to detect panels");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels)) {
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
          const initialSlices = data.panels.map((box: unknown, index: number) => ({
            id: `detected-${index}-${Date.now()}`,
            cropTop: box.cropTop,
            cropBottom: box.cropBottom,
            cropLeft: box.cropLeft,
            cropRight: box.cropRight,
            autoTrim: editAutoTrim,
          }));
          setSlices(initialSlices);

          const first = initialSlices[0];
          setSelectedSliceId(first.id);
          setEditCropLeft(first.cropLeft);
          setEditCropRight(first.cropRight);
          setEditCropTop(first.cropTop);
          setEditCropBottom(first.cropBottom);
        } else {
          addNotification(
            "No panels detected. Triggering AI-based fallback...",
            "info"
          );
          await handleAiCrop();
        }
      }
    } catch (err: any) {
      console.error("Detect panels failed, trying AI fallback:", err);
      addNotification(
        "Panel detection failed, trying AI-based detection...",
        "info"
      );
      await handleAiCrop();
    } finally {
      setIsDetecting(false);
    }
  };

  return {
    handleAiCrop,
    handleDetectPanels,
  };
}
