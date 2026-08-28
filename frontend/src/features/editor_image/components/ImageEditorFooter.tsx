import React from "react";
import { Undo2, Trash2, RefreshCw, Scissors } from "lucide-react";
import { Slice } from "@/features/editor_image/components";

import { ImageTool } from "@/features/editor_image/hooks/useImageEditorState";

interface ImageEditorFooterProps {
  slices: Slice[];
  historyLength: number;
  handleUndo: () => void;
  isSavingEdit: boolean;
  setEditingImageIdx: (idx: number | null) => void;
  handleDeleteCurrentImage: () => void;
  activeTab: ImageTool;

  isTransforming: boolean;
  addNotification: (msg: string, type: any) => void;
  handleExecuteHorizontalSplit: () => void;
  handleExecuteSave: () => void;
}

export default function ImageEditorFooter({
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
}: ImageEditorFooterProps) {
  return (
    <div className="px-5 py-4 bg-[#141414] border-t border-[#2F2F2F] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-left">
      <div className="flex flex-col gap-1 sm:max-w-[45%]">
        <span className="text-[10px] text-[#9CA3AF] font-mono italic break-words">
          {slices.length > 0
            ? `Multi-cut: ${slices.length} new scenes will be created on your deck`
            : "Single-frame crop mode — drag to set crop bounds"}
        </span>
        {historyLength > 0 && (
          <span className="text-[9px] text-[#3B82F6] font-mono">
            {historyLength} undo step{historyLength !== 1 ? "s" : ""} available
            · Ctrl+Z
          </span>
        )}
        <span className="text-[9px] text-[#6B7280] font-mono mt-0.5 hidden sm:block">
          Hotkeys: [ Prev · ] Next · Esc Close · Enter Save · Ctrl+Z Undo
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end ml-auto">
        {/* Undo Button in footer */}
        <button
          type="button"
          onClick={() => {
            console.log("[ImageEditorFooter] Undo action triggered");
            handleUndo();
          }}
          disabled={historyLength === 0 || isSavingEdit}
          title="Undo last action (Ctrl+Z)"
          className="btn-secondary inline-flex items-center gap-1.5 disabled:opacity-25 px-3 py-2 rounded-xl text-xs font-semibold font-mono"
        >
          <Undo2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Undo</span>
          {historyLength > 0 && (
            <span className="bg-[#121212] text-[#3B82F6] border border-[#2F2F2F] text-[9px] font-bold px-1.5 rounded">
              {historyLength}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("[ImageEditorFooter] Closing editor");
            window.history.pushState({}, "", "/");
            window.dispatchEvent(new Event("popstate"));
          }}
          disabled={isSavingEdit}
          className="btn-secondary inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            console.log("[ImageEditorFooter] Delete current image requested");
            handleDeleteCurrentImage();
          }}
          disabled={isSavingEdit}
          className="btn-secondary inline-flex items-center gap-1.5 text-[#EF4444] border-[#EF4444]/30 hover:bg-[#EF4444]/10 px-3.5 py-2 rounded-xl text-xs font-semibold"
        >
          <Trash2 className="h-3.5 w-3.5 text-[#EF4444]" />
          <span>Delete</span>
        </button>

        {activeTab === "slice" ? (
          <button
            type="button"
            onClick={handleExecuteHorizontalSplit}
            disabled={isSavingEdit}
            className="btn-primary relative px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 uppercase tracking-wider shadow-sm"
          >
            {isSavingEdit ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Processing Split...</span>
              </>
            ) : (
              <>
                <Scissors className="h-3.5 w-3.5 text-white" />
                <span>Apply Split</span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleExecuteSave}
            disabled={isSavingEdit}
            className="btn-primary relative px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 uppercase tracking-wider shadow-sm"
          >
            {isSavingEdit ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Scissors className="h-3.5 w-3.5 text-white" />
                <span>Apply Changes</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
