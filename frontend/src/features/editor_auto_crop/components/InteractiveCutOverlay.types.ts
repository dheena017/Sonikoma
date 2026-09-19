import * as api from "@/api";

export type ThemeColor = "emerald" | "cyan" | "violet" | "amber" | "rose";
export type BorderStyle = "solid" | "dashed" | "dotted";
export type ToolMode = "box" | "select";

export interface ThemeConfigItem {
  name: string;
  hex: string;
  rgb: string;
  borderActive: string;
  borderInactive: string;
  ring: string;
  text: string;
  glowShadow: string;
  handleBg: string;
  badgeBg: string;
}

export const THEME_CONFIG: Record<ThemeColor, ThemeConfigItem> = {
  emerald: {
    name: "Emerald",
    hex: "#10b981",
    rgb: "16, 185, 129",
    borderActive: "border-emerald-400",
    borderInactive: "border-emerald-500/40",
    ring: "ring-emerald-400",
    text: "text-emerald-300",
    glowShadow: "0 0 25px rgba(16,185,129,0.35)",
    handleBg: "bg-emerald-400",
    badgeBg: "bg-emerald-500/20",
  },
  cyan: {
    name: "Electric Cyan",
    hex: "#06b6d4",
    rgb: "6, 182, 212",
    borderActive: "border-cyan-400",
    borderInactive: "border-cyan-500/40",
    ring: "ring-cyan-400",
    text: "text-cyan-300",
    glowShadow: "0 0 25px rgba(6,182,212,0.35)",
    handleBg: "bg-cyan-400",
    badgeBg: "bg-cyan-500/20",
  },
  violet: {
    name: "Neon Violet",
    hex: "#8b5cf6",
    rgb: "139, 92, 246",
    borderActive: "border-violet-400",
    borderInactive: "border-violet-500/40",
    ring: "ring-violet-400",
    text: "text-violet-300",
    glowShadow: "0 0 25px rgba(139,92,246,0.35)",
    handleBg: "bg-violet-400",
    badgeBg: "bg-violet-500/20",
  },
  amber: {
    name: "Solar Amber",
    hex: "#f59e0b",
    rgb: "245, 158, 11",
    borderActive: "border-amber-400",
    borderInactive: "border-amber-500/40",
    ring: "ring-amber-400",
    text: "text-amber-300",
    glowShadow: "0 0 25px rgba(245,158,11,0.35)",
    handleBg: "bg-amber-400",
    badgeBg: "bg-amber-500/20",
  },
  rose: {
    name: "Cyber Rose",
    hex: "#f43f5e",
    rgb: "244, 63, 94",
    borderActive: "border-rose-400",
    borderInactive: "border-rose-500/40",
    ring: "ring-rose-400",
    text: "text-rose-300",
    glowShadow: "0 0 25px rgba(244,63,94,0.35)",
    handleBg: "bg-rose-400",
    badgeBg: "bg-rose-500/20",
  },
};

export const BORDER_STYLE_CLASSES: Record<BorderStyle, string> = {
  solid: "border-solid",
  dashed: "border-dashed",
  dotted: "border-dotted",
};

export type DragAction =
  | {
      type: "move-box";
      boxIdx: number;
      startPointerX: number;
      startPointerY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      currentX: number;
      currentY: number;
    }
  | {
      type: "resize-box";
      boxIdx: number;
      handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se";
      startPointerX: number;
      startPointerY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      currentX: number;
      currentY: number;
      currentW: number;
      currentH: number;
    }
  | {
      type: "draw-box";
      startPointerX: number;
      startPointerY: number;
      currentPointerX: number;
      currentPointerY: number;
    };

export interface InteractiveCutOverlayProps {
  imageUrl: string;
  boxes: api.PanelBoundingBoxInput[];
  selectedPanelIndex: number | null;
  onSelectPanel: (idx: number) => void;
  onMoveCutLine?: (cutIdx: number, newY: number) => void;
  onNudgeCutLine?: (cutIdx: number, deltaPx: number) => void;
  onAddCutLine?: (yPosition: number) => void;
  onDeleteCutLine?: (cutIdx: number) => void;
  onUpdateBox?: (boxIdx: number, updatedBox: api.PanelBoundingBoxInput) => void;
  onAddBox?: (newBox: api.PanelBoundingBoxInput) => void;
  onSplitPanel?: (boxIdx: number) => void;
  onDeletePanel?: (boxIdx: number) => void;
  onNudgePanel?: (boxIdx: number, deltaY: number) => void;
  onApplyCrop?: () => void;
  isReCropping?: boolean;
  dimensions?: { width: number; height: number };
  showCutLines?: boolean;
  onToggleCutLines?: () => void;
  onOpenBigScreen?: () => void;
}
