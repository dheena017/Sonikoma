import React from "react";
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
  return (
    <aside className="w-full lg:w-56 bg-neutral-955 border border-neutral-850 rounded-2xl p-4 shrink-0 space-y-3 shadow-xl self-stretch overflow-y-auto">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
            Playback Monitor
          </h4>
        </div>
      </div>

      <div className="space-y-1.5 font-mono text-xs">
        <button
          type="button"
          onClick={() => setActivePreviewTab?.("timeline")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
            activePreviewTab === "timeline"
              ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
              : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
          }`}
        >
          <span>Storyboard Live</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 text-purple-300 rounded border border-purple-900/40">
            {panels.length}p
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActivePreviewTab?.("video")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
            activePreviewTab === "video"
              ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
              : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
          }`}
        >
          <span>Compiled Video</span>
          <span className="text-[9px] px-1.5 py-0.5 bg-neutral-950 text-emerald-400 rounded border border-emerald-900/40">
            MP4
          </span>
        </button>
      </div>

      {/* Episode Playback Selectors */}
      <div className="pt-2 border-t border-neutral-850 space-y-2">
        <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono">
          Episode Replays
        </span>
        {((window as any).__scrapeEpisodeGroups as Array<any> || []).length > 0 ? (
          <div className="space-y-1 max-h-48 overflow-y-auto overflow-x-hidden p-1 pt-2 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {getSortedEpisodeGroups(
              ((window as any).__scrapeEpisodeGroups as Array<{ episodeLabel: string; startIndex: number; count: number }>) || []
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
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-neutral-900/50 hover:bg-purple-900/30 text-[11px] font-mono text-purple-200 hover:text-white transition-all text-left border border-neutral-850 hover:border-purple-500/40 cursor-pointer"
              >
                <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                <span className="text-[9px] text-neutral-400 font-normal">{grp.count}f</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-neutral-900/40 border border-neutral-850 text-center space-y-1">
            <p className="text-[10px] font-mono text-neutral-400 font-semibold">Single Episode Active</p>
            <p className="text-[9px] font-mono text-neutral-600">No multi-episode batch found</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default React.memo(VideoPreviewSidebar);
export { VideoPreviewSidebar };
