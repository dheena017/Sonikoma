import React from "react";
import { Scissors, Trash } from "lucide-react";

interface PanelCardActionsProps {
  idx: number;
  imgUrl: string;
  openEditingImageIdx?: (index: number | null) => void;
  setEditingImageIdx: (index: number | null) => void;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export function PanelCardActions({
  idx,
  imgUrl,
  openEditingImageIdx,
  setEditingImageIdx,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
}: PanelCardActionsProps) {
  const handleEditClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setEditingImageIdx(idx);
    if (openEditingImageIdx) {
      openEditingImageIdx(idx);
    }
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setScrapedImages((prev) => prev.filter((_, i) => i !== idx));
    setSelectedScraped((prev) => prev.filter((img) => img !== imgUrl));
    setConsoleLogs((prev) => [
      `[GUI] Deleted extracted frame #${idx + 1} from deck.`,
      ...prev,
    ]);
  };

  return (
    <div className="flex gap-1 justify-between items-center bg-transparent w-full" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleEditClick}
        title="Crop & Trim White Background"
        className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-purple-950 hover:text-purple-400 text-neutral-400 py-1 rounded border border-neutral-800 hover:border-purple-900/60 transition-colors cursor-pointer text-[10px] font-mono"
      >
        <Scissors className="h-3 w-3" />
        <span>Edit</span>
      </button>

      <button
        type="button"
        onClick={handleDeleteClick}
        title="Remove element from deck"
        className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-red-950 hover:text-red-400 text-neutral-500 py-1 rounded border border-neutral-800 hover:border-red-900/60 transition-colors cursor-pointer text-[10px] font-mono"
      >
        <Trash className="h-3 w-3" />
        <span>Delete</span>
      </button>
    </div>
  );
}
