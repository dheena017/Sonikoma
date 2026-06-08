import React from "react";
import { Scissors, X, ChevronLeft, ChevronRight, Undo2, Redo2, Trash2 } from "lucide-react";

interface CropEditorHeaderProps {
  editingImageIdx: number;
  scrapedImages: string[];
  handlePrevImage: () => void;
  handleNextImage: () => void;
  handleUndo: () => void;
  historyLength: number;
  handleRedo: () => void;
  redoHistoryLength: number;
  handleDeleteCurrentImage: () => void;
  setEditingImageIdx: (idx: number | null) => void;
}

export default function CropEditorHeader({
  editingImageIdx,
  scrapedImages,
  handlePrevImage,
  handleNextImage,
  handleUndo,
  historyLength,
  handleRedo,
  redoHistoryLength,
  handleDeleteCurrentImage,
  setEditingImageIdx,
}: CropEditorHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-neutral-950 via-neutral-950/95 to-purple-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-1">
        <div className="p-2 rounded-xl bg-purple-600/15 border border-purple-500/20">
          <Scissors className="h-4 w-4 text-purple-400" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm sm:text-base text-white tracking-tight leading-5">
            Advanced Drag & Drop Crop Generator
          </h3>
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-mono mt-0.5 leading-4">
            Crop and trim frame #{editingImageIdx + 1} with drag-and-drop controls
          </p>
        </div>
      </div>
      
      {/* Panel Navigation Group */}
      <div className="w-full sm:w-auto flex items-center justify-between gap-2 bg-neutral-900/80 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.35)] rounded-3xl p-1.5 select-none">
        <button
          onClick={handlePrevImage}
          disabled={editingImageIdx === 0}
          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:text-white hover:bg-purple-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Previous Panel (ArrowLeft or [)"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="min-w-[120px] px-3 py-2 text-[11px] font-semibold font-mono text-purple-200 bg-white/5 ring-1 ring-white/10 rounded-2xl backdrop-blur-sm text-center">
          Panel {editingImageIdx + 1} of {scrapedImages.length}
        </div>

        <button
          onClick={handleNextImage}
          disabled={editingImageIdx === scrapedImages.length - 1}
          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:text-white hover:bg-purple-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          title="Next Panel (ArrowRight or ])"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
         {/* Undo Button in header */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={historyLength === 0}
          title="Undo last action (Ctrl+Z)"
          className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Undo2 className="h-4 w-4" />
          <span className="hidden sm:inline">Undo</span>
          {historyLength > 0 && (
            <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
              {historyLength}
            </span>
          )}
        </button>
        {/* Redo Button in header */}
        <button
          type="button"
          onClick={handleRedo}
          disabled={redoHistoryLength === 0}
          title="Redo last action (Ctrl+Y)"
          className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Redo2 className="h-4 w-4" />
          <span className="hidden sm:inline">Redo</span>
          {redoHistoryLength > 0 && (
            <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
              {redoHistoryLength}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleDeleteCurrentImage}
          title="Delete Panel from deck"
          className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-red-200 bg-red-500/10 hover:bg-red-500/15 hover:text-red-100 border border-red-500/10 transition-all cursor-pointer"
        >
          <Trash2 className="h-4 w-4 text-red-400" />
          <span className="hidden sm:inline">Delete</span>
        </button>
        <div className="w-px h-6 bg-white/10" />
        <button
          onClick={() => setEditingImageIdx(null)}
          className="inline-flex items-center justify-center rounded-2xl p-2 bg-neutral-950/60 hover:bg-neutral-800/90 text-neutral-300 hover:text-white transition-all"
          title="Close crop editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
