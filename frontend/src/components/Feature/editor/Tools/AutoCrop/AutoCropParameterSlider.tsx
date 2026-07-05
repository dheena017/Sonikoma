import React from "react";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  hint: string;
  unit?: string;
}

export function AutoCropParameterSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  unit = "",
}: Props) {
  const sliderClass =
    "w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-indigo-500";
  const cardClass =
    "space-y-1.5 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl";
  const labelClass = "flex justify-between items-center text-[10px] font-mono";

  return (
    <div className={cardClass}>
      <div className={labelClass}>
        <span className="text-neutral-500 uppercase tracking-wider font-bold">
          {label}
        </span>
        <span className="text-indigo-400 font-bold">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={sliderClass}
      />
      <p className="text-[8px] text-neutral-600 leading-normal">{hint}</p>
    </div>
  );
}
