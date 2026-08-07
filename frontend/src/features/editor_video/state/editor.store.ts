/**
 * editor.store.ts
 * 
 * Editor-wide global state (Zustand-ready scaffold).
 * Tracks the active project, dirty state, and top-level editor mode.
 *
 * TODO: Replace this zustand scaffold with `create()` from 'zustand'
 * once the package is installed.
 */

export interface EditorState {
  projectId: string | null;
  isDirty: boolean;
  isSaving: boolean;
  mode: "edit" | "preview" | "export";
}

// ─── Initial State ────────────────────────────────────────────────────────────
export const initialEditorState: EditorState = {
  projectId: null,
  isDirty: false,
  isSaving: false,
  mode: "edit",
};

// ─── Actions (pure reducers — swap for Zustand actions when ready) ─────────────
export function setDirty(state: EditorState, dirty: boolean): EditorState {
  return { ...state, isDirty: dirty };
}

export function setSaving(state: EditorState, saving: boolean): EditorState {
  return { ...state, isSaving: saving };
}

export function setMode(state: EditorState, mode: EditorState["mode"]): EditorState {
  return { ...state, mode };
}
