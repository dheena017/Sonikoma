import React, { useState } from "react";
import {
  X,
  AlertTriangle,
  Terminal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";

export interface ErrorPopupDetail {
  title: string;
  message: string;
  technicalDetails?: string;
  suggestion?: string;
  type?: "error" | "warning" | "info" | "success";
  onRetry?: () => void;
}

interface ErrorPopupModalProps {
  error: ErrorPopupDetail | null;
  onClose: () => void;
}

export default function ErrorPopupModal({
  error,
  onClose,
}: ErrorPopupModalProps) {
  if (!error) return null;

  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `[Error Diagnosis]\nTitle: ${error.title}\nMessage: ${
      error.message
    }\nTechnical logs:\n${error.technicalDetails || "None"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isWarning = error.type === "warning";

  const handleApplyRetry = () => {
    if (error.onRetry) {
      error.onRetry();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Container */}
      <div
        className={`relative w-full max-w-2xl bg-neutral-900 border-2 ${
          isWarning ? "border-amber-500/50" : "border-red-500/50"
        } rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden z-10 animate-in zoom-in-95 duration-200`}
      >
        {/* Glow Element */}
        <div
          className={`absolute top-0 left-1/4 right-1/4 h-1.5 bg-gradient-to-r ${
            isWarning
              ? "from-transparent via-amber-500 to-transparent"
              : "from-transparent via-red-500 to-transparent"
          } blur-[1px]`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div
              className={`p-3.5 rounded-2xl ${
                isWarning
                  ? "bg-amber-500/10 text-amber-400"
                  : "bg-red-500/10 text-red-500"
              } shrink-0`}
            >
              <AlertTriangle className="h-7 w-7 animate-pulse" />
            </div>
            <div className="space-y-1">
              <span
                className={`text-[9.5px] uppercase tracking-widest font-bold font-mono px-2.5 py-0.5 rounded-full ${
                  isWarning
                    ? "bg-amber-500/15 text-amber-400 border border-amber-500/35"
                    : "bg-red-500/15 text-red-400 border border-red-500/35"
                }`}
              >
                {isWarning ? "Heuristics Warning" : "Engine Fault Dialog"}
              </span>
              <h2 className="text-xl font-bold font-sans text-white leading-snug">
                {error.title}
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mt-1 pr-4">
                {error.message}
              </p>
            </div>
          </div>

          {/* Solution & Corrective Auto-Tuner Section */}
          {error.suggestion && (
            <div className="bg-neutral-950/60 rounded-2xl border border-neutral-800/40 p-5 space-y-4">
              <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-purple-950/10 border border-purple-900/15 p-3 rounded-xl">
                💡{" "}
                <span className="font-semibold text-purple-300">
                  Diagnostic Suggestion:
                </span>{" "}
                {error.suggestion}
              </p>
            </div>
          )}

          {/* Technical Traceback Accordion */}
          {error.technicalDetails && (
            <div className="border border-neutral-800/80 rounded-2xl overflow-hidden bg-neutral-950/30">
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 py-3 bg-neutral-950/70 hover:bg-neutral-900/50 transition-all font-mono text-[11px] text-neutral-300 font-medium cursor-pointer border-b border-neutral-800/40"
              >
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Technical Diagnostics & Output Logs</span>
                </div>
                {expanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />
                )}
              </button>

              {expanded && (
                <div className="relative p-4 font-mono text-[10px] text-neutral-400 bg-neutral-950 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
                  <button
                    onClick={handleCopy}
                    className="absolute top-2.5 right-2.5 bg-neutral-900 border border-neutral-800 hover:border-purple-500 text-neutral-300 hover:text-white p-1.5 rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-all hover:bg-neutral-950"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">
                          Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                  {error.technicalDetails}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-850"
            >
              Cancel & Dismiss
            </button>
            {error.onRetry && (
              <button
                onClick={handleApplyRetry}
                className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs tracking-wide shadow-lg shadow-purple-950/55 hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                <span>Auto-Apply & Re-clean Target</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
