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
    <aside className="w-full lg:w-60 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-4 shrink-0 space-y-4 shadow-xl self-stretch overflow-y-auto">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
            Playback Monitor
          </h4>
        </div>
        <span className="text-[10px] font-mono text-purple-400/80 bg-purple-950/40 border border-purple-800/40 px-2 py-0.5 rounded-full font-bold">
          LIVE
        </span>
      </div>

      {/* Monitor View Mode Selection */}
      <div className="space-y-2 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("timeline")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
            activePreviewTab === "timeline"
              ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 border-purple-500/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              : "bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Layout className={`h-4 w-4 ${activePreviewTab === "timeline" ? "text-purple-400" : "text-neutral-500"}`} />
            <span>Storyboard Live</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-neutral-950 text-purple-300 rounded-md border border-purple-900/50 font-bold">
            {panels.length}p
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePreviewTab?.("video")}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
            activePreviewTab === "video"
              ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/20 border-purple-500/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.25)]"
              : "bg-neutral-950/50 border-neutral-800/80 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Video className={`h-4 w-4 ${activePreviewTab === "video" ? "text-emerald-400" : "text-neutral-500"}`} />
            <span>Compiled Video</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 bg-neutral-950 text-emerald-400 rounded-md border border-emerald-900/50 font-bold">
            MP4
          </span>
        </button>
      </div>

      {/* Episode Playback Selectors */}
      <div className="pt-3 border-t border-neutral-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-purple-400" />
            Episode Replays
          </span>
          {hasEpisodeGroups && (
            <span className="text-[9px] font-mono text-neutral-500 font-bold">
              {episodeGroups.length} Batch
            </span>
          )}
        </div>

        {hasEpisodeGroups ? (
          <div className="space-y-1.5 max-h-52 overflow-y-auto overflow-x-hidden pr-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {getSortedEpisodeGroups(
              (episodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>)
            ).map(({ grp, originalIdx }) => (
              <button
                key={originalIdx}
                type="button"
                title={`Jump to ${formatDisplayEpisodeLabel(grp.episodeLabel)} — starts at panel ${grp.startIndex + 1} · ${grp.count} frames`}
                onClick={() => {
                  if (grp.startIndex !== undefined) {
                    setCurrentPanelIndex(grp.startIndex);
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-950/40 hover:bg-purple-900/25 text-xs font-mono text-purple-200 hover:text-white transition-all text-left border border-neutral-800/80 hover:border-purple-500/50 cursor-pointer active:scale-95"
              >
                <div className="flex items-center gap-2 truncate">
                  <Film className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="truncate font-semibold">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-neutral-900 text-neutral-400 rounded border border-neutral-800 shrink-0 font-normal">
                  {grp.count}f
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-purple-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] font-mono font-bold">Single Episode Active</span>
            </div>
            <p className="text-[10px] font-mono text-neutral-500 leading-normal">
              Full timeline playback active with {panels.length} panel cuts
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default React.memo(VideoPreviewSidebar);
export { VideoPreviewSidebar };

