import React from "react";
import { Filter } from "lucide-react";
import SectionTitle from "../../../shared/SectionTitle";

interface Props {
  cropCannyLow: number;
  setCropCannyLow: (v: number) => void;
  cropCannyHigh: number;
  setCropCannyHigh: (v: number) => void;
  cropCloseKernelSize: number;
  setCropCloseKernelSize: (v: number) => void;
}

export function AutoCropCannyControls({
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
}: Props) {
  return (
    <div className="p-4.5 bg-neutral-950/40 border border-neutral-800 rounded-2xl space-y-4">
      <SectionTitle icon={<Filter className="h-3 w-3" />}>
        Canny Boundary Finders
      </SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-neutral-500">Canny Low Edge</span>
            <span className="text-emerald-400 font-bold">{cropCannyLow}</span>
          </div>
          <input
            type="range"
            min="0"
            max="150"
            value={cropCannyLow}
            onChange={(e) => setCropCannyLow(Number(e.target.value))}
            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[8px] font-mono">
            <span className="text-neutral-500">Canny High Edge</span>
            <span className="text-emerald-400 font-bold">{cropCannyHigh}</span>
          </div>
          <input
            type="range"
            min="50"
            max="255"
            value={cropCannyHigh}
            onChange={(e) => setCropCannyHigh(Number(e.target.value))}
            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>
      <div className="space-y-1 pt-1">
        <div className="flex justify-between text-[8px] font-mono">
          <span className="text-neutral-500">Morph Close Kernel Size</span>
          <span className="text-emerald-400 font-bold">
            {cropCloseKernelSize}px
          </span>
        </div>
        <input
          type="range"
          min="3"
          max="51"
          step="2"
          value={cropCloseKernelSize}
          onChange={(e) => setCropCloseKernelSize(Number(e.target.value))}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <p className="text-[7.5px] text-neutral-600 leading-normal">
          Closes small gaps in black boundaries. Higher sizes group separated
          sketches into unified panels.
        </p>
      </div>
    </div>
  );
}
