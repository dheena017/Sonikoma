import React from "react";
import { createPortal } from "react-dom";
import { X, LogOut, Heart, AlertTriangle, Trash2, CreditCard, ShieldX } from "lucide-react";

export interface GoodbyeUserModalProps {
  username?: string;
  title?: string;
  message?: string;
  isOpen?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function GoodbyeUserModal({
  username,
  title = username ? `Account Deletion, ${username}` : "Account Deletion Completed",
  message = "Your Sonikoma studio account and profile data have been permanently removed from our servers. We sincerely thank you for bringing stories to life with our studio.",
  isOpen = true,
  onConfirm,
  onCancel,
  confirmText = "Return to Home",
  cancelText = "Close",
}: GoodbyeUserModalProps) {
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 selection:bg-rose-500/30 font-sans"
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
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 blur-[1px]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 text-amber-400">
              <LogOut className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                ⚠️ Account Purge Completed
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

          {/* Purged items breakdown */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <Trash2 className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="font-semibold text-white">Project Files & Media</span>
              </div>
              <span className="text-[11px] font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                Permanently Erased
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="font-semibold text-white">Subscriptions & Billing</span>
              </div>
              <span className="text-[11px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                Cancelled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-white/5 text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldX className="h-4 w-4 text-purple-400 shrink-0" />
                <span className="font-semibold text-white">API Keys & Tokens</span>
              </div>
              <span className="text-[11px] font-mono text-purple-300 font-bold bg-purple-500/10 px-2 py-0.5 rounded-lg border border-purple-500/20">
                Revoked
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-neutral-900/60 border border-white/5 p-3 rounded-xl">
            <Heart className="h-4 w-4 text-rose-400 shrink-0" />
            <span>Thank you for being part of Sonikoma Studio. You are always welcome back!</span>
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
            className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-550 hover:to-rose-550 text-white font-bold rounded-xl text-xs tracking-wide transition-all active:scale-95 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)] flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default GoodbyeUserModal;
