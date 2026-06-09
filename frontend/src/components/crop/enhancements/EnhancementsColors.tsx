import React from "react";

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
}

export function SliderRow({ label, value, min, max, step = 1, unit = "%", onChange, disabled }: SliderRowProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-neutral-400">{label}</span>
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md"
          style={{ color: disabled ? "#6b7280" : value === (min + max) / 2 || value === 100 ? "#a78bfa" : value > (min + max) / 2 ? "#34d399" : "#f87171", background: "rgba(255,255,255,0.05)" }}
        >
          {value}{unit}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
          style={{
            width: `${pct}%`,
            background: disabled ? "#4b5563" : "linear-gradient(to right, #7c3aed, #a78bfa)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer disabled:cursor-not-allowed h-full"
        />
      </div>
    </div>
  );
}

interface EnhancementsColorsProps {
  activeStoryboardPanel: any;
  handleModifyBrightness: (panelId: number, val: number) => void;
  handleModifyContrast: (panelId: number, val: number) => void;
  handleModifySaturation: (panelId: number, val: number) => void;
}

export function EnhancementsColors({
  activeStoryboardPanel,
  handleModifyBrightness,
  handleModifyContrast,
  handleModifySaturation,
}: EnhancementsColorsProps) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-1.5">
        <div className="h-px flex-1 bg-white/5" />
        <span className="text-[9px] uppercase font-mono font-bold text-neutral-600 tracking-widest px-1">
          Fine-Tuning Colors
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      <SliderRow
        label="Brightness"
        value={activeStoryboardPanel?.brightness ?? 100}
        min={50}
        max={180}
        disabled={!activeStoryboardPanel}
        onChange={(val) =>
          activeStoryboardPanel &&
          handleModifyBrightness(activeStoryboardPanel.id, val)
        }
      />
      <SliderRow
        label="Contrast"
        value={activeStoryboardPanel?.contrast ?? 100}
        min={50}
        max={180}
        disabled={!activeStoryboardPanel}
        onChange={(val) =>
          activeStoryboardPanel &&
          handleModifyContrast(activeStoryboardPanel.id, val)
        }
      />
      <SliderRow
        label="Saturation"
        value={activeStoryboardPanel?.saturation ?? 100}
        min={50}
        max={180}
        disabled={!activeStoryboardPanel}
        onChange={(val) =>
          activeStoryboardPanel &&
          handleModifySaturation(activeStoryboardPanel.id, val)
        }
      />
    </div>
  );
}
