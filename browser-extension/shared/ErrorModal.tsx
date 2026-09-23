import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

export interface ErrorModalData {
  title: string;
  message: string;
  technicalDetails?: string;
  suggestion?: string;
  onRetry?: () => void;
}

interface ErrorModalProps {
  error: ErrorModalData | null;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({ error, onClose }) => {
  if (!error) return null;

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `[Sonikoma Error Diagnosis]\nTitle: ${error.title}\nMessage: ${
      error.message
    }\nTechnical Logs: ${error.technicalDetails || "None"}\nSuggestion: ${
      error.suggestion || "None"
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    if (error.onRetry) {
      error.onRetry();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-[#0f1422] border-2 border-rose-500/50 rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 p-4">
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-white p-1 rounded-full bg-slate-900/60 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X size={14} />
        </button>

        <div className="flex items-start gap-3 mt-1">
          <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 shrink-0 border border-rose-500/30">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1 pr-4">
            <span className="text-[9px] uppercase tracking-wider font-bold font-mono px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
              System Error
            </span>
            <h3 className="text-sm font-bold text-white mt-1 leading-snug">
              {error.title}
            </h3>
          </div>
        </div>

        {/* Error message */}
        <div className="mt-3 bg-rose-950/40 border border-rose-800/40 rounded-xl p-3 text-xs text-rose-200/90 leading-relaxed break-words max-h-36 overflow-y-auto">
          {error.message}
        </div>

        {/* Helpful suggestion if available */}
        {error.suggestion && (
          <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-lg p-2.5 leading-snug">
            <span className="font-semibold text-amber-200">💡 Tip: </span>
            {error.suggestion}
          </div>
        )}

        {/* Technical Details dropdown */}
        {error.technicalDetails && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-between w-full py-1 text-[11px] text-slate-400 hover:text-slate-200 font-mono transition-colors cursor-pointer"
            >
              <span>{expanded ? "Hide Details" : "View Technical Logs"}</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {expanded && (
              <pre className="mt-1 bg-black/60 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-24 whitespace-pre-wrap break-all select-text">
                {error.technicalDetails}
              </pre>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer border border-slate-700/50"
            title="Copy error diagnosis to clipboard"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          <div className="flex items-center gap-2">
            {error.onRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-semibold transition-colors cursor-pointer shadow-md shadow-rose-950"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
