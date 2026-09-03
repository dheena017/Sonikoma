import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Keyboard, X, ShieldAlert } from "lucide-react";
import { ShortcutActionDetails } from "@/features/app_shortcuts/components/shortcutTypes";

export interface NewKeyCombinationModalProps {
  recordingActionId: string | null;
  details?: ShortcutActionDetails | null;
  conflictMsg?: string | null;
  onCancel: () => void;
}

export default function NewKeyCombinationModal({
  recordingActionId,
  details,
  conflictMsg,
  onCancel,
}: NewKeyCombinationModalProps) {
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!recordingActionId) return;

    document.body.style.overflow = "hidden";
    const container = document.getElementById("main-scroll-container");
    if (container) container.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      if (container) container.style.overflow = "";
    };
  }, [recordingActionId]);

  if (!recordingActionId) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-neutral-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px] blur-[1px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <Keyboard className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Key Combination
              </h2>
              <p className="text-[11px] text-neutral-400">
                Record a custom keyboard shortcut
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer border border-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Action Scope & Label */}
          {details && (
            <div className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-[10px] font-mono font-bold text-[#3B82F6] px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 shrink-0">
                {details.scope}
              </span>
              <span className="text-xs font-bold text-neutral-200 truncate">
                {details.label}
              </span>
            </div>
          )}

          {/* Key Listener Card */}
          <div className="py-8 px-6 bg-neutral-900/40 border border-white/5 rounded-2xl flex flex-col justify-center items-center group">
            <span className="text-base text-neutral-200 font-semibold tracking-tight animate-pulse">
              Waiting for input...
            </span>
            <span className="text-xs text-neutral-500 font-mono mt-3 leading-relaxed max-w-xs">
              Press any combination of modifier keys (Ctrl, Alt, Shift) and a
              standard key.
            </span>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-white/5 text-[10px] text-neutral-400 font-mono">
                Example: Ctrl + Shift + S
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-white/5 text-[10px] text-neutral-400 font-mono">
                Example: Space
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-950 border border-white/5 text-[10px] text-neutral-400 font-mono">
                Example: Delete
              </span>
            </div>
          </div>

          {/* Conflict Alert */}
          {conflictMsg && (
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-300 text-left animate-in shake duration-300">
              <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{conflictMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/40">
          <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-neutral-500 uppercase tracking-wider">
            <span>Press</span>
            <kbd className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-white/10 shadow-sm text-[10px]">
              Esc
            </kbd>
            <span>to abort</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer hover:border-white/20 active:scale-95 shadow-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
