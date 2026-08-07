/**
 * inspector.store.ts
 *
 * Inspector panel state (Zustand-ready scaffold).
 * Tracks the currently selected layer and any locked/pinned sections.
 */

export interface InspectorState {
  selectedLayerId: string | null;
  isLocked: boolean;
  pinnedSections: string[];
}

export const initialInspectorState: InspectorState = {
  selectedLayerId: null,
  isLocked: false,
  pinnedSections: [],
};

export function selectLayer(state: InspectorState, layerId: string | null): InspectorState {
  return { ...state, selectedLayerId: layerId };
}

export function toggleLock(state: InspectorState): InspectorState {
  return { ...state, isLocked: !state.isLocked };
}

export function pinSection(state: InspectorState, sectionId: string): InspectorState {
  if (state.pinnedSections.includes(sectionId)) return state;
  return { ...state, pinnedSections: [...state.pinnedSections, sectionId] };
}

export function unpinSection(state: InspectorState, sectionId: string): InspectorState {
  return { ...state, pinnedSections: state.pinnedSections.filter((s) => s !== sectionId) };
}
