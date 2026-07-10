import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Scissors, Trash2, X } from "lucide-react";
import { useImageEditorStore } from "../../../hooks/useImageEditorState";
import { NotificationType } from "../../notification/NotificationStack";

interface PanelCardActionsProps {
  idx: number;
  imgUrl: string;
  openEditingImageIdx?: (index: number | null) => void;
  setEditingImageIdx: (index: number | null) => void;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
}

export function PanelCardActions({
  idx,
  imgUrl,
  openEditingImageIdx,
  setEditingImageIdx,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
}: PanelCardActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    console.log(`[PanelCardActions] Entering edit mode for image #${idx + 1}`);

    // 1. Update Zustand store (This triggers the modal if it's subscribed)
    useImageEditorStore.setState({
      activeTool: "adjust",
      editingImageIdx: idx,
    });

    // 2. Update URL safely without refreshing the page
    const url = new URL(window.location.href);
    url.searchParams.set("idx", idx.toString());
    window.history.pushState({}, "", url.toString());

    // 3. Back-compat: Keep legacy state in sync
    if (setEditingImageIdx) {
      setEditingImageIdx(idx);
    }
  };

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
    addNotification(`Deleted image #${idx + 1} from deck.`, "success");
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className="flex gap-1 items-center w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleEditClick}
          title="Crop & Trim White Background"
          className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-purple-950/50 hover:text-purple-400 text-neutral-500 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-800/50 transition-all duration-150 cursor-pointer text-[9px] font-mono font-medium tracking-wide"
        >
          <Scissors className="h-3 w-3 shrink-0" />
          <span>Edit</span>
        </button>

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
            <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl z-10 animate-in zoom-in-95 duration-200 flex flex-col">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 blur-[1px]" />
              
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0 bg-neutral-950">
                <h2 className="text-base font-bold text-neutral-100">Delete Image?</h2>
                <button onClick={() => setShowDeleteConfirm(false)} className="text-neutral-400 hover:text-neutral-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6">
                <p className="text-xs text-neutral-300">Are you sure you want to delete image #{idx + 1}?</p>
              </div>

              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2 bg-neutral-800 text-white rounded-xl text-xs">Cancel</button>
                <button onClick={executeDelete} className="px-6 py-2 bg-red-600 text-white font-bold rounded-xl text-xs">Confirm</button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}