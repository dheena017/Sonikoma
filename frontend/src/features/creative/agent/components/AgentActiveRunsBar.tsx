import React from "react";
import {
  Bot,
  Plus,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  PauseCircle,
  Film,
} from "lucide-react";
import { AgentRunResponse, AgentStage } from "../types";

interface AgentActiveRunsBarProps {
  runs: AgentRunResponse[];
  activeRunId?: string | null;
  isCreatingNew: boolean;
  onSelectRun: (run: AgentRunResponse) => void;
  onStartNew: () => void;
}

const ACTIVE_STATUSES: AgentStage[] = [
  "initializing",
  "scraping",
  "processing_images",
  "generating_narrative",
  "synthesizing_audio",
  "rendering_video",
  "publishing_youtube",
];

function getStageShortLabel(status: AgentStage, progress: number): string {
  switch (status) {
    case "scraping":
      return `Scraping (${progress}%)`;
    case "processing_images":
      return `Panels (${progress}%)`;
    case "generating_narrative":
      return `Scripting (${progress}%)`;
    case "synthesizing_audio":
      return `Voiceover (${progress}%)`;
    case "rendering_video":
      return `Rendering (${progress}%)`;
    case "publishing_youtube":
      return `Publishing (${progress}%)`;
    case "awaiting_review":
      return "Needs Review";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return `${status} (${progress}%)`;
  }
}

export const AgentActiveRunsBar: React.FC<AgentActiveRunsBarProps> = ({
  runs,
  activeRunId,
  isCreatingNew,
  onSelectRun,
  onStartNew,
}) => {
  if (runs.length === 0) return null;

  const activeCount = runs.filter((r) => ACTIVE_STATUSES.includes(r.status)).length;
  const reviewCount = runs.filter((r) => r.status === "awaiting_review").length;

  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-3 sm:p-4 shadow-xl space-y-2.5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left Title Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Multi-Agent Hub
              </span>
              {activeCount > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-[10px] font-mono text-blue-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  {activeCount} Running in Background
                </span>
              )}
              {reviewCount > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-bold">
                  <PauseCircle className="w-3 h-3 text-amber-400" />
                  {reviewCount} Awaiting Review
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Launch New Agent Button */}
        <button
          type="button"
          onClick={onStartNew}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 shadow-sm ${
            isCreatingNew
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-blue-500/25 ring-2 ring-blue-500/50"
              : "bg-[#202020] hover:bg-[#2A2A2A] border-[#3B3B3B] text-gray-200 hover:text-white"
          }`}
          title="Open creation form to start another video with a new agent"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" />
          <span>+ Create New Video</span>
        </button>
      </div>

      {/* Runs Switcher Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
        {runs.map((run) => {
          const isSelected = !isCreatingNew && activeRunId === run.run_id;
          const isActive = ACTIVE_STATUSES.includes(run.status);
          const isAwaiting = run.status === "awaiting_review";
          const isCompleted = run.status === "completed";
          const isFailed = run.status === "failed";

          const titleDisplay =
            run.scraped_title || run.series_title || run.chapter_title || run.run_id;
          const displayLabel =
            titleDisplay.length > 28
              ? `${titleDisplay.slice(0, 25)}...`
              : titleDisplay;

          return (
            <button
              key={run.run_id}
              type="button"
              onClick={() => onSelectRun(run)}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-sans transition-all cursor-pointer active:scale-95 ${
                isSelected
                  ? "bg-blue-600/20 border-blue-500/70 text-white shadow-sm shadow-blue-500/20 ring-1 ring-blue-500/50"
                  : "bg-[#1A1A1A] hover:bg-[#222222] border-[#2E2E2E] text-gray-300 hover:text-white"
              }`}
            >
              {/* Status Icon */}
              {isActive && (
                <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
              )}
              {isAwaiting && (
                <PauseCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
              )}
              {isCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              )}
              {isFailed && (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
              )}

              {/* Title & Format */}
              <span className="font-semibold text-xs tracking-tight truncate max-w-[150px] sm:max-w-[200px]">
                {displayLabel}
              </span>

              {/* Format Badge */}
              {run.video_format === "shorts" ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  9:16
                </span>
              ) : run.video_format === "landscape" ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  16:9
                </span>
              ) : null}

              {/* Progress/Stage Pill */}
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                  isActive
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : isAwaiting
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : isCompleted
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {getStageShortLabel(run.status, run.progress)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AgentActiveRunsBar;
