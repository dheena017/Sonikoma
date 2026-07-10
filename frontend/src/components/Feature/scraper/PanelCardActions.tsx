import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { NotificationType } from "../../notification/NotificationStack";

// 1. Removed edit-related props
interface PanelCardActionsProps {
  idx: number;
  imgUrl: string;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
}

export function PanelCardActions({
  idx,
  imgUrl,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
}: PanelCardActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 2. handleEditClick has been completely removed

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    setScrapedImages((prev) => prev.filter((_, i) => i !== idx));
    setSelectedScraped((prev) => prev.filter((img) => img !== imgUrl));
    setConsoleLogs((prev) => [
      `[GUI] Deleted image #${idx + 1} from deck.`,
      ...prev,
    ]);
    console.log(`[GUI] Deleted image #${idx + 1} from deck.`);
    addNotification(`Deleted image #${idx + 1} from deck.`, "success");
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className="flex gap-1 items-center w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3. The Edit button has been completely removed */}

        {/* Delete button (Now takes up the full width) */}
        <button
          type="button"
          onClick={handleDeleteClick}
          title="Remove panel from deck"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer text-[9px] font-mono font-medium tracking-wide bg-neutral-900 hover:bg-red-950/50 hover:text-red-400 text-neutral-500 border-neutral-800 hover:border-red-900/50"
        >
          <Trash2 className="h-3 w-3 shrink-0" />
          <span>Delete</span>
        </button>
      </div>

      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 blur-[1px]" />
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0 bg-neutral-950">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 tracking-tight">
                      Delete Image?
                    </h2>
                    <p className="text-[10px] text-neutral-450 font-mono">
                      Warning: This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-neutral-400 hover:text-neutral-100 bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-left">
                <p className="text-xs text-neutral-355 leading-relaxed font-sans">
                  Are you sure you want to delete image{" "}
                  <strong>#{idx + 1}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-neutral-100 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeDelete}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 border border-red-550/30 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Confirm & Delete</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}