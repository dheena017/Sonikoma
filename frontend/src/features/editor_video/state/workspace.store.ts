/**
 * workspace.store.ts
 *
 * Workspace panel state (Zustand-ready scaffold).
 * Tracks which workspace drawer is active and layout panel visibility.
 */

import { WorkspaceId } from "../types/workspace.types";

export interface WorkspaceState {
  activeWorkspace: WorkspaceId;
  layoutConfig: {
    mediaBin: boolean;
    rightInspector: boolean;
    timeline: boolean;
  };
}

export const initialWorkspaceState: WorkspaceState = {
  activeWorkspace: "story",
  layoutConfig: {
    mediaBin: true,
    rightInspector: true,
    timeline: true,
  },
};

export function setActiveWorkspace(state: WorkspaceState, id: WorkspaceId): WorkspaceState {
  return { ...state, activeWorkspace: id };
}

export function togglePanel(
  state: WorkspaceState,
  panel: keyof WorkspaceState["layoutConfig"]
): WorkspaceState {
  return {
    ...state,
    layoutConfig: {
      ...state.layoutConfig,
      [panel]: !state.layoutConfig[panel],
    },
  };
}
