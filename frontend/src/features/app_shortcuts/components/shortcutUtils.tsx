import React from "react";
import {
  Layers,
  Play,
  Navigation,
  Settings,
  Image as ImageIcon,
  Film,
  Scissors,
  SplitSquareHorizontal,
  Copy,
  Plus,
  Volume2,
  Lock,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import {
  Category,
  ShortcutActionDetails,
} from "@/features/app_shortcuts/components/shortcutTypes";

export const categoryOptions: Category[] = [
  "all",
  "nav",
  "timeline",
  "editor",
  "playback",
  "trigger",
  "deck",
];

export const categoryLabels: Record<Category, string> = {
  all: "All",
  nav: "Navigation",
  timeline: "Timeline & Video",
  editor: "Editor",
  playback: "Playback",
  trigger: "Trigger",
  deck: "Gallery",
};

export const getActionDetails = (id: string): ShortcutActionDetails => {
  let label = id
    .replace(/^nav_/, "")
    .replace(/^trigger_/, "")
    .replace(/^playback_/, "")
    .replace(/^editor_tab_/, "")
    .replace(/^editor_/, "")
    .replace(/^timeline_/, "")
    .replace(/^deck_/, "")
    .replace(/^volume_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let scope = "Global";
  let icon = <Navigation className="h-3.5 w-3.5" />;
  let category: Category = "nav";

  // Navigation
  if (id === "nav_dashboard") { label = "Go to Dashboard"; scope = "Navigation"; category = "nav"; icon = <Navigation className="h-3.5 w-3.5" />; }
  else if (id === "nav_settings") { label = "Go to Settings"; scope = "Navigation"; category = "nav"; icon = <Settings className="h-3.5 w-3.5" />; }
  else if (id === "nav_editor") { label = "Go to Video Editor"; scope = "Navigation"; category = "nav"; icon = <Film className="h-3.5 w-3.5" />; }
  else if (id === "nav_autocrop") { label = "Go to AutoCrop Studio"; scope = "Navigation"; category = "nav"; icon = <Scissors className="h-3.5 w-3.5" />; }
  else if (id === "nav_bubble") { label = "Go to Bubble Cleaner"; scope = "Navigation"; category = "nav"; icon = <Layers className="h-3.5 w-3.5" />; }
  else if (id === "nav_logs") { label = "Go to System Logs"; scope = "Navigation"; category = "nav"; icon = <Settings className="h-3.5 w-3.5" />; }
  else if (id === "nav_status") { label = "Go to Server Status"; scope = "Navigation"; category = "nav"; icon = <Settings className="h-3.5 w-3.5" />; }
  else if (id === "nav_shortcuts") { label = "Go to Shortcuts Settings"; scope = "Navigation"; category = "nav"; icon = <Settings className="h-3.5 w-3.5" />; }
  else if (id === "nav_profile") { label = "Go to User Profile"; scope = "Navigation"; category = "nav"; icon = <Settings className="h-3.5 w-3.5" />; }

  // Triggers / Actions
  else if (id === "trigger_compile") { label = "Compile Video Project"; scope = "Action"; category = "trigger"; icon = <Settings className="h-3.5 w-3.5" />; }
  else if (id === "trigger_scrape") { label = "New Scrape Task"; scope = "Action"; category = "trigger"; icon = <Settings className="h-3.5 w-3.5" />; }

  // Playback & Audio
  else if (id === "playback_toggle") { label = "Play / Pause Playback"; scope = "Playback"; category = "playback"; icon = <Play className="h-3.5 w-3.5" />; }
  else if (id === "playback_reset") { label = "Reset Playback to Start"; scope = "Playback"; category = "playback"; icon = <Play className="h-3.5 w-3.5" />; }
  else if (id === "volume_up") { label = "Increase Volume"; scope = "Audio"; category = "playback"; icon = <Volume2 className="h-3.5 w-3.5" />; }
  else if (id === "volume_down") { label = "Decrease Volume"; scope = "Audio"; category = "playback"; icon = <Volume2 className="h-3.5 w-3.5" />; }
  else if (id === "volume_mute") { label = "Mute / Unmute Master Audio"; scope = "Audio"; category = "playback"; icon = <Volume2 className="h-3.5 w-3.5" />; }
  else if (id === "playback_speed_1") { label = "Playback Speed: 1.0x"; scope = "Playback"; category = "playback"; icon = <Play className="h-3.5 w-3.5" />; }
  else if (id === "playback_speed_1_5") { label = "Playback Speed: 1.5x"; scope = "Playback"; category = "playback"; icon = <Play className="h-3.5 w-3.5" />; }
  else if (id === "playback_speed_2") { label = "Playback Speed: 2.0x"; scope = "Playback"; category = "playback"; icon = <Play className="h-3.5 w-3.5" />; }

  // Timeline & Video
  else if (id === "timeline_split") { label = "Split Clip at Playhead"; scope = "Timeline"; category = "timeline"; icon = <SplitSquareHorizontal className="h-3.5 w-3.5" />; }
  else if (id === "timeline_delete") { label = "Delete Selected Clip"; scope = "Timeline"; category = "timeline"; icon = <Scissors className="h-3.5 w-3.5" />; }
  else if (id === "timeline_copy") { label = "Copy Selected Clip"; scope = "Timeline"; category = "timeline"; icon = <Copy className="h-3.5 w-3.5" />; }
  else if (id === "timeline_paste") { label = "Paste Clip"; scope = "Timeline"; category = "timeline"; icon = <Plus className="h-3.5 w-3.5" />; }
  else if (id === "timeline_duplicate") { label = "Duplicate Selected Clip"; scope = "Timeline"; category = "timeline"; icon = <Copy className="h-3.5 w-3.5" />; }
  else if (id === "timeline_keyframe") { label = "Add Animation Keyframe"; scope = "Timeline"; category = "timeline"; icon = <Plus className="h-3.5 w-3.5" />; }
  else if (id === "timeline_zoom_in") { label = "Zoom In Scale"; scope = "Timeline"; category = "timeline"; icon = <ZoomIn className="h-3.5 w-3.5" />; }
  else if (id === "timeline_zoom_out") { label = "Zoom Out Scale"; scope = "Timeline"; category = "timeline"; icon = <ZoomOut className="h-3.5 w-3.5" />; }
  else if (id === "timeline_zoom_reset") { label = "Reset Zoom to 100%"; scope = "Timeline"; category = "timeline"; icon = <Maximize2 className="h-3.5 w-3.5" />; }
  else if (id === "timeline_mute") { label = "Toggle Active Track Mute"; scope = "Timeline"; category = "timeline"; icon = <Volume2 className="h-3.5 w-3.5" />; }
  else if (id === "timeline_lock") { label = "Toggle Active Track Lock"; scope = "Timeline"; category = "timeline"; icon = <Lock className="h-3.5 w-3.5" />; }
  else if (id === "timeline_snap") { label = "Toggle Magnetic Snapping"; scope = "Timeline"; category = "timeline"; icon = <Layers className="h-3.5 w-3.5" />; }

  // Editor (Canvas / Image)
  else if (id.startsWith("editor_")) {
    scope = "Editor";
    category = "editor";
    icon = <Layers className="h-3.5 w-3.5" />;
    if (id === "editor_brush_inc") label = "Increase Brush Size";
    else if (id === "editor_brush_dec") label = "Decrease Brush Size";
    else if (id === "editor_zoom_in") label = "Zoom In Canvas";
    else if (id === "editor_zoom_out") label = "Zoom Out Canvas";
  }

  // Gallery
  else if (id.startsWith("deck_")) {
    scope = "Gallery";
    category = "deck";
    icon = <ImageIcon className="h-3.5 w-3.5" />;
  }

  return { label, scope, icon, category };
};

export const highlightText = (text: string, highlight: string) => {
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

export const renderKeyCombo = (combo: string) => {
  if (!combo) return <span className="text-neutral-600 italic">Disabled</span>;

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
