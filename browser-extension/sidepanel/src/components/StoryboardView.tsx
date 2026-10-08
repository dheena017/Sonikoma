import React from "react";
import { Search, CheckSquare, Square, RefreshCw, Sparkles } from "lucide-react";
import { StoryboardPanel } from "../types";
import { StoryboardCard } from "./StoryboardCard";
import { EmptyStoryboardState } from "./EmptyStoryboardState";

export interface StoryboardViewProps {
  panels: StoryboardPanel[];
  filteredPanels: StoryboardPanel[];
  searchQuery: string;
  globalMotion: string;
  enabledCount: number;
  chapterInfo: {
    title: string;
    chapterName: string;
    hasDetectedChapter: boolean;
  };
  isScanning: boolean;
  isAnalyzingAll?: boolean;
  activeAuditioningId: string | null;
  onSearchChange: (q: string) => void;
  onGlobalMotionChange: (preset: string) => void;
  onToggleSelectAll: (select: boolean) => void;
  onScan: () => void;
  onLoadSample: () => void;
  onUpdatePanel: (id: string, updates: Partial<StoryboardPanel>) => void;
  onMovePanel: (index: number, direction: "up" | "down") => void;
  onDuplicatePanel: (panel: StoryboardPanel, index: number) => void;
  onDeletePanel: (id: string) => void;
  onAuditionPanel: (
    panelId: string,
    text: string,
    voice?: string,
    audioUrl?: string
  ) => void;
  onAnalyzePanel?: (panelId: string, imageUrl: string) => void;
  onAnalyzeAllPanels?: () => void;
  onPreviewImage: (imageUrl: string) => void;
}

export const StoryboardView: React.FC<StoryboardViewProps> = ({
  panels,
  filteredPanels,
  searchQuery,
  enabledCount,
  chapterInfo,
  isScanning,
  isAnalyzingAll = false,
  activeAuditioningId,
  onSearchChange,
  onToggleSelectAll,
  onScan,
  onLoadSample,
  onUpdatePanel,
  onMovePanel,
  onDuplicatePanel,
  onDeletePanel,
  onAuditionPanel,
  onAnalyzePanel,
  onAnalyzeAllPanels,
  onPreviewImage,
}) => {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Unified Header & Toolbar ── */}
      <div className="px-3 py-2 bg-[#121212] border-b border-[#2f2f2f] flex flex-col gap-1.5 shrink-0">
        {/* Row 1: Series Title & Action Controls */}
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] shrink-0" />
            <p className="font-bold text-[#e5e5e5] truncate text-[11px] leading-tight">
              {chapterInfo.title}
              {chapterInfo.chapterName &&
                chapterInfo.chapterName.toLowerCase() !==
                  chapterInfo.title.toLowerCase() && (
                  <span className="text-[#9ca3af] font-normal ml-1.5 text-[10px]">
                    • {chapterInfo.chapterName}
                  </span>
                )}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onScan}
              disabled={isScanning}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#282828] disabled:opacity-50 border border-[#2f2f2f] text-sky-400 text-[9px] font-semibold transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw
                size={9}
                className={isScanning ? "animate-spin" : ""}
              />
              <span>{isScanning ? "Scanning..." : "Rescan"}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Search & Select All */}
        {panels.length > 0 && (
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search
                size={10}
                className="absolute left-2 top-2 text-[#6b7280]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search dialogue or scenes..."
                className="w-full bg-[#181818] border border-[#2f2f2f] focus:border-[#3b82f6] rounded pl-6 pr-2 py-0.5 text-[10px] text-[#e5e5e5] placeholder-[#6b7280] focus:outline-none transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => onToggleSelectAll(enabledCount < panels.length)}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1e1e] hover:bg-[#282828] border border-[#2f2f2f] text-[#9ca3af] hover:text-[#e5e5e5] text-[9px] font-medium transition-colors cursor-pointer shrink-0"
            >
              {enabledCount === panels.length ? (
                <CheckSquare size={10} className="text-[#3b82f6]" />
              ) : (
                <Square size={10} />
              )}
              <span>
                {enabledCount === panels.length ? "All Selected" : "Select All"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Storyboard Cards List or Empty State ── */}
      <div className="flex-1 p-3 flex flex-col gap-2.5 overflow-y-auto bg-[#0a0a0a]">
        {panels.length === 0 ? (
          <EmptyStoryboardState
            isScanning={isScanning}
            onScan={onScan}
            onLoadSample={onLoadSample}
          />
        ) : filteredPanels.length === 0 ? (
          <div className="text-center text-[#9ca3af] py-10 text-[11px]">
            No scenes match search query "{searchQuery}"
          </div>
        ) : (
          filteredPanels.map((panel) => (
            <StoryboardCard
              key={panel.id}
              panel={panel}
              totalPanels={panels.length}
              isAuditioning={activeAuditioningId === panel.id}
              onUpdate={onUpdatePanel}
              onMove={onMovePanel}
              onDuplicate={onDuplicatePanel}
              onDelete={onDeletePanel}
              onAudition={onAuditionPanel}
              onAnalyze={onAnalyzePanel}
              onPreviewImage={onPreviewImage}
            />
          ))
        )}
      </div>
    </div>
  );
};
