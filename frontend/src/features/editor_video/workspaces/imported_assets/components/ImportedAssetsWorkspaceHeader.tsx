import React from "react";
import {
  ArrowUpDown,
  CheckSquare,
  Square,
  Search,
  X,
  Plus,
  Scissors,
  Sparkles,
  Trash2,
} from "lucide-react";

export type AssetFilterTab = "all" | "timeline" | "unassigned" | "favorites";

export interface ImportedAssetsWorkspaceHeaderProps {
  filteredCount: number;
  totalCount: number;
  activeTab: AssetFilterTab;
  onSelectTab: (tab: AssetFilterTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortOrder: "asc" | "desc";
  onToggleSort: () => void;
  selectedCount: number;
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
  onAddSelectedToTimeline?: () => void;
  onAutoCropSelected?: () => void;
  onCleanBubblesSelected?: () => void;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}

export const ImportedAssetsWorkspaceHeader: React.FC<ImportedAssetsWorkspaceHeaderProps> = ({
  filteredCount,
  totalCount,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
  sortOrder,
  onToggleSort,
  selectedCount,
  isAllSelected,
  onToggleSelectAll,
  onAddSelectedToTimeline,
  onAutoCropSelected,
  onCleanBubblesSelected,
  onDeleteSelected,
  onClearSelection,
}) => {
  return (
    <div className="shrink-0 border-b border-purple-900/20 bg-[#0c0d18]/95 backdrop-blur-2xl">
      {/* Title & Master Actions Row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-white/5">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-[11px] font-black text-white uppercase tracking-wider font-mono truncate">
            Imported Assets
          </h2>
          <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
            {filteredCount} / {totalCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
                ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                : selectedCount > 0
                ? "bg-purple-900/40 border-purple-500/40 text-purple-300"
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
          { id: "all", label: "All" },
          { id: "timeline", label: "Timeline" },
          { id: "unassigned", label: "Unassigned" },
          { id: "favorites", label: "Starred" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id as AssetFilterTab)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold whitespace-nowrap transition-all border cursor-pointer ${
              activeTab === tab.id
                ? "bg-purple-600/30 border-purple-500/60 text-white shadow-[0_0_8px_rgba(168,85,247,0.25)]"
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
            placeholder="Search frame (#1, #2...)"
            className="w-full h-7 pl-7 pr-7 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-[10px] font-mono focus:outline-none focus:border-purple-500/60 transition-all"
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

      {/* Floating Bulk Action Bar (When frames are selected) */}
      {selectedCount > 0 && (
        <div className="px-3 py-2 bg-purple-950/50 border-t border-purple-500/30 flex flex-wrap items-center justify-between gap-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[10px] font-black font-mono text-purple-200">
            {selectedCount} Selected
          </span>

          <div className="flex items-center gap-1 flex-wrap">
            {onAddSelectedToTimeline && (
              <button
                type="button"
                onClick={onAddSelectedToTimeline}
                className="px-2 py-0.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Add selected frames to storyboard timeline"
              >
                <Plus className="h-2.5 w-2.5" />
                <span>Add ({selectedCount})</span>
              </button>
            )}

            {onAutoCropSelected && (
              <button
                type="button"
                onClick={onAutoCropSelected}
                className="px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Auto-crop selected frames"
              >
                <Scissors className="h-2.5 w-2.5" />
                <span>Auto Crop</span>
              </button>
            )}

            {onCleanBubblesSelected && (
              <button
                type="button"
                onClick={onCleanBubblesSelected}
                className="px-2 py-0.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Clean speech bubbles in selected frames"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>Clean</span>
              </button>
            )}

            {onDeleteSelected && (
              <button
                type="button"
                onClick={onDeleteSelected}
                className="px-2 py-0.5 rounded-md bg-rose-600/80 hover:bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                title="Delete selected frames"
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

export default ImportedAssetsWorkspaceHeader;
