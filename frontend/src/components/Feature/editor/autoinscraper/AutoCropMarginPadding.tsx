import React, { useState, useEffect } from "react";
import { Settings, Zap } from "lucide-react";
import { SectionTitle } from "../crop";

interface Props {
  cropPaddingPx: number;
  setCropPaddingPx: (v: number) => void;
  firstImageUrl: string | null;
}

export function AutoCropMarginPadding({
  cropPaddingPx,
  setCropPaddingPx,
  firstImageUrl,
}: Props) {
  const [smartPadding, setSmartPadding] = useState(false);

  useEffect(() => {
    if (smartPadding && firstImageUrl) {
      const img = new Image();
      img.onload = () => {
        // Heuristic: 10px per 1000px height, min 5, max 30
        const autoPad = Math.min(30, Math.max(5, Math.round(img.height / 100)));
        setCropPaddingPx(autoPad);
      };
      img.src = firstImageUrl;
    }
  }, [smartPadding, firstImageUrl, setCropPaddingPx]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Settings className="h-3 w-3" />}>
          Crop Margin Padding
        </SectionTitle>
        <button
          onClick={() => setSmartPadding(!smartPadding)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[8px] font-bold transition-all ${
            smartPadding
              ? "bg-violet-500/20 border-violet-500 text-violet-300"
              : "bg-neutral-900 border-neutral-800 text-neutral-500"
          }`}
        >
          <Zap
            className={`h-2.5 w-2.5 ${smartPadding ? "fill-current" : ""}`}
          />
          SMART PADDING
        </button>
      </div>
      <div className="bg-neutral-950/40 border border-neutral-800 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-neutral-500">Margin Padding</span>
          <span className="text-violet-400 font-bold">{cropPaddingPx}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="40"
          value={cropPaddingPx}
          onChange={(e) => {
            setCropPaddingPx(Number(e.target.value));
            setSmartPadding(false);
          }}
          className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-violet-500"
        />
        <p className="text-[8px] text-neutral-600 font-sans">
          Inserts additional gutter space around detected boundaries. Smart
          padding scales based on image resolution.
        </p>
      </div>
    </div>
  );
}
