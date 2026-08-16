import React from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { GeneratedPanel } from "@/types";
import { formatDisplayEpisodeLabel, getSortedEpisodeGroups } from "@/features/editor_imported_images/components/ImportedImagesSidebar";

type EpisodeGroupRecord = {
  episodeLabel: string;
  startIndex: number;
  count: number;
};

interface StoryboardSidebarProps {
  episodeGroups: EpisodeGroupRecord[];
  panels: GeneratedPanel[];
  selectedTimelineEp: number | "all";
  setSelectedTimelineEp: React.Dispatch<React.SetStateAction<number | "all">>;
  setCurrentPanelIndex: (idx: number) => void;
  timelineEpSearchQuery: string;
  setTimelineEpSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  timelineEpSortAscending: boolean;
  setTimelineEpSortAscending: React.Dispatch<React.SetStateAction<boolean>>;
  addNotification?: (message: string, type: any) => void;
  hoveredTimelineEpIdx: number | null;
  setHoveredTimelineEpIdx: React.Dispatch<React.SetStateAction<number | null>>;
  isCollapsed?: boolean;
  setIsCollapsed?: (v: boolean) => void;
}

const StoryboardSidebar = ({
  episodeGroups,
  panels,
  selectedTimelineEp,
  setSelectedTimelineEp,
  setCurrentPanelIndex,
  timelineEpSearchQuery,
  setTimelineEpSearchQuery,
  timelineEpSortAscending,
  setTimelineEpSortAscending,
  addNotification,
  hoveredTimelineEpIdx,
  setHoveredTimelineEpIdx,
  isCollapsed = false,
  setIsCollapsed,
}: StoryboardSidebarProps) => {
  const safeEpisodeGroups = episodeGroups.length > 0 ? episodeGroups : [];

  if (isCollapsed) {
    return (
      <aside className="bg-[#0d0d12] border border-neutral-800 rounded-2xl p-2 shrink-0 shadow-xl flex flex-col items-center gap-2 self-start transition-all duration-300 w-10">
        <button
          type="button"
          onClick={() => setIsCollapsed?.(false)}
          title="Open Storyboard Navigator"
          className="w-full flex flex-col items-center gap-2 pt-2 cursor-pointer group"
        >
          <PanelLeft className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span
            className="text-[8px] font-black font-mono uppercase text-neutral-500 group-hover:text-purple-400 transition-colors tracking-widest"
            style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}
          >
            Sequences
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-64 bg-[#0d0d12] border border-neutral-800 rounded-2xl p-3 shrink-0 shadow-[0_16px_40px_rgba(0,0,0,0.38)] flex flex-col self-start transition-all duration-300">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
          <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">
            Storyboard
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          {safeEpisodeGroups.length > 0 && (
            <button
              type="button"
              onClick={() => setTimelineEpSortAscending((prev) => !prev)}
              title="Toggle Sort Order (Ascending / Descending)"
              className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-850 text-purple-300 border border-neutral-800 rounded-lg transition-all cursor-pointer"
            >
              {timelineEpSortAscending ? "1 → N" : "N → 1"}
            </button>
          )}
          {setIsCollapsed && (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              title="Collapse Navigator"
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-white transition-all cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 flex-1 min-h-0">
        <div className="relative">
          <input
            type="text"
            value={timelineEpSearchQuery}
            onChange={(e) => setTimelineEpSearchQuery(e.target.value)}
            placeholder="Filter sequence..."
            className="w-full bg-neutral-900/80 border border-neutral-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60 font-mono transition-all"
          />
          {timelineEpSearchQuery && (
            <button
              type="button"
              onClick={() => setTimelineEpSearchQuery("")}
              className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-2">
          <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono mb-2">
            <span>Sequence</span>
            <span>{safeEpisodeGroups.length > 0 ? safeEpisodeGroups.length : "All"}</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedTimelineEp("all")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border ${
              selectedTimelineEp === "all"
                ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white"
            }`}
          >
            <span className="truncate">All Scenes</span>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-955 text-purple-300 border border-purple-900/40 shrink-0">
              {safeEpisodeGroups.length > 0
                ? safeEpisodeGroups.reduce((acc, g) => acc + g.count, 0)
                : panels.length}f
            </span>
          </button>
        </div>

        {safeEpisodeGroups.length > 0 ? (
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-800 flex-1 min-h-0">
            <div className="flex items-center justify-between text-[9px] font-black text-purple-300 uppercase tracking-widest font-mono shrink-0">
              <span>Episodes</span>
              <span>({safeEpisodeGroups.length})</span>
            </div>

            <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto overflow-x-hidden p-1 custom-purple-scrollbar">
              {(() => {
                const rawSorted = getSortedEpisodeGroups(safeEpisodeGroups);
                const sorted = timelineEpSortAscending ? rawSorted : [...rawSorted].reverse();
                const filtered = sorted.filter(({ grp }) => {
                  if (!timelineEpSearchQuery.trim()) return true;
                  return formatDisplayEpisodeLabel(grp.episodeLabel)
                    .toLowerCase()
                    .includes(timelineEpSearchQuery.toLowerCase());
                });

                return filtered.map(({ grp, originalIdx }) => {
                  const isSelected = selectedTimelineEp === originalIdx;
                  const epPanels = panels.filter((panel, globalIdx) => {
                    if (panel.episode_label) {
                      return panel.episode_label === grp.episodeLabel;
                    }
                    return globalIdx >= grp.startIndex && globalIdx < grp.startIndex + grp.count;
                  });

                  const durationStr = `${grp.count * 4}s`;

                  return (
                    <div key={`timeline-ep-wrapper-${originalIdx}`} className="relative group/ep">
                      <button
                        type="button"
                        title={`${formatDisplayEpisodeLabel(grp.episodeLabel)} — ${grp.count} frames · ${durationStr} · ${epPanels.length} panels`}
                        onClick={() => {
                          setSelectedTimelineEp(originalIdx);
                          if (grp.startIndex !== undefined) {
                            setCurrentPanelIndex(grp.startIndex);
                          }
                        }}
                        onMouseEnter={() => setHoveredTimelineEpIdx(originalIdx)}
                        onMouseLeave={() => setHoveredTimelineEpIdx(null)}
                        className={`w-full flex flex-col gap-1 px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left border cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/25 border-purple-400 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                            : "bg-neutral-900/50 border-neutral-850 text-neutral-350 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5 w-full">
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isSelected ? "bg-purple-400 animate-pulse" : "bg-emerald-500/80"
                              }`}
                            />
                            <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                          </div>
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-955 text-purple-300 border border-purple-900/40 shrink-0">
                            {grp.count}f
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-neutral-400 font-normal pl-4 pt-0.5">
                          <span>⏱️ {durationStr}</span>
                          <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">✓ Sequenced</span>
                        </div>
                      </button>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 p-3 text-[10px] text-neutral-400 font-mono">
            No episode sequence loaded yet. Panels will appear here when grouped.
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            addNotification?.("All Storyboard panels selected", "info");
          }}
          className="w-full px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-xs font-mono font-bold text-neutral-300 border border-neutral-800 text-center transition-all cursor-pointer truncate"
        >
          ✅ Select All Scenes
        </button>
      </div>
    </aside>
  );
};

export default StoryboardSidebar;
