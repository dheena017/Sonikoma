import React from "react";
import { ChevronDown } from "lucide-react";
import { DETECTION_OPTIONS, ERASE_OPTIONS } from "../auto";

interface CleanBubblesModesProps {
  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (style: "all" | "white_only" | "text_only") => void;
  eraseMethod:
    | "auto"
    | "inpaint"
    | "inpaint_ns"
    | "blur"
    | "solid_white"
    | "solid_black"
    | "solid_color"
    | "transparent"
    | "ocr";
  setEraseMethod: (
    method:
      | "auto"
      | "inpaint"
      | "inpaint_ns"
      | "blur"
      | "solid_white"
      | "solid_black"
      | "solid_color"
      | "transparent"
      | "ocr"
  ) => void;
  setActivePreset: (preset: string) => void;
  fillColor: string;
  setFillColor: (color: string) => void;
  sensitivity: number;
  setSensitivity: (val: number) => void;
  sensitivityPct: number;
}

export default function CleanBubblesModes({
  detectionStyle,
  setDetectionStyle,
  eraseMethod,
  setEraseMethod,
  setActivePreset,
  fillColor,
  setFillColor,
  sensitivity,
  setSensitivity,
  sensitivityPct,
}: CleanBubblesModesProps) {
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        {/* Detection Style Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
            Detection Mode
          </label>
          <div className="relative">
            <select
              value={detectionStyle}
              onChange={(e) => {
                setDetectionStyle(e.target.value as any);
                setActivePreset("Custom");
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-600 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              {DETECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>

        {/* Erase Method Selector */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-neutral-400 uppercase font-mono block tracking-wider">
            Erase Strategy
          </label>
          <div className="relative">
            <select
              value={eraseMethod}
              onChange={(e) => {
                setEraseMethod(e.target.value as any);
                setActivePreset("Custom");
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] font-mono focus:border-purple-600 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              {ERASE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Custom Solid Color Fill picker */}
      {eraseMethod === "solid_color" && (
        <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl animate-fadeIn">
          <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider">
            Fill Color
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-16 bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-center rounded py-0.5"
            />
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-5 h-5 bg-transparent border-0 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Sensitivity slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold text-neutral-400 uppercase font-mono tracking-wider">
            Detection Sensitivity
          </span>
          <span className="text-[10px] font-mono font-bold text-purple-400">
            {sensitivity}%
          </span>
        </div>
        <div className="relative h-1.5 rounded-full bg-neutral-900 border border-white/5 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{
              width: `${sensitivityPct}%`,
              background: "linear-gradient(to right, #7c3aed, #c084fc)",
            }}
          />
          <input
            type="range"
            min="10"
            max="90"
            value={sensitivity}
            onChange={(e) => {
              setSensitivity(Number(e.target.value));
              setActivePreset("Custom");
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
      </div>
    </div>
  );
}
