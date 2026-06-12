import React from "react";
import { Slice } from "../components/crop/types";
import { NotificationType } from "../components/NotificationStack";

interface UseImageTransformProps {
  activeFetch: typeof fetch;
  editingImageIdx: number | null;
  imageUrl: string | null;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  setIsTransforming: (val: boolean) => void;
  setIsMerging: (val: boolean) => void;
  setIsCleaning: (val: boolean) => void;
  setIsCroppingSlice: (id: string | null) => void;
  setSlicesCroppedCount: React.Dispatch<React.SetStateAction<number>>;
  slicesCroppedCount: number;
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  setSelectedSliceId: (id: string | null) => void;
  pushHistory: () => void;
  eraseMethod: string;
  sensitivity: number;
  dilation: number;
  inpaintRadius: number;
  detectionStyle: string;
  debugMode: boolean;
  fillColor: string;
  gpu: boolean;
  addPanelsToStoryboard: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
}

export function useImageTransform({
  activeFetch,
  editingImageIdx,
  imageUrl,
  scrapedImages,
  setScrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,
  setIsTransforming,
  setIsMerging,
  setIsCleaning,
  setIsCroppingSlice,
  setSlicesCroppedCount,
  slicesCroppedCount,
  setSlices,
  setSelectedSliceId,
  pushHistory,
  eraseMethod,
  sensitivity,
  dilation,
  inpaintRadius,
  detectionStyle,
  debugMode,
  fillColor,
  gpu,
  addPanelsToStoryboard,
}: UseImageTransformProps) {

  const handleTransform = async (type: "rotate" | "flip", value: string) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    console.log(`[Image Editor] Transform requested: ${type} with value: ${value} on image #${editingImageIdx + 1}`);
    setIsTransforming(true);
    try {
      const response = await activeFetch("/api/transform-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl, type, value }),
      });
      if (!response.ok) throw new Error("Transform failed: " + response.status);
      const data = await response.json();
      if (data.url && setScrapedImages) {
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy[editingImageIdx] = data.url;
          return copy;
        });
        addNotification(
          type === "rotate" ? `Rotated ${value}°` : `Flipped ${value === "h" ? "Horizontally" : "Vertically"}`,
          "success"
        );
      }
    } catch (err: any) {
      console.error(`[Image Editor] Transform failed:`, err);
      addNotification(`Transform failed: ${err.message}`, "error");
    } finally {
      setIsTransforming(false);
    }
  };

  const handleMergeWithNext = async (
    count: number,
    config: { direction: "next" | "prev"; layout: "vertical" | "horizontal"; spacing: number; spacingColor: string; scaleToFit: boolean; alignMode: "center" | "start" | "end"; padding: number; } = { direction: "next", layout: "vertical", spacing: 0, spacingColor: "white", scaleToFit: true, alignMode: "center", padding: 0 }
  ) => {
    if (editingImageIdx === null) return;

    let urlsToMerge: string[] = [];
    let spliceStart = editingImageIdx;

    if (config.direction === "next") {
      urlsToMerge = scrapedImages.slice(editingImageIdx, editingImageIdx + count + 1);
    } else {
      spliceStart = Math.max(0, editingImageIdx - count);
      urlsToMerge = scrapedImages.slice(spliceStart, editingImageIdx + 1);
    }

    if (urlsToMerge.length < 2) return;
    console.log(`[Stitcher] Merging ${urlsToMerge.length} images starting from index ${spliceStart}`, urlsToMerge);
    setIsMerging(true);
    try {
      const response = await activeFetch("/api/stitch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: urlsToMerge,
          layout: config.layout,
          spacing: config.spacing,
          spacingColor: config.spacingColor,
          scaleToFit: config.scaleToFit,
          alignMode: config.alignMode,
          padding: config.padding
        }),
      });
      if (!response.ok) throw new Error("Merge failed: " + response.status);
      const data = await response.json();
      if (data.url && setScrapedImages) {
        const stitchedUrl = data.url;
        setScrapedImages((prev) => {
          const copy = [...prev];
          copy.splice(spliceStart, count + 1, stitchedUrl);
          return copy;
        });
        addNotification(
          `Merged ${count + 1} frames into 1 panel successfully!`,
          "success"
        );
      }
    } catch (err: any) {
      console.error(`[Stitcher] Merge failed:`, err);
      addNotification(`Merge failed: ${err.message}`, "error");
    } finally {
      setIsMerging(false);
    }
  };

  const handleCleanSingleBubble = async (
    ymin: number,
    xmin: number,
    ymax: number,
    xmax: number,
    text: string
  ) => {
    if (editingImageIdx === null || !imageUrl) return;
    console.log(`[Speech Bubbles] Cleaning single bubble on image #${editingImageIdx + 1}`, { box: { ymin, xmin, ymax, xmax }, text });
    setIsCleaning(true);
    try {
      const response = await activeFetch("/api/remove-speech-bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          box: { ymin, xmin, ymax, xmax },
          text,
          method: eraseMethod,
          sensitivity,
          dilation,
          inpaint_radius: inpaintRadius,
          detection_style: detectionStyle,
          debug_mode: debugMode,
          fill_color: eraseMethod === "solid_color" ? fillColor : "",
          gpu,
        }),
      });
      if (!response.ok) throw new Error(`Single bubble clean failed: ${response.status}`);
      const data = await response.json();
      if (data.success && data.url) {
        if (setScrapedImages) {
          setScrapedImages((prev) => {
            const copy = [...prev];
            copy[editingImageIdx] = data.url;
            return copy;
          });
        }
        if (setPanels) {
          setPanels((prev) =>
            prev.map((p) =>
              p.image_url === imageUrl ? { ...p, image_url: data.url } : p
            )
          );
        }
        addNotification("Cleaned single bubble successfully", "success");
      }
    } catch (err: any) {
      console.error(err);
      addNotification(err.message || "Failed to clean bubble", "error");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleDeleteSlice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    pushHistory();
    setSlices((prev) => prev.filter((s) => s.id !== id));
    setSelectedSliceId(null);
  };

  const handleCropSingleSlice = async (slice: Slice, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingImageIdx === null || !setScrapedImages) return;
    const originalUrl = scrapedImages[editingImageIdx];
    console.log(`[Image Editor] Cropping single slice ${slice.id} from image #${editingImageIdx + 1}`, slice);

    setIsCroppingSlice(slice.id);
    try {
      const response = await activeFetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: originalUrl,
          cropTop: slice.cropTop,
          cropBottom: slice.cropBottom,
          cropLeft: slice.cropLeft,
          cropRight: slice.cropRight,
          autoTrim: slice.autoTrim,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Add directly to Storyboard only
      addPanelsToStoryboard([data.url]);

      setSlicesCroppedCount((prev) => prev + 1);

      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Image Editor] Extracted cut from Frame #${editingImageIdx + 1} and added to Storyboard`,
          ...prev,
        ]);
      }

      handleDeleteSlice(slice.id, e);
      addNotification("Extracted Cut and added to Storyboard!", "success");
    } catch (err: any) {
      console.error(`[Image Editor] Single slice crop failed:`, err);
      addNotification(`Failed to crop: ${err.message}`, "error");
    } finally {
      setIsCroppingSlice(null);
    }
  };

  return {
    handleTransform,
    handleMergeWithNext,
    handleCleanSingleBubble,
    handleDeleteSlice,
    handleCropSingleSlice,
  };
}
