import React from "react";
import { createPortal } from "react-dom";
import { X, Bot, Sparkles, Trash2, ArrowRight } from "lucide-react";

interface AgentBackgroundActionModalProps {
  runId: string;
  scrapedTitle?: string;
  onRunInBackgroundAndStartNew: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export const AgentBackgroundActionModal: React.FC<AgentBackgroundActionModalProps> = ({
  runId,
  scrapedTitle,
  onRunInBackgroundAndStartNew,
  onDiscard,
  onCancel,
}) => {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 text-left"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl mx-4 bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
        {/* Top Accent Gradient */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 shrink-0 bg-neutral-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 shrink-0">
              <Bot className="h-5 w-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight">
                Run Agent in Background?
              </h2>
              <p className="text-xs text-neutral-400 font-mono mt-0.5 truncate max-w-md">
                {scrapedTitle ? scrapedTitle : `Agent Run: ${runId}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 ml-2"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-neutral-300">
          <p className="leading-relaxed">
            This autonomous agent is currently active generating your video. You
            do <span className="font-semibold text-white">not</span> need to discard it!
          </p>
          <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <span className="font-semibold text-white block">
                Multi-Agent Background Execution
              </span>
              <span className="leading-relaxed block text-neutral-400">
                You can let this agent continue rendering in the background while you configure and launch another video concurrently. You can switch between agents at any time.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-neutral-800/80 bg-neutral-900/40">
          <button
            type="button"
            onClick={onDiscard}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Discard Run</span>
          </button>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              Keep Watching
            </button>
            <button
              type="button"
              onClick={onRunInBackgroundAndStartNew}
              className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-500/25 border border-blue-400/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 font-mono whitespace-nowrap"
            >
              <span>Run in Background</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgentBackgroundActionModal;
