import React from "react";
import { Trash2, X } from "lucide-react";

interface BulkActionFooterProps {
  selectedCount: number;
  clearSelection: () => void;
  onBulkDelete: () => void;
}

export default function BulkActionFooter({
  selectedCount,
  clearSelection,
  onBulkDelete,
}: BulkActionFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 p-4 z-50 animate-in slide-in-from-bottom-10 duration-300">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-900/90 to-[#0b0b0e]/95 backdrop-blur-xl border border-purple-500/50 rounded-2xl p-4 flex items-center justify-between shadow-2xl shadow-purple-900/40">
        <div className="flex items-center gap-4">
          <div className="bg-purple-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
            {selectedCount}
          </div>
          <div className="text-white font-medium">projects selected</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={clearSelection}
            className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Clear Selection
          </button>
          <button
            onClick={onBulkDelete}
            className="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-900/50 transition-all active:scale-95 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete Selected
          </button>
        </div>
      </div>
    </div>
  );
}
