import React from "react";
import { Undo2, Trash2, RefreshCw, Scissors } from "lucide-react";
import { Slice } from "../shared/types";

interface CropEditorFooterProps {
  slices: Slice[];
  historyLength: number;
  handleUndo: () => void;
  isSavingEdit: boolean;
  setEditingImageIdx: (idx: number | null) => void;
  handleDeleteCurrentImage: () => void;
  activeTab: "adjust" | "edit" | "eraser" | "slice" | "crop" | "merge";
  isTransforming: boolean;
  addNotification: (msg: string, type: any) => void;
  handleExecuteHorizontalSplit: () => void;
  handleExecuteSave: () => void;
}

export default function CropEditorFooter({
  slices,
  historyLength,
  handleUndo,
  isSavingEdit,
  setEditingImageIdx,
  handleDeleteCurrentImage,
  activeTab,
  isTransforming,
  addNotification,
  handleExecuteHorizontalSplit,
  handleExecuteSave,
}: CropEditorFooterProps) {
  return (
    <div className="px-5 py-4 bg-gradient-to-r from-neutral-950/95 via-neutral-950 to-purple-950/10 border-t border-white/5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1 text-left sm:max-w-[45%]">
        <span className="text-[10px] text-neutral-500 font-mono italic break-words">
          {slices.length > 0
            ? `Multi-cut: ${slices.length} new scenes will be created on your deck`
            : "Single-frame crop mode — drag to set crop bounds"}
        </span>
        {historyLength > 0 && (
          <span className="text-[9px] text-purple-500/80 font-mono">
            {historyLength} undo step{historyLength !== 1 ? "s" : ""} available · Ctrl+Z
          </span>
        )}
        <span className="text-[9px] text-neutral-600 font-mono mt-0.5 hidden sm:block">
          Hotkeys: [ Prev · ] Next · Esc Close · Enter Save · Ctrl+Z Undo
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
        {/* Undo Button in footer */}
        <button
          type="button"
          onClick={() => {
            console.log("[CropEditorFooter] Undo action triggered");
            handleUndo();
          }}
          disabled={historyLength === 0 || isSavingEdit}
          title="Undo last action (Ctrl+Z)"
          className="inline-flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-purple-600/50 disabled:opacity-25 disabled:cursor-not-allowed px-3 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Undo</span>
          {historyLength > 0 && (
            <span className="bg-purple-950/60 text-purple-300 text-[9px] font-bold px-1.5 rounded">
              {historyLength}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("[CropEditorFooter] Closing editor");
            setEditingImageIdx(null);
          }}
          disabled={isSavingEdit}
          className="inline-flex items-center justify-center bg-neutral-900/80 border border-white/5 text-neutral-400 hover:text-white px-3.5 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-colors hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("[CropEditorFooter] Delete current image requested");
            handleDeleteCurrentImage();
          }}
          disabled={isSavingEdit}
          className="inline-flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/55 border border-red-900/30 hover:border-red-900/50 text-red-400 px-3.5 py-2 rounded-2xl text-xs font-semibold cursor-pointer transition-all"
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500/70" />
          <span>Delete</span>
        </button>

        {activeTab === "slice" ? (
          <button
            type="button"
            onClick={handleExecuteHorizontalSplit}
            disabled={isSavingEdit}
            className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
            style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
          >
            {isSavingEdit ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing Split...</span>
              </>
            ) : (
              <>
                <Scissors className="h-3.5 w-3.5 text-purple-200" />
                <span>Apply Split</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExecuteSave}
            disabled={isSavingEdit}
            className="relative bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50"
            style={{ boxShadow: isSavingEdit ? undefined : "0 0 20px rgba(139,92,246,0.25), 0 4px 12px rgba(0,0,0,0.4)" }}
          >
            {isSavingEdit ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Scissors className="h-3.5 w-3.5 text-purple-200" />
                <span>Apply Changes</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
