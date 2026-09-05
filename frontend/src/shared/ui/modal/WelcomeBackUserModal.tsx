import React from "react";
import { createPortal } from "react-dom";
import { X, Hand, ArrowRight, FolderKanban, Zap, Cpu } from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface WelcomeBackUserModalProps {
  username?: string;
  title?: string;
  message?: string;
  isOpen?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function WelcomeBackUserModal({
  username,
  title = username ? `Welcome back, ${username}!` : "Welcome Back!",
  message = "Good to see you again! We've saved your progress so you can jump right back into creating.",
  isOpen = true,
  onConfirm,
  onCancel,
  confirmText = "Go to Dashboard",
  cancelText = "Close",
}: WelcomeBackUserModalProps) {
  const isExecutingRef = React.useRef(false);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    try {
      onConfirm();
    } finally {
      setTimeout(() => {
        isExecutingRef.current = false;
      }, 300);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 selection:bg-blue-500/30 font-sans"
      data-modal="true"
    >
      {/* Backdrop blur overlay */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel || onConfirm}
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-lg bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 blur-[1px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <SonikomaLogo iconOnly size="sm" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                👋 Workspace Ready
              </span>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {title}
              </h2>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 text-left">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {message}
          </p>

          {/* Session details list */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <FolderKanban className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="font-semibold text-white">Your Projects</span>
              </div>
              <span className="text-[11px] text-blue-300 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-lg border border-blue-500/20">
                Saved & Ready
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">AI Credits</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                Available
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-white">Video Studio</span>
              </div>
              <span className="text-[11px] text-purple-300 font-bold bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20">
                Ready
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmClick}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-550 hover:to-purple-550 text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{confirmText}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default WelcomeBackUserModal;
