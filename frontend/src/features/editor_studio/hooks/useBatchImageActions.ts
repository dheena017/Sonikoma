import { LogEntry, normalizeLog } from "@/types/logs";
import React, { useState, useCallback, useMemo } from "react";
import { GeneratedPanel } from "@/types";
import { NotificationType } from "@/features/app_notification";
import { processWithConcurrency } from "@/shared/utils/batchUtils";
import * as api from "@/api/index";

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
  const abortControllersRef = React.useRef<Set<AbortController>>(new Set());

  const handleCancelBatch = useCallback(() => {
    abortBatchRef.current.aborted = true;
    abortControllersRef.current.forEach((controller) => {
      try {
        controller.abort();
      } catch (e) {}
    });
    abortControllersRef.current.clear();
    setIsBatchCropping(false);
    setIsCleaningBubbles(false);
    setBatchProgress(null);
    setCleanProgress(null);
    setCroppingImgUrl(null);
    setBubbleCroppingImgUrl(null);
    addNotification("Cancelled batch operation.", "info");
  }, [
    addNotification,
    setIsBatchCropping,
    setIsCleaningBubbles,
    setBatchProgress,
    setCleanProgress,
    setCroppingImgUrl,
    setBubbleCroppingImgUrl,
  ]);

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
          const controller = new AbortController();
          abortControllersRef.current.add(controller);
          try {
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
              { signal: controller.signal }
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
            abortControllersRef.current.delete(controller);
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
    // Fall back to all images when nothing is explicitly selected
    const targetImages =
      selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (targetImages.length === 0) {
      addNotification(
        "No images available to crop — scrape some images first.",
        "warning"
      );
      return;
    }

    // Reset stale panel state, window cache, and selection
    setPanels([]);
    (window as any).__lastDetectedPanels = [];

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

    let finalTargetImages = targetImages;
    let isStitchedCombined = false;

    if (targetImages.length > 1) {
      setConsoleLogs((prev) => [
        `[Auto Cropper] Merging ${targetImages.length} images into a single long strip for full-page panel detection...`,
        ...prev,
      ]);
      console.group(
        `[DBG] Auto Crop — Pre-Stitch (${targetImages.length} images)`
      );
      console.log("[DBG] Source image URLs:", targetImages);
      console.groupEnd();
      try {
        const mergeData = await api.mergeImages(fetchWithInterceptor, {
          urls: targetImages,
        });
        console.log("[DBG] mergeImages response:", mergeData);
        if (mergeData && mergeData.url) {
          finalTargetImages = [mergeData.url];
          isStitchedCombined = true;
          console.log("[DBG] Stitched URL:", mergeData.url);
          setConsoleLogs((prev) => [
            `[Auto Cropper] Successfully stitched full long strip! Running panel detection on combined image...`,
            ...prev,
          ]);
        }
      } catch (mergeErr: any) {
        console.warn(
          "[Auto Cropper] Pre-crop image stitching failed, proceeding on individual images:",
          mergeErr
        );
      }
    }

    let completedCount = 0;
    const errors: string[] = [];
    const newSlicedUrlsMap: Record<string, string[]> = {};

    try {
      abortBatchRef.current.aborted = false;
      await processWithConcurrency(
        finalTargetImages,
        8,
        async (url) => {
          if (abortBatchRef.current.aborted)
            throw new Error("Cancelled by user");
          setCroppingImgUrl(url);
          const controller = new AbortController();
          abortControllersRef.current.add(controller);
          try {
            const detectPayload = {
              url: url,
              sensitivity: cropSensitivity,
              backgroundColorMode: cropBackgroundMode || "auto",
              aspectRatio: aspectRatioLock,
              minAreaPct: minPanelAreaPct / 100.0,
              mergeThreshold: overlapMergeThreshold,
              strategy: useLocalCV ? "local-cv" : "balanced",
              model: cropModel,
              cannyLow: cropCannyLow,
              cannyHigh: cropCannyHigh,
              closeKernelSize: cropCloseKernelSize,
              minHeightPx: cropMinHeightPx || 150,
              paddingPx: cropPaddingPx,
              autoSplit: autoSplitTallStrips,
              useYolo: true,
              guidanceInstructions: cropGuidance,
              focusMode: cropFocusMode,
            };
            console.group(`[DBG] detectPanels — Request`);
            console.log("[DBG] Payload:", detectPayload);
            console.groupEnd();
            const data = await api.detectPanels(
              fetchWithInterceptor,
              detectPayload,
              { signal: controller.signal }
            );
            console.group(`[DBG] detectPanels — Response`);
            console.log(
              "[DBG] success:",
              data.success,
              "| total_panels:",
              data.total_panels,
              "| imageWidth:",
              data.imageWidth,
              "| imageHeight:",
              data.imageHeight
            );
            console.log(
              "[DBG] isTallStrip:",
              data.isTallStrip,
              "| fallback:",
              data.fallback
            );
            console.log(
              "[DBG] Raw panels count:",
              Array.isArray(data.panels) ? data.panels.length : "N/A"
            );
            console.groupEnd();
            if (abortBatchRef.current.aborted)
              throw new Error("Cancelled by user");
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
                // Sort strictly top-to-bottom (y pixel), then left-to-right (x pixel).
                // Using pixel coords is accurate for both webtoon strips and manga grids.
                // The old 4%-cropTop row-band method reordered panels incorrectly on tall
                // stitched strips (one band = ~2400px on a 60k-px strip).
                const sortedPanels = [...data.panels].sort((a: any, b: any) => {
                  const dy = (a.y ?? 0) - (b.y ?? 0);
                  if (dy !== 0) return dy;
                  return (a.x ?? 0) - (b.x ?? 0);
                });
                (window as any).__lastDetectedPanels = sortedPanels;
                const totalPanelsCount =
                  data.total_panels || sortedPanels.length;
                const imgW = data.imageWidth || "auto";
                const imgH = data.imageHeight || "auto";
                console.log(
                  `[Auto Cropper Debug JSON] Total panels: ${totalPanelsCount}, Image size: ${imgW}x${imgH}px`,
                  sortedPanels
                );
                // ── Detailed gap analysis ────────────────────────────────────────
                console.group(
                  `[DBG] Panel Sorted Order — ${sortedPanels.length} panels (image: ${imgW}x${imgH}px)`
                );
                let prevYEnd = 0;
                const panelDebugRows = sortedPanels.map((p: any, i: number) => {
                  const gap = p.y - prevYEnd;
                  const row = {
                    "#": i + 1,
                    id: p.id,
                    y_start: p.y,
                    y_end: p.y + p.height,
                    height: p.height,
                    x: p.x,
                    width: p.width,
                    gap_from_prev: gap,
                    croppedUrl: p.croppedUrl ? "✓" : "✗",
                  };
                  if (gap > 0)
                    console.warn(
                      `[DBG] ⚠ GAP ${gap}px before panel ${
                        i + 1
                      } (prev ended at y=${prevYEnd}, this starts at y=${p.y})`
                    );
                  prevYEnd = p.y + p.height;
                  return row;
                });
                console.table(panelDebugRows);
                const totalGap = sortedPanels.reduce(
                  (acc: number, p: any, i: number) => {
                    if (i === 0) return p.y; // gap from 0 to first panel
                    return (
                      acc +
                      (p.y -
                        (sortedPanels[i - 1].y + sortedPanels[i - 1].height))
                    );
                  },
                  0
                );
                const coveredH = sortedPanels.reduce(
                  (acc: number, p: any) => acc + p.height,
                  0
                );
                console.log(
                  `[DBG] Coverage: ${coveredH}px covered out of ${imgH}px total | Total gap: ${totalGap}px | Panel 1 starts at y=${
                    sortedPanels[0]?.y ?? "N/A"
                  }`
                );
                console.groupEnd();
                const serverCroppedCount = sortedPanels.filter(
                  (b: any) => !!b.croppedUrl
                ).length;
                setConsoleLogs((prev) => [
                  `[Auto Cropper] Image Size: ${imgW}x${imgH}px | Total Panels: ${totalPanelsCount}`,
                  serverCroppedCount === sortedPanels.length
                    ? `[Auto Cropper] ✓ All ${sortedPanels.length} panels cropped server-side (no extra API calls needed)`
                    : `[Auto Cropper] ${serverCroppedCount}/${
                        sortedPanels.length
                      } panels pre-cropped server-side, ${
                        sortedPanels.length - serverCroppedCount
                      } need edit API fallback`,
                  ...prev,
                ]);
                const croppedResults = await Promise.all(
                  sortedPanels.map(async (box: any, boxIdx: number) => {
                    if (box.croppedUrl)
                      return { orderIndex: boxIdx, url: box.croppedUrl };
                    const cropData = await api.submitImageEdits(
                      fetchWithInterceptor,
                      {
                        url: url,
                        cropTop: box.cropTop,
                        cropBottom: box.cropBottom,
                        cropLeft: box.cropLeft,
                        cropRight: box.cropRight,
                        autoTrim: false, // detection coordinates are already precise; autoTrim would over-trim artwork
                        padding: cropPaddingPx,
                        sensitivity: cropSensitivity,
                        backgroundColorMode: cropBackgroundMode,
                      }
                    );
                    return { orderIndex: boxIdx, url: cropData.url };
                  })
                );

                const croppedUrls = croppedResults
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((res) => res.url);

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
            abortControllersRef.current.delete(controller);
            completedCount++;
            setBatchProgress({
              current: completedCount,
              total: finalTargetImages.length,
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
      if (
        isStitchedCombined &&
        finalTargetImages[0] &&
        newSlicedUrlsMap[finalTargetImages[0]]
      ) {
        // Multi-select stitch path: replace the selected source images (targetImages)
        // in-place with the new cropped panels. All other images stay untouched.
        const selectedSet = new Set(targetImages);
        let injected = false;
        const copy: string[] = [];
        prev.forEach((img) => {
          if (selectedSet.has(img)) {
            // Insert the panels only once, at the position of the first selected image
            if (!injected) {
              copy.push(...newSlicedUrlsMap[finalTargetImages[0]]);
              injected = true;
            }
            // Skip the remaining selected images (they're replaced by panels)
          } else {
            copy.push(img);
          }
        });
        return copy;
      }
      // Single image path: replace each cropped image with its panel slices
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
    scrapedImages,
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
