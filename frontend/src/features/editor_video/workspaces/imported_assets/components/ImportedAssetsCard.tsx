import React, { useState } from "react";
import {
  Plus,
  Star,
  Check,
  Link2,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
  Scissors,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";

export interface ImportedAssetsCardProps {
  url: string;
  index: number;
  isAssigned: boolean;
  isSelected: boolean;
  isFav: boolean;
  isMerging?: boolean;
  isCropping?: boolean;
  isCleaning?: boolean;
  totalImagesCount: number;
  onSelect: (index: number, url: string, e: React.MouseEvent) => void;
  onToggleFavorite: (index: number, e: React.MouseEvent) => void;
  onAddToTimeline: (url: string, index: number, e: React.MouseEvent) => Promise<void> | void;
  onMergeWithNext: (index: number, e: React.MouseEvent) => Promise<void> | void;
  onOpenEditor: (index: number, e: React.MouseEvent) => void;
  onDelete: (index: number, e: React.MouseEvent) => void;
}

export const ImportedAssetsCard: React.FC<ImportedAssetsCardProps> = ({
  url,
  index,
  isAssigned,
  isSelected,
  isFav,
  isMerging = false,
  isCropping = false,
  isCleaning = false,
  totalImagesCount,
  onSelect,
  onToggleFavorite,
  onAddToTimeline,
  onMergeWithNext,
  onOpenEditor,
  onDelete,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const displayUrl = getProxiedImageUrl(url);
  const title = `Frame #${index + 1}`;

  const isProcessing = isMerging || isCropping || isCleaning || isAdding;

  const handleAddClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    try {
      await onAddToTimeline(url, index, e);
    } finally {
      setTimeout(() => setIsAdding(false), 400);
    }
  };

  return (
    <div
      draggable={!isProcessing}
      onDragStart={(e) => {
        if (isProcessing) return;
        e.dataTransfer.setData("text/plain", url);
        e.dataTransfer.setData(
          "application/json",
          JSON.stringify({ image_url: url, index })
        );
      }}
      onClick={(e) => onSelect(index, url, e)}
      className={`relative group rounded-2xl overflow-hidden border transition-all flex flex-col cursor-pointer select-none ${
        isSelected
          ? "border-[#3B82F6] bg-[#2A2A2A] ring-2 ring-[#3B82F6]/50 "
          : "border-white/10 bg-[#090912] hover:border-[#3B82F6]/50 shadow-md hover:shadow-[0_8px_25px_rgba(59,130,246,0.2)]"
      }`}
    >
      {/* Thumbnail Image Container */}
      <div className="relative w-full aspect-[3/4] bg-black/60 overflow-hidden">
        <img
          src={displayUrl}
          alt={title}
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-300 ${
            isProcessing ? "scale-95 blur-[1px] opacity-60" : "group-hover:scale-105"
          }`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50 opacity-75 group-hover:opacity-90 transition-opacity pointer-events-none" />

        {/* Top Status & Checkbox */}
        <div className="absolute top-2 inset-x-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-1">
            <div
              className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                isSelected
                  ? "bg-[#2A2A2A] border-[#60A5FA] text-white"
                  : "bg-black/60 border-white/20 text-transparent group-hover:border-white/50"
              }`}
            >
              <Check className="h-3 w-3" />
            </div>
            <span className="text-[9px] font-black font-mono bg-black/75 text-[#3B82F6] px-1.5 py-0.5 rounded border border-[#3B82F6]/30 backdrop-blur-md">
              #{index + 1}
            </span>
          </div>

          <button
            type="button"
            onClick={(e) => onToggleFavorite(index, e)}
            className="p-1 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 text-neutral-400 hover:text-amber-300 transition-colors"
            title={isFav ? "Favorited" : "Favorite"}
          >
            <Star
              className={`h-3 w-3 ${
                isFav ? "text-amber-400 fill-amber-400" : ""
              }`}
            />
          </button>
        </div>

        {/* Assigned Timeline Pill */}
        {isAssigned && !isProcessing && (
          <div className="absolute bottom-2 left-2 z-10">
            <span className="inline-flex items-center gap-1 text-[8px] font-bold font-mono bg-emerald-950/90 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-500/40 backdrop-blur-md">
              <Check className="h-2.5 w-2.5" />
              Timeline
            </span>
          </div>
        )}

        {/* ── Active Processing / Loading Overlay on Card Image ───────────── */}
        {isProcessing && (
          <div className="absolute inset-0 z-20 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-3 text-center animate-in fade-in duration-150">
            <div className="relative flex items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-[#3B82F6]/20 border border-[#3B82F6]/40 animate-ping absolute inset-0" />
              <div className="w-8 h-8 rounded-full bg-[#2A2A2A] border border-[#60A5FA]/60 flex items-center justify-center ">
                <Loader2 className="h-4 w-4 text-[#60A5FA] animate-spin" />
              </div>
            </div>

            <span className="text-[9px] font-bold font-mono text-[#3B82F6] tracking-wider uppercase">
              {isCropping
                ? "Auto Cropping..."
                : isCleaning
                ? "Cleaning..."
                : isMerging
                ? "Merging..."
                : isAdding
                ? "Adding..."
                : "Processing..."}
            </span>
          </div>
        )}
      </div>

      {/* Card Controls & Actions Footer */}
      <div className="p-2 bg-[#0c0d18] border-t border-white/5 space-y-1.5">
        {/* Primary Action Button: Add to Timeline */}
        <button
          type="button"
          onClick={handleAddClick}
          disabled={isProcessing}
          className={`w-full py-1 px-2 rounded-lg font-mono text-[9px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer ${
            isAdding
              ? "bg-[#2A2A2A] text-[#3B82F6] opacity-90 cursor-wait"
              : "bg-[#2A2A2A] hover:bg-[#3B82F6] text-white"
          }`}
        >
          {isAdding ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-[#3B82F6]" />
          ) : (
            <Plus className="h-2.5 w-2.5" />
          )}
          <span>{isAdding ? "Adding..." : "Add to Timeline"}</span>
        </button>

        {/* Secondary Action Button: Merge with Next */}
        <button
          type="button"
          onClick={(e) => {
            if (index >= totalImagesCount - 1) return;
            onMergeWithNext(index, e);
          }}
          disabled={isProcessing || isMerging || index >= totalImagesCount - 1}
          className={`w-full py-1 px-2 rounded-lg font-mono text-[9px] font-bold flex items-center justify-center gap-1 transition border ${
            index >= totalImagesCount - 1
              ? "bg-white/[0.02] border-white/[0.05] text-neutral-600 cursor-not-allowed select-none opacity-40"
              : isMerging
              ? "bg-[#2A2A2A] border-indigo-400 text-indigo-200 cursor-wait"
              : "bg-[#2A2A2A] hover:bg-[#333333] border-[#2F2F2F] text-neutral-300 hover:text-white cursor-pointer"
          }`}
        >
          {isMerging ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin text-neutral-300" />
          ) : (
            <Link2 className="h-2.5 w-2.5" />
          )}
          <span>
            {isMerging
              ? "Merging..."
              : index >= totalImagesCount - 1
              ? "End of Chapter"
              : "Merge with Next"}
          </span>
        </button>

        {/* Edit & Delete Mini Buttons */}
        <div className="grid grid-cols-2 gap-1 pt-0.5">
          <button
            type="button"
            onClick={(e) => onOpenEditor(index, e)}
            disabled={isProcessing}
            className="py-1 px-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-[8px] font-bold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40"
            title="Edit Frame in Image Editor"
          >
            <Edit2 className="h-2.5 w-2.5" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={(e) => onDelete(index, e)}
            disabled={isProcessing}
            className="py-1 px-1.5 rounded-md bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 font-mono text-[8px] font-bold flex items-center justify-center gap-1 transition cursor-pointer disabled:opacity-40"
            title="Delete Frame"
          >
            <Trash2 className="h-2.5 w-2.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportedAssetsCard;
