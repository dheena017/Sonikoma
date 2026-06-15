import React from "react";
import { Image as ImageIcon, Download, Trash2, Plus } from "lucide-react";

interface LiveScraperHeaderProps {
  imagesCount: number;
  selectedCount: number;
  isZipping: boolean;
  handleDownloadZip: () => void;
  handleDeleteSelected: () => void;
  handleAddToStoryboard: () => void;
}

export default function LiveScraperHeader({
  imagesCount,
  selectedCount,
  isZipping,
  handleDownloadZip,
  handleDeleteSelected,
  handleAddToStoryboard,
}: LiveScraperHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-neutral-800/60 pb-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/15 text-purple-400">
          <ImageIcon className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-sm text-white">
              Live Asset Extraction
            </h3>
            {imagesCount > 0 && (
              <span className="text-[10px] px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-inner font-mono uppercase tracking-wider">
                {imagesCount} Frames
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 font-mono">
            Separated panels from the live Webtoon viewer.
          </p>
        </div>
      </div>

      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={imagesCount === 0 || isZipping}
          className="text-[10px] font-mono border border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 hover:text-white rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-3.5 w-3.5" />
          <span>{isZipping ? "Downloading..." : "Download"}</span>
        </button>
        <button
          type="button"
          onClick={handleDeleteSelected}
          disabled={selectedCount === 0}
          className="text-[10px] font-mono border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg px-3.5 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
        <button
          type="button"
          onClick={handleAddToStoryboard}
          disabled={selectedCount === 0}
          className="text-[10px] font-mono rounded-lg px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30 flex items-center gap-1.5 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add to Storyboard</span>
        </button>
      </div>
    </div>
  );
}
