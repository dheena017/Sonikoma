// ─── useTimelineState ────────────────────────────────────────────────────────
// Canonical location: timeline/useTimelineState.ts
// Centralises all Timeline state and derived handlers.

import { useState, useRef, useCallback, useEffect } from "react";
import {
  ContextMenuState,
  AISuggestion,
} from "./types";
import { useKeyframes, KeyframesState } from "./useKeyframes";
import { editorEventBus } from "../events/editorEventBus";
import { useAppShortcuts } from "@/shared/hooks/useAppShortcuts";

export interface TimelineState {
  // Core State
  zoomLevel: number;
  snapEnabled: boolean;
  selectedClip: string | null;
  mutedTracks: Record<string, boolean>;
  soloTrack: string | null;
  lockedTracks: Record<string, boolean>;
  hiddenTracks: Record<string, boolean>;
  captionsVisible: boolean;
  contextMenu: ContextMenuState | null;
  clipboard: string | null;
  clipDurations: Record<string, number>;
  clipOffsets: Record<string, number>;

  // Sub-systems
  keyframesState: KeyframesState;
  aiSuggestions: AISuggestion[];

  // Refs
  trackAreaRef: React.RefObject<HTMLDivElement>;
  contextMenuRef: React.RefObject<HTMLDivElement>;

  // Setters / helpers
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setCaptionsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSoloTrack: React.Dispatch<React.SetStateAction<string | null>>;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handleZoomReset: () => void;

  getClipDuration: (key: string) => number;
  updateClipDuration: (key: string, duration: number) => void;
  updateClipOffset: (key: string, offsetPx: number) => void;

  // Track controls
  toggleSnap: () => void;
  toggleMute: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleHide: (id: string) => void;
  toggleSolo: (id: string) => void;

  // Clip interactions
  handleClipClick: (key: string, panelIdx: number) => void;
  openContextMenu: (
    e: React.MouseEvent,
    clipKey: string,
    panelIdx: number
  ) => void;
  closeContextMenu: () => void;

  // Context menu actions
  handleCopy: () => void;
  handlePaste: () => void;
  handleDuplicate: () => void;
  handleRemoveDuration: () => void;
  handleApplyDurationToAll: (panels: any[]) => void;
  handleSplit: () => void;

  // Track-specific workspace launchers (replaces single openMediaPicker)
  openPanelsPicker: () => void;    // V1 → storyboard
  openMusicPicker: () => void;     // A1 → audio
  openSfxPicker: () => void;       // A2 → audio
  openVoicePicker: () => void;     // A3 → audio
  openFxPicker: () => void;        // V2 → elements
  openSubtitlesPicker: () => void; // V3 → text
  // Legacy alias kept for AddTrackRow
  openMediaPicker: () => void;

  // AI Suggestions
  acceptAISuggestion: (s: AISuggestion) => void;
  dismissAISuggestion: (id: string) => void;

  // Derived flags
  hasSelection: boolean;
  hasDuration: boolean;
  selectedDuration: number | null;
}

export function useTimelineState(
  setCurrentPanelIndex?: (idx: number) => void
): TimelineState {
  const [zoomLevel, setZoomLevel] = useState(31);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [mutedTracks, setMutedTracks] = useState<Record<string, boolean>>({});
  const [soloTrack, setSoloTrack] = useState<string | null>(null);
  const [lockedTracks, setLockedTracks] = useState<Record<string, boolean>>({});
  const [hiddenTracks, setHiddenTracks] = useState<Record<string, boolean>>({});
  const [captionsVisible, setCaptionsVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [clipboard, setClipboard] = useState<string | null>(null);
  const [clipDurations, setClipDurations] = useState<Record<string, number>>(
    {}
  );
  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});

  // Sub-states
  const keyframesState = useKeyframes();
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);

  const trackAreaRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getClipDuration = useCallback(
    (key: string) => clipDurations[key] ?? 0,
    [clipDurations]
  );

  const updateClipDuration = useCallback((key: string, duration: number) => {
    setClipDurations((prev) => ({ ...prev, [key]: duration }));
  }, []);

  const updateClipOffset = useCallback((key: string, offsetPx: number) => {
    setClipOffsets((prev) => ({ ...prev, [key]: offsetPx }));
  }, []);

  const selectedDuration = selectedClip ? getClipDuration(selectedClip) : null;
  const hasSelection = !!selectedClip;
  const hasDuration = hasSelection && getClipDuration(selectedClip!) > 0;

  // ── Zoom controls ───────────────────────────────────────────────────────────
  const handleZoomIn = useCallback(
    () => setZoomLevel((z) => Math.min(120, z + 5)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoomLevel((z) => Math.max(10, z - 5)),
    []
  );
  const handleZoomReset = useCallback(
    () => setZoomLevel(30),
    []
  );

  // ── Track controls ──────────────────────────────────────────────────────────
  const toggleSnap = useCallback(
    () => setSnapEnabled((p) => !p),
    []
  );
  const toggleMute = useCallback(
    (id: string) => setMutedTracks((p) => ({ ...p, [id]: !p[id] })),
    []
  );
  const toggleLock = useCallback(
    (id: string) => setLockedTracks((p) => ({ ...p, [id]: !p[id] })),
    []
  );
  const toggleHide = useCallback(
    (id: string) => setHiddenTracks((p) => ({ ...p, [id]: !p[id] })),
    []
  );
  const toggleSolo = useCallback(
    (id: string) => setSoloTrack((p) => (p === id ? null : id)),
    []
  );

  // ── Clip interactions ───────────────────────────────────────────────────────
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const handleClipClick = useCallback(
    (key: string, panelIdx: number) => {
      setSelectedClip(key);
      setCurrentPanelIndex?.(panelIdx);
      setContextMenu(null);
    },
    [setCurrentPanelIndex]
  );

  const openContextMenu = useCallback(
    (e: React.MouseEvent, clipKey: string, panelIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedClip(clipKey);
      setCurrentPanelIndex?.(panelIdx);

      let x = e.clientX;
      let y = e.clientY;
      let buttonTop = y;
      let buttonBottom = y;
      let buttonLeft = x;
      let buttonRight = x;

      const target = e.currentTarget as HTMLElement | null;
      if (target && typeof target.getBoundingClientRect === "function") {
        const rect = target.getBoundingClientRect();
        buttonTop = rect.top;
        buttonBottom = rect.bottom;
        buttonLeft = rect.left;
        buttonRight = rect.right;
        x = rect.right;
        y = rect.bottom;
      }

      setContextMenu({
        x: x || 200,
        y: y || 200,
        buttonTop,
        buttonBottom,
        buttonLeft,
        buttonRight,
        clipKey,
        panelIdx,
        clipDuration: getClipDuration(clipKey),
      });
    },
    [setCurrentPanelIndex, getClipDuration]
  );

  // ── Context-menu dismiss ────────────────────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContextMenu();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        closeContextMenu();
      }
    };

    const timer = setTimeout(() => {
      window.addEventListener("mousedown", onMouseDown);
    }, 20);
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [contextMenu, closeContextMenu]);

  // ── Context menu actions ────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    const targetClip = contextMenu?.clipKey || selectedClip;
    if (targetClip) setClipboard(targetClip);
    closeContextMenu();
  }, [contextMenu, selectedClip, closeContextMenu]);

  const handlePaste = useCallback(() => {
    if (clipboard && selectedClip) {
      const d = getClipDuration(clipboard);
      if (d > 0) {
        setClipDurations((p) => ({ ...p, [selectedClip]: d }));
      }
    }
    closeContextMenu();
  }, [clipboard, selectedClip, getClipDuration, closeContextMenu]);

  const handleDuplicate = useCallback(() => {
    const targetClip = contextMenu?.clipKey || selectedClip;
    if (targetClip) {
      const d = getClipDuration(targetClip);
      setClipDurations((p) => ({ ...p, [`${targetClip}-dup`]: d }));
    }
    closeContextMenu();
  }, [contextMenu, selectedClip, getClipDuration, closeContextMenu]);

  const handleRemoveDuration = useCallback(() => {
    const targetClip = contextMenu?.clipKey || selectedClip;
    if (targetClip)
      setClipDurations((p) => ({ ...p, [targetClip]: 0 }));
    closeContextMenu();
  }, [contextMenu, selectedClip, closeContextMenu]);

  const handleApplyDurationToAll = useCallback(
    (panels: any[]) => {
      const targetClip = contextMenu?.clipKey || selectedClip;
      if (targetClip) {
        const d = getClipDuration(targetClip);
        const track = targetClip.replace(/-\d+.*$/, "");
        const updates: Record<string, number> = {};
        for (let i = 0; i < panels.length; i++) updates[`${track}-${i}`] = d;
        setClipDurations((p) => ({ ...p, ...updates }));
      }
      closeContextMenu();
    },
    [contextMenu, selectedClip, getClipDuration, closeContextMenu]
  );

  const handleSplit = useCallback(() => {
    const targetClip = contextMenu?.clipKey || selectedClip;
    if (targetClip) {
      const currentDur = getClipDuration(targetClip) || 3.0;
      const halfDur = Math.max(0.5, parseFloat((currentDur / 2).toFixed(1)));
      setClipDurations((p) => ({
        ...p,
        [targetClip]: halfDur,
        [`${targetClip}-split`]: halfDur,
      }));
    }
    closeContextMenu();
  }, [contextMenu, selectedClip, getClipDuration, closeContextMenu]);

  // ── Workspace launchers via event bus ─────────────────────────────────────
  /** Publish OPEN_WORKSPACE so WorkspacePanel switches to the right tab */
  const openWorkspace = useCallback((workspaceId: string) => {
    editorEventBus.publish("OPEN_WORKSPACE", { workspaceId });
  }, []);

  const openPanelsPicker   = useCallback(() => openWorkspace("storyboard"), [openWorkspace]);
  const openMusicPicker    = useCallback(() => openWorkspace("audio"), [openWorkspace]);
  const openSfxPicker      = useCallback(() => openWorkspace("audio"), [openWorkspace]);
  const openVoicePicker    = useCallback(() => openWorkspace("audio"), [openWorkspace]);
  const openFxPicker       = useCallback(() => openWorkspace("elements"), [openWorkspace]);
  const openSubtitlesPicker = useCallback(() => openWorkspace("text"), [openWorkspace]);
  // Legacy alias for AddTrackRow
  const openMediaPicker    = useCallback(() => openWorkspace("imported_assets"), [openWorkspace]);

  // ── AI Suggestions ──────────────────────────────────────────────────────────
  const acceptAISuggestion = useCallback(
    (s: AISuggestion) => {
      keyframesState.addKeyframe(s.clipKey, s.time, s.property, s.value);
      setAiSuggestions((prev) => prev.filter((item) => item.id !== s.id));
    },
    [keyframesState]
  );

  const dismissAISuggestion = useCallback((id: string) => {
    setAiSuggestions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const { shortcuts, matchesShortcut } = useAppShortcuts();

  // ── Global keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      // Global zoom shortcuts
      if (
        matchesShortcut(e, shortcuts.timeline_zoom_in) ||
        (!shortcuts.timeline_zoom_in && (e.key === "=" || e.key === "+"))
      ) {
        e.preventDefault();
        handleZoomIn();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_zoom_out) ||
        (!shortcuts.timeline_zoom_out && (e.key === "-" || e.key === "_"))
      ) {
        e.preventDefault();
        handleZoomOut();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_zoom_reset) ||
        (!shortcuts.timeline_zoom_reset && e.key === "0" && !e.ctrlKey && !e.metaKey)
      ) {
        e.preventDefault();
        handleZoomReset();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_snap) ||
        (!shortcuts.timeline_snap && (e.key === "n" || e.key === "N") && !e.ctrlKey && !e.metaKey)
      ) {
        toggleSnap();
        return;
      }

      // Clip actions
      if (!selectedClip) return;
      if (
        matchesShortcut(e, shortcuts.timeline_split) ||
        (!shortcuts.timeline_split && (e.key === "s" || e.key === "S") && !e.ctrlKey && !e.metaKey)
      ) {
        e.preventDefault();
        handleSplit();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_delete) ||
        (!shortcuts.timeline_delete && (e.key === "Delete" || e.key === "Backspace"))
      ) {
        e.preventDefault();
        handleRemoveDuration();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_copy) ||
        (!shortcuts.timeline_copy && (e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C"))
      ) {
        e.preventDefault();
        handleCopy();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_paste) ||
        (!shortcuts.timeline_paste && (e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V"))
      ) {
        e.preventDefault();
        handlePaste();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_duplicate) ||
        (!shortcuts.timeline_duplicate && (e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D"))
      ) {
        e.preventDefault();
        handleDuplicate();
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_keyframe) ||
        (!shortcuts.timeline_keyframe && (e.key === "k" || e.key === "K") && !e.ctrlKey && !e.metaKey)
      ) {
        keyframesState.addKeyframe(selectedClip, 1.0, "scale", 1.0);
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_mute) ||
        (!shortcuts.timeline_mute && (e.key === "m" || e.key === "M") && !e.ctrlKey && !e.metaKey)
      ) {
        const track = selectedClip.split("-")[0].toUpperCase();
        if (track) toggleMute(track);
        return;
      }
      if (
        matchesShortcut(e, shortcuts.timeline_lock) ||
        (!shortcuts.timeline_lock && (e.key === "l" || e.key === "L") && !e.ctrlKey && !e.metaKey)
      ) {
        const track = selectedClip.split("-")[0].toUpperCase();
        if (track) toggleLock(track);
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedClip,
    shortcuts,
    matchesShortcut,
    handleSplit,
    handleRemoveDuration,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    toggleSnap,
    toggleMute,
    toggleLock,
    keyframesState,
  ]);

  return {
    zoomLevel,
    snapEnabled,
    selectedClip,
    mutedTracks,
    soloTrack,
    lockedTracks,
    hiddenTracks,
    captionsVisible,
    contextMenu,
    clipboard,
    clipDurations,
    clipOffsets,
    keyframesState,
    aiSuggestions,
    trackAreaRef,
    contextMenuRef,
    setZoomLevel,
    setSnapEnabled,
    setCaptionsVisible,
    setSoloTrack,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    getClipDuration,
    updateClipDuration,
    updateClipOffset,
    toggleSnap,
    toggleMute,
    toggleLock,
    toggleHide,
    toggleSolo,
    handleClipClick,
    openContextMenu,
    closeContextMenu,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleRemoveDuration,
    handleApplyDurationToAll,
    handleSplit,
    openPanelsPicker,
    openMusicPicker,
    openSfxPicker,
    openVoicePicker,
    openFxPicker,
    openSubtitlesPicker,
    openMediaPicker,
    acceptAISuggestion,
    dismissAISuggestion,
    hasSelection,
    hasDuration,
    selectedDuration,
  };
}
