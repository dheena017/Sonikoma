import React from "react";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import {
  formatDisplayEpisodeLabel,
  getSortedEpisodeGroups,
} from "./ImportedImagesDeck";
import { ChapterRatingDisplay } from "@/features/workspace_scraper/chapter-scraper/components/ChapterRatingDisplay";

export interface EpisodeGroupRecord {
  episodeLabel: string;
  startIndex: number;
  count: number;
}

export interface ImportedImagesSidebarProps {
  episodeGroups: EpisodeGroupRecord[];
  scrapedImages: string[];
  selectedEpisodeIdx: number | "all";
  setSelectedEpisodeIdx: React.Dispatch<React.SetStateAction<number | "all">>;
  episodeSearchQuery: string;
  setEpisodeSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  episodeSortAscending: boolean;
  setEpisodeSortAscending: React.Dispatch<React.SetStateAction<boolean>>;
  isEpisodeCollapsed?: boolean;
  setIsEpisodeCollapsed?: (collapsed: boolean) => void;
  selectedScraped?: string[];
  setSelectedScraped?: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs?: React.Dispatch<React.SetStateAction<string[]>>;
  setLastSelectedIndex?: (idx: number | null) => void;
}

export const ImportedImagesSidebar: React.FC<ImportedImagesSidebarProps> = ({
  episodeGroups,
  scrapedImages,
  selectedEpisodeIdx,
  setSelectedEpisodeIdx,
  episodeSearchQuery,
  setEpisodeSearchQuery,
  episodeSortAscending,
  setEpisodeSortAscending,
  isEpisodeCollapsed = false,
  setIsEpisodeCollapsed,
  selectedScraped = [],
  setSelectedScraped,
  setConsoleLogs,
  setLastSelectedIndex,
}) => {
  if (episodeGroups.length === 0) return null;

  const rawSortedGroups = getSortedEpisodeGroups(episodeGroups);
  const sortedGroups = episodeSortAscending
    ? rawSortedGroups
    : [...rawSortedGroups].reverse();

  const filteredGroups = sortedGroups.filter(({ grp }) => {
    if (!episodeSearchQuery.trim()) return true;
    const label = formatDisplayEpisodeLabel(grp.episodeLabel).toLowerCase();
    return label.includes(episodeSearchQuery.toLowerCase());
  });

  const totalScrapedFrames = episodeGroups.reduce(
    (acc, g) => acc + g.count,
    0
  );

  if (isEpisodeCollapsed) {
    return (
      <aside className="relative bg-[#0c0d16]/70 border border-white/10 backdrop-blur-xl rounded-2xl shrink-0 shadow-2xl lg:sticky lg:top-24 self-start transition-all duration-300 overflow-hidden w-10 p-2">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-80" />
        <button
          type="button"
          onClick={() => setIsEpisodeCollapsed?.(false)}
          title="Open Episode Navigator"
          className="w-full flex flex-col items-center gap-2 pt-2 cursor-pointer group"
        >
          <PanelLeft className="w-4 h-4 text-[#3B82F6] group-hover:text-[#93C5FD] transition-colors" />
          <span
            className="text-[8px] font-black font-mono uppercase text-neutral-500 group-hover:text-[#60A5FA] transition-colors tracking-widest"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
            }}
          >
            Episodes
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="relative bg-[#0c0d16]/70 border border-white/10 backdrop-blur-xl rounded-2xl shrink-0 shadow-2xl lg:sticky lg:top-24 self-start transition-all duration-300 overflow-hidden w-full lg:w-56 p-4 space-y-3">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 opacity-80" />

      {/* Header */}
      <div className="relative flex items-center justify-between gap-2 border-b border-neutral-850/80 pb-3 pt-1.5">
        <div className="min-w-0 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#2A2A2A] animate-pulse shrink-0" />
          <div className="min-w-0">
            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono truncate">
              Episodes
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono">
              {episodeGroups.length} loaded
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setEpisodeSortAscending((prev) => !prev)}
            title="Toggle Sort Order"
            className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-850 text-[#60A5FA] border border-neutral-800 rounded-lg transition-all cursor-pointer"
          >
            {episodeSortAscending ? "1→N" : "N→1"}
          </button>
          {setIsEpisodeCollapsed && (
            <button
              type="button"
              onClick={() => setIsEpisodeCollapsed(true)}
              title="Hide Episode Navigator"
              className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-white transition-all cursor-pointer"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={episodeSearchQuery}
          onChange={(e) => setEpisodeSearchQuery(e.target.value)}
          placeholder="Search episodes..."
          className="w-full bg-neutral-900/80 border border-neutral-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#3B82F6]/60 font-mono transition-all"
        />
        {episodeSearchQuery && (
          <button
            type="button"
            onClick={() => setEpisodeSearchQuery("")}
            className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Episode Scroll List */}
      <div className="space-y-1.5 max-h-[55vh] overflow-y-auto overflow-x-hidden p-1 pt-2 pb-2 custom-purple-scrollbar">
        {/* All Episodes Button */}
        <button
          type="button"
          title={`Show all episodes — ${totalScrapedFrames} frames total`}
          onClick={() => setSelectedEpisodeIdx("all")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
            selectedEpisodeIdx === "all"
              ? "bg-[#2A2A2A] border-[#3B82F6]/60 text-white "
              : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850"
          }`}
        >
          <span className="truncate">All Episodes</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-[#60A5FA] border border-[#2F2F2F] shrink-0">
            {totalScrapedFrames}f
          </span>
        </button>

        {/* Filtered Episode Cards */}
        {filteredGroups.map(({ grp, originalIdx }) => {
          const isSelected = selectedEpisodeIdx === originalIdx;
          const grpImages = scrapedImages.slice(
            grp.startIndex,
            grp.startIndex + grp.count
          );
          const grpSelectedCount = grpImages.filter((img) =>
            selectedScraped.includes(img)
          ).length;

          return (
            <div
              key={`ep-sidebar-${originalIdx}`}
              className={`group/ep flex flex-col p-2.5 rounded-xl border transition-all ${
                isSelected
                  ? "bg-[#181926]/90 border-[#3B82F6]/60 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "bg-neutral-900/40 border-neutral-850 hover:border-neutral-750 hover:bg-neutral-900/80"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEpisodeIdx(originalIdx)}
                  className="flex-1 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold font-mono truncate transition-colors ${
                        isSelected
                          ? "text-[#60A5FA]"
                          : "text-neutral-300 group-hover/ep:text-white"
                      }`}
                    >
                      {formatDisplayEpisodeLabel(grp.episodeLabel)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {grp.count} frames
                    </span>
                    {grpSelectedCount > 0 && (
                      <span className="text-[9px] text-[#60A5FA] font-mono font-bold bg-[#3B82F6]/10 px-1 rounded">
                        {grpSelectedCount} selected
                      </span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover/ep:opacity-100 transition-opacity">
                  <ChapterRatingDisplay
                    rating={(grp as any).rating}
                    likes={(grp as any).likes}
                    views={(grp as any).views}
                    compact
                  />
                  {setSelectedScraped && (
                    <button
                      type="button"
                      title={
                        grpSelectedCount === grp.count
                          ? "Deselect episode frames"
                          : "Select all episode frames"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (grpSelectedCount === grp.count) {
                          setSelectedScraped((prev) =>
                            prev.filter((img) => !grpImages.includes(img))
                          );
                          setLastSelectedIndex?.(null);
                        } else {
                          setSelectedScraped((prev) =>
                            Array.from(new Set([...prev, ...grpImages]))
                          );
                          setConsoleLogs?.((prev) => [
                            `[GUI] Selected episode ${grp.episodeLabel}`,
                            ...prev,
                          ]);
                        }
                      }}
                      className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-neutral-850 hover:bg-[#3B82F6] text-neutral-400 hover:text-white transition-all cursor-pointer"
                    >
                      {grpSelectedCount === grp.count ? "None" : "All"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default React.memo(ImportedImagesSidebar);
