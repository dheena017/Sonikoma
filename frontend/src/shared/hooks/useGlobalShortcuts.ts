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
  nav_dashboard: "Alt+D",
  nav_settings: "Alt+S",
  nav_editor: "Alt+E",
  nav_autocrop: "Alt+C",
  nav_bubble: "Alt+B",
  nav_logs: "Alt+L",
  nav_status: "Alt+G",
  nav_shortcuts: "Alt+K",
  nav_profile: "Alt+U",
  trigger_compile: "Alt+P",
  trigger_scrape: "Alt+N",
  playback_toggle: "Space",
  playback_reset: "Alt+R",
  volume_up: "Alt+ArrowUp",
  volume_down: "Alt+ArrowDown",
  volume_mute: "Alt+M",
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

      // ── Dispatch table ───────────────────────────────────────────────────
      if (matchesShortcut(e, shortcuts.nav_dashboard)) {
        e.preventDefault();
        props.navigateTo?.("/dashboard");
      } else if (matchesShortcut(e, shortcuts.nav_settings)) {
        e.preventDefault();
        props.navigateTo?.("/settings");
      } else if (matchesShortcut(e, shortcuts.nav_editor)) {
        e.preventDefault();
        props.navigateTo?.("/editor");
      } else if (matchesShortcut(e, shortcuts.nav_shortcuts)) {
        e.preventDefault();
        setIsShortcutsHelpOpen((prev) => !prev);
      } else if (matchesShortcut(e, shortcuts.playback_toggle)) {
        e.preventDefault();
        props.toggleStoryboardPlayback?.();
      } else if (matchesShortcut(e, shortcuts.playback_reset)) {
        e.preventDefault();
        props.resetStoryboardPlayback?.();
      } else if (matchesShortcut(e, shortcuts.trigger_compile)) {
        e.preventDefault();
        props.handleGenerateVideo?.();
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
