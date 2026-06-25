import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  accentColor?: string; // "red" | "purple"
  onConfirm: () => void;
  onCancel?: () => void;
  isAlert?: boolean;
}

export default function ConfirmModal({
  title,
  message,
  accentColor = "purple",
  onConfirm,
  onCancel,
  isAlert = false,
}: ConfirmModalProps) {
  const isRed = accentColor === "red";

  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    const container = document.getElementById("main-scroll-container");
    if (container) container.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      if (container) container.style.overflow = "unset";
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel || onConfirm}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Glow Accent */}
        <div
          className={`absolute top-0 left-0 right-0 h-[2px] blur-[1px] ${
            isRed
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-amber-500"
              : "bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500"
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isRed
                  ? "bg-red-500/10 text-red-400"
                  : "bg-purple-500/10 text-purple-400"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel || onConfirm}
            className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-left">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
          {!isAlert && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-2.5 border text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer ${
              isRed
                ? "bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 border-red-550/30 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border-purple-500/30 shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)]"
            }`}
          >
            <span>{isAlert ? "OK" : "Confirm"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
