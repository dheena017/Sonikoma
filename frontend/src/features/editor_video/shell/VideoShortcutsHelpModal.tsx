import React, { useState, useMemo } from "react";
import {
  X,
  Keyboard,
  Search,
  Play,
  Scissors,
  ZoomIn,
  Sliders,
  Sparkles,
} from "lucide-react";
import { useAppShortcuts } from "@/shared/hooks/useAppShortcuts";

export interface VideoShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "all", label: "All Shortcuts", icon: Keyboard },
  { id: "playback", label: "Playback & Navigation", icon: Play },
  { id: "edit", label: "Clip & Track Editing", icon: Scissors },
  { id: "zoom", label: "Zoom & Grid", icon: ZoomIn },
  { id: "layout", label: "General & Layout", icon: Sliders },
];

export const VideoShortcutsHelpModal: React.FC<VideoShortcutsHelpModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const { shortcuts } = useAppShortcuts();

  const shortcutsList = useMemo(() => {
    return [
      // Playback
      {
        id: "play_pause",
        label: "Play / Pause",
        description: "Toggle video and timeline playback",
        keys: (shortcuts.playback_toggle || "Space").split("+"),
        category: "playback" as const,
      },
      {
        id: "step_back",
        label: "Step Backward",
        description: "Nudge playhead 0.5s backward",
        keys: ["←"],
        category: "playback" as const,
      },
      {
        id: "step_forward",
        label: "Step Forward",
        description: "Nudge playhead 0.5s forward",
        keys: ["→"],
        category: "playback" as const,
      },
      {
        id: "jump_back",
        label: "Jump 2s Backward",
        description: "Quickly seek backward by 2 seconds",
        keys: ["Shift", "←"],
        category: "playback" as const,
      },
      {
        id: "jump_forward",
        label: "Jump 2s Forward",
        description: "Quickly seek forward by 2 seconds",
        keys: ["Shift", "→"],
        category: "playback" as const,
      },
      {
        id: "jump_start",
        label: "Jump to Start",
        description: "Move playhead to 0:00",
        keys: ["Home"],
        category: "playback" as const,
      },
      {
        id: "jump_end",
        label: "Jump to End",
        description: "Move playhead to end of timeline",
        keys: ["End"],
        category: "playback" as const,
      },

      // Editing
      {
        id: "split_clip",
        label: "Split Clip",
        description: "Slice selected clip at current playhead position",
        keys: (shortcuts.timeline_split || "S").split("+"),
        category: "edit" as const,
      },
      {
        id: "delete_clip",
        label: "Delete Selected",
        description: "Remove clip or reset custom duration",
        keys: (shortcuts.timeline_delete || "Delete").split("+"),
        category: "edit" as const,
      },
      {
        id: "copy_clip",
        label: "Copy Clip",
        description: "Copy selected panel or audio clip",
        keys: (shortcuts.timeline_copy || "Ctrl+C").split("+"),
        category: "edit" as const,
      },
      {
        id: "paste_clip",
        label: "Paste Clip",
        description: "Paste copied clip to active track",
        keys: (shortcuts.timeline_paste || "Ctrl+V").split("+"),
        category: "edit" as const,
      },
      {
        id: "duplicate_clip",
        label: "Duplicate Clip",
        description: "Create an immediate clone of selected clip",
        keys: (shortcuts.timeline_duplicate || "Ctrl+D").split("+"),
        category: "edit" as const,
      },
      {
        id: "add_keyframe",
        label: "Add Keyframe",
        description: "Insert animation transform keyframe on selected clip",
        keys: (shortcuts.timeline_keyframe || "K").split("+"),
        category: "edit" as const,
      },
      {
        id: "toggle_mute",
        label: "Toggle Track Mute",
        description: "Mute or unmute track of selected clip",
        keys: (shortcuts.timeline_mute || "M").split("+"),
        category: "edit" as const,
      },
      {
        id: "toggle_lock",
        label: "Toggle Track Lock",
        description: "Lock or unlock track to prevent accidental moves",
        keys: (shortcuts.timeline_lock || "L").split("+"),
        category: "edit" as const,
      },

      // Zoom & Tools
      {
        id: "zoom_in",
        label: "Zoom In Timeline",
        description: "Increase timeline scale & pixel density",
        keys: (shortcuts.timeline_zoom_in || "+").split("+"),
        category: "zoom" as const,
      },
      {
        id: "zoom_out",
        label: "Zoom Out Timeline",
        description: "Decrease timeline scale to see more duration",
        keys: (shortcuts.timeline_zoom_out || "-").split("+"),
        category: "zoom" as const,
      },
      {
        id: "zoom_reset",
        label: "Reset Zoom (100%)",
        description: "Reset timeline scale to default 30px/s",
        keys: (shortcuts.timeline_zoom_reset || "0").split("+"),
        category: "zoom" as const,
      },
      {
        id: "toggle_snap",
        label: "Magnetic Snapping",
        description: "Toggle magnetic clip edge alignment",
        keys: (shortcuts.timeline_snap || "N").split("+"),
        category: "zoom" as const,
      },

      // Layout & General
      {
        id: "open_shortcuts",
        label: "Keyboard Shortcuts",
        description: "Open this cheat sheet modal",
        keys: ["?"],
        category: "layout" as const,
      },
    ];
  }, [shortcuts]);

  const filtered = useMemo(() => {
    return shortcutsList.filter((item) => {
      if (activeCat !== "all" && item.category !== activeCat) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.keys.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [search, activeCat]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-[#0e0e16] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#12121e]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-purple-600/20 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Timeline & Video Shortcuts
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                  Cheat Sheet
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Speed up editing with keyboard shortcuts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-white/5 space-y-3 bg-[#0a0a10]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shortcuts (e.g., Space, Split, Zoom, Ctrl+D)..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#3B82F6] transition"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = activeCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-sm"
                      : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No shortcuts found matching &ldquo;{search}&rdquo;
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200 group-hover:text-[#93C5FD] transition">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {item.keys.map((k, i) => (
                    <React.Fragment key={i}>
                      <kbd className="min-w-[28px] h-7 px-2 flex items-center justify-center rounded-md bg-neutral-900 border border-neutral-700 text-xs font-mono font-bold text-[#60A5FA] shadow-sm">
                        {k}
                      </kbd>
                      {i < item.keys.length - 1 && (
                        <span className="text-neutral-600 text-xs">+</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-[#12121e] flex items-center justify-between text-[11px] text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Hover any tool button to see its shortcut</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-[#3B82F6] text-white font-medium transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoShortcutsHelpModal;
