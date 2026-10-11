import React from "react";
import { Film, Plus, Sparkles } from "lucide-react";

interface AgentHeroBannerProps {
  onOpenHistory?: () => void;
  historyCount?: number;
  onStartNew?: () => void;
  isCreatingNew?: boolean;
  hasActiveRun?: boolean;
  onViewActiveRun?: () => void;
}

export const AgentHeroBanner: React.FC<AgentHeroBannerProps> = ({
  onOpenHistory,
  historyCount = 0,
  onStartNew,
  isCreatingNew = false,
  hasActiveRun = false,
  onViewActiveRun,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2F2F2F] pb-6">
      <div className="space-y-2 max-w-2xl text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-[#E5E5E5] tracking-tight leading-tight">
          Autonomous Webtoon{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]">
            Agent
          </span>
        </h1>
        <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed">
          Zero-touch URL to YouTube pipeline: scrapes chapter images, smart-crops panels, synthesizes neural voiceover, renders cinematic video, and publishes to YouTube.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        {/* Toggle back to active in-flight run if currently creating new */}
        {hasActiveRun && isCreatingNew && onViewActiveRun && (
          <button
            type="button"
            onClick={onViewActiveRun}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-xs font-mono font-medium text-blue-400 hover:text-blue-300 transition-all cursor-pointer active:scale-95 shadow-sm"
            title="Switch back to view active background agent"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Active Agent</span>
          </button>
        )}

        {/* Create New Video Button */}
        {onStartNew && (
          <button
            type="button"
            onClick={onStartNew}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold tracking-wide transition-all cursor-pointer border active:scale-95 shadow-sm ${
              isCreatingNew || !hasActiveRun
                ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white border-blue-400 shadow-blue-500/25 ring-2 ring-blue-500/40"
                : "bg-[#1E1E1E] hover:bg-[#282828] border-[#383838] text-gray-200 hover:text-white"
            }`}
            title="Launch creation form to generate a new video"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Create New Video</span>
          </button>
        )}

        {/* History Modal Trigger */}
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#2F2F2F] text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] transition-all cursor-pointer active:scale-95"
          >
            <Film className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Past Publications</span>
            {historyCount > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/20 text-[#3B82F6] font-bold text-[10px]">
                {historyCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};


export default AgentHeroBanner;
