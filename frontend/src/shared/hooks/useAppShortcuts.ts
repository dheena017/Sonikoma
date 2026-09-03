import { useState, useEffect, useCallback } from "react";
import {
  DEFAULT_SHORTCUTS,
  matchesShortcut,
} from "@/shared/hooks/useGlobalShortcuts";

export const SHORTCUTS_EVENT = "sonikoma_shortcuts_changed";

export function loadAppShortcuts(): Record<string, string> {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ai_comic_shortcuts");
      if (stored) {
        return { ...DEFAULT_SHORTCUTS, ...JSON.parse(stored) };
      }
    }
  } catch {}
  return DEFAULT_SHORTCUTS;
}

export function notifyShortcutsChanged(updated: Record<string, string>) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(SHORTCUTS_EVENT, { detail: updated })
    );
  }
}

export function useAppShortcuts() {
  const [shortcuts, setShortcuts] =
    useState<Record<string, string>>(loadAppShortcuts);

  useEffect(() => {
    const handleUpdate = () => {
      setShortcuts(loadAppShortcuts());
    };
    window.addEventListener(SHORTCUTS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(SHORTCUTS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const getShortcut = useCallback(
    (id: string, fallback?: string): string => {
      return shortcuts[id] || fallback || DEFAULT_SHORTCUTS[id] || "";
    },
    [shortcuts]
  );

  const formatTooltip = useCallback(
    (label: string, id: string, fallback?: string): string => {
      const key = getShortcut(id, fallback);
      if (!key) return label;
      return `${label} (${key})`;
    },
    [getShortcut]
  );

  return { shortcuts, getShortcut, formatTooltip, matchesShortcut };
}
