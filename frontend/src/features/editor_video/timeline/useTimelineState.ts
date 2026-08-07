// ─── useTimelineState ────────────────────────────────────────────────────────
// Canonical location: timeline/useTimelineState.ts
// Centralises all Timeline state and derived handlers.

import { useState, useRef, useCallback, useEffect } from "react";
import { ContextMenuState, DEFAULT_PANEL_DURATION, MediaItem, AISuggestion } from "./types";
import { useKeyframes, KeyframesState } from "./useKeyframes";

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

  // Sub-systems
  keyframesState: KeyframesState;
  isMediaPickerOpen: boolean;
  aiSuggestions: AISuggestion[];

  // Refs
  trackAreaRef: React.RefObject<HTMLDivElement>;
  contextMenuRef: React.RefObject<HTMLDivElement>;

  // Setters / helpers
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setSnapEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setCaptionsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setSoloTrack: React.Dispatch<React.SetStateAction<string | null>>;

  getClipDuration: (key: string) => number;
  updateClipDuration: (key: string, duration: number) => void;

  // Track controls
  toggleMute: (id: string) => void;
  toggleLock: (id: string) => void;
  toggleHide: (id: string) => void;
  toggleSolo: (id: string) => void;

  // Clip interactions
  handleClipClick: (key: string, panelIdx: number) => void;
  openContextMenu: (e: React.MouseEvent, clipKey: string, panelIdx: number) => void;
  closeContextMenu: () => void;

  // Context menu actions
  handleCopy: () => void;
  handlePaste: () => void;
  handleDuplicate: () => void;
  handleRemoveDuration: () => void;
  handleApplyDurationToAll: (panels: any[]) => void;
  handleSplit: () => void;

  // Media Modal
  openMediaPicker: () => void;
  closeMediaPicker: () => void;
  handleSelectMedia: (item: MediaItem) => void;

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
  const [clipDurations, setClipDurations] = useState<Record<string, number>>({});

  // Sub-states
  const keyframesState = useKeyframes();
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([
    { id: "ai-1", clipKey: "v1-0", time: 0.5, property: "scale", value: 1.2, label: "Zoom Punch", confidence: 0.92 },
    { id: "ai-2", clipKey: "v1-1", time: 1.0, property: "opacity", value: 0.0, label: "Fade Out", confidence: 0.88 },
  ]);

  const trackAreaRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getClipDuration = useCallback(
    (key: string) => clipDurations[key] ?? DEFAULT_PANEL_DURATION,
    [clipDurations]
  );

  const updateClipDuration = useCallback((key: string, duration: number) => {
    setClipDurations((prev) => ({ ...prev, [key]: duration }));
  }, []);

  const selectedDuration = selectedClip ? getClipDuration(selectedClip) : null;
  const hasSelection = !!selectedClip;
  const hasDuration = hasSelection && getClipDuration(selectedClip!) > 0;

  // ── Track controls ──────────────────────────────────────────────────────────
  const toggleMute = useCallback((id: string) => setMutedTracks((p) => ({ ...p, [id]: !p[id] })), []);
  const toggleLock = useCallback((id: string) => setLockedTracks((p) => ({ ...p, [id]: !p[id] })), []);
  const toggleHide = useCallback((id: string) => setHiddenTracks((p) => ({ ...p, [id]: !p[id] })), []);
  const toggleSolo = useCallback((id: string) => setSoloTrack((p) => (p === id ? null : id)), []);

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
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
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
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeContextMenu(); };
    const onClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node))
        closeContextMenu();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [contextMenu, closeContextMenu]);

  // ── Context menu actions ────────────────────────────────────────────────────
  const handleCopy = useCallback(() => {
    if (contextMenu) setClipboard(contextMenu.clipKey);
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handlePaste = useCallback(() => closeContextMenu(), [closeContextMenu]);

  const handleDuplicate = useCallback(() => {
    if (contextMenu) {
      const d = getClipDuration(contextMenu.clipKey);
      setClipDurations((p) => ({ ...p, [`${contextMenu.clipKey}-dup`]: d }));
    }
    closeContextMenu();
  }, [contextMenu, getClipDuration, closeContextMenu]);

  const handleRemoveDuration = useCallback(() => {
    if (contextMenu)
      setClipDurations((p) => ({ ...p, [contextMenu.clipKey]: 0 }));
    closeContextMenu();
  }, [contextMenu, closeContextMenu]);

  const handleApplyDurationToAll = useCallback(
    (panels: any[]) => {
      if (contextMenu) {
        const d = getClipDuration(contextMenu.clipKey);
        const track = contextMenu.clipKey.replace(/-\d+$/, "");
        const updates: Record<string, number> = {};
        for (let i = 0; i < panels.length; i++) updates[`${track}-${i}`] = d;
        setClipDurations((p) => ({ ...p, ...updates }));
      }
      closeContextMenu();
    },
    [contextMenu, getClipDuration, closeContextMenu]
  );

  const handleSplit = useCallback(() => closeContextMenu(), [closeContextMenu]);

  // ── Media Modal ─────────────────────────────────────────────────────────────
  const openMediaPicker = useCallback(() => setIsMediaPickerOpen(true), []);
  const closeMediaPicker = useCallback(() => setIsMediaPickerOpen(false), []);
  const handleSelectMedia = useCallback((item: MediaItem) => {
    console.log("Adding media item to timeline:", item);
  }, []);

  // ── AI Suggestions ──────────────────────────────────────────────────────────
  const acceptAISuggestion = useCallback((s: AISuggestion) => {
    keyframesState.addKeyframe(s.clipKey, s.time, s.property, s.value);
    setAiSuggestions((prev) => prev.filter((item) => item.id !== s.id));
  }, [keyframesState]);

  const dismissAISuggestion = useCallback((id: string) => {
    setAiSuggestions((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Global keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selectedClip) return;
      if (e.key === "s" || e.key === "S") handleSplit();
      if (e.key === "Delete" || e.key === "Backspace") handleRemoveDuration();
      if ((e.ctrlKey || e.metaKey) && e.key === "c") setClipboard(selectedClip);
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); handleDuplicate(); }
      if (e.key === "k" || e.key === "K") {
        // Add keyframe at 1.0s on selected clip
        keyframesState.addKeyframe(selectedClip, 1.0, "scale", 1.0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedClip, handleSplit, handleRemoveDuration, handleDuplicate, keyframesState]);

  return {
    zoomLevel, snapEnabled, selectedClip, mutedTracks, soloTrack,
    lockedTracks, hiddenTracks, captionsVisible, contextMenu, clipboard, clipDurations,
    keyframesState, isMediaPickerOpen, aiSuggestions,
    trackAreaRef, contextMenuRef,
    setZoomLevel, setSnapEnabled, setCaptionsVisible, setSoloTrack,
    getClipDuration, updateClipDuration,
    toggleMute, toggleLock, toggleHide, toggleSolo,
    handleClipClick, openContextMenu, closeContextMenu,
    handleCopy, handlePaste, handleDuplicate, handleRemoveDuration,
    handleApplyDurationToAll, handleSplit,
    openMediaPicker, closeMediaPicker, handleSelectMedia,
    acceptAISuggestion, dismissAISuggestion,
    hasSelection, hasDuration, selectedDuration,
  };
}
