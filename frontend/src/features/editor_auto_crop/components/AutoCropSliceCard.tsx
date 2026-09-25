import React from "react";
import {
  Maximize2,
  Copy,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Combine,
  CheckCircle2,
} from "lucide-react";
import * as api from "@/api";
import { SafeImage } from "./SafeImage";

export interface AutoCropSliceCardProps {
  url: string;
  sliceIdx: number;
  totalSlices: number;
  isSelected: boolean;
  box?: api.PanelBoundingBoxInput;
  viewMode: "grid" | "reel";
  onSelect: (idx: number) => void;
  onInspect: (url: string) => void;
  onDuplicate: (idx: number) => void;
  onRemove: (idx: number) => void;
  onMoveSlice: (fromIdx: number, direction: "left" | "right") => void;
  onSplitHalf: (idx: number) => void;
  onMergeNext: (idx: number) => void;
}

export function AutoCropSliceCard({
  url,
  sliceIdx,
  totalSlices,
  isSelected,
  box,
  viewMode,
  onSelect,
  onInspect,
  onDuplicate,
  onRemove,
  onMoveSlice,
  onSplitHalf,
  onMergeNext,
}: AutoCropSliceCardProps) {
  const isFirst = sliceIdx === 0;
  const isLast = sliceIdx === totalSlices - 1;
  const boxH = box?.height || 0;
  const boxW = box?.width || 0;
  const boxRatio = boxW > 0 && boxH > 0 ? (boxW / boxH).toFixed(2) : undefined;

  return (
    <div
      onClick={() => onSelect(sliceIdx)}
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all !cursor-pointer bg-neutral-900 flex flex-col ${
        isSelected
          ? "border-emerald-400 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/15 scale-[1.01]"
          : "border-neutral-800 hover:border-neutral-700"
      } ${
        viewMode === "reel"
          ? "w-[260px] sm:w-[300px] shrink-0 snap-center shadow-2xl"
          : "w-full"
      }`}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/50">
        <SafeImage
          src={url}
          alt={`Panel ${sliceIdx + 1}`}
          className="w-full h-full object-contain p-1.5 transition-transform duration-200 group-hover:scale-105"
        />

        {/* Panel Number Pill & Dimensions */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none flex-wrap">
          <span className="px-2 py-0.5 rounded-lg bg-black/85 text-[10px] sm:text-xs font-mono font-bold text-emerald-300 border border-emerald-500/30 shadow-md">
            #{sliceIdx + 1}
          </span>
          {boxH > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/75 text-[9px] font-mono text-neutral-300 border border-neutral-700">
              {boxH}px {boxRatio ? `(${boxRatio}:1)` : ""}
            </span>
          )}
        </div>

        {/* Top Right Quick Actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Inspect Zoom */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(url);
            }}
            className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
            title="Inspect Zoom"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(sliceIdx);
            }}
            className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
            title="Duplicate Slice"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>

          {/* Remove / Exclude */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(sliceIdx);
            }}
            className="p-1.5 rounded-lg bg-black/85 text-neutral-300 hover:text-rose-400 hover:bg-rose-950/70 border border-neutral-700 shadow-md active:scale-95 !cursor-pointer"
            title="Exclude Slice"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom Reorder Buttons */}
        <div className="absolute bottom-2 inset-x-2 flex items-center justify-between opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            disabled={isFirst}
            onClick={(e) => {
              e.stopPropagation();
              onMoveSlice(sliceIdx, "left");
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-black/90 text-neutral-200 hover:text-white disabled:opacity-20 border border-neutral-700 shadow-lg active:scale-90 transition-all flex items-center justify-center !cursor-pointer disabled:cursor-not-allowed"
            title="Move earlier"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={(e) => {
              e.stopPropagation();
              onMoveSlice(sliceIdx, "right");
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-black/90 text-neutral-200 hover:text-white disabled:opacity-20 border border-neutral-700 shadow-lg active:scale-90 transition-all flex items-center justify-center !cursor-pointer disabled:cursor-not-allowed"
            title="Move later"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel Slice Card Footer Toolbar */}
      <div className="p-2 bg-neutral-950 border-t border-neutral-800/90 flex items-center justify-between gap-1 text-[10px] font-mono">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSplitHalf(sliceIdx);
            }}
            className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors active:scale-95 !cursor-pointer"
            title="Split this panel into two equal halves"
          >
            <Scissors className="h-2.5 w-2.5" />
            <span>½ Split</span>
          </button>

          {!isLast && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMergeNext(sliceIdx);
              }}
              className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white flex items-center gap-0.5 transition-colors active:scale-95 !cursor-pointer"
              title="Merge with next panel below"
            >
              <Combine className="h-2.5 w-2.5 text-sky-400" />
              <span>Merge ▼</span>
            </button>
          )}
        </div>

        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" /> Ready
        </span>
      </div>
    </div>
  );
}

export default AutoCropSliceCard;
