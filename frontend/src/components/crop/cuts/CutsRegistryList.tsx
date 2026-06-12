import React from "react";
import { Layers, RefreshCw, Crop as CropIcon, Trash2 } from "lucide-react";
import { Slice } from "../shared/types";

interface CutsRegistryListProps {
  slices: Slice[];
  selectedSliceId: string | null;
  handleSelectSlice: (slice: Slice) => void;
  handleCropSingleSlice: (slice: Slice, e: React.MouseEvent) => Promise<void>;
  handleDeleteSlice: (id: string, e: React.MouseEvent) => void;
  isCroppingSlice: string | null;
  isSavingEdit: boolean;
}

export function CutsRegistryList({
  slices,
  selectedSliceId,
  handleSelectSlice,
  handleCropSingleSlice,
  handleDeleteSlice,
  isCroppingSlice,
  isSavingEdit,
}: CutsRegistryListProps) {
  if (slices.length === 0) {
    return (
      <div className="border border-white/5 border-dashed rounded-2xl p-6 text-center">
        <Layers className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
        <p className="text-[11px] font-bold text-neutral-500">Crop tools list is empty</p>
        <p className="text-[10px] text-neutral-600 leading-normal mt-1">
          Draw on the image canvas and push to crop tools list, or use Auto Panel
          contour detection below to auto-slice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {slices.map((slice, index) => {
        const isSelected = slice.id === selectedSliceId;
        return (
          <div
            key={slice.id}
            onClick={() => {
              console.log(`[CutsRegistry] Selecting slice #${index + 1}: ${slice.id}`);
              handleSelectSlice(slice);
            }}
            className={`p-2.5 rounded-xl text-[11px] font-mono border cursor-pointer transition-all flex items-center justify-between group ${
              isSelected
                ? "bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow shadow-emerald-900/20"
                : "bg-black/20 border-white/5 hover:bg-white/3 hover:border-white/10 text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`font-bold ${isSelected ? "text-emerald-300" : "text-neutral-400"}`}>
                #{index + 1}
              </span>
              <span className="text-[9px] opacity-60">
                {parseFloat((100 - slice.cropLeft - slice.cropRight).toFixed(1))}%w
                &nbsp;×&nbsp;
                {parseFloat((100 - slice.cropTop - slice.cropBottom).toFixed(1))}%h
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] text-neutral-700 font-mono mr-1">
                Y:{Math.round(slice.cropTop)}-{Math.round(100 - slice.cropBottom)}%
              </span>
              <button
                type="button"
                onClick={(e) => {
                  console.log(`[CutsRegistry] Executing crop for slice: ${slice.id}`);
                  handleCropSingleSlice(slice, e);
                }}
                disabled={isCroppingSlice === slice.id || isSavingEdit}
                className="text-purple-500 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait p-1 rounded-lg hover:bg-purple-900/30 transition-all cursor-pointer"
                title="Execute this crop immediately"
              >
                {isCroppingSlice === slice.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <CropIcon className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  console.log(`[CutsRegistry] Deleting slice: ${slice.id}`);
                  handleDeleteSlice(slice.id, e);
                }}
                className="text-neutral-700 hover:text-red-400 p-1 rounded-lg hover:bg-red-950/40 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title="Delete individual crop tool"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
