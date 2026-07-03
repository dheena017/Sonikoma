import React from "react";
import { Keyboard, ShieldAlert } from "lucide-react";
import { ShortcutActionDetails } from "./shortcutTypes";

interface ShortcutRecordingModalProps {
  recordingActionId: string;
  details: ShortcutActionDetails;
  conflictMsg: string | null;
  onCancel: () => void;
}

export default function ShortcutRecordingModal({
  recordingActionId,
  details,
  conflictMsg,
  onCancel,
}: ShortcutRecordingModalProps) {
  if (!recordingActionId) return null;

  return (
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
              {details.label}
            </span>
          </p>
        </div>

        <div className="py-10 px-6 bg-neutral-900/40 border border-white/5 rounded-3xl flex flex-col justify-center items-center group">
          <span className="text-lg text-neutral-200 font-medium tracking-tight animate-pulse">
            Waiting for input...
          </span>
          <span className="text-xs text-neutral-500 font-mono mt-4 leading-relaxed max-w-xs">
            Press any combination of modifier keys (Ctrl, Alt, Shift) and a standard key.
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
            onClick={onCancel}
            className="px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-xl active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
