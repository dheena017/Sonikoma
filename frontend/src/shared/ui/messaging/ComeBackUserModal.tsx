import React, { useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Sparkles,
  ArrowRight,
  Flame,
  ShieldCheck,
  Cloud,
  Clock,
  Heart,
  Save,
} from "lucide-react";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface ComeBackUserModalProps {
  username?: string;
  title?: string;
  message?: string;
  isOpen?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function ComeBackUserModal({
  username,
  title = username ? `Leaving so soon, ${username}?` : "Signing Out?",
  message = "Don't worry—all your active storyboards, character settings, and AI render queues are safely preserved in the cloud.",
  isOpen = true,
  onConfirm,
  onCancel,
  confirmText = "Sign Out",
  cancelText = "Stay Signed In",
}: ComeBackUserModalProps) {
  const isExecutingRef = useRef(false);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 selection:bg-emerald-500/30 font-sans"
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
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 blur-[1px] z-30" />

        {/* Visual Header Banner */}
        <div className="relative h-36 sm:h-40 w-full overflow-hidden shrink-0 border-b border-white/10 select-none">
          <img
            src="/demo-romance.jpg"
            alt="Session saved banner"
            className="w-full h-full object-cover object-top filter brightness-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-transparent to-neutral-950/60" />

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="absolute top-3.5 right-3.5 z-20 text-neutral-400 hover:text-white bg-black/60 hover:bg-black/90 border border-white/10 p-2 rounded-full transition-all cursor-pointer backdrop-blur-md"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="absolute bottom-3.5 left-5 right-5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-1 mb-1 shadow-md">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              All Changes Saved
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight drop-shadow-md">
              {title}
            </h2>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-4 text-left">
          <p className="text-xs text-neutral-300 leading-relaxed font-sans">
            {message}
          </p>

          {/* Cloud & session assurances */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Cloud className="h-4 w-4 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Auto-Cloud Sync</h4>
                  <p className="text-[11px] text-neutral-400">
                    Your canvas, voice actors, and storyboards are safe.
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                100% Synced
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-teal-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Instant Resume</h4>
                  <p className="text-[11px] text-neutral-400">
                    Pick up right from where you paused on any device.
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-teal-300 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                Ready
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-300/90 bg-emerald-950/30 border border-emerald-500/20 p-2.5 rounded-xl">
            <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Thank you for creating with Sonikoma Studio! See you soon.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 bg-neutral-950/80 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-550 text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{cancelText}</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirmClick}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-800"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ComeBackUserModal;
