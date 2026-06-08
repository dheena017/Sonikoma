import { Slice } from "../components/crop/types";
import { NotificationType } from "../components/NotificationStack";

interface UseCropEditorPipelinesProps {
  activeFetch: typeof fetch;
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  imageUrl: string | null;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;

  eraseMethod: string;
  sensitivity: number;
  dilation: number;
  inpaintRadius: number;
  detectionStyle: string;
  debugMode: boolean;
  fillColor: string;
  gpu: boolean;

  setIsTransforming: (val: boolean) => void;
  setIsMerging: (val: boolean) => void;
  setIsCleaning: (val: boolean) => void;
  setIsCroppingSlice: (id: string | null) => void;
  setSlicesCroppedCount: React.Dispatch<React.SetStateAction<number>>;
  slicesCroppedCount: number;
  setIsDetecting: (val: boolean) => void;
  setDetectedBoxes: React.Dispatch<React.SetStateAction<any[]>>;
  setIsAiDetecting: (val: boolean) => void;
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  setSelectedSliceId: (id: string | null) => void;

  pushHistory: () => void;
}

export function useCropEditorPipelines({
  activeFetch,
  editingImageIdx,
  setEditingImageIdx,
  imageUrl,
  scrapedImages,
  setScrapedImages,
  setPanels,
  setConsoleLogs,
  addNotification,

  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,

  eraseMethod,
  sensitivity,
  dilation,
  inpaintRadius,
  detectionStyle,
  debugMode,
  fillColor,
  gpu,

  setIsTransforming,
  setIsMerging,
  setIsCleaning,
  setIsCroppingSlice,
  setSlicesCroppedCount,
  slicesCroppedCount,
  setIsDetecting,
  setDetectedBoxes,
  setIsAiDetecting,
  setSlices,
  setSelectedSliceId,

  pushHistory,
}: UseCropEditorPipelinesProps) {

  const handleTransform = async (type: "rotate" | "flip", value: string) => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
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
    setIsCleaning(true);
    try {
      const response = await activeFetch("/api/remove-speech-bubble", {
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

      setScrapedImages((prev) => {
        const copy = [...prev];
        copy.splice(editingImageIdx + 1 + slicesCroppedCount, 0, data.url);
        return copy;
      });

      setSlicesCroppedCount((prev) => prev + 1);

      if (setConsoleLogs) {
        setConsoleLogs((prev) => [
          `[Image Editor] Extracted cut from Frame #${editingImageIdx + 1}`,
          ...prev,
        ]);
      }

      handleDeleteSlice(slice.id, e);
      addNotification("Extracted Cut!", "success");
    } catch (err: any) {
      addNotification(`Failed to crop: ${err.message}`, "error");
    } finally {
      setIsCroppingSlice(null);
    }
  };

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
        const hasCroppedUrls = data.panels.every((p: any) => p.croppedUrl);
        if (hasCroppedUrls && setScrapedImages) {
          const croppedUrls = data.panels.map((p: any) => p.croppedUrl);

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

        const newSlices = data.panels.map((box: any, index: number) => ({
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
          const initialSlices = data.panels.map((box: any, index: number) => ({
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
          addNotification("No panels detected.", "warning");
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
    handleTransform,
    handleMergeWithNext,
    handleCleanSingleBubble,
    handleDeleteSlice,
    handleCropSingleSlice,
    handleAiCrop,
    handleDetectPanels,
  };
}
