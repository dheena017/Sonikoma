import React, { useEffect, useState, useCallback, useMemo } from "react";

export interface UseGlobalShortcutsProps {
  scrapedImages?: string[];
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  lastEditorPath?: string;
  targetUrl?: string;
  volume?: number;
  setVolume?: React.Dispatch<React.SetStateAction<number>>;
  isMuted?: boolean;
  setIsMuted?: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification?: (msg: string, type: "success" | "info" | "warning" | "error") => void;
  handleGenerateVideo?: () => void;
  toggleStoryboardPlayback?: () => void;
  resetStoryboardPlayback?: () => void;
  navigateTo?: (path: string) => void;
  setIsPipMode?: (v: boolean) => void;
  [key: string]: any;
}

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  // Navigation (All verified routes)
  nav_dashboard: "Alt+D",
  nav_projects: "Alt+J",
  nav_settings: "Alt+S",
  nav_editor: "Alt+E",
  nav_autocrop: "Alt+C",
  nav_aicore: "Alt+A",
  nav_shortcuts: "Alt+K",
  nav_profile: "Alt+U",
  nav_notifications: "Alt+I",

  // Action Triggers
  trigger_compile: "Alt+P",
  trigger_scrape: "Alt+N",

  // Playback & Audio
  playback_toggle: "Space",
  playback_reset: "Alt+R",
  volume_up: "Alt+ArrowUp",
  volume_down: "Alt+ArrowDown",
  volume_mute: "Alt+M",

  // Timeline & Video Editor
  timeline_split: "S",
  timeline_delete: "Delete",
  timeline_copy: "Ctrl+C",
  timeline_paste: "Ctrl+V",
  timeline_duplicate: "Ctrl+D",
  timeline_keyframe: "K",
  timeline_snap: "N",
  timeline_zoom_in: "=",
  timeline_zoom_out: "-",
  timeline_zoom_reset: "0",
  timeline_mute: "M",
  timeline_lock: "L",
};

/** Normalize and check if a keyboard event matches a shortcut string like "Alt+D" or "Ctrl+Z" */
export function matchesShortcut(e: KeyboardEvent, shortcutStr?: string): boolean {
  if (!shortcutStr) return false;
  const parts = shortcutStr.toLowerCase().split("+");
  const key = parts[parts.length - 1];
  const requiresCtrl = parts.includes("ctrl") || parts.includes("control");
  const requiresAlt = parts.includes("alt");
  const requiresShift = parts.includes("shift");

  const ctrlPressed = e.ctrlKey || e.metaKey;
  if (requiresCtrl !== ctrlPressed) return false;
  if (requiresAlt !== e.altKey) return false;
  if (requiresShift !== e.shiftKey) return false;

  if (key === "space") return e.code === "Space";
  if (key === "arrowup") return e.key === "ArrowUp";
  if (key === "arrowdown") return e.key === "ArrowDown";
  if (key === "arrowleft") return e.key === "ArrowLeft";
  if (key === "arrowright") return e.key === "ArrowRight";
  if (key === "escape") return e.key === "Escape";
  if (key === "delete" || key === "del") return e.key === "Delete" || e.key === "Backspace";
  if (key === "=" || key === "+") return e.key === "=" || e.key === "+";
  if (key === "-" || key === "_") return e.key === "-" || e.key === "_";

  return e.key.toLowerCase() === key;
}

export function useGlobalShortcuts(props: UseGlobalShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<Record<string, string>>(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("ai_comic_shortcuts");
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_SHORTCUTS, ...parsed };
        }
      }
    } catch {}
    return DEFAULT_SHORTCUTS;
  });

  const [activePlaybackSpeed, setActivePlaybackSpeed] = useState<number>(1.0);
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcut keys when typing inside input fields or textareas
      const target = e.target as HTMLElement;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      // ── Dispatch table (Strictly verified valid routes) ───────────────────
      if (matchesShortcut(e, shortcuts.nav_dashboard)) {
        e.preventDefault();
        props.navigateTo?.("/dashboard");
      } else if (matchesShortcut(e, shortcuts.nav_projects)) {
        e.preventDefault();
        props.navigateTo?.("/projects");
      } else if (matchesShortcut(e, shortcuts.nav_settings)) {
        e.preventDefault();
        props.navigateTo?.("/settings/account");
      } else if (matchesShortcut(e, shortcuts.nav_editor)) {
        e.preventDefault();
        props.navigateTo?.("/editor");
      } else if (matchesShortcut(e, shortcuts.nav_autocrop)) {
        e.preventDefault();
        props.navigateTo?.("/auto-crop");
      } else if (matchesShortcut(e, shortcuts.nav_aicore)) {
        e.preventDefault();
        props.navigateTo?.("/ai-core");
      } else if (matchesShortcut(e, shortcuts.nav_shortcuts)) {
        e.preventDefault();
        props.navigateTo?.("/shortcuts");
      } else if (matchesShortcut(e, shortcuts.nav_profile)) {
        e.preventDefault();
        props.navigateTo?.("/profile");
      } else if (matchesShortcut(e, shortcuts.nav_notifications)) {
        e.preventDefault();
        props.navigateTo?.("/notifications");
      } else if (matchesShortcut(e, shortcuts.playback_toggle)) {
        e.preventDefault();
        props.toggleStoryboardPlayback?.();
      } else if (matchesShortcut(e, shortcuts.playback_reset)) {
        e.preventDefault();
        props.resetStoryboardPlayback?.();
      } else if (matchesShortcut(e, shortcuts.trigger_compile)) {
        e.preventDefault();
        props.handleGenerateVideo?.();
      } else if (matchesShortcut(e, shortcuts.trigger_scrape)) {
        e.preventDefault();
        props.scrapeImages?.();
      } else if (matchesShortcut(e, shortcuts.volume_up) && props.setVolume) {
        e.preventDefault();
        props.setVolume((v) => Math.min(100, v + 10));
      } else if (matchesShortcut(e, shortcuts.volume_down) && props.setVolume) {
        e.preventDefault();
        props.setVolume((v) => Math.max(0, v - 10));
      } else if (matchesShortcut(e, shortcuts.volume_mute) && props.setIsMuted) {
        e.preventDefault();
        props.setIsMuted((m) => !m);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, props]);

  return {
    shortcuts,
    setShortcuts,
    activePlaybackSpeed,
    setActivePlaybackSpeed,
    isShortcutsHelpOpen,
    setIsShortcutsHelpOpen,
  };
}
