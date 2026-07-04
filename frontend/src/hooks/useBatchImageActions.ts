import { LogEntry, normalizeLog } from "../types/logs";
import React, { useState, useCallback, useMemo } from "react";
import { GeneratedPanel } from "../types.js";
import { NotificationType } from "../components/notification/NotificationStack.js";
import { processWithConcurrency } from "../utils/batchUtils.js";
import * as api from "../api/index.js";

interface UseBatchImageActionsProps {
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  scrapedImages: string[];
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
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
  autoSplitTallStrips: boolean;
  useLocalCV: boolean;
  selectedModel: string;
  cropPaddingPx: number;
  cropModel: string;
  cropMinHeightPx: number;
  cropCannyLow: number;
  cropCannyHigh: number;
  cropCloseKernelSize: number;
  cropGuidance: string;
  cropFocusMode: string;

  isCleaningBubbles: boolean;
  setIsCleaningBubbles: React.Dispatch<React.SetStateAction<boolean>>;
  cleanProgress: { current: number; total: number } | null;
  setCleanProgress: React.Dispatch<
    React.SetStateAction<{ current: number; total: number } | null>
  >;
  bubbleCroppingImgUrl: string | null;
  setBubbleCroppingImgUrl: React.Dispatch<React.SetStateAction<string | null>>;

  isBatchCropping: boolean;
  setIsBatchCropping: React.Dispatch<React.SetStateAction<boolean>>;
  batchProgress: { current: number; total: number } | null;
  setBatchProgress: React.Dispatch<
    React.SetStateAction<{ current: number; total: number } | null>
  >;
  croppingImgUrl: string | null;
  setCroppingImgUrl: React.Dispatch<React.SetStateAction<string | null>>;
  audioFeedback?: any;
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
  autoSplitTallStrips,
  useLocalCV,
  selectedModel,
  cropPaddingPx,
  cropModel,
  cropMinHeightPx,
  cropCannyLow,
  cropCannyHigh,
  cropCloseKernelSize,
  cropGuidance,
  cropFocusMode,

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
  audioFeedback,
}: UseBatchImageActionsProps) {
  const abortBatchRef = React.useRef({ aborted: false });
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const handleCancelBatch = useCallback(() => {
    abortBatchRef.current.aborted = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    addNotification("Cancelling batch operation...", "info");
  }, [addNotification]);

  const handleCleanBubblesSelected = useCallback(async () => {
    const targetImages = selectedScraped;
    if (targetImages.length === 0) {
      addNotification(
        "No panels selected — select panels first in the scraper deck.",
        "warning"
      );
      return;
    }
    console.log(
      `[Speech Bubbles] Starting batch clean on ${targetImages.length} images`,
      targetImages
    );
    setIsCleaningBubbles(true);
    setCleanProgress({ current: 0, total: targetImages.length });
    setConsoleLogs((prev) => [
      `[Speech Bubbles] Starting batch clean bubbles job for ${targetImages.length} images...`,
      ...prev,
    ]);

    let completedCount = 0;
    const errors: string[] = [];

    try {
      abortBatchRef.current.aborted = false;
      await processWithConcurrency(
        targetImages,
        8,
        async (url) => {
          if (abortBatchRef.current.aborted)
            throw new Error("Cancelled by user");
          setBubbleCroppingImgUrl(url);
          try {
            abortControllerRef.current = new AbortController();
            // Need to pass signal to the API call. I'll update the api.removeSpeechBubbles to accept options.
            const data = await api.removeSpeechBubbles(
              fetchWithInterceptor,
              {
                url: url,
                method: bubbleEraseMethod,
                sensitivity: bubbleSensitivity,
                detection_style: bubbleDetectionStyle,
                dilation: bubbleDilation,
                inpaint_radius: bubbleInpaintRadius,
              },
              { signal: abortControllerRef.current.signal }
            );

            if (data.success && data.url) {
              setScrapedImages((prev) =>
                prev.map((img) => (img === url ? data.url : img))
              );
              setSelectedScraped((prev) =>
                prev.map((img) => (img === url ? data.url : img))
              );
              setPanels((prev) =>
                prev.map((p) =>
                  p.image_url === url ? { ...p, image_url: data.url } : p
                )
              );
            } else {
              const errMsg =
                data.message || "Failed to clean speech bubbles on this image.";
              throw new Error(errMsg);
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              console.log(`[Speech Bubbles] Image cleaning ${url} cancelled.`);
              return;
            }
            console.error(`[Speech Bubbles] Error cleaning image ${url}:`, err);
            errors.push(
              `Image: ${url.substring(0, 40)}... - Error: ${err.message}`
            );
          } finally {
            completedCount++;
            setCleanProgress({
              current: completedCount,
              total: targetImages.length,
            });
          }
        },
        abortBatchRef.current
      );
    } catch (outerErr: any) {
      errors.push(
        `Critical error in batch bubble cleaning: ${outerErr.message}`
      );
    } finally {
      setIsCleaningBubbles(false);
      setCleanProgress(null);
      setBubbleCroppingImgUrl(null);
    }

    if (abortBatchRef.current.aborted) {
      addNotification("Batch bubble cleaning was cancelled.", "info");
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Batch cleaning cancelled by user.`,
        ...prev,
      ]);
    } else if (errors.length > 0) {
      addNotification(
        `Batch cleaning speech bubbles completed with ${errors.length} errors.`,
        "error"
      );
      setConsoleLogs((prev) => [
        `[Speech Bubbles] Batch cleaning finished with errors:\n${errors.join(
          "\n"
        )}`,
        ...prev,
      ]);
    } else {
      addNotification(
        `Successfully cleaned speech bubbles for ${targetImages.length} images!`,
        "success"
      );
      audioFeedback?.playSuccess();
      setConsoleLogs((prev) => [
        `[Speech Bubbles] ✓ Batch clean speech bubbles job completed successfully!`,
        ...prev,
      ]);
    }
    setSelectedScraped([]);
  }, [
    selectedScraped,
    addNotification,
    setConsoleLogs,
    setIsCleaningBubbles,
    setCleanProgress,
    setBubbleCroppingImgUrl,
    fetchWithInterceptor,
    bubbleEraseMethod,
    bubbleSensitivity,
    bubbleDetectionStyle,
    bubbleDilation,
    bubbleInpaintRadius,
    setScrapedImages,
    setSelectedScraped,
    setPanels,
    audioFeedback,
  ]);

  const handleAutoCropSelected = useCallback(async () => {
    const targetImages = selectedScraped;
    if (targetImages.length === 0) {
      addNotification(
        "No panels selected — select panels first in the scraper deck.",
        "warning"
      );
      return;
    }
    console.log(
      `[Auto Cropper] Starting batch auto-crop on ${targetImages.length} images`,
      targetImages
    );
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
      abortBatchRef.current.aborted = false;
      await processWithConcurrency(
        targetImages,
        8,
        async (url) => {
          if (abortBatchRef.current.aborted)
            throw new Error("Cancelled by user");
          setCroppingImgUrl(url);
          try {
            abortControllerRef.current = new AbortController();
            const data = await api.detectPanels(
              fetchWithInterceptor,
              {
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
                autoSplit: autoSplitTallStrips,
                guidanceInstructions: cropGuidance,
                focusMode: cropFocusMode,
              },
              { signal: abortControllerRef.current.signal }
            );
            if (data.fallback) {
              setConsoleLogs((prev) => [
                `[Smart Cropper Fallback] Smart Scanner detection failed on ${url.substring(
                  0,
                  40
                )}..., fell back to local CV: ${data.message}`,
                ...prev,
              ]);
              addNotification(
                `System failed (quota/connection). Fell back to local CV detection.`,
                "info"
              );
            }

            if (data.success && Array.isArray(data.panels)) {
              if (data.panels.length > 0) {
                const croppedUrls: string[] = [];
                for (let i = 0; i < data.panels.length; i++) {
                  const box = data.panels[i];

                  if (box.croppedUrl) {
                    croppedUrls.push(box.croppedUrl);
                  } else {
                    const cropData = await api.editImage(fetchWithInterceptor, {
                      url: url,
                      cropTop: box.cropTop,
                      cropBottom: box.cropBottom,
                      cropLeft: box.cropLeft,
                      cropRight: box.cropRight,
                      autoTrim: true,
                      padding: cropPaddingPx,
                      sensitivity: cropSensitivity,
                      backgroundColorMode: cropBackgroundMode,
                    });
                    croppedUrls.push(cropData.url);
                  }
                }
                newSlicedUrlsMap[url] = croppedUrls;
              } else {
                newSlicedUrlsMap[url] = [url];
                setConsoleLogs((prev) => [
                  `[Auto Cropper Warning] No panels detected for ${url.substring(
                    0,
                    40
                  )}... - keeping original image as a single panel.`,
                  ...prev,
                ]);
              }
            } else {
              const errMsg =
                data.message ||
                "No panels detected or backend service unavailable.";
              throw new Error(errMsg);
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              console.log(`[Auto Cropper] Image crop ${url} cancelled.`);
              newSlicedUrlsMap[url] = [url];
              return;
            }
            console.error(`[Auto Cropper] Error cropping image ${url}:`, err);
            errors.push(
              `Image: ${url.substring(0, 40)}... - Error: ${err.message}`
            );
            newSlicedUrlsMap[url] = [url];
          } finally {
            completedCount++;
            setBatchProgress({
              current: completedCount,
              total: targetImages.length,
            });
          }
        },
        abortBatchRef.current
      );
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

    if (abortBatchRef.current.aborted) {
      addNotification("Batch auto crop was cancelled.", "info");
      setConsoleLogs((prev) => [
        `[Auto Cropper] Batch auto crop cancelled by user.`,
        ...prev,
      ]);
    } else if (errors.length > 0) {
      addNotification(
        `Batch auto crop completed with ${errors.length} errors.`,
        "error"
      );
      setConsoleLogs((prev) => [
        `[Auto Cropper] Batch auto crop finished with errors:\n${errors.join(
          "\n"
        )}`,
        ...prev,
      ]);
    } else {
      addNotification(`Successfully sliced & auto-cropped panels!`, "success");
      audioFeedback?.playSuccess();
      setConsoleLogs((prev) => [
        `[Auto Cropper] ✓ Batch auto crop job completed successfully!`,
        ...prev,
      ]);
    }
    setSelectedScraped([]);
  }, [
    selectedScraped,
    addNotification,
    setIsBatchCropping,
    setBatchProgress,
    setConsoleLogs,
    setCroppingImgUrl,
    fetchWithInterceptor,
    cropSensitivity,
    cropBackgroundMode,
    aspectRatioLock,
    minPanelAreaPct,
    overlapMergeThreshold,
    useLocalCV,
    cropModel,
    cropCannyLow,
    cropCannyHigh,
    cropCloseKernelSize,
    cropMinHeightPx,
    autoSplitTallStrips,
    cropGuidance,
    cropFocusMode,
    cropPaddingPx,
    setScrapedImages,
    audioFeedback,
    setSelectedScraped,
  ]);

  return useMemo(
    () => ({
      isCleaningBubbles,
      cleanProgress,
      bubbleCroppingImgUrl,
      isBatchCropping,
      batchProgress,
      croppingImgUrl,
      handleCleanBubblesSelected,
      handleAutoCropSelected,
      handleCancelBatch,
    }),
    [
      isCleaningBubbles,
      cleanProgress,
      bubbleCroppingImgUrl,
      isBatchCropping,
      batchProgress,
      croppingImgUrl,
      handleCleanBubblesSelected,
      handleAutoCropSelected,
      handleCancelBatch,
    ]
  );
}
