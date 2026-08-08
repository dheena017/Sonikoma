import React from "react";
import { Search, Filter, RefreshCw, Sparkles, ChevronDown, CheckCircle2, Eye } from "lucide-react";

interface EpisodeControlsBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedFilter: string;
  setSelectedFilter: (value: string) => void;
  selectedCount: number;
  totalEpisodes: number;
  selectedEpisodes: any[];
  onRefresh: () => void;
  onToggleSelectAll: () => void;
  onOpenBatchPreview?: () => void;
}

const EpisodeControlsBar: React.FC<EpisodeControlsBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedFilter,
  setSelectedFilter,
  selectedCount,
  totalEpisodes,
  selectedEpisodes,
  onRefresh,
  onToggleSelectAll,
  onOpenBatchPreview,
}) => {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800/70 rounded-3xl p-4 backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search episodes..."
              className="w-full pl-9 pr-3 py-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500/40"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-neutral-950/70 border border-neutral-800 rounded-xl text-sm text-neutral-200 focus:outline-none focus:border-purple-500/40 appearance-none"
            >
              <option value="all">All Episodes</option>
              <option value="new">New</option>
              <option value="selected">Selected</option>
              <option value="favorite">Favorite</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onToggleSelectAll}
            className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-950/70 text-sm font-semibold text-neutral-300 hover:border-purple-500/30 hover:text-white transition-all"
          >
            {selectedCount === totalEpisodes ? "Clear All" : "Select All"}
          </button>

          {selectedEpisodes.length > 0 && onOpenBatchPreview && (
            <button
              onClick={onOpenBatchPreview}
              className="px-3 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 text-sm font-semibold text-purple-300 hover:bg-purple-500/20 transition-all flex items-center gap-2"
            >
              <Eye size={14} /> Preview Batch
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950/70 text-neutral-400 hover:text-white hover:border-purple-500/30 transition-all"
            title="Refresh Episodes"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 px-2.5 py-1">
          <CheckCircle2 size={12} className="text-emerald-400" />
          {selectedCount} selected
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 px-2.5 py-1">
          <Sparkles size={12} className="text-purple-400" />
          {totalEpisodes} episodes available
        </div>
      </div>
    </div>
  );
};

export default EpisodeControlsBar;
