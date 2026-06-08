import React from "react";
import { Scissors, Trash2 } from "lucide-react";
import { NotificationType } from "../NotificationStack";

interface PanelCardActionsProps {
  idx: number;
  imgUrl: string;
  openEditingImageIdx?: (index: number | null) => void;
  setEditingImageIdx: (index: number | null) => void;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingImageIdx(idx);
    if (openEditingImageIdx) openEditingImageIdx(idx);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      // Auto-reset confirm state after 2.5 s
      setTimeout(() => setConfirmDelete(false), 2500);
      return;
    }
    setScrapedImages((prev) => prev.filter((_, i) => i !== idx));
    setSelectedScraped((prev) => prev.filter((img) => img !== imgUrl));
    setConsoleLogs((prev) => [
      `[GUI] Deleted extracted frame #${idx + 1} from deck.`,
      ...prev,
    ]);
    console.log(`[GUI] Deleted extracted frame #${idx + 1} from deck.`);
    addNotification(`Deleted extracted frame #${idx + 1} from deck.`, "success");
  };

  return (
    <div
      className="flex gap-1 items-center w-full"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Edit / Crop button */}
      <button
        type="button"
        onClick={handleEditClick}
        title="Crop & Trim White Background"
        className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-purple-950/50 hover:text-purple-300 text-neutral-400 py-1.5 rounded-lg border border-neutral-800 hover:border-purple-800/50 transition-all duration-150 cursor-pointer text-[9px] font-mono font-medium tracking-wide"
      >
        <Scissors className="h-3 w-3 shrink-0" />
        <span>Edit</span>
      </button>

      {/* Delete button – single-click → confirm, second click → delete */}
      <button
        type="button"
        onClick={handleDeleteClick}
        title={confirmDelete ? "Click again to confirm delete" : "Remove panel from deck"}
        className={[
          "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border transition-all duration-150 cursor-pointer text-[9px] font-mono font-medium tracking-wide",
          confirmDelete
            ? "bg-red-900/60 border-red-700/70 text-red-300 animate-pulse"
            : "bg-neutral-900 hover:bg-red-950/50 hover:text-red-400 text-neutral-500 border-neutral-800 hover:border-red-900/50",
        ].join(" ")}
      >
        <Trash2 className="h-3 w-3 shrink-0" />
        <span>{confirmDelete ? "Confirm?" : "Delete"}</span>
      </button>
    </div>
  );
}
