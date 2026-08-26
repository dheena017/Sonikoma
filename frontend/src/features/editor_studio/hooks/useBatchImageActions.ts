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

    let completedCount = 0;
    const errors: string[] = [];
    const newSlicedUrlsMap: Record<string, string[]> = {};

    try {
      abortBatchRef.current.aborted = false;
      await processWithConcurrency(
        finalTargetImages,
        4,
        async (url) => {
          if (abortBatchRef.current.aborted)
            throw new Error("Cancelled by user");
          setCroppingImgUrl(url);
          const controller = new AbortController();
          abortControllersRef.current.add(controller);
          let detectedLayout: any = null;
          try {
            // ── STEP 1: Detect Layout & Comic Format (Small vs Tall) ───────
            try {
              const typeInfo = await api.detectPanelCropType(
                fetchWithInterceptor,
                { url: url },
                { signal: controller.signal }
              );
              if (typeInfo && typeInfo.success) {
                detectedLayout = typeInfo;
                console.log(
                  `[Auto Cropper: Layout] Detected ${typeInfo.type_label} (${typeInfo.width}x${typeInfo.height}px, ratio: ${typeInfo.aspect_ratio}, flow: ${typeInfo.reading_flow})`
                );
              }
            } catch (typeErr) {
              console.warn("[Auto Cropper] detectPanelCropType warning:", typeErr);
            }

            const isTallStrip =
              detectedLayout?.crop_type === "long_panels" ||
              (detectedLayout?.aspect_ratio != null && detectedLayout.aspect_ratio >= 2.2);

            let croppedUrls: string[] = [];

            if (!isTallStrip) {
              // ── Route 3A: Small Image 4-Directional Margin Crop ───────────
              // 1. Detect tight frame, bind nearby speech bubbles, and drop gutter SFX
              let appliedMargins: any = {};
              try {
                const detectRes = await api.detectSmallPanels(
                  fetchWithInterceptor,
                  {
                    url: url,
                    aspect_ratio: aspectRatioLock && aspectRatioLock !== "free" ? aspectRatioLock : "free",
                    auto_trim: true,
                    snap_to_frame: true,
                    merge_speech_bubbles: true,
                    filter_gutter_sfx: true,
                    bleed_padding_px: cropPaddingPx || 5,
                  },
                  { signal: controller.signal }
                );

                if (detectRes && detectRes.success && detectRes.margins) {
                  appliedMargins = detectRes.margins;
                  console.log(
                    `[Auto Cropper: Small] Snapped frame with ${detectRes.bound_speech_bubbles_count || 0} bound dialogue bubbles:`,
                    appliedMargins
                  );
                }
              } catch (detErr) {
                console.warn("[Auto Cropper] detectSmallPanels fallback:", detErr);
              }

              // 2. Execute tight crop
              try {
                const smallRes = await api.cropSmallPanels(
                  fetchWithInterceptor,
                  {
                    url: url,
                    crop_top: appliedMargins.crop_top || 0,
                    crop_bottom: appliedMargins.crop_bottom || 0,
                    crop_left: appliedMargins.crop_left || 0,
                    crop_right: appliedMargins.crop_right || 0,
                    unit: appliedMargins.unit || "pixels",
                    aspect_ratio: aspectRatioLock && aspectRatioLock !== "free" ? (aspectRatioLock as any) : "free",
                    auto_trim: true,
                    padding_px: cropPaddingPx,
                    output_format: "webp",
                    quality: 90,
                  },
                  { signal: controller.signal }
                );

                if (smallRes && smallRes.success && smallRes.url) {
                  croppedUrls = [smallRes.url];
                  console.log(
                    `[Auto Cropper] ✓ Small image cropped in ${smallRes.processing_time_ms}ms via small-panels`
                  );
                } else {
                  croppedUrls = [url];
                }
              } catch (smallErr) {
                console.warn("[Auto Cropper] cropSmallPanels fallback:", smallErr);
                croppedUrls = [url];
              }

              setConsoleLogs((prev) => [
                `[Auto Cropper] ✓ Small Image processed (${detectedLayout?.width || "auto"}x${detectedLayout?.height || "auto"}px)`,
                ...prev,
              ]);
            } else {
              // ── Route 3B: Tall Webtoon Strip Multi-Panel Batch Slicer ─────
              console.info(`[Auto Cropper] Analyzing tall strip: ${url}`);

              let detectedPanelsList: any[] = [];
              try {
                const longDetectRes = await api.detectLongPanels(
                  fetchWithInterceptor,
                  {
                    url: url,
                    sensitivity: cropSensitivity,
                    background_mode: cropBackgroundMode || "auto",
                    min_panel_height: cropMinHeightPx || 150,
                    overlap_merge_threshold: overlapMergeThreshold,
                    auto_split: autoSplitTallStrips,
                    bleed_padding_px: cropPaddingPx || 5,
                  },
                  { signal: controller.signal }
                );

                if (longDetectRes && longDetectRes.success && Array.isArray(longDetectRes.panels)) {
                  detectedPanelsList = longDetectRes.panels;
                  console.log(
                    `[Auto Cropper: Long] Detected ${detectedPanelsList.length} panels down tall strip.`
                  );
                }
              } catch (longDetErr) {
                console.warn("[Auto Cropper] detectLongPanels fallback:", longDetErr);
              }

              if (detectedPanelsList.length > 0) {
                const sortedPanels = [...detectedPanelsList].sort((a: any, b: any) => {
                  const dy = (a.y ?? 0) - (b.y ?? 0);
                  if (dy !== 0) return dy;
                  return (a.x ?? 0) - (b.x ?? 0);
                });

                try {
                  const sliceRes = await api.cropLongPanels(
                    fetchWithInterceptor,
                    {
                      url: url,
                      panels: sortedPanels,
                      bleed_guard_px: cropPaddingPx || 5,
                      background_mode: cropBackgroundMode || "auto",
                      output_format: "webp",
                      quality: 90,
                    },
                    { signal: controller.signal }
                  );

                  if (
                    sliceRes &&
                    sliceRes.success &&
                    Array.isArray(sliceRes.slices) &&
                    sliceRes.slices.length > 0
                  ) {
                    croppedUrls = sliceRes.slices
                      .sort((a: any, b: any) => a.index - b.index)
                      .map((s: any) => s.url);
                    console.log(
                      `[Auto Cropper] ✓ Batch sliced ${croppedUrls.length} panels from tall strip via long-panels`
                    );
                  } else {
                    croppedUrls = sortedPanels.map((p: any) => p.croppedUrl || url);
                  }
                } catch (sliceErr: any) {
                  console.warn("[Auto Cropper] cropLongPanels fallback:", sliceErr);
                  croppedUrls = sortedPanels.map((p: any) => p.croppedUrl || url);
                }

                setConsoleLogs((prev) => [
                  `[Auto Cropper] ✓ Tall Strip sliced into ${croppedUrls.length} panels`,
                  ...prev,
                ]);
              } else {
                croppedUrls = [url];
                setConsoleLogs((prev) => [
                  `[Auto Cropper Warning] No panels detected for tall strip ${url.substring(0, 40)}...`,
                  ...prev,
                ]);
              }
            }

            newSlicedUrlsMap[url] = croppedUrls;
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
