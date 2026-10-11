import React from "react";
import {
  Globe,
  Scissors,
  BookOpen,
  Mic,
  Film,
  Youtube,
  CheckCircle2,
  Clock,
  AlertCircle,
  PauseCircle,
  RotateCcw,
} from "lucide-react";
import { AgentStage } from "../types";

interface AgentProgressTrackerProps {
  status: AgentStage;
  progress: number;
  currentAction: string;
  onApprove?: () => void;
  onReset?: () => void;
  onRestart?: () => void;
  onStop?: () => void;
  isReviewAwaiting?: boolean;
}

const STAGES = [
  {
    key: "scraping",
    label: "Scrape URL",
    desc: "Fetching chapter & images",
    icon: Globe,
  },
  {
    key: "processing_images",
    label: "Merge & Crop",
    desc: "Slicing clean story panels",
    icon: Scissors,
  },
  {
    key: "generating_narrative",
    label: "AI Narrative",
    desc: "Writing script & translation",
    icon: BookOpen,
  },
  {
    key: "synthesizing_audio",
    label: "Voice Audio",
    desc: "Neural voiceover sync",
    icon: Mic,
  },
  {
    key: "rendering_video",
    label: "Video Render",
    desc: "Cinematic motion assembly",
    icon: Film,
  },
  {
    key: "publishing_youtube",
    label: "YouTube Publish",
    desc: "SEO headers & channel push",
    icon: Youtube,
  },
];

export const AgentProgressTracker: React.FC<AgentProgressTrackerProps> = ({
  status,
  progress,
  currentAction,
  onApprove,
  onReset,
  onRestart,
  onStop,
  isReviewAwaiting = false,
}) => {
  const getStageStatus = (stageKey: string, index: number) => {
    const stageKeys = STAGES.map((s) => s.key);
    const currentIndex = stageKeys.indexOf(status);

    if (status === "completed") return "done";
    if (status === "failed") return currentIndex === index ? "failed" : currentIndex > index ? "done" : "pending";
    if (status === "stopped") return currentIndex === index ? "stopped" : currentIndex > index ? "done" : "pending";
    if (status === "awaiting_review" && index <= 3) return "done";

    if (currentIndex === -1) return "pending";
    if (currentIndex > index) return "done";
    if (currentIndex === index) return "active";
    return "pending";
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-6">
      {/* Header and Progress Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {status !== "completed" && status !== "failed" && status !== "stopped" && status !== "awaiting_review" && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  status === "completed"
                    ? "bg-[#10B981]"
                    : status === "failed"
                    ? "bg-[#EF4444]"
                    : status === "stopped"
                    ? "bg-[#F59E0B]"
                    : status === "awaiting_review"
                    ? "bg-[#F59E0B]"
                    : "bg-[#3B82F6]"
                }`}
              />
            </span>
            <h3 className="text-base font-bold text-[#E5E5E5] tracking-wide">
              Pipeline Execution Status
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-[#9CA3AF]">
              Progress: <span className="text-[#3B82F6]">{progress}%</span>
            </span>
            <span
              className={`text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded-md border ${
                status === "completed"
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : status === "failed"
                  ? "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
                  : status === "stopped"
                  ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                  : status === "awaiting_review"
                  ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                  : "bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#3B82F6] animate-pulse"
              }`}
            >
              {status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Outer Progress Bar */}
        <div className="w-full h-2 bg-[#121212] rounded-full overflow-hidden border border-[#2F2F2F]">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              status === "completed"
                ? "bg-[#10B981]"
                : status === "failed"
                ? "bg-[#EF4444]"
                : status === "stopped"
                ? "bg-[#F59E0B]"
                : status === "awaiting_review"
                ? "bg-[#F59E0B]"
                : "bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Current Activity Message */}
        <p className="text-xs font-mono text-[#9CA3AF] truncate">
          &gt; {currentAction || "Processing autonomous workflow..."}
        </p>
      </div>

      {/* ── Visual Step Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {STAGES.map((s, idx) => {
          const Icon = s.icon;
          const stageState = getStageStatus(s.key, idx);

          return (
            <div
              key={s.key}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                stageState === "done"
                  ? "bg-[#121212] border-[#10B981]/40 text-[#10B981]"
                  : stageState === "active"
                  ? "bg-[#121212] border-[#3B82F6] text-[#3B82F6] ring-1 ring-[#3B82F6]/40 shadow-md shadow-[#3B82F6]/10"
                  : stageState === "failed"
                  ? "bg-[#121212] border-[#EF4444]/40 text-[#EF4444]"
                  : stageState === "stopped"
                  ? "bg-[#121212] border-amber-500/40 text-amber-400"
                  : "bg-[#121212] border-[#2F2F2F] text-[#6B7280]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`p-2 rounded-lg ${
                    stageState === "done"
                      ? "bg-[#10B981]/20 text-[#10B981]"
                      : stageState === "active"
                      ? "bg-[#3B82F6]/20 text-[#3B82F6] animate-pulse"
                      : stageState === "stopped"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-[#1E1E1E] text-[#6B7280]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {stageState === "done" && (
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                )}
                {stageState === "active" && (
                  <div className="w-3.5 h-3.5 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
                )}
                {stageState === "stopped" && (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
                {stageState === "failed" && (
                  <AlertCircle className="w-4 h-4 text-[#EF4444]" />
                )}
                {stageState === "pending" && (
                  <Clock className="w-3.5 h-3.5 text-[#6B7280]" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider block opacity-70">
                  Step 0{idx + 1}
                </span>
                <h4 className="text-xs font-bold text-[#E5E5E5] mt-0.5">{s.label}</h4>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5 line-clamp-1 font-sans">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stopped / Failed Checkpoint Actions ── */}
      {(status === "stopped" || status === "failed") && (
        <div
          className={`p-4 rounded-xl bg-[#121212] border ${
            status === "stopped" ? "border-amber-500/40" : "border-[#EF4444]/40"
          } flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in`}
        >
          <div className="flex items-center gap-3">
            <AlertCircle
              className={`w-6 h-6 flex-shrink-0 ${
                status === "stopped" ? "text-amber-400" : "text-[#EF4444]"
              }`}
            />
            <div>
              <h4 className="text-sm font-bold text-[#E5E5E5]">
                {status === "stopped" ? "Agent Execution Stopped" : "Agent Execution Failed"}
              </h4>
              <p className="text-xs text-[#9CA3AF] font-sans">
                {status === "stopped"
                  ? "The pipeline was stopped by user. Click 'Restart Agent' to restart from step 1 with the same chapter, or 'Discard Run' to clear."
                  : (currentAction || "An unexpected error occurred during execution. Click 'Restart Agent' to retry from step 1.")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333] border border-[#3F3F3F] text-[#E5E5E5] font-bold text-xs font-mono uppercase tracking-wide transition-all shadow-sm cursor-pointer active:scale-95"
                title="Discard this run"
              >
                Discard Run
              </button>
            )}
            {onRestart && (
              <button
                type="button"
                onClick={onRestart}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs font-mono uppercase tracking-wide transition-all shadow-md shadow-blue-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
                title="Restart this agent from scratch"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restart Agent</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review Checkpoint Prompt if Paused */}
      {isReviewAwaiting && onApprove && (
        <div className="p-4 rounded-xl bg-[#121212] border border-[#F59E0B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <PauseCircle className="w-6 h-6 text-[#F59E0B] flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#E5E5E5]">Review Checkpoint Reached</h4>
              <p className="text-xs text-[#9CA3AF] font-sans">
                Panels and narrative scripts generated. Inspect below, then approve to compile video &amp; publish to YouTube.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                className="px-4 py-2.5 rounded-xl bg-[#262626] hover:bg-[#333] border border-[#3F3F3F] text-[#E5E5E5] font-bold text-xs font-mono uppercase tracking-wide transition-all shadow-sm cursor-pointer active:scale-95 flex items-center gap-1.5"
                title="Discard this run and launch with all chapter panels"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" /> Start New Run
              </button>
            )}
            <button
              type="button"
              onClick={onApprove}
              className="px-5 py-2.5 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-neutral-950 font-black text-xs font-mono uppercase tracking-wide transition-all shadow-md cursor-pointer active:scale-95"
            >
              Approve &amp; Publish Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentProgressTracker;
