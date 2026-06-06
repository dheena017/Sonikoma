import React from "react";
import {
  Layers,
  Plus,
  Sliders,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Crop,
  Trash2,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { Slice } from "./types";

interface CutsRegistryProps {
  slices: Slice[];
  setSlices: React.Dispatch<React.SetStateAction<Slice[]>>;
  selectedSliceId: string | null;
  setSelectedSliceId: (id: string | null) => void;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  editAutoTrim: boolean;
  handlePushToSlices: () => void;
  autoPushOnDraw: boolean;
  setAutoPushOnDraw: (v: boolean) => void;
  handleClearAllSlices: () => void;
  handleNudge: (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => void;
  handleSelectSlice: (slice: Slice) => void;
  handleDeleteSlice: (id: string, e: React.MouseEvent) => void;
  handleCropSingleSlice: (slice: Slice, e: React.MouseEvent) => Promise<void>;
  isCroppingSlice: string | null;
  isSavingEdit: boolean;
}

interface NudgeControlProps {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementIcon: React.ReactNode;
  incrementIcon: React.ReactNode;
  decrementTitle: string;
  incrementTitle: string;
}

function NudgeControl({
  label,
  value,
  onDecrement,
  onIncrement,
  decrementIcon,
  incrementIcon,
  decrementTitle,
  incrementTitle,
}: NudgeControlProps) {
  return (
    <div className="flex flex-col space-y-1.5 bg-black/30 border border-white/5 p-2 rounded-xl">
      <span className="text-neutral-600 text-[9px] font-sans font-semibold uppercase tracking-widest">{label}</span>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onDecrement}
          className="p-1 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800/80 rounded-lg transition-all cursor-pointer border border-white/5 hover:border-white/10"
          title={decrementTitle}
        >
          {decrementIcon}
        </button>
        <span className="text-neutral-200 font-bold font-mono text-xs">{value}%</span>
        <button
          type="button"
          onClick={onIncrement}
          className="p-1 text-neutral-500 hover:text-white bg-black/40 hover:bg-neutral-800/80 rounded-lg transition-all cursor-pointer border border-white/5 hover:border-white/10"
          title={incrementTitle}
        >
          {incrementIcon}
        </button>
      </div>
    </div>
  );
}

export default function CutsRegistry({
  slices,
  setSlices,
  selectedSliceId,
  setSelectedSliceId,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  editAutoTrim,
  handlePushToSlices,
  autoPushOnDraw,
  setAutoPushOnDraw,
  handleClearAllSlices,
  handleNudge,
  handleSelectSlice,
  handleDeleteSlice,
  handleCropSingleSlice,
  isCroppingSlice,
  isSavingEdit,
}: CutsRegistryProps) {
  const hasSelection =
    editCropTop !== 0 ||
    editCropBottom !== 0 ||
    editCropLeft !== 0 ||
    editCropRight !== 0;

  return (
    <div className="space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
            <LayoutGrid className="h-3 w-3 text-purple-400" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
              Target Crop Tools Registry
            </span>
            <p className="text-[9px] text-neutral-600 font-mono mt-0.5">{slices.length} Crop Tools Defined</p>
          </div>
        </div>
        {slices.length > 0 && (
          <button
            type="button"
            onClick={handleClearAllSlices}
            className="flex items-center gap-1 text-[9px] bg-red-950/60 hover:bg-red-900/80 text-red-400 border border-red-800/40 hover:border-red-700/60 px-2 py-1 rounded-lg cursor-pointer transition-all"
            title="Clear all defined crop tools from list"
          >
            <Trash2 className="h-2.5 w-2.5" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Save selection controls */}
      <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-3">
        <button
          type="button"
          onClick={handlePushToSlices}
          disabled={!hasSelection}
          className="w-full bg-purple-600/80 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30"
          style={{ boxShadow: !hasSelection ? undefined : "0 0 15px rgba(139,92,246,0.2)" }}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Save Selection as Crop Tool</span>
        </button>

        <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors">
          <span className="flex-1">Auto-save drawn boxes on drop</span>
          <div className={`relative w-8 h-4 rounded-full border flex-shrink-0 transition-all ${autoPushOnDraw ? "bg-purple-600 border-purple-500" : "bg-neutral-800 border-neutral-700"}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${autoPushOnDraw ? "left-4.5" : "left-0.5"}`} />
            <input
              type="checkbox"
              checked={autoPushOnDraw}
              onChange={(e) => setAutoPushOnDraw(e.target.checked)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </label>
      </div>

      {/* Fine-tune selected crop */}
      {hasSelection && (
        <div className="bg-black/30 border border-purple-500/15 p-3 rounded-xl space-y-3">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-3 w-3 text-purple-400" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
              {selectedSliceId ? "Fine-Tune Selected Crop Tool" : "Fine-Tune Selection"}
            </span>
          </div>

          {/* Nudge grid */}
          <div className="grid grid-cols-2 gap-1.5">
            <NudgeControl
              label="Crop Top"
              value={editCropTop}
              onDecrement={() => handleNudge("top", -1)}
              onIncrement={() => handleNudge("top", 1)}
              decrementIcon={<ChevronDown className="h-3 w-3" />}
              incrementIcon={<ChevronUp className="h-3 w-3" />}
              decrementTitle="Decrease top (-1%)"
              incrementTitle="Increase top (+1%)"
            />
            <NudgeControl
              label="Crop Bottom"
              value={editCropBottom}
              onDecrement={() => handleNudge("bottom", -1)}
              onIncrement={() => handleNudge("bottom", 1)}
              decrementIcon={<ChevronUp className="h-3 w-3" />}
              incrementIcon={<ChevronDown className="h-3 w-3" />}
              decrementTitle="Decrease bottom (-1%)"
              incrementTitle="Increase bottom (+1%)"
            />
            <NudgeControl
              label="Crop Left"
              value={editCropLeft}
              onDecrement={() => handleNudge("left", -1)}
              onIncrement={() => handleNudge("left", 1)}
              decrementIcon={<ChevronRight className="h-3 w-3" />}
              incrementIcon={<ChevronLeft className="h-3 w-3" />}
              decrementTitle="Decrease left (-1%)"
              incrementTitle="Increase left (+1%)"
            />
            <NudgeControl
              label="Crop Right"
              value={editCropRight}
              onDecrement={() => handleNudge("right", -1)}
              onIncrement={() => handleNudge("right", 1)}
              decrementIcon={<ChevronLeft className="h-3 w-3" />}
              incrementIcon={<ChevronRight className="h-3 w-3" />}
              decrementTitle="Decrease right (-1%)"
              incrementTitle="Increase right (+1%)"
            />
          </div>

          {/* Slider fine-controls */}
          <div className="space-y-2 pt-1">
            {[
              { label: "Top Edge", value: editCropTop, setter: setEditCropTop },
              { label: "Bottom Edge", value: editCropBottom, setter: setEditCropBottom },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <div className="flex justify-between items-center text-[9px] font-mono text-neutral-600 mb-1">
                  <span>{label}</span>
                  <span className="text-purple-400 font-bold">{value}%</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${(value / 80) * 100}%`,
                      background: "linear-gradient(to right, #6d28d9, #a78bfa)",
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="0.5"
                    value={value}
                    onChange={(e) => setter(parseFloat(Number(e.target.value).toFixed(1)))}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slices list */}
      {slices.length === 0 ? (
        <div className="border border-white/5 border-dashed rounded-2xl p-6 text-center">
          <Layers className="h-5 w-5 text-neutral-700 mx-auto mb-2" />
          <p className="text-[11px] font-bold text-neutral-500">Crop tools list is empty</p>
          <p className="text-[10px] text-neutral-600 leading-normal mt-1">
            Draw on the image canvas and push to crop tools list, or use Auto Panel
            contour detection below to auto-slice.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {slices.map((slice, index) => {
            const isSelected = slice.id === selectedSliceId;
            return (
              <div
                key={slice.id}
                onClick={() => handleSelectSlice(slice)}
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
                    onClick={(e) => handleCropSingleSlice(slice, e)}
                    disabled={isCroppingSlice === slice.id || isSavingEdit}
                    className="text-purple-500 hover:text-purple-300 disabled:opacity-50 disabled:cursor-wait p-1 rounded-lg hover:bg-purple-900/30 transition-all cursor-pointer"
                    title="Execute this crop immediately"
                  >
                    {isCroppingSlice === slice.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Crop className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSlice(slice.id, e)}
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
      )}
    </div>
  );
}
