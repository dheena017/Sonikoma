import React from "react";
import { X, Youtube, ExternalLink, Film, Clock, Calendar } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#2F2F2F] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-[#3B82F6]" />
            <h3 className="text-lg font-bold text-[#E5E5E5]">Previous Agent Generations</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Runs */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-[#6B7280] space-y-2">
              <Film className="w-8 h-8 mx-auto opacity-40 text-[#6B7280]" />
              <p className="text-sm">No agent runs recorded yet.</p>
              <p className="text-xs">Launch your first 1-click agent to see history here.</p>
            </div>
          ) : (
            history.map((run) => (
              <div
                key={run.run_id}
                className="p-4 rounded-xl border border-[#2F2F2F] bg-[#121212] hover:border-[#3B82F6]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] font-bold uppercase">
                      {run.status}
                    </span>
                    <span className="text-xs text-[#6B7280] font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(run.created_at * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#E5E5E5] group-hover:text-[#3B82F6] transition-colors">
                    {run.scraped_title || run.youtube_metadata?.title || "Webtoon Story Recap"}
                  </h4>
                  {run.youtube_url && (
                    <a
                      href={run.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Youtube className="w-3.5 h-3.5" />
                      <span className="truncate max-w-xs">{run.youtube_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectRun(run);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#252525] border border-[#2F2F2F] text-xs font-mono text-[#E5E5E5] transition-colors cursor-pointer self-start sm:self-center"
                >
                  View Details
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentHistoryModal;
