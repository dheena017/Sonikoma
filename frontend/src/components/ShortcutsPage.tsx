import React, { useState, useEffect, useMemo } from "react";
import {
  Keyboard,
  ArrowLeft,
  RefreshCw,
  Search,
  Edit3,
  ShieldAlert,
  Check,
} from "lucide-react";

interface ShortcutsPageProps {
  shortcuts: Record<string, string>;
  setShortcuts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  defaultShortcuts: Record<string, string>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function ShortcutsPage({
  shortcuts,
  setShortcuts,
  defaultShortcuts,
  onNavigateHome,
  addNotification,
}: ShortcutsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recordingActionId, setRecordingActionId] = useState<string | null>(
    null
  );
  const [conflictMsg, setConflictMsg] = useState<string | null>(null);

  // Set window global flag to lock main router listeners
  useEffect(() => {
    (window as any).isRecordingHotkey = recordingActionId !== null;
    return () => {
      (window as any).isRecordingHotkey = false;
    };
  }, [recordingActionId]);

  // Listen for keypress when recording a shortcut
  useEffect(() => {
    if (!recordingActionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape alone cancels recording
      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        setRecordingActionId(null);
        setConflictMsg(null);
        return;
      }

      const parts: string[] = [];
      if (e.ctrlKey) parts.push("Control");
      if (e.altKey) parts.push("Alt");
      if (e.shiftKey) parts.push("Shift");

      let key = e.key;
      // Capitalize first letter or custom naming
      if (key === " ") key = "Space";
      if (key.length === 1) {
        key = key.toUpperCase();
      }

      // Ignore modifier presses alone
      if (["Control", "Alt", "Shift"].includes(e.key)) {
        return;
      }

      parts.push(key);
      const combination = parts.join("+");

      // Check conflicts
      const conflictEntry = Object.entries(shortcuts).find(
        ([id, val]) =>
          id !== recordingActionId &&
          typeof val === "string" &&
          val.toLowerCase() === combination.toLowerCase()
      );

      if (conflictEntry) {
        const friendlyName = conflictEntry[0]
          .replace("nav_", "Navigate to ")
          .replace("trigger_", "Trigger ")
          .replace("playback_", "Playback ")
          .replace("editor_", "Editor ")
          .replace("deck_", "Scraper Deck ")
          .replace(/_/g, " ");
        setConflictMsg(
          `Conflict: "${combination}" is already assigned to "${friendlyName}".`
        );
        return;
      }

      // Save
      setShortcuts((prev) => {
        const next = { ...prev, [recordingActionId]: combination };
        localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
        return next;
      });

      if (addNotification) {
        addNotification(
          `Updated shortcut for ${recordingActionId.replace(
            /_/g,
            " "
          )} to ${combination}`,
          "success"
        );
      }

      setRecordingActionId(null);
      setConflictMsg(null);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recordingActionId, shortcuts, setShortcuts, addNotification]);

  const handleResetToDefaults = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirm(
      "Are you sure you want to restore all keyboard shortcuts to factory defaults?"
    );
    if (confirmed) {
      setShortcuts(defaultShortcuts);
      localStorage.setItem(
        "ai_comic_shortcuts",
        JSON.stringify(defaultShortcuts)
      );
      if (addNotification) {
        addNotification("Restored default key configurations", "info");
      }
    }
  };

  // Human-readable labels
  const getActionDetails = (id: string) => {
    const formattedId = id
      .replace("nav_", "Navigate: ")
      .replace("trigger_", "Action: ")
      .replace("playback_", "Preview: ")
      .replace("editor_tab_", "Editor Tab: ")
      .replace("editor_", "Editor: ")
      .replace("deck_", "Scraper Gallery: ")
      .replace(/_/g, " ");

    let scope = "Global";
    if (id.startsWith("editor_")) scope = "Crop Editor Only";
    else if (
      id.startsWith("playback_") ||
      id.startsWith("deck_") ||
      id.startsWith("volume_")
    )
      scope = "Dashboard Only";

    return { label: formattedId, scope };
  };

  const filteredShortcuts = useMemo(() => {
    return Object.entries(shortcuts).filter(([id, val]) => {
      const details = getActionDetails(id);
      return (
        details.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [shortcuts, searchQuery]);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span
              className="hover:text-purple-400 cursor-pointer"
              onClick={onNavigateHome}
            >
              Dashboard
            </span>
            <span>&gt;</span>
            <span className="text-purple-400">Key Bindings</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Keyboard className="h-6 w-6 text-purple-400" />
            Workspace Key Bindings Configuration
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Customize global accessibility keys and editor canvas macro hotkeys
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-neutral-500" />
            Restore Defaults
          </button>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
        <input
          type="text"
          placeholder="Filter shortcuts by action name or key..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2 text-xs text-neutral-200 outline-none transition-all font-mono"
        />
      </div>

      {/* Grid of Shortcuts */}
      <div className="bg-neutral-950/40 border border-neutral-850 rounded-2xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 bg-neutral-950/80 px-6 py-3 border-b border-neutral-850 text-[10px] font-bold font-mono text-neutral-500 tracking-wider uppercase">
          <div className="col-span-5 sm:col-span-6">Action / Command</div>
          <div className="col-span-3">Scope Context</div>
          <div className="col-span-4 text-right">Key Combination</div>
        </div>

        <div className="divide-y divide-neutral-900/60 max-h-[500px] overflow-y-auto">
          {filteredShortcuts.length === 0 ? (
            <div className="p-8 text-center text-xs text-neutral-500 font-mono">
              No shortcuts found matching search query.
            </div>
          ) : (
            filteredShortcuts.map(([id, val]) => {
              const details = getActionDetails(id);
              const isRecording = recordingActionId === id;

              return (
                <div
                  key={id}
                  onClick={() => {
                    if (!isRecording) {
                      setRecordingActionId(id);
                      setConflictMsg(null);
                    }
                  }}
                  className={`grid grid-cols-12 items-center px-6 py-3.5 text-xs transition-all cursor-pointer select-none group ${
                    isRecording
                      ? "bg-purple-950/20 border-l-2 border-l-purple-500"
                      : "hover:bg-neutral-900/40 border-l-2 border-l-transparent"
                  }`}
                >
                  <div className="col-span-5 sm:col-span-6 font-semibold text-white tracking-tight flex items-center gap-2">
                    <span className="capitalize">{details.label}</span>
                  </div>
                  <div className="col-span-3 text-[10px] font-mono text-neutral-500">
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800/80">
                      {details.scope}
                    </span>
                  </div>
                  <div className="col-span-4 text-right flex items-center gap-2 justify-end">
                    {isRecording ? (
                      <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded bg-purple-500 text-white animate-pulse shadow-md shadow-purple-900/40">
                        PRESS NEW KEYS...
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <kbd className="px-2.5 py-1 text-[10px] font-bold font-mono bg-neutral-900 border border-neutral-800 text-purple-300 rounded shadow-sm group-hover:text-purple-200 group-hover:border-purple-800/50 transition-colors">
                          {val}
                        </kbd>
                        <Edit3 className="h-3 w-3 text-neutral-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recording Prompt Modal */}
      {recordingActionId && (
        <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-[fadeIn_0.15s_ease-out]">
            <div className="inline-flex p-3 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-400">
              <Keyboard className="h-6 w-6 text-purple-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Record Key Combination
              </h3>
              <p className="text-[11px] text-neutral-450 font-mono mt-1">
                Assigning hotkey for:{" "}
                <strong className="text-purple-300">
                  {recordingActionId.replace(/_/g, " ")}
                </strong>
              </p>
            </div>

            <div className="py-6 px-4 bg-neutral-900/60 border border-neutral-850 rounded-2xl flex flex-col justify-center items-center h-24">
              <span className="text-xs text-neutral-400 font-mono">
                Press your custom hotkey on your keyboard now...
              </span>
              <span className="text-[10px] text-neutral-600 font-mono mt-2">
                (e.g. Alt+S, Control+Shift+E, Space, or F5)
              </span>
            </div>

            {conflictMsg && (
              <div className="flex items-center gap-1.5 p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 text-[10px] font-mono text-amber-350 text-left">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{conflictMsg}</span>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-2">
              <span className="text-[10px] font-mono text-neutral-500">
                Press{" "}
                <kbd className="px-1 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                  Esc
                </kbd>{" "}
                to cancel
              </span>
              <button
                onClick={() => {
                  setRecordingActionId(null);
                  setConflictMsg(null);
                }}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-350 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
