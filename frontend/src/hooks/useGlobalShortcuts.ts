import React from "react";

interface UseGlobalShortcutsProps {
  scrapedImages: string[];
  selectedScraped: string[];
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  lastEditorPath: string;
  targetUrl: string;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification: (
    msg: string,
    type: "success" | "info" | "warning" | "error"
  ) => void;
  handleGenerateVideo: () => void;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
  navigateTo: (path: string) => void;
  setIsPipMode: (v: boolean) => void;
}

export const DEFAULT_SHORTCUTS = {
  nav_dashboard: "Alt+D",
  nav_settings: "Alt+S",
  nav_editor: "Alt+E",
  nav_autocrop: "Alt+C",
  nav_bubble: "Alt+B",
  nav_logs: "Alt+L",
  nav_status: "Alt+G",
  nav_shortcuts: "Alt+K",
  trigger_compile: "Alt+P",
  trigger_scrape: "Alt+N",
  playback_toggle: "Space",
  playback_reset: "Alt+R",
  volume_up: "Alt+ArrowUp",
  volume_down: "Alt+ArrowDown",
  volume_mute: "Alt+M",
  editor_tab_1: "Alt+1",
  editor_tab_2: "Alt+2",
  editor_tab_3: "Alt+3",
  editor_tab_4: "Alt+4",
  editor_tab_5: "Alt+5",
  editor_tab_6: "Alt+6",
  editor_prev: "ArrowLeft",
  editor_next: "ArrowRight",
  editor_undo: "Control+Z",
  editor_redo: "Control+Y",
  editor_save: "Control+S",
  editor_close: "Escape",
  deck_select_all: "Alt+A",
  deck_invert: "Alt+I",
  deck_clear: "Alt+X",
  deck_stitch: "Alt+M",
};

export function useGlobalShortcuts({
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  lastEditorPath,
  targetUrl,
  volume,
  setVolume,
  isMuted,
  setIsMuted,
  addNotification,
  handleGenerateVideo,
  toggleStoryboardPlayback,
  resetStoryboardPlayback,
  navigateTo,
  setIsPipMode,
}: UseGlobalShortcutsProps) {
  const [shortcuts, setShortcuts] = React.useState<Record<string, string>>(
    () => {
      try {
        const stored = localStorage.getItem("ai_comic_shortcuts");
        if (stored) {
          const parsed = JSON.parse(stored);
          // Sanitize: only keep entries where the value is a non-empty string
          const sanitized = Object.fromEntries(
            Object.entries(parsed).filter(
              ([, v]) => typeof v === "string" && (v as string).trim() !== ""
            )
          ) as Record<string, string>;
          return { ...DEFAULT_SHORTCUTS, ...sanitized };
        }
      } catch (e) {}
      return DEFAULT_SHORTCUTS;
    }
  );

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable)
      ) {
        return;
      }

      if ((window as any).isRecordingHotkey) {
        return;
      }

      // Build modifier key strings
      const parts: string[] = [];
      if (event.ctrlKey) parts.push("Control");
      if (event.altKey) parts.push("Alt");
      if (event.shiftKey) parts.push("Shift");

      let key = event.key;
      if (!key) return;
      if (key === " ") key = "Space";

      if (!["Control", "Alt", "Shift"].includes(key)) {
        parts.push(key.length === 1 ? key.toUpperCase() : key);
      } else {
        return; // modifier-only
      }

      const combination = parts.join("+").toLowerCase();

      // Find matched keybind action — guard against undefined/null shortcut values
      const matchedAction = Object.entries(shortcuts).find(
        ([_, val]) =>
          typeof val === "string" && val.toLowerCase() === combination
      )?.[0];

      if (!matchedAction) return;

      event.preventDefault();

      const path = window.location.pathname;
      const chapterPathMatch = path.match(
        /\/series\/[^\/]+\/chapters\/([^\/]+)/
      );
      const isDashboard =
        path === "/dashboard" ||
        (chapterPathMatch !== null && !path.endsWith("/details"));
      const isEditor = path.startsWith("/editor");

      switch (matchedAction) {
        case "nav_dashboard":
          navigateTo("/dashboard");
          break;
        case "nav_settings":
          navigateTo("/settings");
          break;
        case "nav_editor":
          if (scrapedImages.length > 0) {
            setIsPipMode(false);
            navigateTo(lastEditorPath);
          } else {
            addNotification(
              "No scraped frames available. Scraping required.",
              "info"
            );
          }
          break;
        case "nav_autocrop":
          if (scrapedImages.length > 0) {
            navigateTo("/auto-crop");
          } else {
            addNotification("No scraped frames available.", "info");
          }
          break;
        case "nav_bubble":
          if (scrapedImages.length > 0) {
            navigateTo("/bubble-cleaner");
          } else {
            addNotification("No scraped frames available.", "info");
          }
          break;
        case "nav_logs":
          navigateTo("/logs");
          break;
        case "nav_status":
          navigateTo("/status");
          break;
        case "nav_shortcuts":
          navigateTo("/shortcuts");
          break;
        case "trigger_compile":
          handleGenerateVideo();
          break;
        case "trigger_scrape":
          if (targetUrl) {
            addNotification(
              "Keyboard Trigger: Initializing comic scraper task...",
              "info"
            );
          } else {
            addNotification("Enter a Webtoon URL first.", "warning");
          }
          break;
        case "playback_toggle":
          if (isDashboard) toggleStoryboardPlayback();
          break;
        case "playback_reset":
          if (isDashboard) resetStoryboardPlayback();
          break;
        case "volume_up":
          if (isDashboard) {
            setVolume((v) => Math.min(100, v + 10));
          }
          break;
        case "volume_down":
          if (isDashboard) {
            setVolume((v) => Math.max(0, v - 10));
          }
          break;
        case "volume_mute":
          if (isDashboard) {
            setIsMuted((m) => !m);
          }
          break;
        case "deck_select_all":
          if (isDashboard && scrapedImages.length > 0) {
            if (selectedScraped.length === scrapedImages.length) {
              setSelectedScraped([]);
            } else {
              setSelectedScraped([...scrapedImages]);
            }
          }
          break;
        case "deck_invert":
          if (isDashboard && scrapedImages.length > 0) {
            setSelectedScraped((prev) =>
              scrapedImages.filter((img) => !prev.includes(img))
            );
          }
          break;
        case "deck_clear":
          if (isDashboard) setSelectedScraped([]);
          break;
        case "deck_stitch":
          if (isDashboard && selectedScraped.length >= 2) {
            addNotification(
              "Keyboard Trigger: Stitching selected panels...",
              "info"
            );
            const btn = document.querySelector(
              '#scraped_strips_deck button[title*="Stitch"]'
            ) as HTMLButtonElement;
            btn?.click();
          }
          break;

        // Editor Shortcuts
        case "editor_tab_1":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "adjust",
            });
          break;
        case "editor_tab_2":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "edit",
            });
          break;
        case "editor_tab_3":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "eraser",
            });
          break;
        case "editor_tab_4":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "slice",
            });
          break;
        case "editor_tab_5":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "crop",
            });
          break;
        case "editor_tab_6":
          if (isEditor)
            (window as any).dispatchEditorAction?.({
              type: "SWITCH_TAB",
              tab: "merge",
            });
          break;
        case "editor_prev":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "PREV_IMAGE" });
          break;
        case "editor_next":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "NEXT_IMAGE" });
          break;
        case "editor_undo":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "UNDO" });
          break;
        case "editor_redo":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "REDO" });
          break;
        case "editor_save":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "SAVE" });
          break;
        case "editor_close":
          if (isEditor)
            (window as any).dispatchEditorAction?.({ type: "CLOSE" });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    shortcuts,
    scrapedImages,
    lastEditorPath,
    targetUrl,
    selectedScraped,
    volume,
    isMuted,
    addNotification,
    handleGenerateVideo,
    toggleStoryboardPlayback,
    resetStoryboardPlayback,
    setVolume,
    setIsMuted,
    setSelectedScraped,
    navigateTo,
    setIsPipMode,
  ]);

  return {
    shortcuts,
    setShortcuts,
  };
}
