// ─── Timeline shared types & constants ───────────────────────────────────────
// Canonical location: timeline/types.ts

export interface TimelineProps {
  panels?: any[];
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  musicTheme?: string;
  voiceActor?: string;
}

export interface ContextMenuState {
  x: number;
  y: number;
  buttonTop?: number;
  buttonBottom?: number;
  buttonLeft?: number;
  buttonRight?: number;
  clipKey: string;
  panelIdx: number;
  clipDuration: number;
}

/** A single animation snapshot on a clip at a given time. */
export interface Keyframe {
  id: string;
  /** Seconds from the clip's own start (not the timeline start). */
  time: number;
  property: "opacity" | "x" | "y" | "scale" | "rotation" | "blur" | "volume";
  value: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "step";
}

export type EasingMode = Keyframe["easing"];
export type KeyframeProperty = Keyframe["property"];

/** An asset that can be dropped onto the timeline. */
export interface MediaItem {
  id: string;
  type: "image" | "video" | "audio" | "blank";
  name: string;
  url?: string;
  /** Duration in seconds (undefined = user-defined). */
  duration?: number;
  thumbnail?: string;
}

/** AI-generated keyframe / transition suggestion (ghost state, not yet committed). */
export interface AISuggestion {
  id: string;
  clipKey: string;
  time: number;
  property: KeyframeProperty;
  value: number;
  label: string;
  confidence: number; // 0–1
}

/** Waveform bar heights (%) used for the music track visualisation. */
export const WAVEFORM: number[] = [
  40, 70, 30, 90, 55, 100, 62, 80, 42, 88, 34, 65, 78, 44, 92, 50, 72, 36, 95,
  60, 45, 85, 52, 100, 40, 74, 32, 90, 56, 70,
];


/** Colour map for keyframe properties — used by diamonds and panel badges. */
export const KEYFRAME_COLORS: Record<KeyframeProperty, string> = {
  opacity: "bg-amber-400  border-amber-300",
  x: "bg-blue-400   border-blue-300",
  y: "bg-green-400  border-green-300",
  scale: "bg-[#2A2A2A] border-[#2F2F2F]",
  rotation: "bg-pink-400   border-pink-300",
  blur: "bg-blue-400   border-cyan-300",
  volume: "bg-emerald-400 border-emerald-300",
};
