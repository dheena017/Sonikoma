// ─── ContextMenuPopup ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/ContextMenuPopup.tsx
// Specialized Canva & NLE context menus tailored uniquely per track type:
// V1 (Story Panels), V2 (Camera FX), V3 (Subtitles), A1 (Music), A2 (SFX), A3 (Voiceover).

import React from "react";
import {
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Lock,
  Clock,
  SplitSquareHorizontal,
  Download,
  Info,
  Sparkles,
  Type,
  Camera,
  Music,
  Zap,
  Mic,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { ContextMenuState } from "../types";

interface ContextMenuPopupProps {
  contextMenu: ContextMenuState | null;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  clipboard: string | null;
  hasDuration: boolean;
  onCopy: () => void;
  onPaste: () => void;
  onDuplicate: () => void;
  onRemoveDuration: () => void;
  onApplyDurationToAll: () => void;
  onSplit: () => void;
}

const MENU_W = 240;

const ContextMenuPopup: React.FC<ContextMenuPopupProps> = ({
  contextMenu,
  contextMenuRef,
  clipboard,
  hasDuration,
  onCopy,
  onPaste,
  onDuplicate,
  onRemoveDuration,
  onApplyDurationToAll,
  onSplit,
}) => {
  if (!contextMenu) return null;

  const key = contextMenu.clipKey.toLowerCase();
  const trackPrefix = key.split("-")[0]; // "v1", "v2", "v3", "a1", "a2", "a3"

  // ── Track-Specific Header & Items Configuration ──────────────────────────────
  let trackTitle = "Clip Options";
  let trackIcon = Sparkles;
  let trackColor = "text-purple-400";
  let items: any[] = [];

  if (trackPrefix === "v1") {
    // 🎦 V1 Story Panels (Frames / Images)
    trackTitle = `Story Panel #${(contextMenu.panelIdx ?? 0) + 1}`;
    trackIcon = ImageIcon;
    trackColor = "text-purple-400";
    items = [
      { icon: Copy, label: "Copy Frame", shortcut: "Ctrl+C", action: onCopy },
      {
        icon: ClipboardPaste,
        label: "Paste Frame",
        shortcut: "Ctrl+V",
        action: onPaste,
        disabled: !clipboard,
      },
      {
        icon: CopyPlus,
        label: "Duplicate Frame",
        shortcut: "Ctrl+D",
        action: onDuplicate,
      },
      { divider: true },
      { icon: RefreshCw, label: "Regenerate Visual / Prompt", action: onCopy },
      { icon: Maximize2, label: "Fit / Fill Aspect Ratio", action: onCopy },
      {
        icon: SplitSquareHorizontal,
        label: "Split Frame at Playhead",
        shortcut: "S",
        action: onSplit,
      },
      {
        icon: Clock,
        label: "Edit Frame Duration",
        action: onApplyDurationToAll,
        disabled: !hasDuration,
      },
      { icon: Lock, label: "Lock Frame", shortcut: "L", action: onSplit },
      { divider: true },
      { icon: Download, label: "Export Frame (PNG)", action: onCopy },
      {
        icon: Trash2,
        label: "Delete Frame",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else if (trackPrefix === "v2") {
    // 🎥 V2 Camera FX (Pan, Zoom, Motion clips)
    trackTitle = `Camera Motion FX #${(contextMenu.panelIdx ?? 0) + 1}`;
    trackIcon = Camera;
    trackColor = "text-indigo-400";
    items = [
      {
        icon: Sparkles,
        label: "Copy Motion Style",
        shortcut: "Ctrl+Alt+C",
        action: onCopy,
      },
      {
        icon: CopyPlus,
        label: "Apply Motion to Next Panel",
        shortcut: "Ctrl+D",
        action: onDuplicate,
      },
      { divider: true },
      { icon: Sliders, label: "Adjust Camera Speed / Intensity", action: onCopy },
      {
        icon: Clock,
        label: "Edit Motion Timing",
        action: onApplyDurationToAll,
      },
      {
        icon: Trash2,
        label: "Remove Motion FX",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else if (trackPrefix === "v3") {
    // 📝 V3 Subtitles (Text narration lines)
    trackTitle = `Subtitle / Caption #${(contextMenu.panelIdx ?? 0) + 1}`;
    trackIcon = Type;
    trackColor = "text-purple-300";
    items = [
      { icon: Copy, label: "Copy Text", shortcut: "Ctrl+C", action: onCopy },
      {
        icon: CopyPlus,
        label: "Duplicate Caption Line",
        shortcut: "Ctrl+D",
        action: onDuplicate,
      },
      { divider: true },
      { icon: Sparkles, label: "Style & Font Preset", action: onCopy },
      {
        icon: Clock,
        label: "Sync Duration to Voice",
        action: onApplyDurationToAll,
      },
      {
        icon: Trash2,
        label: "Delete Subtitle",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else if (trackPrefix === "a1") {
    // 🎵 A1 Music (BGM Soundtrack)
    trackTitle = "BGM Soundtrack";
    trackIcon = Music;
    trackColor = "text-emerald-400";
    items = [
      { icon: RefreshCw, label: "Change Music Theme", action: onCopy },
      { icon: Sliders, label: "Adjust BGM Volume & Fade", action: onCopy },
      { icon: VolumeX, label: "Mute Soundtrack", shortcut: "M", action: onSplit },
      { divider: true },
      {
        icon: Clock,
        label: "Trim Track Duration",
        action: onApplyDurationToAll,
      },
      { icon: Download, label: "Download Audio Track", action: onCopy },
      {
        icon: Trash2,
        label: "Remove Music Track",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else if (trackPrefix === "a2") {
    // ⚡ A2 Sound FX (SFX sound clips)
    trackTitle = `Sound FX #${(contextMenu.panelIdx ?? 0) + 1}`;
    trackIcon = Zap;
    trackColor = "text-cyan-400";
    items = [
      { icon: RefreshCw, label: "Browse / Replace SFX", action: onCopy },
      { icon: CopyPlus, label: "Duplicate SFX Clip", shortcut: "Ctrl+D", action: onDuplicate },
      { divider: true },
      { icon: Sliders, label: "SFX Gain & Volume", action: onCopy },
      { icon: Clock, label: "Adjust SFX Timing", action: onApplyDurationToAll },
      { icon: Download, label: "Download SFX Sample", action: onCopy },
      {
        icon: Trash2,
        label: "Delete Sound FX",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else if (trackPrefix === "a3") {
    // 🎙️ A3 Voiceover (Dialogue audio tracks)
    trackTitle = `Voiceover #${(contextMenu.panelIdx ?? 0) + 1}`;
    trackIcon = Mic;
    trackColor = "text-purple-300";
    items = [
      { icon: RefreshCw, label: "Regenerate Voice Audio (TTS)", action: onCopy },
      { icon: Mic, label: "Change Character Voice Actor", action: onCopy },
      { divider: true },
      { icon: Volume2, label: "Voice Gain & Pitch Shifter", action: onCopy },
      {
        icon: SplitSquareHorizontal,
        label: "Slice / Split Voice Line",
        shortcut: "S",
        action: onSplit,
      },
      { icon: Download, label: "Download Voice WAV", action: onCopy },
      {
        icon: Trash2,
        label: "Delete Voice Line",
        shortcut: "DELETE",
        action: onRemoveDuration,
        danger: true,
      },
    ];
  } else {
    // Generic Fallback
    items = [
      { icon: Copy, label: "Copy", shortcut: "Ctrl+C", action: onCopy },
      { icon: CopyPlus, label: "Duplicate", shortcut: "Ctrl+D", action: onDuplicate },
      { icon: Trash2, label: "Delete", shortcut: "DELETE", action: onRemoveDuration, danger: true },
    ];
  }

  const HeaderIcon = trackIcon;
  const MENU_W = 230;
  // Dynamic estimated height based on items count
  const estimatedH = items.length * 32 + 54;
  const MENU_H = Math.min(estimatedH, window.innerHeight - 32);

  // 1. Horizontal: Align top-right corner of menu with button by default
  let x = contextMenu.x - MENU_W;
  if (x < 12) {
    x = Math.min(Math.max(12, contextMenu.x), window.innerWidth - MENU_W - 12);
  }

  // 2. Vertical: If it overflows the bottom of the screen, flip above the button
  let y = contextMenu.y;
  if (y + MENU_H > window.innerHeight - 16) {
    y = Math.max(12, contextMenu.y - MENU_H - 24);
  }

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-[9999] bg-[#0f0f1c]/95 backdrop-blur-2xl rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 py-1.5 overflow-hidden text-neutral-200 select-none animate-in fade-in zoom-in-95 duration-100 max-h-[calc(100vh-28px)] flex flex-col"
      style={{ left: Math.max(8, x), top: Math.max(8, y), width: MENU_W }}
    >
      {/* Track Category Header */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-white/[0.08] mb-1 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <HeaderIcon className={`h-3.5 w-3.5 ${trackColor} shrink-0`} />
          <span className="text-[11px] font-mono font-bold text-white truncate">
            {trackTitle}
          </span>
        </div>
        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
          Actions
        </span>
      </div>

      {/* Action Items List */}
      <div className="overflow-y-auto max-h-[calc(100vh-80px)] flex flex-col gap-[1px]">
        {items.map((item, i) => {
          if ("divider" in item)
            return <div key={i} className="h-px bg-white/[0.08] mx-2 my-1" />;
          const { icon: Icon, label, shortcut, action, disabled, danger } = item;
          return (
            <button
              key={`${label}-${i}`}
              onClick={disabled ? undefined : action}
              className={`w-full flex items-center justify-between px-3 py-[6px] text-xs transition-colors ${
                disabled
                  ? "text-neutral-500 cursor-not-allowed opacity-40"
                  : danger
                  ? "text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 cursor-pointer"
                  : "text-neutral-300 hover:bg-white/[0.08] hover:text-white cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    danger ? "text-rose-400" : "text-neutral-400"
                  }`}
                />
                <span className="font-medium truncate">{label}</span>
              </div>
              {shortcut && (
                <span className="text-[10px] text-neutral-400 font-mono shrink-0 ml-2 bg-black/40 px-1 py-0.2 rounded border border-white/5">
                  {shortcut}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(ContextMenuPopup);
