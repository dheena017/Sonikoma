import { useState, useEffect } from "react";
import { Slice } from "@/components/Feature/editor/shared";
import { create } from "zustand";

export type ImageTool = "adjust" | "edit" | "slice" | "crop" | "merge" | "draw" | "separate" | "train";

interface PlayerSettings {
  isPlayerOpen: boolean;
  playerPos: { x: number; y: number };
  playerSize: { width: number; height: number };
}

interface ImageEditorGlobalState {
  activeTool: ImageTool;
  setActiveTool: (tool: ImageTool) => void;
  slicesCount: number;
  setSlicesCount: (count: number) => void;
  playerSettings: PlayerSettings;
  setPlayerSettings: (settings: Partial<PlayerSettings>) => void;
}


const getTabFromPathName = () => {
  const segments = window.location.pathname.split("/");
  const tabSegment = segments[2];
  const validTabs = ["adjust", "edit", "eraser", "slice", "crop", "merge", "draw", "separate"];

  if (tabSegment && validTabs.includes(tabSegment)) {
    return tabSegment as ImageTool;
  }
  return null;
};



export const useImageEditorStore = create<ImageEditorGlobalState & {
  editingImageIdx: number | null;
  setEditingImageIdx: (idx: number | null) => void;
}>((set) => ({
  playerSettings: {
    isPlayerOpen: true,
    playerPos: { x: 50, y: 150 },
    playerSize: { width: 384, height: 216 },
  },
  setPlayerSettings: (settings) => {
    set((state) => ({
      playerSettings: {
        ...state.playerSettings,
        ...settings,
      },
    }));
  },
  activeTool: getTabFromPathName() || "adjust",
  setActiveTool: (tool) => {
    set({ activeTool: tool });

    // Preserve the current workspace URL.
    // Only update the browser URL when we're already inside the legacy /editor/* routes.
    const isLegacyEditorRoute = window.location.pathname.startsWith("/editor/") || window.location.pathname.startsWith("/image-editor");
    if (!isLegacyEditorRoute) return;

    const params = new URLSearchParams(window.location.search);
    const idx = params.get("idx") || "0";
    const newPath = window.location.pathname.startsWith("/image-editor")
      ? `/image-editor?idx=${idx}&series=${params.get("series") || ""}&chapter=${params.get("chapter") || ""}`
      : `/editor/${tool}?idx=${idx}`;
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.pushState({}, "", newPath);
    }
  },
  slicesCount: 0,
  setSlicesCount: (count) => set({ slicesCount: count }),

  editingImageIdx: null,
  setEditingImageIdx: (idx) => set({ editingImageIdx: idx }),
}));

export const useCropEditorStore = useImageEditorStore;
export const useCropEditorState = useImageEditorState;

interface UseImageEditorStateProps {
  scrapedImages: string[];
  editingImageIdx: number | null;
  imageEditStates?: Record<string, any>;
}

export function useImageEditorState({
  scrapedImages,
  editingImageIdx,
  imageEditStates,
}: UseImageEditorStateProps) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragType, setDragType] = useState<
    | "draw"
    | "move"
    | "split"
    | "drag-split-line"
    | `resize-${"nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e"}`
    | null
  >(null);
  const [dragStartPercent, setDragStartPercent] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [originalCropBounds, setOriginalCropBounds] = useState<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  } | null>(null);
  const [draggingSplitLineIdx, setDraggingSplitLineIdx] = useState<
    number | null
  >(null);
  const [editMode, setEditMode] = useState<
    "crop" | "clean_auto" | "clean_manual" | "typeset" | "slices"
  >("crop");
  const [detectedBubbles, setDetectedBubbles] = useState<
    Array<{
      box: [number, number, number, number];
      text: string;
      category?: string;
    }>
  >([]);
  const [selectedBubbleIdx, setSelectedBubbleIdx] = useState<number | null>(
    null
  );
  const [brushSize, setBrushSize] = useState(20);
  const [brushAction, setBrushAction] = useState<"paint" | "erase">("paint");

  // Lifted Clean Bubbles Parameters States
  const [detectionStyle, setDetectionStyle] = useState<
    "all" | "white_only" | "text_only"
  >("all");
  const [eraseMethod, setEraseMethod] = useState<
    | "auto"
    | "inpaint"
    | "inpaint_ns"
    | "blur"
    | "solid_white"
    | "solid_black"
    | "solid_color"
    | "transparent"
    | "ocr"
  >("auto");
  const [sensitivity, setSensitivity] = useState<number>(50);
  const [dilation, setDilation] = useState<number>(-1);
  const [inpaintRadius, setInpaintRadius] = useState<number>(3);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [ocrLang, setOcrLang] = useState<string>("en");
  const [gpu, setGpu] = useState<boolean>(false);
  const [morphKernelSize, setMorphKernelSize] = useState<number>(15);
  const [morphShape, setMorphShape] = useState<string>("ellipse");
  const [useCustomColorTarget, setUseCustomColorTarget] =
    useState<boolean>(false);
  const [customColorTarget, setCustomColorTarget] = useState<string>("#ffffcc");
  const [customColorTolerance, setCustomColorTolerance] = useState<number>(25);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);

  const imageUrl =
    editingImageIdx !== null ? scrapedImages[editingImageIdx] : null;
  const savedState =
    imageUrl && imageEditStates ? imageEditStates[imageUrl] : null;

  const [detectedBoxes, setDetectedBoxes] = useState<
    Array<{
      cropTop: number;
      cropBottom: number;
      cropLeft: number;
      cropRight: number;
      width: number;
      height: number;
      area: number;
    }>
  >(savedState?.detectedBoxes || []);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isAiDetecting, setIsAiDetecting] = useState<boolean>(false);

  // Sidebar Tab Configuration using Global Zustand Store
  const { activeTool, setActiveTool } = useImageEditorStore();
  const activeTab = activeTool as ImageTool;

  const setActiveTab = (newTab: ImageTool) => {
    setActiveTool(newTab);
  };

  // Keep state in sync with back/forward history navigation
  useEffect(() => {
    const handleRouteSync = () => {
      const pathTab = getTabFromPathName();
      if (pathTab && pathTab !== activeTool) {
        useImageEditorStore.setState({ activeTool: pathTab });
      }
    };
    window.addEventListener("popstate", handleRouteSync);
    return () => window.removeEventListener("popstate", handleRouteSync);
  }, [activeTool]);

  // Zoom & Transform
  const [zoom, setZoom] = useState<number>(1);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);

  // Merge
  const [isMerging, setIsMerging] = useState<boolean>(false);

  // Multiple Cut List
  const [slices, setSlices] = useState<Slice[]>(savedState?.slices || []);

  // Sync slicesCount to store
  useEffect(() => {
    useImageEditorStore.setState({ slicesCount: slices.length });
  }, [slices.length]);
  const [selectedSliceId, setSelectedSliceId] = useState<string | null>(
    savedState?.selectedSliceId || null
  );
  const [autoPushOnDraw, setAutoPushOnDraw] = useState<boolean>(false);

  const [splitPosition, setSplitPosition] = useState<number>(50);
  const [splitLines, setSplitLines] = useState<number[]>(
    savedState?.splitLines || []
  );

  const [loadedImageUrl, setLoadedImageUrl] = useState<string | null>(null);

  const [showSplitPosition, setShowSplitPosition] = useState<boolean>(
    savedState?.activeTab === "slice" || false
  );
  const [magneticSnap, setMagneticSnap] = useState<boolean>(true);
  const [detectedGutters, setDetectedGutters] = useState<number[]>([]);

  const [isCroppingSlice, setIsCroppingSlice] = useState<string | null>(null);
  const [slicesCroppedCount, setSlicesCroppedCount] = useState(0);

  return {
    dragStart,
    setDragStart,
    dragType,
    setDragType,
    dragStartPercent,
    setDragStartPercent,
    originalCropBounds,
    setOriginalCropBounds,
    draggingSplitLineIdx,
    setDraggingSplitLineIdx,
    editMode,
    setEditMode,
    detectedBubbles,
    setDetectedBubbles,
    selectedBubbleIdx,
    setSelectedBubbleIdx,
    brushSize,
    setBrushSize,
    brushAction,
    setBrushAction,
    detectionStyle,
    setDetectionStyle,
    eraseMethod,
    setEraseMethod,
    sensitivity,
    setSensitivity,
    dilation,
    setDilation,
    inpaintRadius,
    setInpaintRadius,
    debugMode,
    setDebugMode,
    fillColor,
    setFillColor,
    ocrLang,
    setOcrLang,
    gpu,
    setGpu,
    morphKernelSize,
    setMorphKernelSize,
    morphShape,
    setMorphShape,
    useCustomColorTarget,
    setUseCustomColorTarget,
    customColorTarget,
    setCustomColorTarget,
    customColorTolerance,
    setCustomColorTolerance,
    isCleaning,
    setIsCleaning,
    imageUrl,
    savedState,
    detectedBoxes,
    setDetectedBoxes,
    isDetecting,
    setIsDetecting,
    isAiDetecting,
    setIsAiDetecting,
    activeTab,
    setActiveTab,
    activeTool,
    setActiveTool,
    zoom,
    setZoom,
    isTransforming,
    setIsTransforming,
    isMerging,
    setIsMerging,
    slices,
    setSlices,
    selectedSliceId,
    setSelectedSliceId,
    autoPushOnDraw,
    setAutoPushOnDraw,
    splitPosition,
    setSplitPosition,
    splitLines,
    setSplitLines,
    showSplitPosition,
    setShowSplitPosition,
    magneticSnap,
    setMagneticSnap,
    detectedGutters,
    setDetectedGutters,
    isCroppingSlice,
    setIsCroppingSlice,
    slicesCroppedCount,
    setSlicesCroppedCount,
    loadedImageUrl,
    setLoadedImageUrl,
  };
}
