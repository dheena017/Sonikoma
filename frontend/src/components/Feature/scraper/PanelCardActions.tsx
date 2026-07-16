import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, Edit2 } from "lucide-react";
import { NotificationType } from "../../notification";
import { useImageEditorStore } from "../../../hooks/useImageEditorState";

interface PanelCardActionsProps {
  idx: number;
  imgUrl: string;
  /** Raw URL matching scrapedImages entries, used for selection state updates */
  rawImgUrl: string;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<any[]>>;
  addNotification: (message: string, type: NotificationType) => void;
}

export function PanelCardActions({
  idx,
  imgUrl,
  rawImgUrl,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addNotification,
}: PanelCardActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Safely open the editor without URL bugs
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    // 1. Tell the store which image to edit
    useImageEditorStore.setState({ editingImageIdx: idx, activeTool: "adjust" });

    // 2. Tell the main layout to switch to the Image Editor tab
    window.dispatchEvent(
      new CustomEvent("SWITCH_TAB", { detail: "image-editor" })
    );
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    setScrapedImages((prev) => prev.filter((_, i) => i !== idx));
    // Use rawImgUrl so we match the raw URL stored in selectedScraped
    setSelectedScraped((prev) => prev.filter((img) => img !== rawImgUrl));
    setConsoleLogs((prev) => [`[GUI] Deleted image #${idx + 1} from deck.`, ...prev]);
    addNotification(`Deleted image #${idx + 1} from deck.`, "success");
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className="flex gap-1 items-center w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* NEW SAFELY WIRED EDIT BUTTON */}
        <button
          type="button"
          onClick={handleEditClick}
          title="Open Image Editor"
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer text-[9px] font-mono font-medium tracking-wide bg-neutral-900 hover:bg-purple-950/50 hover:text-purple-400 text-neutral-500 border-neutral-800 hover:border-purple-900/50"
        >
          <Edit2 className="h-3 w-3 shrink-0" />
          <span>Edit</span>
        </button>

        {/* Delete button */}
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-neutral-100 tracking-tight">
                      Delete Image?
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-neutral-400 hover:text-neutral-100 bg-neutral-900 hover:bg-neutral-800 p-2 rounded-full cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-6 text-left">
                <p className="text-xs text-neutral-355 font-sans">
                  Are you sure you want to delete image{" "}
                  <strong>#{idx + 1}</strong>?
                </p>
              </div>
              <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-650 to-rose-650 text-white font-bold rounded-xl text-xs cursor-pointer"
                >
                  Confirm & Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

