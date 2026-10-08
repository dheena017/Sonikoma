import React from "react";
import { Film } from "lucide-react";

interface AgentHeroBannerProps {
  onOpenHistory?: () => void;
  historyCount?: number;
}

export const AgentHeroBanner: React.FC<AgentHeroBannerProps> = ({
  onOpenHistory,
  historyCount = 0,
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

      <div className="flex items-center gap-3 self-start md:self-center">
        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#2F2F2F] text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] transition-all cursor-pointer"
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
