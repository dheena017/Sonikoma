import React, { useState } from "react";
import { NotificationType } from "../components/NotificationStack.js";
import { processWithConcurrency } from "../utils/batchUtils.js";
import * as api from "../api/index.js";

interface UseSingleImageEditsProps {
  editingImageIdx: number | null;
  scrapedImages: string[];
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: any;
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  editAutoTrim: boolean;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  audioFeedback?: any;
}

export function useSingleImageEdits({
  editingImageIdx,
  scrapedImages,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
  fetchWithInterceptor,
  editCropTop,
  editCropBottom,
  editCropLeft,
  editCropRight,
  editAutoTrim,
  addPanelsToStoryboard,
}: UseSingleImageEditsProps) {
  const [mergingIndices, setMergingIndices] = useState<number[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);

  const handleSaveEditedImage = async () => {
    if (editingImageIdx === null) return;

    const originalUrl = scrapedImages[editingImageIdx];
    setIsSavingEdit(true);
    setConsoleLogs((prev) => [
      `[Image Editor] Processing Crop & Auto-Trim operations on Frame #${
        editingImageIdx + 1
      }...`,
      `[Image Editor] Crop values → Top: ${editCropTop}% | Bottom: ${editCropBottom}% | Left: ${editCropLeft}% | Right: ${editCropRight}% | AutoTrim: ${editAutoTrim}`,
      ...prev,
    ]);

    try {
      const data = await api.editImage(fetchWithInterceptor, {
        url: originalUrl,
        cropTop: editCropTop,
        cropBottom: editCropBottom,
        cropLeft: editCropLeft,
        cropRight: editCropRight,
        autoTrim: editAutoTrim,
      });

      const croppedUrl = data.url;

      // Add directly to Timeline only
      addPanelsToStoryboard([croppedUrl]);

      setConsoleLogs((prev) => [
        `[Image Editor] [SUCCESS] Successfully cropped Frame #${
          editingImageIdx + 1
        } and added to Timeline!`,
        `[Image Editor]   - Sent (Original): ${originalUrl.substring(
          0,
          60
        )}...`,
        `[Image Editor]   - Revise (Cropped): ${croppedUrl.substring(
          0,
          60
        )}...`,
        ...prev,
      ]);
      console.log(
        `[Image Editor] Cropped Frame #${
          editingImageIdx + 1
        } and added to Timeline:`,
        { original: originalUrl, cropped: croppedUrl }
      );
      addNotification(
        `Frame #${
          editingImageIdx + 1
        } cropped and added to Timeline successfully!`,
        "success"
      );
      audioFeedback?.playTick();
    } catch (err: any) {
      setConsoleLogs((prev) => [
        `[Image Editor] [ERROR] Failed to save edits for Frame #${
          editingImageIdx + 1
        }: ${(err as any).message || "Unknown error"}`,
        ...prev,
      ]);
      if (!(err as any).intercepted) {
        addNotification(
          `Failed to save edits for Frame #${
            editingImageIdx + 1
          }. Please try again later.`,
          "error"
        );
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleSaveMultipleCuts = async (
    cuts: Array<{
      cropTop: number;
      cropBottom: number;
      cropLeft: number;
      cropRight: number;
      autoTrim: boolean;
    }>
  ) => {
    if (editingImageIdx === null || cuts.length === 0) return;

    const originalUrl = scrapedImages[editingImageIdx];
    setIsSavingEdit(true);
    setConsoleLogs((prev) => [
      `[Image Editor] Processing Batch Multiple Cut operations (${
        cuts.length
      } cuts) on Frame #${editingImageIdx + 1}...`,
      ...prev,
    ]);

    try {
      const croppedUrls = await processWithConcurrency(
        cuts,
        8,
        async (cut, index) => {
          setConsoleLogs((prev) => [
            `[Image Editor] Starting Crop Cut #${index + 1}/${cuts.length}...`,
            ...prev,
          ]);
          const data = await api.editImage(fetchWithInterceptor, {
            url: originalUrl,
            cropTop: cut.cropTop,
            cropBottom: cut.cropBottom,
            cropLeft: cut.cropLeft,
            cropRight: cut.cropRight,
            autoTrim: cut.autoTrim,
          });
          setConsoleLogs((prev) => [
            `[Image Editor] Crop Cut #${index + 1}/${cuts.length} complete.`,
            ...prev,
          ]);
          return data.url;
        }
      );

      // Add all cropped urls directly to Timeline
      addPanelsToStoryboard(croppedUrls);

      setConsoleLogs((prev) => [
        `[Image Editor] Successfully added ${cuts.length} cropped/trimmed frames to Timeline!`,
        ...prev,
      ]);
      console.log(
        `[Image Editor] Generated ${cuts.length} cuts from Frame #${
          editingImageIdx + 1
        } and added to Timeline:`,
        croppedUrls
      );
      addNotification(
        `Generated ${cuts.length} separate cuts added to Timeline!`,
        "success"
      );
      audioFeedback?.playTick();
    } catch (err: any) {
      console.error(
        `[Image Editor] Batch crop failed for Frame #${editingImageIdx + 1}:`,
        err
      );
      if (!(err as any).intercepted) {
        addNotification(
          `Batch crop failed. Please check the edits and try again.`,
          "error"
        );
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleStitchWithNext = async (idx: number) => {
    if (idx < 0 || idx >= scrapedImages.length - 1) return;

    setMergingIndices((prev) => [...prev, idx]);
    setConsoleLogs((prev) => [
      `[Stitcher] Merging Frame #${idx + 1} with Frame #${
        idx + 2
      } vertically...`,
      ...prev,
    ]);

    try {
      const img1 = scrapedImages[idx];
      const img2 = scrapedImages[idx + 1];

      const data = await api.mergeImages(fetchWithInterceptor, {
        urls: [img1, img2],
      });
      const stitchedUrl = data.url;

      setScrapedImages((prev) => {
        const copy = [...prev];
        copy.splice(idx, 2, stitchedUrl);
        return copy;
      });

      setSelectedScraped((prev) => {
        const hasImg1 = prev.includes(img1);
        const hasImg2 = prev.includes(img2);
        const filtered = prev.filter((img) => img !== img1 && img !== img2);
        if (hasImg1 || hasImg2) {
          return [...filtered, stitchedUrl];
        }
        return filtered;
      });

      setConsoleLogs((prev) => [
        `[Stitcher] [SUCCESS] Successfully merged Frame #${
          idx + 1
        } and Frame #${idx + 2} vertically into a new seamless frame asset!`,
        ...prev,
      ]);
      console.log(
        `[Stitcher] Merged frames ${idx + 1} & ${idx + 2} -> ${stitchedUrl}`
      );
      addNotification(
        `Frames #${idx + 1} and #${idx + 2} stitched successfully!`,
        "success"
      );
      audioFeedback?.playTick();
      return stitchedUrl;
    } catch (err: any) {
      setConsoleLogs((prev) => [
        `[Stitcher] [ERROR] Merge failed for Frame #${idx + 1} + #${idx + 2}: ${
          (err as any).message || "Unknown error"
        }`,
        ...prev,
      ]);
      if (!(err as any).intercepted) {
        addNotification(
          `Stitching failed. Please try again or refresh the page.`,
          "error"
        );
      }
      return null;
    } finally {
      setMergingIndices((prev) => prev.filter((i) => i !== idx));
    }
  };

  return {
    mergingIndices,
    isSavingEdit,
    handleSaveEditedImage,
    handleSaveMultipleCuts,
    handleStitchWithNext,
  };
}
