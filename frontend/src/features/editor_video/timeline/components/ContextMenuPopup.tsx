// ─── ContextMenuPopup ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/ContextMenuPopup.tsx

import React from "react";
import {
  Copy, ClipboardPaste, CopyPlus, TimerOff,
  Timer, SplitSquareHorizontal,
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

const MENU_W = 224;
const MENU_H = 260;

const ContextMenuPopup: React.FC<ContextMenuPopupProps> = ({
  contextMenu, contextMenuRef, clipboard, hasDuration,
  onCopy, onPaste, onDuplicate, onRemoveDuration, onApplyDurationToAll, onSplit,
}) => {
  if (!contextMenu) return null;

  const x = Math.min(contextMenu.x, window.innerWidth  - MENU_W - 8);
  const y = Math.min(contextMenu.y, window.innerHeight - MENU_H - 8);

  const items = [
    { icon: Copy,                  label: "Copy",                  shortcut: "Ctrl + C", action: onCopy,               disabled: false },
    { icon: ClipboardPaste,        label: "Paste",                 shortcut: "Ctrl + V", action: onPaste,              disabled: !clipboard },
    { icon: CopyPlus,              label: "Duplicate",             shortcut: "Ctrl + D", action: onDuplicate,          disabled: false },
    { divider: true },
    { icon: TimerOff,              label: "Remove duration",       shortcut: "Delete",   action: onRemoveDuration,     disabled: !hasDuration },
    { icon: Timer,                 label: "Apply duration to all", shortcut: "",         action: onApplyDurationToAll, disabled: !hasDuration },
    { divider: true },
    { icon: SplitSquareHorizontal, label: "Split",                 shortcut: "S",        action: onSplit,              disabled: false },
  ] as const;

  return (
    <div
      ref={contextMenuRef}
      className="fixed z-[9999] bg-white/96 backdrop-blur-xl rounded-xl shadow-2xl border border-neutral-200/80 py-1.5 overflow-hidden"
      style={{ left: x, top: y, width: MENU_W }}
    >
      {items.map((item, i) => {
        if ("divider" in item) return <div key={i} className="h-px bg-neutral-200/70 mx-2 my-1" />;
        const { icon: Icon, label, shortcut, action, disabled } = item;
        return (
          <button
            key={label}
            onClick={disabled ? undefined : action}
            className={`w-full flex items-center justify-between px-3 py-[7px] text-sm transition-colors ${
              disabled ? "text-neutral-400 cursor-not-allowed" : "text-neutral-800 hover:bg-neutral-100 cursor-pointer"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium">{label}</span>
            </div>
            {shortcut && <span className="text-[11px] text-neutral-400 font-mono">{shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(ContextMenuPopup);
