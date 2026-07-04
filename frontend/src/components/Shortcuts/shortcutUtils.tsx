import React from "react";
import {
  Layers,
  Play,
  Navigation,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import { Category, ShortcutActionDetails } from "./shortcutTypes";

export const categoryOptions: Category[] = [
  "all",
  "nav",
  "trigger",
  "playback",
  "editor",
  "deck",
];

export const categoryLabels: Record<Category, string> = {
  all: "All",
  nav: "Navigation",
  trigger: "Trigger",
  playback: "Playback",
  editor: "Editor",
  deck: "Gallery",
};

export const getActionDetails = (id: string): ShortcutActionDetails => {
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

  if (id === "playback_speed_1") label = "Playback Speed: 1x";
  if (id === "playback_speed_1_5") label = "Playback Speed: 1.5x";
  if (id === "playback_speed_2") label = "Playback Speed: 2x";
  if (id === "editor_brush_inc") label = "Editor: Increase Brush Size";
  if (id === "editor_brush_dec") label = "Editor: Decrease Brush Size";
  if (id === "editor_zoom_in") label = "Editor: Zoom In";
  if (id === "editor_zoom_out") label = "Editor: Zoom Out";

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
