import React from "react";
import {
  Film,
  Search,
  X,
  Plus,
  Sparkles,
  Volume2,
  Camera,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  Play,
} from "lucide-react";

export type StoryboardFilterTab = "all" | "dialogue" | "prompts" | "camera" | "audio";

export interface StoryboardWorkspaceHeaderProps {
  panelCount: number;
  totalDuration: string;
  activeTab: StoryboardFilterTab;
  onSelectTab: (tab: StoryboardFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onAutoVoiceover?: () => void;
  onAutoCameraPan?: () => void;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
  onPlayStoryboard?: () => void;
}

export const StoryboardWorkspaceHeader: React.FC<StoryboardWorkspaceHeaderProps> = ({
  panelCount,
  totalDuration,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onAutoVoiceover,
  onAutoCameraPan,
  onDeleteSelected,
  onClearSelection,
  onPlayStoryboard,
}) => {
  return (
    <div className="shrink-0 border-b border-[#2F2F2F] bg-[#121212]/95 backdrop-blur-2xl">
      {/* Title & Master Actions Row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA]">
            <Film className="h-3.5 w-3.5" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-white uppercase tracking-wider font-mono truncate">
              Storyboard
            </h2>
            <p className="text-[9px] font-mono text-neutral-400">
              {panelCount} Panels • {totalDuration}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onPlayStoryboard && (
            <button
              type="button"
              onClick={onPlayStoryboard}
              className="p-1 px-2 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 hover:text-white transition-all text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-sm"
              title="Preview Storyboard Playback"
            >
              <Play className="h-2.5 w-2.5 fill-emerald-300" />
              <span>Preview</span>
            </button>
          )}

          {/* Sort Toggle Button */}
          <button
            type="button"
            onClick={onToggleSort}
            className="p-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-all text-[10px] flex items-center gap-1 cursor-pointer"
            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
          >
            <ArrowUpDown className="h-3 w-3" />
          </button>

          {/* Select All Toggle Button */}
          <button
            type="button"
            onClick={onToggleSelectAll}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
              isAllSelected
                ? "bg-[#2A2A2A] border-[#3B82F6] text-white "
                : selectedCount > 0
                ? "bg-[#2A2A2A] border-[#3B82F6]/40 text-[#60A5FA]"
                : "bg-neutral-900/80 hover:bg-neutral-800 border-neutral-800 text-neutral-300"
            }`}
          >
            {isAllSelected ? (
              <CheckSquare className="h-3 w-3" />
            ) : (
              <Square className="h-3 w-3" />
            )}
            <span>{isAllSelected ? "Deselect" : "Select All"}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 pt-2 pb-1.5 flex items-center gap-1 overflow-x-auto mini-sidebar-scrollbar">
        {[
          { id: "all", label: "All Panels" },
          { id: "dialogue", label: "Dialogue" },
          { id: "prompts", label: "Visual Prompts" },
          { id: "camera", label: "Camera FX" },
          { id: "audio", label: "Audio" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id as StoryboardFilterTab)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#2A2A2A] border-[#3B82F6]/60 text-white "
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div className="px-3 pb-2 pt-0.5">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search dialogue, panels (#1, #2...)"
            className="w-full h-7 pl-7 pr-7 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-[10px] font-mono focus:outline-none focus:border-[#3B82F6]/60 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar (When panels are selected) */}
      {selectedCount > 0 && (
        <div className="px-3 py-2 bg-[#2A2A2A] border-t border-[#3B82F6]/30 flex flex-wrap items-center justify-between gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[10px] font-black font-mono text-[#3B82F6]">
            {selectedCount} Selected
          </span>

          <div className="flex items-center gap-1 flex-wrap">
            {onAutoVoiceover && (
              <button
                type="button"
                onClick={onAutoVoiceover}
                className="px-2 py-0.5 rounded-md bg-[#2A2A2A] hover:bg-[#3B82F6] text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Generate AI Voiceover for selected panels"
              >
                <Volume2 className="h-2.5 w-2.5" />
                <span>Voiceover</span>
              </button>
            )}

            {onAutoCameraPan && (
              <button
                type="button"
                onClick={onAutoCameraPan}
                className="px-2 py-0.5 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Apply dynamic camera motions to selected panels"
              >
                <Camera className="h-2.5 w-2.5" />
                <span>Motion</span>
              </button>
            )}

            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="px-2 py-0.5 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Remove selected panels from storyboard"
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            )}

            {onClearSelection && (
              <button
                type="button"
                onClick={onClearSelection}
                className="px-1.5 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[9px] transition cursor-pointer"
                title="Clear selection"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryboardWorkspaceHeader;
