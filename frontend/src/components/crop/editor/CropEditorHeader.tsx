import React from "react";
import {
  Scissors,
  X,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  Trash2,
  Minimize2,
} from "lucide-react";

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
  activeTab: string;
  isPipMode?: boolean;
  setIsPipMode?: (val: boolean) => void;
  slices?: any[];
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
  activeTab,
  isPipMode = false,
  setIsPipMode,
  slices = [],
}: CropEditorHeaderProps) {
  const handleCloseClick = async () => {
    if (historyLength > 0 || slices.length > 0) {
      const confirm = (window as any).confirmAsync || window.confirm;
      const confirmClose = await confirm(
        "You have unsaved changes in the editor. Are you sure you want to navigate away?",
        "Unsaved Changes",
        "red"
      );
      if (confirmClose) {
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new Event("popstate"));
      }
    } else {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
    }
  };

  return (
    <div className="relative px-5 sm:px-6 py-4 border-b border-white/5 bg-gradient-to-r from-neutral-950 via-neutral-950/95 to-purple-950/20">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="flex flex-col gap-3">
        {/* Top Row: Title + Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Left: Title Section */}
          <div className="min-w-0 flex items-start gap-3">
            <div className="shrink-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 border border-purple-400/20 p-2.5 shadow-[0_0_25px_rgba(139,92,246,0.14)]">
              <Scissors className="h-4 w-4 text-purple-300" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.22em] text-purple-200">
                  Crop Editor
                </span>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-mono text-neutral-300">
                  Frame #{editingImageIdx + 1}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
                Advanced Drag & Drop Crop Generator
              </h3>
              <p className="max-w-2xl text-[10px] sm:text-[11px] text-neutral-400 font-mono leading-4">
                Crop, trim, split, and clean the current frame without leaving
                the editor.
              </p>
              {/* Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-bold font-mono text-neutral-500 uppercase tracking-wider pt-1 select-none">
                <span
                  className="hover:text-purple-400 cursor-pointer transition-colors"
                  onClick={handleCloseClick}
                >
                  Dashboard
                </span>
                <span>/</span>
                <span className="text-neutral-400">Editor</span>
                <span>/</span>
                <span className="text-purple-400">{activeTab}</span>
                <span>/</span>
                <span className="text-neutral-400 font-semibold">
                  Frame #{editingImageIdx + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 justify-end flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                console.log("[CropEditorHeader] Undo action triggered");
                handleUndo();
              }}
              disabled={historyLength === 0}
              title="Undo last action (Ctrl+Z)"
              className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Undo2 className="h-4 w-4" />
              <span className="hidden sm:inline">Undo</span>
              {historyLength > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
                  {historyLength}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("[CropEditorHeader] Redo action triggered");
                handleRedo();
              }}
              disabled={redoHistoryLength === 0}
              title="Redo last action (Ctrl+Y)"
              className="relative inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:bg-neutral-800/85 hover:text-white border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
            {setIsPipMode && (
              <button
                type="button"
                onClick={() => {
                  if (isPipMode) {
                    setIsPipMode(false);
                    // restore path
                    const params = new URLSearchParams(window.location.search);
                    const idx = params.get("idx") || "0";
                    window.history.pushState(
                      {},
                      "",
                      `/editor/${activeTab}?idx=${idx}`
                    );
                    window.dispatchEvent(new Event("popstate"));
                  } else {
                    setIsPipMode(true);
                    // navigate to dashboard
                    window.history.pushState({}, "", "/");
                    window.dispatchEvent(new Event("popstate"));
                  }
                }}
                className={`inline-flex items-center justify-center rounded-2xl p-2 transition-all cursor-pointer ${
                  isPipMode
                    ? "bg-purple-600 text-white shadow-lg"
                    : "bg-neutral-950/60 hover:bg-neutral-800/90 text-neutral-300 hover:text-white"
                }`}
                title={
                  isPipMode
                    ? "Exit Picture-in-Picture Mode"
                    : "Minimize to Picture-in-Picture"
                }
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            )}
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={handleCloseClick}
              className="inline-flex items-center justify-center rounded-2xl p-2 bg-neutral-950/60 hover:bg-neutral-800/90 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Close crop editor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom Row: Panel Navigation */}
        <div className="flex items-center justify-between gap-2 bg-neutral-900/70 ring-1 ring-white/10 shadow-[0_10px_30px_rgba(15,23,42,0.35)] rounded-3xl p-1.5 select-none">
          <button
            onClick={() => {
              console.log("[CropEditorHeader] Navigating to previous image");
              handlePrevImage();
            }}
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
            onClick={() => {
              console.log("[CropEditorHeader] Navigating to next image");
              handleNextImage();
            }}
            disabled={editingImageIdx === scrapedImages.length - 1}
            className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-[11px] font-semibold font-mono text-neutral-300 bg-neutral-950/60 hover:text-white hover:bg-purple-600/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Next Panel (ArrowRight or ])"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
