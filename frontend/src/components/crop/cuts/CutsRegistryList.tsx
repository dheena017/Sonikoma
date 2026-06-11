import React from "react";
import { Layers, RefreshCw, Crop as CropIcon, Trash2 } from "lucide-react";
import { Cut } from "../shared/types";

interface CutsRegistryListProps {
  cuts: Cut[];
  selectedCutId: string | null;
  handleSelectCut: (cut: Cut) => void;
  handleCropSingleCut: (cut: Cut, e: React.MouseEvent) => Promise<void>;
  handleDeleteCut: (id: string, e: React.MouseEvent) => void;
  isCroppingCut: string | null;
  isSavingEdit: boolean;
}

export function CutsRegistryList({
  cuts,
  selectedCutId,
  handleSelectCut,
  handleCropSingleCut,
  handleDeleteCut,
  isCroppingCut,
  isSavingEdit,
}: CutsRegistryListProps) {
  if (cuts.length === 0) {
    return (
      <div className="border border-white/5 border-dashed rounded-2xl p-6 text-center">
        <Layers className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
        <p className="text-[11px] font-bold text-neutral-500">Crop tools list is empty</p>
        <p className="text-[10px] text-neutral-600 leading-normal mt-1">
          Draw on the image canvas and push to crop tools list, or use Auto Panel
          contour detection below to auto-cut.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
      {cuts.map((cut, index) => {
        const isSelected = cut.id === selectedCutId;
        return (
          <div
            key={cut.id}
            onClick={() => handleSelectCut(cut)}
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
                {parseFloat((100 - cut.cropLeft - cut.cropRight).toFixed(1))}%w
                &nbsp;×&nbsp;
                {parseFloat((100 - cut.cropTop - cut.cropBottom).toFixed(1))}%h
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[9px] text-neutral-700 font-mono mr-1">
                Y:{Math.round(cut.cropTop)}-{Math.round(100 - cut.cropBottom)}%
              </span>
              <button
                type="button"
                onClick={(e) => handleCropSingleCut(cut, e)}
                disabled={isCroppingCut === cut.id || isSavingEdit}
                className="text-purple-500 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait p-1 rounded-lg hover:bg-purple-900/30 transition-all cursor-pointer"
                title="Execute this crop immediately"
              >
                {isCroppingCut === cut.id ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <CropIcon className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteCut(cut.id, e)}
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
