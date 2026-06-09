import React from "react";
import SectionTitle from "../crop/SectionTitle";
import { LEGEND } from "./bubbleCleanerConfig";

interface BubbleCleanerRightColumnProps {
  sensitivity: number;
  setSensitivity: (v: number) => void;
  detectionStyle: string;
  eraseMethod: string;
}

export default function BubbleCleanerRightColumn({
  sensitivity,
  setSensitivity,
  detectionStyle,
  eraseMethod,
}: BubbleCleanerRightColumnProps) {
  return (
    <div className="lg:col-span-5 space-y-6">
      {/* SECTION 3: SENSITIVITY */}
      <div className="space-y-3">
        <SectionTitle>Detection Sensitivity</SectionTitle>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-300 font-sans">
                Threshold aggressiveness
              </p>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                Controls the OpenCV brightness threshold.
              </p>
            </div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {sensitivity}
              <span className="text-sm text-neutral-400 ml-0.5">%</span>
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-purple-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
            <span>← Conservative</span>
            <span>Aggressive →</span>
          </div>
          <p className="text-[10px] text-neutral-500 font-sans border-t border-neutral-800 pt-3">
            Lower values avoid erasing light-colored art. Higher values catch
            more pale or off-white bubbles that sit close to the panel
            background.
          </p>
        </div>
      </div>

      {/* SECTION 4: LEGEND */}
      <div className="space-y-3">
        <SectionTitle>Bubble Type Legend</SectionTitle>
        <div className="flex flex-col gap-2">
          {LEGEND.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 bg-neutral-950/50 border border-neutral-800/60 rounded-xl px-4 py-3"
            >
              <div
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`}
              />
              <div>
                <p className="text-[11px] font-bold text-neutral-200 font-mono">
                  {item.label}
                </p>
                <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Config Badge */}
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl px-4 py-3 space-y-1.5">
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
          Active Config
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] px-2 py-1 rounded-lg bg-purple-950/60 text-purple-300 border border-purple-800/50 font-mono font-bold">
            {detectionStyle}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 font-mono font-bold">
            {eraseMethod}
          </span>
          <span className="text-[10px] px-2 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 font-mono font-bold">
            {sensitivity}% sensitivity
          </span>
        </div>
      </div>
    </div>
  );
}
