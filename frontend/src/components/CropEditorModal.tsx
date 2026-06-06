import React from "react";
import { 
  Scissors, 
  X, 
  RefreshCw, 
  Crop, 
  Sparkles, 
  Plus, 
  Trash2, 
  Layers, 
  Move, 
  Check,
  Brain,
  Sliders,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Split,
  Type
} from "lucide-react";

interface Slot {
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  autoTrim: boolean;
}

import { NotificationType } from "./NotificationStack";
import { ErrorPopupDetail } from "./ErrorPopupModal";

interface CropEditorModalProps {
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  setEditAutoTrim: (val: boolean) => void;
  scrapedImages: string[];
  setScrapedImages?: React.Dispatch<React.SetStateAction<string[]>>;
  isSavingEdit: boolean;
  handleSaveEditedImage: () => Promise<void>;
  handleSaveMultipleCuts: (cuts: Slot[]) => Promise<void>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  addNotification: (message: string, type: NotificationType) => void;
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  panels?: any[];
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
  fetchWithInterceptor?: typeof fetch;
  setErrorPopup?: (err: ErrorPopupDetail | null) => void;
}

interface Slice {
  id: string;
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  autoTrim: boolean;
}

export default function CropEditorModal({
  editingImageIdx,
  setEditingImageIdx,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,
  setEditAutoTrim,
  scrapedImages,
  setScrapedImages,
  isSavingEdit,
  handleSaveEditedImage,
  handleSaveMultipleCuts,
  setConsoleLogs,
  addNotification,
  selectedScraped,
  setSelectedScraped,
  panels,
  setPanels,
  fetchWithInterceptor,
  setErrorPopup
}: CropEditorModalProps) {
  const activeFetch = fetchWithInterceptor || fetch;
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = React.useState<{ x: number; y: number } | null>(null);
  const [dragType, setDragType] = React.useState<'draw' | 'move' | null>(null);
  const [dragStartPercent, setDragStartPercent] = React.useState<{ x: number; y: number } | null>(null);
  const [originalCropBounds, setOriginalCropBounds] = React.useState<{ top: number; bottom: number; left: number; right: number } | null>(null);

  const [detectedBoxes, setDetectedBoxes] = React.useState<Array<{
    cropTop: number;
    cropBottom: number;
    cropLeft: number;
    cropRight: number;
    width: number;
    height: number;
    area: number;
  }>>([]);
  const [isDetecting, setIsDetecting] = React.useState<boolean>(false);
  const [isAiDetecting, setIsAiDetecting] = React.useState<boolean>(false);

  // Multiple Cut List
  const [slices, setSlices] = React.useState<Slice[]>([]);
  const [selectedSliceId, setSelectedSliceId] = React.useState<string | null>(null);
  const [autoPushOnDraw, setAutoPushOnDraw] = React.useState<boolean>(false);

  const [isRemovingSpeechBubbles, setIsRemovingSpeechBubbles] = React.useState<boolean>(false);
  const [activeSpeechBubbleMethod, setActiveSpeechBubbleMethod] = React.useState<'inpaint' | 'blur' | 'ocr' | null>(null);

  const [isCroppingSlice, setIsCroppingSlice] = React.useState<string | null>(null);
  const [slicesCroppedCount, setSlicesCroppedCount] = React.useState(0);

  const activeStoryboardPanel = panels?.find(p => p.image_url === scrapedImages[editingImageIdx!]);

  const handleModifyBrightness = (panelId: number, val: number) => {
    setPanels?.(prev => prev.map(p => p.id === panelId ? { ...p, brightness: val } : p));
  };
  const handleModifyContrast = (panelId: number, val: number) => {
    setPanels?.(prev => prev.map(p => p.id === panelId ? { ...p, contrast: val } : p));
  };
  const handleModifySaturation = (panelId: number, val: number) => {
    setPanels?.(prev => prev.map(p => p.id === panelId ? { ...p, saturation: val } : p));
  };
  const handleModifyFilterPreset = (panelId: number, preset: string) => {
    setPanels?.(prev => prev.map(p => p.id === panelId ? { ...p, filter_preset: preset } : p));
  };

  // Clear states when transitioning editing frames
  React.useEffect(() => {
    setDetectedBoxes([]);
    setSlices([]);
    setSelectedSliceId(null);
    setSlicesCroppedCount(0);
  }, [editingImageIdx]);

  // Sync active coordinates state into the currently selected slice to support on-canvas fine-tuning
  React.useEffect(() => {
    if (selectedSliceId) {
      setSlices(prev => prev.map(s => s.id === selectedSliceId ? {
        ...s,
        cropTop: editCropTop,
        cropBottom: editCropBottom,
        cropLeft: editCropLeft,
        cropRight: editCropRight
      } : s));
    }
  }, [editCropTop, editCropBottom, editCropLeft, editCropRight, selectedSliceId]);

  const handleRemoveSpeechBubbles = async (method: 'inpaint' | 'blur' | 'ocr') => {
    if (editingImageIdx === null) return;
    const imgUrl = scrapedImages[editingImageIdx];
    setIsRemovingSpeechBubbles(true);
    setActiveSpeechBubbleMethod(method);
    
    const associatedPanel = panels?.find(p => p.image_url === imgUrl);
    const sensitivity = associatedPanel?.bubble_sensitivity !== undefined ? associatedPanel.bubble_sensitivity : 50;
    const dilation = associatedPanel?.bubble_dilation !== undefined ? associatedPanel.bubble_dilation : -1;
    const inpaint_radius = associatedPanel?.inpaint_radius !== undefined ? associatedPanel.inpaint_radius : 3;
    const detection_style = associatedPanel?.detection_style || "all";
    const activeMethod = method; 
    
    if (setConsoleLogs) {
      setConsoleLogs(prev => [
        `[Speech Bubbles Editor] Erasing speech boxes via ${activeMethod} (sensitivity: ${sensitivity}%, dilation: ${dilation !== -1 ? dilation + "px" : "auto"}, radius: ${inpaint_radius}px, style: ${detection_style}) on this panel...`,
        ...prev
      ]);
    }

    try {
    console.log(`[Speech Bubbles Editor] Request Body:`, JSON.stringify({
          url: imgUrl,
          method: activeMethod,
          sensitivity: sensitivity,
          dilation: dilation,
          inpaint_radius: inpaint_radius,
          detection_style: detection_style
        }));

      const response = await activeFetch("/api/remove-speech-bubbles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: imgUrl,
          method: activeMethod,
          sensitivity: sensitivity,
          dilation: dilation,
          inpaint_radius: inpaint_radius,
          detection_style: detection_style
        })
      });

      if (!response.ok) {
        let errMsg = "Speech bubble removal system error";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (e) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.success && data.url) {
        // Update in scrapedImages lists
        if (setScrapedImages) {
          setScrapedImages(prev => prev.map(img => img === imgUrl ? data.url : img));
        }
        // Update in selectedScraped
        if (setSelectedScraped && selectedScraped) {
          setSelectedScraped(prev => prev.map(img => img === imgUrl ? data.url : img));
        }
        // Update in panels storyboard
        if (setPanels && panels) {
          setPanels(prev => prev.map(panel => panel.image_url === imgUrl ? { 
            ...panel, 
            image_url: data.url,
            bubble_method: method
          } : panel));
        }

        const isBlur = method === "blur";
        const isOcr = method === "ocr";
        let successMsg = "";
        if (data.bubbles_detected === false) {
          successMsg = "No distinct speech text candidates were detected, but the process completed successfully.";
        } else if (isBlur) {
          successMsg = "Blur Successful! The speech text has been smudged together into a fuzzy, grayish-white blob.";
        } else if (isOcr) {
          successMsg = "AI Erase Successful! The text has been removed using OCR detection and inpainting.";
        } else {
          successMsg = "Inpaint Successful! The speech bubble vanishes, and the missing space is filled with matching background art.";
        }

        if (setConsoleLogs) {
          setConsoleLogs(prev => [
            `[Speech Bubbles Editor] ${successMsg} (${isBlur ? "Smudge" : "Healing"} method)`,
            ...prev
          ]);
        }
        addNotification(successMsg, "success");
      } else {
        throw new Error(data.error || "Erase failed");
      }
    } catch (err: any) {
      console.error("[Speech Bubbles Editor] Error:", err);
      addNotification(err.message || "Failed to remove speech bubbles.", "error");
      if (setConsoleLogs) {
        setConsoleLogs(prev => [
          `[Speech Bubbles Editor ERROR] Bubble removal failed: ${err.message || err}`,
          ...prev
        ]);
      }
      if (setErrorPopup) {
        setErrorPopup({
          title: "Speech Bubble Eraser Interrupted",
          message: err.message || "The OpenCV image processing pipeline encountered an issue attempting to find and erase speech bubbles.",
          type: "error",
          technicalDetails: `Error Message: ${err.message || "Unknown"}\nImage URL: ${imgUrl}\nActive Parameters:\n- Method: ${activeMethod}\n- Sensitivity: ${sensitivity}%\n- Dilation: ${dilation}px\n- Inpaint Radius: ${inpaint_radius}px\n- Style: ${detection_style}`,
          suggestion: "OpenCV's white bubble segmentation algorithm did not return a clean mask region. Try reducing 'Boundary Sensitivity' to 50% or below, or switch the Restoration Method to 'Gaussian Smudge' or 'Solid White Fill' for robust speech block coverage.",
          parameters: {
            method: activeMethod,
            sensitivity,
            dilation,
            inpaint_radius: inpaint_radius,
            detection_style
          },
          onRetry: (overrideParams) => {
            if (setPanels && panels) {
              setPanels(prev => prev.map(panel => panel.image_url === imgUrl ? { 
                ...panel, 
                bubble_method: overrideParams.method,
                bubble_sensitivity: overrideParams.sensitivity,
                bubble_dilation: overrideParams.dilation,
                inpaint_radius: overrideParams.inpaint_radius,
                detection_style: overrideParams.detection_style
              } : panel));
            }
            setTimeout(() => {
              handleRemoveSpeechBubbles(overrideParams.method as any);
            }, 100);
          }
        });
      }
    } finally {
      setIsRemovingSpeechBubbles(false);
      setActiveSpeechBubbleMethod(null);
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
        body: JSON.stringify({ url: currentUrl })
      });
      if (!response.ok) throw new Error("AI analysis failed");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels) && data.panels.length > 0) {
        // If the AI has already cropped the images on the backend, we can immediately save them to the deck!
        const hasCroppedUrls = data.panels.every((p: any) => p.croppedUrl);
        if (hasCroppedUrls && setScrapedImages) {
          const croppedUrls = data.panels.map((p: any) => p.croppedUrl);
          
          if (setConsoleLogs) {
            setConsoleLogs(prev => [
              `[AI Smart Crop] Segmented original image into ${croppedUrls.length} pre-cropped panels...`,
              ...prev
            ]);
          }
          
          // Replace original with the cropped segments
          setScrapedImages(prev => {
            const copy = [...prev];
            copy.splice(editingImageIdx, 1, ...croppedUrls);
            return copy;
          });

          addNotification(`AI Smart Crop automatically isolated ${croppedUrls.length} panels!`, "success");
          setEditingImageIdx(null); // Close the modal
          return;
        }

        // Fallback: Populate all panels into the slices list instead of just the first one
        const newSlices = data.panels.map((box: any, index: number) => ({
          id: `ai-${index}-${Date.now()}`,
          cropTop: box.cropTop,
          cropBottom: box.cropBottom,
          cropLeft: box.cropLeft,
          cropRight: box.cropRight,
          autoTrim: editAutoTrim
        }));
        
        setSlices(prev => [...prev, ...newSlices]);
        
        // Select the first of the newly added slices
        const firstNew = newSlices[0];
        setSelectedSliceId(firstNew.id);
        setEditCropLeft(firstNew.cropLeft);
        setEditCropRight(firstNew.cropRight);
        setEditCropTop(firstNew.cropTop);
        setEditCropBottom(firstNew.cropBottom);
      }
    } catch (err: any) {
      console.error("AI crop detection failed:", err);
      addNotification(err.message || "AI crop detection failed. Please try again.", "error");
    } finally {
      setIsAiDetecting(false);
    }
  };

  const handleDetectPanels = async () => {
    if (editingImageIdx === null) return;
    const currentUrl = scrapedImages[editingImageIdx];
    setIsDetecting(true);
    try {
      const response = await activeFetch("/api/detect-panels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl })
      });
      if (!response.ok) throw new Error("Failed to detect panels");
      const data = await response.json();
      if (data.success && Array.isArray(data.panels)) {
        setDetectedBoxes(data.panels);
        if (data.panels.length > 0) {
          const initialSlices = data.panels.map((box: any, index: number) => ({
            id: `detected-${index}-${Date.now()}`,
            cropTop: box.cropTop,
            cropBottom: box.cropBottom,
            cropLeft: box.cropLeft,
            cropRight: box.cropRight,
            autoTrim: editAutoTrim
          }));
          setSlices(initialSlices);

          // Default select the first panel
          const first = initialSlices[0];
          setSelectedSliceId(first.id);
          setEditCropLeft(first.cropLeft);
          setEditCropRight(first.cropRight);
          setEditCropTop(first.cropTop);
          setEditCropBottom(first.cropBottom);
        }
      }
    } catch (err: any) {
      console.error("Detect panels failed, trying AI fallback:", err);
      addNotification("Panel detection failed, trying AI-based detection...", "info");
      await handleAiCrop();
    } finally {
      setIsDetecting(false);
    }
  };

  // Check if pointer click was registered inside the current active crop selection
  const isPointInsideSelection = (x: number, y: number) => {
    if (editCropTop === 0 && editCropBottom === 0 && editCropLeft === 0 && editCropRight === 0) {
      return false;
    }
    const top = editCropTop;
    const bottom = 100 - editCropBottom;
    const left = editCropLeft;
    const right = 100 - editCropRight;
    return x >= left && x <= right && y >= top && y <= bottom;
  };

  const handleStart = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    if (isPointInsideSelection(x, y)) {
      setDragType('move');
      setDragStartPercent({ x, y });
      setOriginalCropBounds({
        top: editCropTop,
        bottom: editCropBottom,
        left: editCropLeft,
        right: editCropRight
      });
    } else {
      setDragType('draw');
      setDragStart({ x, y });
      setSelectedSliceId(null); // Clear selected slice to create a new, independent selection box
    }
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));

    if (dragType === 'draw' && dragStart) {
      const left = Math.min(dragStart.x, x);
      const right = 100 - Math.max(dragStart.x, x);
      const top = Math.min(dragStart.y, y);
      const bottom = 100 - Math.max(dragStart.y, y);

      setEditCropLeft(parseFloat(Math.max(0, Math.min(85, left)).toFixed(1)));
      setEditCropRight(parseFloat(Math.max(0, Math.min(85, right)).toFixed(1)));
      setEditCropTop(parseFloat(Math.max(0, Math.min(85, top)).toFixed(1)));
      setEditCropBottom(parseFloat(Math.max(0, Math.min(85, bottom)).toFixed(1)));
    } else if (dragType === 'move' && dragStartPercent && originalCropBounds) {
      const deltaX = x - dragStartPercent.x;
      const deltaY = y - dragStartPercent.y;

      let newLeft = originalCropBounds.left + deltaX;
      let newRight = originalCropBounds.right - deltaX;
      let newTop = originalCropBounds.top + deltaY;
      let newBottom = originalCropBounds.bottom - deltaY;

      const width = 100 - originalCropBounds.left - originalCropBounds.right;
      const height = 100 - originalCropBounds.top - originalCropBounds.bottom;

      if (newLeft < 0) {
        newLeft = 0;
        newRight = 100 - width;
      } else if (newRight < 0) {
        newRight = 0;
        newLeft = 100 - width;
      }

      if (newTop < 0) {
        newTop = 0;
        newBottom = 100 - height;
      } else if (newBottom < 0) {
        newBottom = 0;
        newTop = 100 - height;
      }

      setEditCropLeft(parseFloat(Math.max(0, Math.min(100, newLeft)).toFixed(1)));
      setEditCropRight(parseFloat(Math.max(0, Math.min(100, newRight)).toFixed(1)));
      setEditCropTop(parseFloat(Math.max(0, Math.min(100, newTop)).toFixed(1)));
      setEditCropBottom(parseFloat(Math.max(0, Math.min(100, newBottom)).toFixed(1)));
    }
  };

  const handleEnd = () => {
    if (dragType === 'draw' && autoPushOnDraw) {
      const width = 100 - editCropLeft - editCropRight;
      const height = 100 - editCropTop - editCropBottom;
      if (width > 1.5 && height > 1.5) {
        const newSlice: Slice = {
          id: `slice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          cropTop: editCropTop,
          cropBottom: editCropBottom,
          cropLeft: editCropLeft,
          cropRight: editCropRight,
          autoTrim: editAutoTrim
        };
        setSlices(prev => [...prev, newSlice]);
        
        // Reset active coordinates
        setEditCropTop(0);
        setEditCropBottom(0);
        setEditCropLeft(0);
        setEditCropRight(0);
        setSelectedSliceId(null);
        addNotification("Cut added!", "success");
      }
    }
    setDragStart(null);
    setDragType(null);
    setDragStartPercent(null);
    setOriginalCropBounds(null);
  };

  // Save selection onto the slices generator deck
  const handlePushToSlices = () => {
    const newSlice: Slice = {
      id: `slice-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cropTop: editCropTop,
      cropBottom: editCropBottom,
      cropLeft: editCropLeft,
      cropRight: editCropRight,
      autoTrim: editAutoTrim
    };
    setSlices(prev => [...prev, newSlice]);
    // Reset the active selection instead of keeping it selected
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
  };

  const handleApplyEqualSplits = (numCuts: number) => {
    const newSlices: Slice[] = [];
    const heightPerCut = 100 / numCuts;
    for (let i = 0; i < numCuts; i++) {
       const top = i * heightPerCut;
       const bottom = 100 - (i + 1) * heightPerCut;
       newSlices.push({
         id: `preset-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
         cropTop: parseFloat(top.toFixed(1)),
         cropBottom: parseFloat(bottom.toFixed(1)),
         cropLeft: 0,
         cropRight: 0,
         autoTrim: editAutoTrim
       });
    }
    setSlices(newSlices);
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    addNotification(`Applied equal ${numCuts}-segment split!`, "success");
  };

  const handleClearAllSlices = () => {
    setSlices([]);
    setSelectedSliceId(null);
    setEditCropTop(0);
    setEditCropBottom(0);
    setEditCropLeft(0);
    setEditCropRight(0);
    addNotification("Cleared all defined cuts.", "info");
  };

  const handleNudge = (direction: 'top' | 'bottom' | 'left' | 'right', amount: number) => {
    if (direction === 'top') {
      setEditCropTop(Math.max(0, Math.min(100, parseFloat((editCropTop + amount).toFixed(1)))));
    } else if (direction === 'bottom') {
      setEditCropBottom(Math.max(0, Math.min(100, parseFloat((editCropBottom + amount).toFixed(1)))));
    } else if (direction === 'left') {
      setEditCropLeft(Math.max(0, Math.min(100, parseFloat((editCropLeft + amount).toFixed(1)))));
    } else if (direction === 'right') {
      setEditCropRight(Math.max(0, Math.min(100, parseFloat((editCropRight + amount).toFixed(1)))));
    }
  };

  const handleSelectSlice = (slice: Slice) => {
    setSelectedSliceId(slice.id);
    setEditCropTop(slice.cropTop);
    setEditCropBottom(slice.cropBottom);
    setEditCropLeft(slice.cropLeft);
    setEditCropRight(slice.cropRight);
  };

  const handleDeleteSlice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSlices(prev => prev.filter(s => s.id !== id));
    if (selectedSliceId === id) {
      setSelectedSliceId(null);
    }
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
          autoTrim: slice.autoTrim
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      
      if (setScrapedImages) {
        setScrapedImages(prev => {
          const copy = [...prev];
          copy.splice(editingImageIdx + 1 + slicesCroppedCount, 0, data.url);
          return copy;
        });
      }

      setSlicesCroppedCount(prev => prev + 1);

      if (setConsoleLogs) {
        setConsoleLogs(prev => [`[Image Editor] Extracted cut from Frame #${editingImageIdx + 1}`, ...prev]);
      }
      
      handleDeleteSlice(slice.id, e);
      addNotification("Extracted Cut!", "success");
    } catch (err: any) {
      addNotification(`Failed to crop: ${err.message}`, "error");
    } finally {
      setIsCroppingSlice(null);
    }
  };

  const handleExecuteSave = () => {
    if (slices.length > 0) {
      const sortedSlices = [...slices].sort((a, b) => a.cropTop - b.cropTop);
      const cuts = sortedSlices.map(s => ({
        cropTop: s.cropTop,
        cropBottom: s.cropBottom,
        cropLeft: s.cropLeft,
        cropRight: s.cropRight,
        autoTrim: s.autoTrim
      }));
      handleSaveMultipleCuts(cuts);
    } else {
      handleSaveEditedImage();
    }
  };

  React.useEffect(() => {
    if (editingImageIdx === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key === 'Escape') {
        setEditingImageIdx(null);
      } else if (e.key === 'Enter') {
        handleExecuteSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingImageIdx]);

  if (editingImageIdx === null) return null;

  return (
    <div
      className="w-full max-w-7xl mx-auto px-6 py-10 flex flex-col gap-6 animate-[fadeIn_0.2s_ease-out]"
    >
      <div
        className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-lg flex flex-col w-full"
      >
          {/* Header */}
          <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
            <div className="flex items-center gap-2">
              <Scissors className="h-4.5 w-4.5 text-purple-400" />
              <div>
                <h3 className="font-bold text-sm text-white">Advanced Drop & Drag Multiple-Cut Generator</h3>
                <p className="text-[10px] text-neutral-400 font-mono">
                  Slicing and Trimming Frame #{editingImageIdx + 1} with custom coordinates drag-and-drop
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingImageIdx(null)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-850 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Content Pane */}
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto select-none">
            
            {/* Left side: Visual Preview Area (Canvas) */}
            <div className="lg:col-span-7 flex flex-col space-y-2">
              <div className="flex justify-between items-center bg-neutral-950/50 p-2 rounded-lg border border-neutral-850">
                <div className="flex items-center gap-2">
                  <Move className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-300 tracking-wider">
                    Interactive Viewport Canvas
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleAiCrop}
                    disabled={isAiDetecting}
                    className="flex items-center gap-1.5 bg-purple-900/40 text-purple-200 hover:bg-purple-800/60 px-2 py-0.5 rounded border border-purple-800/45 text-[9px] font-mono font-bold"
                  >
                    {isAiDetecting ? <RefreshCw className="h-3 w-3 animate-spin"/> : <Brain className="h-3 w-3" />}
                    <span>AI Smart Crop</span>
                  </button>
                  <span className="text-[9px] bg-purple-950 text-purple-300 font-mono font-bold px-2 py-0.5 rounded border border-purple-800/45">
                    Drag empty area to Draw
                  </span>
                  <span className="text-[9px] bg-emerald-950 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded border border-emerald-800/45">
                    Drag selection to Move
                  </span>
                </div>
              </div>
              
              <div 
                className="relative border border-neutral-800 hover:border-purple-500/30 rounded-xl bg-neutral-950 overflow-hidden h-[480px] flex items-center justify-center p-1 select-none transition-colors"
                style={{ cursor: isPointInsideSelection(0, 0) ? "default" : "crosshair" }}
              >
                {isRemovingSpeechBubbles && (
                  <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                    <div className="relative flex items-center justify-center h-20 w-20">
                      <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-pulse" />
                      <div className="absolute inset-2 rounded-full border border-purple-500/20 border-t-purple-500 animate-spin" />
                      <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />
                    </div>
                    <div className="space-y-2 mt-4 max-w-sm">
                      <h4 className="text-sm font-bold text-white font-sans tracking-wide">
                        {activeSpeechBubbleMethod === "blur" 
                          ? "Executing Selective Gaussian Smudge..." 
                          : "Erase & Inpaint Speech Bubbles..."}
                      </h4>
                      <p className="text-[11px] text-neutral-400 leading-normal font-sans">
                        Deploying Python OpenCV algorithms to isolate luminance-contrast contours, segment white speech bubble shapes, and reconstruct background art textures.
                      </p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-950/40 rounded-full border border-purple-900/30 font-mono text-[9.5px] text-purple-300 mt-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                        <span>Processing with {activeSpeechBubbleMethod === "blur" ? "SMUDGE_VAL" : "TELEA_HEALING"}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  ref={containerRef}
                  onMouseDown={(e) => {
                    if (e.button !== 0) return;
                    handleStart(e.clientX, e.clientY);
                  }}
                  onMouseMove={(e) => {
                    handleMove(e.clientX, e.clientY);
                  }}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleStart(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches && e.touches[0]) {
                      handleMove(e.touches[0].clientX, e.touches[0].clientY);
                    }
                  }}
                  onTouchEnd={handleEnd}
                  className="relative inline-block max-h-full max-w-full"
                >
                  {/* The raw image source */}
                  <img 
                    src={scrapedImages[editingImageIdx]} 
                    alt="Crop segment preview"
                    className="max-h-[470px] max-w-full pointer-events-none select-none block"
                    referrerPolicy="no-referrer"
                  />

                {/* RED SHADED AREAS REPRESENTING THE CROPPING BOUNDS (Only shown for non-full items) */}
                {!(editCropTop === 0 && editCropBottom === 0 && editCropLeft === 0 && editCropRight === 0) && (
                  <>
                    <div 
                      className="absolute top-0 left-0 right-0 bg-black/60 border-b border-purple-500/40 transition-all duration-75 pointer-events-none" 
                      style={{ height: `${editCropTop}%` }} 
                    />
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-black/60 border-t border-purple-500/40 transition-all duration-75 pointer-events-none" 
                      style={{ height: `${editCropBottom}%` }} 
                    />
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-black/60 border-r border-purple-500/40 transition-all duration-75 pointer-events-none" 
                      style={{ width: `${editCropLeft}%` }} 
                    />
                    <div 
                      className="absolute top-0 bottom-0 right-0 bg-black/60 border-l border-purple-500/40 transition-all duration-75 pointer-events-none" 
                      style={{ width: `${editCropRight}%` }} 
                    />
                  </>
                )}

                {/* SLICES VISUAL OVERLAYS */}
                {slices.map((slice, index) => {
                  const isSelected = slice.id === selectedSliceId;
                  return (
                    <div
                      key={slice.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSlice(slice);
                      }}
                      className={`absolute border-2 pointer-events-auto cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-emerald-400 bg-emerald-500/20 z-30 shadow-lg shadow-emerald-500/10"
                          : "border-purple-500/50 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-400 z-20"
                      }`}
                      style={{
                        top: `${slice.cropTop}%`,
                        bottom: `${slice.cropBottom}%`,
                        left: `${slice.cropLeft}%`,
                        right: `${slice.cropRight}%`
                      }}
                    >
                      <div className="p-1">
                        <span className={`inline-block font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow ${
                          isSelected 
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                            : "bg-purple-950/90 text-purple-300 border border-purple-800/80"
                        }`}>
                          Cut #{index + 1} {isSelected ? "★ Active" : ""}
                        </span>
                      </div>

                      <div className="flex justify-end p-1">
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSlice(slice.id, e)}
                          className="bg-red-950/90 hover:bg-red-900 border border-red-800 text-red-300 p-0.5 rounded cursor-pointer transition-colors"
                          title="Delete this cut"
                        >
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* ACTIVE CROP BOX BOUNDARY GUIDES */}
                {(editCropTop !== 0 || editCropBottom !== 0 || editCropLeft !== 0 || editCropRight !== 0) && (
                  <div 
                    className="absolute border-2 border-dashed border-emerald-400 bg-emerald-500/5 pointer-events-none transition-all duration-75"
                    style={{
                      top: `${editCropTop}%`,
                      bottom: `${editCropBottom}%`,
                      left: `${editCropLeft}%`,
                      right: `${editCropRight}%`,
                    }}
                  >
                    {/* Corner aesthetics */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white -translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white translate-x-[2px] -translate-y-[2px]" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white -translate-x-[2px] translate-y-[2px]" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white translate-x-[2px] translate-y-[2px]" />
                    
                    {/* Quick helper tag to drag-to-move */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/85 text-[9px] font-bold tracking-wide text-neutral-200 border border-neutral-700 px-2 py-1 rounded shadow-lg backdrop-blur flex items-center gap-1">
                      <Move className="h-3 w-3 text-purple-400 animate-pulse" />
                      <span>Drag to Reposition</span>
                    </div>

                    {/* Specifications badge inside selection */}
                    <div className="absolute top-2 left-2 bg-emerald-950/95 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded shadow">
                      Retained: {parseFloat((100 - editCropLeft - editCropRight).toFixed(1))}% &times; {parseFloat((100 - editCropTop - editCropBottom).toFixed(1))}%
                    </div>
                  </div>
                )}
                </div>
              </div>
              
              <span className="text-[10px] text-neutral-500 text-center italic font-sans block pt-1">
                Drag on unpopulated image space to draw new panels. Grab and shift any box selection to drag-and-drop it.
              </span>
            </div>            {/* Right side: Multi-slice list and telemetry controls */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              
              {/* SECTION: ENHANCEMENTS */}
              <div className="space-y-6 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/80">
                <label className="text-xs font-semibold text-neutral-400 flex items-center gap-1">
                  <span>✨ Enhancement Style Presets</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "none", label: "Original" },
                    { id: "anime_vibrant", label: "Anime Vibrant" },
                    { id: "cinematic_drama", label: "Cinematic Dark" },
                    { id: "hdr_clear", label: "Clarity HDR" }
                  ].map((preset) => {
                    const isActive = (activeStoryboardPanel?.filter_preset || "none") === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => activeStoryboardPanel && handleModifyFilterPreset(activeStoryboardPanel.id, preset.id)}
                        className={`text-left p-2 rounded-lg border text-[10px] font-bold ${
                          isActive
                            ? "bg-purple-600/20 border-purple-500 text-white"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-semibold text-neutral-400">Fine-Tuning</label>
                  
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Brightness</span>
                      <span>{activeStoryboardPanel?.brightness ?? 100}%</span>
                    </div>
                    <input 
                      type="range"
                      min={50}
                      max={180}
                      value={activeStoryboardPanel?.brightness ?? 100}
                      onChange={(e) => activeStoryboardPanel && handleModifyBrightness(activeStoryboardPanel.id, Number(e.target.value))}
                      className="w-full accent-purple-500 bg-neutral-800 h-1 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Contrast</span>
                      <span>{activeStoryboardPanel?.contrast ?? 100}%</span>
                    </div>
                    <input 
                      type="range"
                      min={50}
                      max={180}
                      value={activeStoryboardPanel?.contrast ?? 100}
                      onChange={(e) => activeStoryboardPanel && handleModifyContrast(activeStoryboardPanel.id, Number(e.target.value))}
                      className="w-full accent-purple-500 bg-neutral-800 h-1 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION: BATCH MULTIPLE CUT GENERATOR */}
              <div className="space-y-3 bg-neutral-950/50 p-4 rounded-xl border border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-mono font-bold text-purple-400 tracking-wider">
                      Target Cuts Registry
                    </span>
                    <span className="text-[9px] text-neutral-500 font-mono">
                      {slices.length} Cuts Defined
                    </span>
                  </div>
                  {slices.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllSlices}
                      className="text-[9px] bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/50 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1"
                      title="Clear all defined cuts from list"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                <div className="bg-neutral-900/65 border border-neutral-800/50 p-3 rounded-xl space-y-3">
                  <button
                    type="button"
                    onClick={handlePushToSlices}
                    disabled={editCropTop === 0 && editCropBottom === 0 && editCropLeft === 0 && editCropRight === 0}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Save Selection as Cut</span>
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-neutral-300 hover:text-white justify-between">
                    <span>Auto-save drawn boxes on drop</span>
                    <input
                      type="checkbox"
                      checked={autoPushOnDraw}
                      onChange={(e) => setAutoPushOnDraw(e.target.checked)}
                      className="rounded border-neutral-800 text-purple-600 bg-neutral-950 focus:ring-purple-500/30 h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>

                {/* COORDINATES ACCORDION FINE-TUNER */}
                {(editCropTop !== 0 || editCropBottom !== 0 || editCropLeft !== 0 || editCropRight !== 0) && (
                  <div className="bg-neutral-950/70 p-3.5 rounded-xl border border-purple-500/20 space-y-3 animate-[fadeIn_0.15s_ease-out]">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300">
                        {selectedSliceId ? "Fine-Tune Selected Cut" : "Fine-Tune Selection"}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      {/* Top */}
                      <div className="flex flex-col space-y-1 bg-neutral-900 border border-neutral-800/60 p-1.5 rounded-lg">
                        <span className="text-neutral-500 text-[9px] font-sans">Crop Top</span>
                        <div className="flex items-center justify-between">
                          <button type="button" onClick={() => handleNudge('top', -1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Up (-1%)"><ChevronDown className="h-3 w-3" /></button>
                          <span className="text-neutral-200 font-bold">{editCropTop}%</span>
                          <button type="button" onClick={() => handleNudge('top', 1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Down (+1%)"><ChevronUp className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {/* Bottom */}
                      <div className="flex flex-col space-y-1 bg-neutral-900 border border-neutral-800/60 p-1.5 rounded-lg">
                        <span className="text-neutral-500 text-[9px] font-sans">Crop Bottom</span>
                        <div className="flex items-center justify-between">
                          <button type="button" onClick={() => handleNudge('bottom', -1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Down (-1%)"><ChevronUp className="h-3 w-3" /></button>
                          <span className="text-neutral-200 font-bold">{editCropBottom}%</span>
                          <button type="button" onClick={() => handleNudge('bottom', 1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Up (+1%)"><ChevronDown className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {/* Left */}
                      <div className="flex flex-col space-y-1 bg-neutral-900 border border-neutral-800/60 p-1.5 rounded-lg">
                        <span className="text-neutral-500 text-[9px] font-sans">Crop Left</span>
                        <div className="flex items-center justify-between">
                          <button type="button" onClick={() => handleNudge('left', -1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Right (-1%)"><ChevronRight className="h-3 w-3" /></button>
                          <span className="text-neutral-200 font-bold">{editCropLeft}%</span>
                          <button type="button" onClick={() => handleNudge('left', 1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Left (+1%)"><ChevronLeft className="h-3 w-3" /></button>
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex flex-col space-y-1 bg-neutral-900 border border-neutral-800/60 p-1.5 rounded-lg">
                        <span className="text-neutral-500 text-[9px] font-sans">Crop Right</span>
                        <div className="flex items-center justify-between">
                          <button type="button" onClick={() => handleNudge('right', -1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Left (-1%)"><ChevronLeft className="h-3 w-3" /></button>
                          <span className="text-neutral-200 font-bold">{editCropRight}%</span>
                          <button type="button" onClick={() => handleNudge('right', 1)} className="p-1 text-neutral-400 hover:text-white bg-neutral-850 hover:bg-neutral-750 rounded transition-colors cursor-pointer" title="Nudge Right (+1%)"><ChevronRight className="h-3 w-3" /></button>
                        </div>
                      </div>
                    </div>

                    {/* Symmetrical fine tuning sliders */}
                    <div className="space-y-1.5 pt-1 text-[10px] text-neutral-400">
                      <div className="flex justify-between items-center">
                        <span>Top Crop Edge</span>
                        <span className="font-mono text-purple-300">{editCropTop}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="0.5"
                        value={editCropTop}
                        onChange={(e) => setEditCropTop(parseFloat(Number(e.target.value).toFixed(1)))}
                        className="w-full accent-purple-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />

                      <div className="flex justify-between items-center pt-1">
                        <span>Bottom Crop Edge</span>
                        <span className="font-mono text-purple-300">{editCropBottom}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        step="0.5"
                        value={editCropBottom}
                        onChange={(e) => setEditCropBottom(parseFloat(Number(e.target.value).toFixed(1)))}
                        className="w-full accent-purple-500 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {slices.length === 0 ? (
                  <div className="border border-neutral-850 border-dashed rounded-xl p-6 text-center text-neutral-500">
                    <Layers className="h-5 w-5 text-neutral-600 mx-auto mb-1.5" />
                    <p className="text-[11px] font-bold text-neutral-400">Cut list is empty</p>
                    <p className="text-[10px] text-neutral-500 leading-normal mt-0.5">
                      Draw on the image canvas and push to cuts list, or use Auto Panel contour detection below to auto-slice.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {slices.map((slice, index) => {
                      const isSelected = slice.id === selectedSliceId;
                      return (
                        <div
                          key={slice.id}
                          onClick={() => handleSelectSlice(slice)}
                          className={`p-2 rounded-xl text-[11px] font-mono border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-emerald-950/40 border-emerald-500/80 text-emerald-300"
                              : "bg-neutral-950 border-neutral-850 hover:bg-neutral-900 text-neutral-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-neutral-300">Cut #{index + 1}</span>
                            <span className="text-[9px] opacity-75">
                              ({parseFloat((100 - slice.cropLeft - slice.cropRight).toFixed(1))}% w)
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-neutral-500 font-mono">
                              H:{Math.round(slice.cropTop)}-{Math.round(100 - slice.cropBottom)}%
                            </span>
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={(e) => handleCropSingleSlice(slice, e)}
                                disabled={isCroppingSlice === slice.id || isSavingEdit}
                                className="text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                title="Execute this cut immediately"
                              >
                                {isCroppingSlice === slice.id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Crop className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSlice(slice.id, e)}
                                className="text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-900 transition-colors cursor-pointer"
                                title="Delete individual slice"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION: QUICK EQUAL-HEIGHT SPLITS */}
              <div className="space-y-3 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Split className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                    Quick Equal Height Splits
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  Stacked panels often have equal proportions. Split the original image into perfectly equal vertical scenes with one click:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleApplyEqualSplits(n)}
                      className="bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[11px] font-mono py-1.5 px-1 flex flex-col items-center justify-center rounded-lg border border-neutral-800 hover:border-purple-500/40 cursor-pointer transition-colors"
                    >
                      <span className="font-bold text-purple-400">{n}x</span>
                      <span className="text-[9px] opacity-75">Slices</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AUTOMATIC OPENCV PANEL SCANNER & LOADER */}
              <div className="space-y-3 bg-neutral-950/40 p-4 rounded-xl border border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-wider">
                    Contours-Detection Auto Slicer
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-normal">
                  Contour scans look for white gutters to identify individual panel slices. When completed, detected panels are instantly loaded into the Targets list for fine-tuning.
                </p>
                <button
                  type="button"
                  onClick={handleDetectPanels}
                  disabled={isDetecting}
                  className="w-full bg-purple-600/15 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] font-mono font-semibold py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2"
                >
                  {isDetecting ? (
                    <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  )}
                  <span>{isDetecting ? "Executing Scan..." : "Detect & Populate Slices List"}</span>
                </button>
              </div>


            </div>

          </div>

          {/* Action Buttons Footer */}
          <div className="px-6 py-4 bg-neutral-950/60 border-t border-neutral-800 flex items-center justify-between gap-3">
            <span className="text-[10px] text-neutral-400 font-mono italic max-w-[50%] hidden sm:block">
              {slices.length > 0 
                ? `Executing multi-cut split operations will create ${slices.length} new scenes on your deck` 
                : "You are editing a single crop selection"}
            </span>

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => setEditingImageIdx(null)}
                disabled={isSavingEdit}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSave}
                disabled={isSavingEdit}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/40"
              >
                {isSavingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Cuts...</span>
                  </>
                ) : slices.length > 0 ? (
                  <>
                    <Layers className="h-4 w-4 animate-pulse text-purple-200" />
                    <span>Execute Multiple Cuts ({slices.length})</span>
                  </>
                ) : (
                  <>
                    <Crop className="h-3.5 w-3.5" />
                    <span>Execute Single Crop</span>
                  </>
                )}
              </button>
            </div>
          </div>

      </div>
    </div>
  );
}
