import React from "react";

interface RangeSliderProps {
  label: string;
  description: string;
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  accentColor?: string; // e.g. "accent-indigo-500" or "accent-purple-500"
  leftLabel?: string;
  rightLabel?: string;
}

export default function RangeSlider({
  label,
  description,
  min,
  max,
  value,
  onChange,
  unit = "%",
  accentColor = "accent-indigo-500",
  leftLabel,
  rightLabel,
}: RangeSliderProps) {
  return (
    <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-neutral-300 font-sans">{label}</p>
          <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
            {description}
          </p>
        </div>
        <span className="text-2xl font-bold text-white font-mono tabular-nums">
          {value}
          <span className="text-sm text-neutral-400 ml-0.5">{unit}</span>
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full ${accentColor} bg-neutral-800 rounded-full h-2 cursor-pointer`}
      />
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
          <span>{leftLabel || ""}</span>
          <span>{rightLabel || ""}</span>
        </div>
      )}
    </div>
  );
}
