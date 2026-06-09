import React, { useState } from "react";
import { GeneratedPanel } from "../types";
import { NotificationType } from "../components/NotificationStack";

interface UseBatchImageActionsProps {
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;

  // bubble configs
  bubbleEraseMethod: string;
  bubbleSensitivity: number;
  bubbleDetectionStyle: string;

  // crop configs
  cropSensitivity: number;
  cropBackgroundMode: string;
  aspectRatioLock: string;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  useLocalCV: boolean;
  selectedModel: string;
  cropPaddingPx: number;
}

export function useBatchImageActions({
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,

  bubbleEraseMethod,
  bubbleSensitivity,
  bubbleDetectionStyle,

  cropSensitivity,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  overlapMergeThreshold,
  useLocalCV,
  selectedModel,
  cropPaddingPx,
}: UseBatchImageActionsProps) {
  const [isCleaningBubbles, setIsCleaningBubbles] = useState<boolean>(false);
  const [cleanProgress, setCleanProgress] = useState<{ current: number; total: number } | null>(null);
  const [bubbleCroppingImgUrl, setBubbleCroppingImgUrl] = useState<string | null>(null);

  const [isBatchCropping, setIsBatchCropping] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [croppingImgUrl, setCroppingImgUrl] = useState<string | null>(null);

  const handleCleanBubblesSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsCleaningBubbles(true);
    setCleanProgress({ current: 0, total: selectedScraped.length });
    setConsoleLogs((prev) => [
      `[Speech Bubbles] Starting batch clean bubbles job for ${selectedScraped.length} selected images...`,
      ...prev,
    ]);

    let completedCount = 0;
    const errors: string[] = [];

    try {
      for (const url of selectedScraped) {
        setBubbleCroppingImgUrl(url);
        try {
          const response = await fetchWithInterceptor("/api/remove-speech-bubbles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: url,
              method: bubbleEraseMethod,
              sensitivity: bubbleSensitivity,
              detection_style: bubbleDetectionStyle,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();

          if (data.success && data.url) {
            setScrapedImages((prev) => prev.map((img) => (img === url ? data.url : img)));
            setSelectedScraped((prev) => prev.map((img) => (img === url ? data.url : img)));
            setPanels((prev) => prev.map((p) => (p.image_url === url ? { ...p, image_url: data.url } : p)));
          }
        } catch (err: any) {
          errors.push(`Image: ${url.substring(0, 40)}... - Error: ${err.message}`);
        } finally {
          completedCount++;
          setCleanProgress({ current: completedCount, total: selectedScraped.length });
        }
      }
    } catch (outerErr: any) {
      errors.push(`Critical error in batch bubble cleaning: ${outerErr.message}`);
    } finally {
      setIsCleaningBubbles(false);
      setCleanProgress(null);
      setBubbleCroppingImgUrl(null);
    }

    if (errors.length > 0) {
      addNotification(`Batch cleaning speech bubbles completed with ${errors.length} errors.`, "warning");
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Batch cleaning finished with errors:\n${errors.join("\n")}`,
        ...prev,
      ]);
    } else {
      addNotification(`Successfully cleaned speech bubbles for ${selectedScraped.length} images!`, "success");
      setConsoleLogs((prev) => [
        `[Speech Bubbles] ✓ Batch clean speech bubbles job completed successfully!`,
        ...prev,
      ]);
    }
    setSelectedScraped([]);
  };

  const handleAutoCropSelected = async () => {
    if (selectedScraped.length === 0) return;
    setIsBatchCropping(true);
    setBatchProgress({ current: 0, total: selectedScraped.length });
    setConsoleLogs((prev) => [
      `[Auto Cropper] Starting batch auto crop job for ${selectedScraped.length} selected images...`,
      ...prev,
    ]);

    let completedCount = 0;
    const errors: string[] = [];
    const newSlicedUrlsMap: Record<string, string[]> = {};

    try {
      for (const url of selectedScraped) {
        setCroppingImgUrl(url);
        try {
          const response = await fetchWithInterceptor("/api/detect-panels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: url,
              sensitivity: cropSensitivity,
              backgroundColorMode: cropBackgroundMode,
              aspectRatio: aspectRatioLock,
              minAreaPct: minPanelAreaPct,
              mergeThreshold: overlapMergeThreshold,
              strategy: useLocalCV ? "local-cv" : "balanced",
              model: selectedModel,
              closeKernelSize: 15,
              minHeightPx: 50,
            }),
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();

          if (data.success && Array.isArray(data.panels) && data.panels.length > 0) {
            const croppedUrls: string[] = [];
            for (let i = 0; i < data.panels.length; i++) {
              const box = data.panels[i];

              // The /api/detect-panels backend already crops each panel and
              // returns a ready-to-use croppedUrl. Use it directly to avoid a
              // redundant second edit-image round-trip that was silently
              // re-cropping the wrong region.
              if (box.croppedUrl) {
                croppedUrls.push(box.croppedUrl);
              } else {
                // Fallback for any backend variant that doesn't embed croppedUrl
                const cropResponse = await fetchWithInterceptor("/api/edit-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    url: url,
                    cropTop: box.cropTop,
                    cropBottom: box.cropBottom,
                    cropLeft: box.cropLeft,
                    cropRight: box.cropRight,
                    autoTrim: true,
                    padding: cropPaddingPx,
                  }),
                });
                if (!cropResponse.ok) throw new Error(`Edit-image HTTP ${cropResponse.status}`);
                const cropData = await cropResponse.json();
                croppedUrls.push(cropData.url);
              }
            }
            newSlicedUrlsMap[url] = croppedUrls;
          } else {
            newSlicedUrlsMap[url] = [url];
          }
        } catch (err: any) {
          errors.push(`Image: ${url.substring(0, 40)}... - Error: ${err.message}`);
          newSlicedUrlsMap[url] = [url];
        } finally {
          completedCount++;
          setBatchProgress({ current: completedCount, total: selectedScraped.length });
        }
      }
    } catch (outerErr: any) {
      errors.push(`Critical error in batch auto-crop: ${outerErr.message}`);
    } finally {
      setIsBatchCropping(false);
      setBatchProgress(null);
      setCroppingImgUrl(null);
    }

    setScrapedImages((prev) => {
      const copy: string[] = [];
      prev.forEach((img) => {
        if (newSlicedUrlsMap[img]) {
          copy.push(...newSlicedUrlsMap[img]);
        } else {
          copy.push(img);
        }
      });
      return copy;
    });

    if (errors.length > 0) {
      addNotification(`Batch auto crop completed with ${errors.length} errors.`, "warning");
      setConsoleLogs((prev) => [
        `[Auto Cropper] Batch auto crop finished with errors:\n${errors.join("\n")}`,
        ...prev,
      ]);
    } else {
      addNotification(`Successfully sliced & auto-cropped panels!`, "success");
      setConsoleLogs((prev) => [
        `[Auto Cropper] ✓ Batch auto crop job completed successfully!`,
        ...prev,
      ]);
    }
    setSelectedScraped([]);
  };

  return {
    isCleaningBubbles,
    cleanProgress,
    bubbleCroppingImgUrl,
    isBatchCropping,
    batchProgress,
    croppingImgUrl,
    handleCleanBubblesSelected,
    handleAutoCropSelected,
  };
}
