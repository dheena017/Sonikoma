/**
 * timeline.store.ts
 *
 * Multi-track timeline state (Zustand-ready scaffold).
 * Tracks playhead, zoom, snap, selected clips, and track visibility.
 */

export interface TimelineState {
  currentPanelIndex: number;
  zoomLevel: number;
  snapEnabled: boolean;
  selectedClipKey: string | null;
  mutedTracks: Record<string, boolean>;
  lockedTracks: Record<string, boolean>;
  hiddenTracks: Record<string, boolean>;
  captionsVisible: boolean;
}

export const initialTimelineState: TimelineState = {
  currentPanelIndex: 0,
  zoomLevel: 31,
  snapEnabled: true,
  selectedClipKey: null,
  mutedTracks: {},
  lockedTracks: {},
  hiddenTracks: {},
  captionsVisible: false,
};

export function selectClip(state: TimelineState, key: string | null): TimelineState {
  return { ...state, selectedClipKey: key };
}

export function toggleSnap(state: TimelineState): TimelineState {
  return { ...state, snapEnabled: !state.snapEnabled };
}

export function setTimelineZoom(state: TimelineState, zoom: number): TimelineState {
  return { ...state, zoomLevel: Math.max(10, Math.min(100, zoom)) };
}

export function setCurrentPanel(state: TimelineState, idx: number): TimelineState {
  return { ...state, currentPanelIndex: idx };
}
