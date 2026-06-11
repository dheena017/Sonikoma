import React from "react";
import { Sliders, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

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

interface CutsRegistryFineTuneProps {
  selectedCutId: string | null;
  editCropTop: number;
  setEditCropTop: (val: number) => void;
  editCropBottom: number;
  setEditCropBottom: (val: number) => void;
  editCropLeft: number;
  setEditCropLeft: (val: number) => void;
  editCropRight: number;
  setEditCropRight: (val: number) => void;
  handleNudge: (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => void;
}

export function CutsRegistryFineTune({
  selectedCutId,
  editCropTop,
  setEditCropTop,
  editCropBottom,
  setEditCropBottom,
  editCropLeft,
  setEditCropLeft,
  editCropRight,
  setEditCropRight,
  handleNudge,
}: CutsRegistryFineTuneProps) {
  return (
    <div className="bg-black/30 border border-purple-500/15 p-3 rounded-xl space-y-3">
      <div className="flex items-center gap-1.5">
        <Sliders className="h-3 w-3 text-purple-400" />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
          {selectedCutId ? "Fine-Tune Selected Crop Tool" : "Fine-Tune Selection"}
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
  );
}
