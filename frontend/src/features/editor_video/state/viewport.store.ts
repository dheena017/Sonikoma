/**
 * viewport.store.ts
 *
 * Viewport / program monitor state (Zustand-ready scaffold).
 * Tracks active preview tab, sidebar visibility, safe-area overlays, etc.
 */

export interface ViewportState {
  activePreviewTab: "video" | "panels";
  isSidebarOpen: boolean;
  showSafeArea: boolean;
  showOverlays: boolean;
  zoomLevel: number;
}

export const initialViewportState: ViewportState = {
  activePreviewTab: "panels",
  isSidebarOpen: false,
  showSafeArea: false,
  showOverlays: true,
  zoomLevel: 100,
};

export function setActivePreviewTab(state: ViewportState, tab: ViewportState["activePreviewTab"]): ViewportState {
  return { ...state, activePreviewTab: tab };
}

export function toggleViewportSidebar(state: ViewportState): ViewportState {
  return { ...state, isSidebarOpen: !state.isSidebarOpen };
}

export function setZoomLevel(state: ViewportState, zoom: number): ViewportState {
  return { ...state, zoomLevel: Math.max(10, Math.min(400, zoom)) };
}
