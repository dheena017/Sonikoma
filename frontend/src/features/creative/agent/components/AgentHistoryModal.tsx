import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Youtube, ExternalLink, Film, Calendar, Clock, Sparkles } from "lucide-react";
import { AgentRunResponse } from "../types";

interface AgentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AgentRunResponse[];
  onSelectRun: (run: AgentRunResponse) => void;
}

export const AgentHistoryModal: React.FC<AgentHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRun,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const container = document.getElementById("main-scroll-container");
    const prevContainerOverflow = container ? container.style.overflow : "";
    if (container) container.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (container) container.style.overflow = prevContainerOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        {/* Glow Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 blur-[1px]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-800/80 shrink-0 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-inner">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Previous Agent Generations
              </h2>
              <p className="text-[11px] text-neutral-400 font-sans">
                Historical autonomous video pipelines and publications ({history.length} records)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white bg-neutral-900/60 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer border border-white/5"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List of Runs */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 text-left">
          {history.length === 0 ? (
            <div className="py-14 text-center text-neutral-400 flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-neutral-900/80 border border-white/5 flex items-center justify-center text-neutral-500 shadow-inner">
                <Film className="w-6 h-6 opacity-60" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">No agent runs recorded yet</p>
                <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                  Launch your first 1-click autonomous motion comic agent to see episode history here.
                </p>
              </div>
            </div>
          ) : (
            history.map((run) => {
              const isDone = run.status === "completed";
              const isFailed = run.status === "failed";
              return (
                <div
                  key={run.run_id}
                  className="p-4 rounded-2xl border border-white/5 bg-neutral-900/40 hover:bg-neutral-900/70 hover:border-blue-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                          isDone
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : isFailed
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        {run.status}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        {new Date(run.created_at * 1000).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {run.panels && run.panels.length > 0 && (
                        <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded-md bg-neutral-800/60 border border-white/5">
                          {run.panels.length} panels
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-neutral-200 group-hover:text-blue-400 transition-colors truncate">
                      {run.scraped_title || run.youtube_metadata?.title || "Webtoon Story Recap"}
                    </h4>
                    {run.youtube_url && (
                      <a
                        href={run.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 font-mono group/yt pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Youtube className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate max-w-sm">{run.youtube_url}</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover/yt:opacity-100 shrink-0" />
                      </a>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectRun(run);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-neutral-800/80 hover:bg-blue-600 hover:text-white border border-white/10 text-xs font-semibold text-neutral-200 transition-all cursor-pointer self-start sm:self-center shadow-sm shrink-0 active:scale-95"
                  >
                    View Details
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AgentHistoryModal;
