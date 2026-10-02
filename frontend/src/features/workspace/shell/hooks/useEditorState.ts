import { create } from "zustand";

export type EditorTool =
  | "adjust"
  | "edit"
  | "slice"
  | "crop"
  | "merge"
  | "draw"
  | "separate"
  | "train";

interface PlayerSettings {
  isPlayerOpen: boolean;
  playerPos: { x: number; y: number };
  playerSize: { width: number; height: number };
}

interface EditorGlobalState {
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
  slicesCount: number;
  setSlicesCount: (count: number) => void;
  playerSettings: PlayerSettings;
  setPlayerSettings: (settings: Partial<PlayerSettings>) => void;
  selectedFocalPoint:
    | "TL"
    | "TC"
    | "TR"
    | "ML"
    | "MC"
    | "MR"
    | "BL"
    | "BC"
    | "BR";
  setSelectedFocalPoint: (
    point: "TL" | "TC" | "TR" | "ML" | "MC" | "MR" | "BL" | "BC" | "BR"
  ) => void;
  showSafeZones: boolean;
  setShowSafeZones: (value: boolean) => void;
  lineSharpen: boolean;
  setLineSharpen: (value: boolean) => void;
  mangaContrast: boolean;
  setMangaContrast: (value: boolean) => void;
  popColorBoost: boolean;
  setPopColorBoost: (value: boolean) => void;
}

const getTabFromPathName = () => {
  const segments = window.location.pathname.split("/");
  const tabSegment = segments[2];
  const validTabs = [
    "adjust",
    "edit",
    "eraser",
    "slice",
    "crop",
    "merge",
    "draw",
    "separate",
  ];

  if (tabSegment && validTabs.includes(tabSegment)) {
    return tabSegment as EditorTool;
  }
  return null;
};

export const useImageEditorStore = create<
  EditorGlobalState & {
    editingImageIdx: number | null;
    setEditingImageIdx: (idx: number | null) => void;
  }
>((set) => ({
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

    const isLegacyEditorRoute =
      window.location.pathname.startsWith("/editor/") ||
      window.location.pathname.startsWith("/image-editor");
    if (!isLegacyEditorRoute) return;

    const params = new URLSearchParams(window.location.search);
    const idx = params.get("idx") || "0";
    const newPath = window.location.pathname.startsWith("/image-editor")
      ? `/image-editor?idx=${idx}&series=${
          params.get("series") || ""
        }&chapter=${params.get("chapter") || ""}`
      : `/editor/${tool}?idx=${idx}`;
    if (window.location.pathname + window.location.search !== newPath) {
      window.history.pushState({}, "", newPath);
    }
  },
  slicesCount: 0,
  setSlicesCount: (count) => set({ slicesCount: count }),
  selectedFocalPoint: "MC",
  setSelectedFocalPoint: (point) => set({ selectedFocalPoint: point }),
  showSafeZones: true,
  setShowSafeZones: (value) => set({ showSafeZones: value }),
  lineSharpen: true,
  setLineSharpen: (value) => set({ lineSharpen: value }),
  mangaContrast: true,
  setMangaContrast: (value) => set({ mangaContrast: value }),
  popColorBoost: false,
  setPopColorBoost: (value) => set({ popColorBoost: value }),

  editingImageIdx: null,
  setEditingImageIdx: (idx) => set({ editingImageIdx: idx }),
}));

export const useEditorStore = useImageEditorStore;
