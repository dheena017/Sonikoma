import React, { useState } from "react";
import { GeneratedPanel } from "../types";
import { NotificationType } from "../components/NotificationStack";

interface UseBatchImageActionsProps {
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  scrapedImages: string[];
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;

  bubbleEraseMethod: string;
  bubbleSensitivity: number;
  bubbleDetectionStyle: string;
  bubbleDilation: number;
  bubbleInpaintRadius: number;

  // crop configs
  cropSensitivity: number;
  cropBackgroundMode: string;
  aspectRatioLock: string;
  minPanelAreaPct: number;
  overlapMergeThreshold: number;
  useLocalCV: boolean;
  selectedModel: string;
  cropPaddingPx: number;
  cropModel: string;
  cropMinHeightPx: number;
  cropCannyLow: number;
  cropCannyHigh: number;
  cropCloseKernelSize: number;

  isCleaningBubbles: boolean;
  setIsCleaningBubbles: React.Dispatch<React.SetStateAction<boolean>>;
  cleanProgress: { current: number; total: number } | null;
  setCleanProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number } | null>>;
  bubbleCroppingImgUrl: string | null;
  setBubbleCroppingImgUrl: React.Dispatch<React.SetStateAction<string | null>>;

  isBatchCropping: boolean;
  setIsBatchCropping: React.Dispatch<React.SetStateAction<boolean>>;
  batchProgress: { current: number; total: number } | null;
  setBatchProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number } | null>>;
  croppingImgUrl: string | null;
  setCroppingImgUrl: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useBatchImageActions({
  selectedScraped,
  setSelectedScraped,
  scrapedImages,
  setScrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,

  bubbleEraseMethod,
  bubbleSensitivity,
  bubbleDetectionStyle,
  bubbleDilation,
  bubbleInpaintRadius,

  cropSensitivity,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  overlapMergeThreshold,
  useLocalCV,
  selectedModel,
  cropPaddingPx,
  cropModel,
  cropMinHeightPx,
  cropCannyLow,
  cropCannyHigh,
  cropCloseKernelSize,

  isCleaningBubbles,
  setIsCleaningBubbles,
  cleanProgress,
  setCleanProgress,
  bubbleCroppingImgUrl,
  setBubbleCroppingImgUrl,
  isBatchCropping,
  setIsBatchCropping,
  batchProgress,
  setBatchProgress,
  croppingImgUrl,
  setCroppingImgUrl,
}: UseBatchImageActionsProps) {

  const handleCleanBubblesSelected = async () => {
    const targetImages = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (targetImages.length === 0) {
      addNotification("No images available for bubble cleaning.", "warning");
      return;
    }
    console.log(`[Speech Bubbles] Starting batch clean on ${targetImages.length} images`, targetImages);
    setIsCleaningBubbles(true);
    setCleanProgress({ current: 0, total: targetImages.length });
    setConsoleLogs((prev) => [
      `[Speech Bubbles] Starting batch clean bubbles job for ${targetImages.length} images...`,
      ...prev,
    ]);

    let completedCount = 0;
    const errors: string[] = [];

    try {
      for (const url of targetImages) {
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
              dilation: bubbleDilation,
              inpaint_radius: bubbleInpaintRadius,
            }),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();

          if (data.success && data.url) {
            setScrapedImages((prev) => prev.map((img) => (img === url ? data.url : img)));
            setSelectedScraped((prev) => prev.map((img) => (img === url ? data.url : img)));
            setPanels((prev) => prev.map((p) => (p.image_url === url ? { ...p, image_url: data.url } : p)));
          } else {
            const errMsg = data.message || "Failed to clean speech bubbles on this image.";
            throw new Error(errMsg);
          }
        } catch (err: any) {
          console.error(`[Speech Bubbles] Error cleaning image ${url}:`, err);
          errors.push(`Image: ${url.substring(0, 40)}... - Error: ${err.message}`);
        } finally {
          completedCount++;
          setCleanProgress({ current: completedCount, total: targetImages.length });
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
      addNotification(`Batch cleaning speech bubbles completed with ${errors.length} errors.`, "error");
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Batch cleaning finished with errors:\n${errors.join("\n")}`,
        ...prev,
      ]);
    } else {
      addNotification(`Successfully cleaned speech bubbles for ${targetImages.length} images!`, "success");
      setConsoleLogs((prev) => [
        `[Speech Bubbles] ✓ Batch clean speech bubbles job completed successfully!`,
        ...prev,
      ]);
    }
    setSelectedScraped([]);
  };

  const handleAutoCropSelected = async () => {
    const targetImages = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (targetImages.length === 0) {
      addNotification("No images available for auto cropping.", "warning");
      return;
    }
    console.log(`[Auto Cropper] Starting batch auto-crop on ${targetImages.length} images`, targetImages);
    setIsBatchCropping(true);
    setBatchProgress({ current: 0, total: targetImages.length });
    setConsoleLogs((prev) => [
      `[Auto Cropper] Starting batch auto crop job for ${targetImages.length} images...`,
      ...prev,
    ]);

    let completedCount = 0;
    const errors: string[] = [];
    const newSlicedUrlsMap: Record<string, string[]> = {};

    try {
      for (const url of targetImages) {
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
              minAreaPct: minPanelAreaPct / 100.0,
              mergeThreshold: overlapMergeThreshold,
              strategy: useLocalCV ? "local-cv" : "balanced",
              model: cropModel,
              cannyLow: cropCannyLow,
              cannyHigh: cropCannyHigh,
              closeKernelSize: cropCloseKernelSize,
              minHeightPx: cropMinHeightPx,
            }),
          });

          if (!response.ok) {
            let errMsg = `HTTP ${response.status}`;
            try {
              const errorData = await response.json();
              if (errorData?.detail) {
                errMsg = errorData.detail;
              }
            } catch (_) {}
            throw new Error(errMsg);
          }
          const data = await response.json();
          if (data.fallback) {
            setConsoleLogs((prev) => [
              `[Auto Cropper Fallback] AI detection failed on ${url.substring(0, 40)}..., fell back to local CV: ${data.message}`,
              ...prev,
            ]);
          }

          if (data.success && Array.isArray(data.panels)) {
            if (data.panels.length > 0) {
              const croppedUrls: string[] = [];
              for (let i = 0; i < data.panels.length; i++) {
                const box = data.panels[i];

                if (box.croppedUrl) {
                  croppedUrls.push(box.croppedUrl);
                } else {
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
              setConsoleLogs((prev) => [
                `[Auto Cropper Warning] No panels detected for ${url.substring(0, 40)}... - keeping original image as a single panel.`,
                ...prev,
              ]);
            }
          } else {
            const errMsg = data.message || "No panels detected or backend service unavailable.";
            throw new Error(errMsg);
          }
        } catch (err: any) {
          console.error(`[Auto Cropper] Error cropping image ${url}:`, err);
          errors.push(`Image: ${url.substring(0, 40)}... - Error: ${err.message}`);
          newSlicedUrlsMap[url] = [url];
        } finally {
          completedCount++;
          setBatchProgress({ current: completedCount, total: targetImages.length });
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
      addNotification(`Batch auto crop completed with ${errors.length} errors.`, "error");
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
