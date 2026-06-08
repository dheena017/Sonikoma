import React from "react";
import { Undo2, Redo2, RotateCcw } from "lucide-react";

interface CleanBubblesHistoryProps {
  handleUndoClean: () => void;
  historyPointer: number;
  handleRedoClean: () => void;
  historyLength: number;
  handleResetToOriginal: () => void;
  imgUrl: string;
  originalUrl: string;
}

export default function CleanBubblesHistory({
  handleUndoClean,
  historyPointer,
  handleRedoClean,
  historyLength,
  handleResetToOriginal,
  imgUrl,
  originalUrl,
}: CleanBubblesHistoryProps) {
  return (
    <div className="flex items-center gap-2 border-t border-white/5 pt-3">
      <button
        type="button"
        onClick={handleUndoClean}
        disabled={historyPointer <= 0}
        className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
        title="Undo clean action"
      >
        <Undo2 className="h-3 w-3 text-purple-400" />
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={handleRedoClean}
        disabled={historyPointer >= historyLength - 1}
        className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed border border-neutral-800 rounded-xl text-neutral-300 flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
        title="Redo clean action"
      >
        <Redo2 className="h-3 w-3 text-purple-400" />
        <span>Redo</span>
      </button>

      <button
        type="button"
        onClick={handleResetToOriginal}
        disabled={imgUrl === originalUrl}
        className="py-1.5 px-3 bg-neutral-900 hover:bg-red-950/20 border border-neutral-800 hover:border-red-900/30 text-neutral-400 hover:text-red-400 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-95 text-[10px] font-mono font-bold"
        title="Reset completely to uncleaned panel state"
      >
        <RotateCcw className="h-3 w-3 text-red-500/70" />
        <span>Original</span>
      </button>
    </div>
  );
}
