import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Keyboard,
  ArrowLeft,
  RefreshCw,
  Search,
  Edit3,
  ShieldAlert,
  Download,
  Upload,
  Trash2,
  Settings,
  Layers,
  Play,
  Navigation,
  Image as ImageIcon,
} from "lucide-react";

interface ShortcutsPageProps {
  shortcuts: Record<string, string>;
  setShortcuts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  defaultShortcuts: Record<string, string>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

type Category = "all" | "nav" | "trigger" | "playback" | "editor" | "deck";

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
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const details = getActionDetails(conflictEntry[0]);
        setConflictMsg(
          `Conflict: "${combination}" is already assigned to "${details.label}".`
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
        const details = getActionDetails(recordingActionId);
        addNotification(
          `Updated shortcut for ${details.label} to ${combination}`,
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
    const confirmed = await (window as any).confirmAsync(
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

  const handleResetSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultValue = defaultShortcuts[id];
    setShortcuts((prev) => {
      const next = { ...prev, [id]: defaultValue };
      localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
      return next;
    });
    if (addNotification) {
      const details = getActionDetails(id);
      addNotification(
        `Reset ${details.label} to default: ${defaultValue}`,
        "info"
      );
    }
  };

  const handleDisableSingle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShortcuts((prev) => {
      const next = { ...prev, [id]: "" };
      localStorage.setItem("ai_comic_shortcuts", JSON.stringify(next));
      return next;
    });
    if (addNotification) {
      const details = getActionDetails(id);
      addNotification(`Disabled shortcut for ${details.label}`, "warning");
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(shortcuts, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = "sonikoma_shortcuts.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    if (addNotification) {
      addNotification("Shortcuts exported successfully", "success");
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (typeof json === "object" && json !== null) {
          // Sanitize
          const sanitized = Object.fromEntries(
            Object.entries(json).filter(([k, v]) => typeof v === "string")
          ) as Record<string, string>;

          setShortcuts(sanitized);
          localStorage.setItem("ai_comic_shortcuts", JSON.stringify(sanitized));
          if (addNotification) {
            addNotification("Shortcuts imported successfully", "success");
          }
        }
      } catch (err) {
        if (addNotification) {
          addNotification("Failed to import shortcuts: Invalid JSON", "error");
        }
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = "";
  };

  // Human-readable labels
  const getActionDetails = (id: string) => {
    let label = id
      .replace("nav_", "Navigate: ")
      .replace("trigger_", "Action: ")
      .replace("playback_", "Preview: ")
      .replace("editor_tab_", "Editor Tab: ")
      .replace("editor_", "Editor: ")
      .replace("deck_", "Gallery: ")
      .replace("volume_", "Volume: ")
      .replace(/_/g, " ");

    let scope = "Global";
    let icon = <Navigation className="h-3.5 w-3.5" />;
    let category: Category = "nav";

    if (id.startsWith("editor_")) {
      scope = "Editor Only";
      icon = <Layers className="h-3.5 w-3.5" />;
      category = "editor";
    } else if (id.startsWith("playback_") || id.startsWith("volume_")) {
      scope = "Workspace Only";
      icon = <Play className="h-3.5 w-3.5" />;
      category = "playback";
    } else if (id.startsWith("deck_")) {
      scope = "Gallery Only";
      icon = <ImageIcon className="h-3.5 w-3.5" />;
      category = "deck";
    } else if (id.startsWith("trigger_")) {
      scope = "Global";
      icon = <Settings className="h-3.5 w-3.5" />;
      category = "trigger";
    }

    // Custom labels for better clarity
    if (id === "playback_speed_1") label = "Playback Speed: 1x";
    if (id === "playback_speed_1_5") label = "Playback Speed: 1.5x";
    if (id === "playback_speed_2") label = "Playback Speed: 2x";
    if (id === "editor_brush_inc") label = "Editor: Increase Brush Size";
    if (id === "editor_brush_dec") label = "Editor: Decrease Brush Size";
    if (id === "editor_zoom_in") label = "Editor: Zoom In";
    if (id === "editor_zoom_out") label = "Editor: Zoom Out";

    return { label, scope, icon, category };
  };

  const filteredShortcuts = useMemo(() => {
    return Object.entries(shortcuts).filter(([id, val]) => {
      const details = getActionDetails(id);
      const matchesSearch =
        details.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        val.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || details.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [shortcuts, searchQuery, activeCategory]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark
              key={i}
              className="bg-purple-500/40 text-purple-200 rounded px-0.5 border-b border-purple-400/50"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const renderKeyCombo = (combo: string) => {
    if (!combo)
      return <span className="text-neutral-600 italic">Disabled</span>;

    const keys = combo.split("+");
    return (
      <div className="flex items-center gap-1.5 justify-end">
        {keys.map((key, idx) => (
          <React.Fragment key={idx}>
            <kbd className="min-w-[24px] px-2 py-1 text-[10px] font-bold font-mono bg-neutral-900 border-b-2 border-neutral-800 text-purple-300 rounded shadow-[0_2px_0_0_rgba(0,0,0,0.5)] flex items-center justify-center group-hover:text-purple-200 group-hover:border-purple-700/50 transition-all active:translate-y-[1px] active:shadow-none">
              {key}
            </kbd>
            {idx < keys.length - 1 && (
              <span className="text-neutral-600 text-[10px]">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
      {/* Header title */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-2">
            <span
              className="hover:text-purple-400 cursor-pointer transition-colors"
              onClick={onNavigateHome}
            >
              Workspace
            </span>
            <span>&gt;</span>
            <span className="text-purple-400">Keyboard Shortcuts</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Keyboard className="h-7 w-7 text-purple-400" />
            </div>
            Shortcuts & Macros
          </h2>
          <p className="text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
            Boost your productivity with custom keybindings. Control the editor,
            navigate the workspace, and trigger AI workflows with your keyboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <div className="h-8 w-px bg-neutral-800 mx-1 hidden sm:block" />
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 border border-neutral-800 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 hover:border-rose-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Factory Reset
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar / Filter Tabs */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-1.5">
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest px-3 mb-2 font-mono">
            Command Groups
          </p>
          {(
            [
              "all",
              "nav",
              "trigger",
              "playback",
              "editor",
              "deck",
            ] as Category[]
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all text-left ${
                activeCategory === cat
                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-300 font-bold"
                  : "text-neutral-450 hover:text-neutral-300 hover:bg-neutral-900/50"
              }`}
            >
              {cat === "all" && <Keyboard className="h-4 w-4" />}
              {cat === "nav" && <Navigation className="h-4 w-4" />}
              {cat === "trigger" && <Settings className="h-4 w-4" />}
              {cat === "playback" && <Play className="h-4 w-4" />}
              {cat === "editor" && <Layers className="h-4 w-4" />}
              {cat === "deck" && <ImageIcon className="h-4 w-4" />}
              <span className="capitalize">
                {cat === "nav"
                  ? "Navigation"
                  : cat === "deck"
                  ? "Gallery"
                  : cat}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search shortcuts (e.g. 'Zoom', 'Dashboard', 'Alt+S')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900/50 border border-neutral-800 hover:border-neutral-700 focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/5 rounded-2xl pl-12 pr-4 py-3 text-sm text-neutral-200 outline-none transition-all placeholder:text-neutral-600 shadow-inner"
            />
          </div>

          {/* Grid of Shortcuts */}
          <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
            <div className="grid grid-cols-12 bg-neutral-950/50 px-6 py-4 border-b border-neutral-800 text-[10px] font-bold font-mono text-neutral-500 tracking-wider uppercase">
              <div className="col-span-6 sm:col-span-7">
                Action & Description
              </div>
              <div className="col-span-2 hidden sm:block">Scope</div>
              <div className="col-span-6 sm:col-span-3 text-right">Mapping</div>
            </div>

            <div className="divide-y divide-neutral-800/40 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
              {filteredShortcuts.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <div className="inline-flex p-4 rounded-full bg-neutral-900 border border-neutral-800">
                    <Search className="h-8 w-8 text-neutral-700" />
                  </div>
                  <p className="text-sm text-neutral-500 font-medium">
                    No shortcuts found matching your criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveCategory("all");
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                filteredShortcuts.map(([id, val]) => {
                  const details = getActionDetails(id);
                  const isRecording = recordingActionId === id;
                  const isModified = val !== defaultShortcuts[id];

                  return (
                    <div
                      key={id}
                      onClick={() => {
                        if (!isRecording) {
                          setRecordingActionId(id);
                          setConflictMsg(null);
                        }
                      }}
                      className={`grid grid-cols-12 items-center px-6 py-4 transition-all cursor-pointer group relative ${
                        isRecording
                          ? "bg-purple-950/20 z-10"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {isRecording && (
                        <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />
                      )}

                      <div className="col-span-6 sm:col-span-7 flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${
                            isRecording
                              ? "bg-purple-500 text-white"
                              : "bg-neutral-900 text-neutral-500 group-hover:text-neutral-300 group-hover:bg-neutral-800"
                          } transition-all`}
                        >
                          {details.icon}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm tracking-tight">
                              {highlightText(details.label, searchQuery)}
                            </span>
                            {isModified && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                                title="Modified from default"
                              />
                            )}
                          </div>
                          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 sm:hidden">
                            Scope: {details.scope}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 hidden sm:block">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-500 font-medium">
                          {details.scope}
                        </span>
                      </div>

                      <div className="col-span-6 sm:col-span-3 flex items-center gap-4 justify-end">
                        {isRecording ? (
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/20">
                              RECORDING...
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            {renderKeyCombo(val)}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
                              {val && (
                                <button
                                  onClick={(e) => handleDisableSingle(id, e)}
                                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-all"
                                  title="Disable Shortcut"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {isModified && (
                                <button
                                  onClick={(e) => handleResetSingle(id, e)}
                                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-amber-400 transition-all"
                                  title="Reset to Default"
                                >
                                  <RefreshCw className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-purple-400 transition-all">
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="bg-neutral-950/80 px-6 py-3 border-t border-neutral-800 flex justify-between items-center">
              <span className="text-[10px] text-neutral-500 font-mono">
                Showing {filteredShortcuts.length} of{" "}
                {Object.keys(shortcuts).length} actions
              </span>
              <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Customized</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px]">
                    Esc
                  </kbd>
                  <span>Cancel recording</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recording Prompt Modal */}
      {recordingActionId && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0a0a0c] border border-white/10 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(139,92,246,0.15)] text-center space-y-6 animate-[fadeIn_0.15s_ease-out] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />

            <div className="inline-flex p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 mb-2">
              <Keyboard className="h-10 w-10 text-purple-300 animate-pulse" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                New Key Combination
              </h3>
              <p className="text-sm text-neutral-400 mt-2">
                Assigning hotkey for:{" "}
                <span className="text-purple-300 font-bold px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 ml-1">
                  {getActionDetails(recordingActionId).label}
                </span>
              </p>
            </div>

            <div className="py-10 px-6 bg-neutral-900/40 border border-white/5 rounded-3xl flex flex-col justify-center items-center group">
              <span className="text-lg text-neutral-200 font-medium tracking-tight animate-pulse">
                Waiting for input...
              </span>
              <span className="text-xs text-neutral-500 font-mono mt-4 leading-relaxed max-w-xs">
                Press any combination of modifier keys (Ctrl, Alt, Shift) and a
                standard key.
              </span>
              <div className="mt-8 flex gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-white/5 text-[10px] text-neutral-400 font-mono">
                  Example: Ctrl + Shift + S
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-neutral-950 border border-white/5 text-[10px] text-neutral-400 font-mono">
                  Example: F5
                </span>
              </div>
            </div>

            {conflictMsg && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs font-medium text-rose-400 text-left animate-[shake_0.4s_ease-in-out]">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{conflictMsg}</span>
              </div>
            )}

            <div className="flex justify-between items-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-widest">
                <span>Press</span>
                <kbd className="px-2 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-white/5 shadow-inner">
                  Esc
                </kbd>
                <span>to abort</span>
              </div>
              <button
                onClick={() => {
                  setRecordingActionId(null);
                  setConflictMsg(null);
                }}
                className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xl active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #262626; border-radius: 20px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #333333; }
      `}</style>
    </div>
  );
}
