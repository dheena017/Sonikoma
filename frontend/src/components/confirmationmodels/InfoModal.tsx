import React from "react";
import { createPortal } from "react-dom";
import { X, Info } from "lucide-react";

interface InfoModalProps {
  title: string;
  message: string;
  accentColor?: "purple" | "cyan" | "green";
  onClose: () => void;
}

const ACCENT_CLASSES: Record<string, string> = {
  purple:
    "from-purple-600 to-indigo-600 border-purple-500/30 shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]",
  cyan: "from-cyan-500 to-sky-500 border-cyan-500/30 shadow-[0_0_20px_-5px_rgba(56,189,248,0.5)]",
  green:
    "from-emerald-500 to-lime-500 border-emerald-500/30 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]",
};

export default function InfoModal({
  title,
  message,
  accentColor = "purple",
  onClose,
}: InfoModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-left">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-2.5 border text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 cursor-pointer bg-gradient-to-r ${ACCENT_CLASSES[accentColor]}`}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
