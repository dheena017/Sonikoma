import React from "react";
import { Layout, Video, Layers, Film, Sparkles } from "lucide-react";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
} from "@/features/workspace_scraper/components/LiveScraperDeck";

export interface VideoPreviewSidebarProps {
  panels: any[];
  activePreviewTab: string;
  setActivePreviewTab: ((tab: string) => void) | undefined;
  setCurrentPanelIndex: (idx: number) => void;
}

const VideoPreviewSidebar: React.FC<VideoPreviewSidebarProps> = ({
  panels,
  activePreviewTab,
  setActivePreviewTab,
  setCurrentPanelIndex,
}) => {
  const episodeGroups = ((window as any).__scrapeEpisodeGroups as Array<any>) || [];
  const hasEpisodeGroups = episodeGroups.length > 0;

  return (
    <aside className="w-full lg:w-56 bg-[#0d0d12]/90 backdrop-blur-md border-r border-neutral-800/80 shrink-0 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.9)]" />
          <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
            Playback Monitor
          </span>
        </div>
        <span className="text-[9px] font-black font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full uppercase tracking-widest">
          LIVE
        </span>
      </div>

      {/* View Mode Tabs */}
      <div className="px-3 py-3 space-y-1.5 shrink-0 border-b border-neutral-800/80">
        {/* Storyboard Live */}
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("timeline")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold font-mono transition-all text-left cursor-pointer border ${
            activePreviewTab === "timeline"
              ? "bg-gradient-to-r from-purple-600/25 to-indigo-600/15 border-purple-500/50 text-white shadow-[0_0_12px_rgba(168,85,247,0.2),inset_0_0_12px_rgba(168,85,247,0.05)]"
              : "bg-neutral-950/50 border-neutral-800/60 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layout className={`h-3.5 w-3.5 ${activePreviewTab === "timeline" ? "text-purple-400" : "text-neutral-600"}`} />
            <span>Storyboard Live</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-md border font-black ${
            activePreviewTab === "timeline"
              ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
              : "bg-neutral-950 text-neutral-600 border-neutral-800"
          }`}>
            {panels.length}p
          </span>
        </button>

        {/* Compiled Video */}
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("video")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold font-mono transition-all text-left cursor-pointer border ${
            activePreviewTab === "video"
              ? "bg-gradient-to-r from-emerald-600/20 to-teal-600/10 border-emerald-500/40 text-white shadow-[0_0_12px_rgba(16,185,129,0.15),inset_0_0_12px_rgba(16,185,129,0.04)]"
              : "bg-neutral-950/50 border-neutral-800/60 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-900/50"
          }`}
        >
          <div className="flex items-center gap-2">
            <Video className={`h-3.5 w-3.5 ${activePreviewTab === "video" ? "text-emerald-400" : "text-neutral-600"}`} />
            <span>Compiled Video</span>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-md border font-black ${
            activePreviewTab === "video"
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-neutral-950 text-neutral-600 border-neutral-800"
          }`}>
            MP4
          </span>
        </button>
      </div>

      {/* Episode Replays */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-3 py-3 space-y-2">
        {/* Section Label */}
        <div className="flex items-center justify-between shrink-0">
          <span className="text-[9px] font-black text-purple-400/80 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Layers className="h-3 w-3" />
            Episode Replays
          </span>
          {hasEpisodeGroups && (
            <span className="text-[9px] font-mono text-neutral-600 font-bold">
              {episodeGroups.length} batch
            </span>
          )}
        </div>

        {/* Episode List */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-1">
          {hasEpisodeGroups ? (
            getSortedEpisodeGroups(
              (episodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>)
            ).map(({ grp, originalIdx }) => (
              <button
                key={originalIdx}
                type="button"
                title={`Jump to ${formatDisplayEpisodeLabel(grp.episodeLabel)} — panel ${grp.startIndex + 1} · ${grp.count} frames`}
                onClick={() => {
                  if (grp.startIndex !== undefined) setCurrentPanelIndex(grp.startIndex);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-950/40 hover:bg-purple-900/20 text-[11px] font-mono text-neutral-400 hover:text-white transition-all text-left border border-neutral-800/70 hover:border-purple-500/40 cursor-pointer active:scale-[0.98]"
              >
                <div className="flex items-center gap-2 truncate">
                  <Film className="h-3 w-3 text-purple-400/70 shrink-0" />
                  <span className="truncate font-semibold">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-neutral-900 text-neutral-600 rounded border border-neutral-800 shrink-0 font-bold ml-1">
                  {grp.count}f
                </span>
              </button>
            ))
          ) : (
            <div className="p-3 rounded-xl bg-purple-950/15 border border-purple-900/30 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-purple-400">
                <Sparkles className="h-3 w-3" />
                <span className="text-[10px] font-mono font-bold">Single Episode Active</span>
              </div>
              <p className="text-[10px] font-mono text-neutral-600 leading-relaxed">
                Full timeline playback with {panels.length} panel cuts
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default React.memo(VideoPreviewSidebar);
export { VideoPreviewSidebar };
