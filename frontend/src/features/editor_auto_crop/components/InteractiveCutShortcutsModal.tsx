import React from "react";
import { createPortal } from "react-dom";
import { Keyboard, X } from "lucide-react";

export interface InteractiveCutShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InteractiveCutShortcutsModal: React.FC<InteractiveCutShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-neutral-950 border border-neutral-700/90 rounded-3xl p-5 shadow-2xl space-y-4 text-xs animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white uppercase tracking-wider">
            <Keyboard className="h-4 w-4 text-emerald-400" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 !cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-neutral-300 font-mono text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Next / Prev Panel</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              J / K
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Toggle Minimap</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              M
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Nudge Panel</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              ↑ / ↓
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Nudge 20px</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              Shift + ↑/↓
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Duplicate</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              D
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Full Width</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              F
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Split in Half</span>
            <span className="px-2 py-0.5 rounded bg-black text-emerald-300 font-bold border border-emerald-500/40">
              S
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Delete Box</span>
            <span className="px-2 py-0.5 rounded bg-black text-rose-300 font-bold border border-rose-500/40">
              Del / ⌫
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Zoom In / Out</span>
            <span className="px-2 py-0.5 rounded bg-black text-cyan-300 font-bold border border-cyan-500/40">
              + / −
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800">
            <span className="text-neutral-400">Reset Zoom</span>
            <span className="px-2 py-0.5 rounded bg-black text-cyan-300 font-bold border border-cyan-500/40">
              0
            </span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900/80 border border-neutral-800 col-span-2">
            <span className="text-neutral-400">Deselect / Close</span>
            <span className="px-2 py-0.5 rounded bg-black text-neutral-300 font-bold border border-neutral-700">
              Esc
            </span>
          </div>
        </div>

        <div className="pt-2 text-center text-[10px] text-neutral-500">
          Tip: Press <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300 font-mono">?</kbd> at any time to toggle this cheatsheet.
        </div>
      </div>
    </div>,
    document.body
  );
};
