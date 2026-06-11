import React from "react";
import { Settings } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";

interface Props {
  cropPaddingPx: number;
  setCropPaddingPx: (v: number) => void;
}

export function AutoCropMarginPadding({ cropPaddingPx, setCropPaddingPx }: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Settings className="h-3 w-3" />}>Crop Margin Padding</SectionTitle>
      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-500">Margin Padding</span>
          <span className="text-violet-400 font-bold">{cropPaddingPx}px</span>
        </div>
        <input type="range" min="0" max="40" value={cropPaddingPx} onChange={(e) => setCropPaddingPx(Number(e.target.value))} className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-violet-500" />
        <p className="text-[8px] text-neutral-600 font-sans">Inserts additional gutter space around detected boundaries, ensuring text dialogue bubbles don't get clipped.</p>
      </div>
    </div>
  );
}
