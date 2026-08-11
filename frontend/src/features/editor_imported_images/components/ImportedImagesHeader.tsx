import React from "react";
import {
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
  Rows,
  LayoutGrid,
  Save,
  SlidersHorizontal,
  Search,
  X,
  Sparkles,
} from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import EditorHeaderFrame from "@/features/editor_studio/components/EditorHeaderFrame";

interface ChapterScraperHeaderProps {
  imagesCount: number;
  selectedCount: number;
  isZipping: boolean;
  isScraping?: boolean;
  rating?: number;
  likes?: string;
  views?: number;
  viewLayout: "scroll" | "grid";
  setViewLayout: (v: "scroll" | "grid") => void;
  handleDownloadZip: () => void;
  handleDeleteSelected: () => void;
  handleAddToStoryboard: () => void;
  handleSaveAssets?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onClearSearch?: () => void;
  showFilters?: boolean;
  onToggleFilters?: () => void;
}

export default function ChapterScraperHeader({
  imagesCount,
  selectedCount,
  isZipping,
  isScraping = false,
  rating,
  likes,
  views,
  viewLayout,
  setViewLayout,
  handleDownloadZip,
  handleDeleteSelected,
  handleAddToStoryboard,
  handleSaveAssets,
  searchQuery = "",
  onSearchQueryChange,
  onClearSearch,
  showFilters = false,
  onToggleFilters,
}: ChapterScraperHeaderProps) {
  const leftBlock = (
    <>
      {(() => {
        const isEpisodeCollapsed = useProjectStore((s) => s.isEpisodeCollapsed);
        const setIsEpisodeCollapsed = useProjectStore((s) => s.setIsEpisodeCollapsed);
        return (
          <button
            type="button"
            onClick={() => setIsEpisodeCollapsed(!isEpisodeCollapsed)}
            title={isEpisodeCollapsed ? "Show Episodes" : "Imported Images"}
            aria-pressed={isEpisodeCollapsed}
            className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all ${
              isEpisodeCollapsed
                ? "bg-purple-600 border-purple-500 text-white shadow-[0_6px_18px_rgba(168,85,247,0.18)]"
                : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        );
      })()}
      <div className="w-px h-4 bg-neutral-800" />
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.9)] shrink-0" />
        <h3 className="font-black text-[10px] sm:text-[11px] text-white uppercase tracking-widest font-mono truncate" title="Imported Images">
          Imported Images
        </h3>
        <span className="text-[9px] px-2 py-0.5 rounded-full border border-neutral-700 bg-neutral-900 text-neutral-300 font-mono font-black">
          {imagesCount}
        </span>
      </div>

      <button
        type="button"
        onClick={onToggleFilters}
        title={showFilters ? "Hide filters" : "Show filters"}
        className={`h-7 w-7 rounded-lg flex items-center justify-center border transition-all ${
          showFilters
            ? "bg-purple-600/30 border-purple-500/60 text-purple-200"
            : "bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </button>

      {onSearchQueryChange && (
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Filter images"
            title="Filter imported images"
            className="w-38 bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-7 py-1 text-[10px] font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60"
          />
          {searchQuery && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}
    </>
  );

  const centerBlock = (
    <>
      <button
        type="button"
        onClick={() => setViewLayout("scroll")}
        title="Horizontal Scroll View"
        className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
          viewLayout === "scroll"
            ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <Rows className="w-3 h-3" />
        <span>Scroll</span>
      </button>
      <button
        type="button"
        onClick={() => setViewLayout("grid")}
        title="Grid View"
        className={`flex items-center gap-1.5 px-2.5 h-6 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer ${
          viewLayout === "grid"
            ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
        }`}
      >
        <LayoutGrid className="w-3 h-3" />
        <span>Grid</span>
      </button>
    </>
  );

  const rightBlock = (
    <div className="flex items-center gap-2 shrink-0">
      {selectedCount > 0 && (
        <span className="text-[9px] font-black font-mono text-purple-300 border border-purple-500/40 bg-purple-500/10 rounded-full px-2 py-1">
          {selectedCount} selected
        </span>
      )}

      {rating !== undefined && (
        <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-mono font-black text-amber-300 border border-amber-500/35 rounded-full px-2 py-1">
          <Sparkles className="w-3 h-3" /> {rating}
        </span>
      )}

      {views !== undefined && (
        <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-mono font-black text-neutral-300 border border-neutral-700 rounded-full px-2 py-1">
          {views} views
        </span>
      )}

      {likes !== undefined && (
        <span className="hidden xl:inline-flex items-center gap-1 text-[9px] font-mono font-black text-pink-300 border border-pink-500/35 rounded-full px-2 py-1">
          <Plus className="w-3 h-3" /> {likes}
        </span>
      )}

      {handleDownloadZip && (
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={isZipping || imagesCount === 0}
          title="Download selected asset zip"
          className="h-7 px-3 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      )}

      {handleDeleteSelected && selectedCount > 0 && (
        <button
          type="button"
          onClick={handleDeleteSelected}
          title="Delete selected"
          className="h-7 px-3 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/25 text-rose-300 transition-all cursor-pointer flex items-center justify-center"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {handleAddToStoryboard && selectedCount > 0 && (
        <button
          type="button"
          onClick={handleAddToStoryboard}
          title="Add selected to storyboard"
          className="h-7 px-3 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-200 transition-all cursor-pointer flex items-center justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}


    </div>
  );

  return (
    <EditorHeaderFrame left={leftBlock} center={centerBlock} right={rightBlock} />
  );
}
