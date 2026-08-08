import React from "react";

const NARRATION_STYLES = [
  { id: "long", label: "Detailed Recap (YouTube Long-form)" },
  { id: "short", label: "Dialogue Focused (Shorts/TikTok)" },
];

const LAYOUT_MODES = [
  { id: "separate", label: "Separate Panels (Fast)" },
  { id: "stitched", label: "Stitched Strip (Slow)" },
];

export interface AdvancedPipelineConstraintsProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  aiModels: any[];
  narrationStyle?: string;
  setNarrationStyle?: (style: string) => void;
  smartSlice?: boolean;
  setSmartSlice?: (v: boolean) => void;
}

export const AdvancedPipelineConstraints: React.FC<AdvancedPipelineConstraintsProps> = ({
  selectedModel,
  setSelectedModel,
  aiModels,
  narrationStyle = "long",
  setNarrationStyle,
  smartSlice = true,
  setSmartSlice,
}) => {
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = React.useState(false);

  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
        className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors pl-1 cursor-pointer"
      >
        <span
          className={`transition-transform duration-300 ${
            advancedSettingsOpen ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
        Global Pipeline Constraints
      </button>

      {advancedSettingsOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-800/50 animate-in fade-in slide-in-from-top-2">
          {/* Engine Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Voice Engine
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Narration Strategy */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Narration Style
            </label>
            <select
              value={narrationStyle}
              onChange={(e) => setNarrationStyle?.(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {NARRATION_STYLES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Layout Mode
            </label>
            <select
              value={smartSlice ? "separate" : "stitched"}
              onChange={(e) => setSmartSlice?.(e.target.value === "separate")}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {LAYOUT_MODES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
