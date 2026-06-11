import React from "react";

interface Props {
  sensitivity: number;
  setSensitivity: (v: number) => void;
}

export function BubbleCleanerSensitivityControl({ sensitivity, setSensitivity }: Props) {
  const card = "space-y-1.5 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl";
  const row = "flex justify-between items-center text-[10px] font-mono";
  const slider = "w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500";

  return (
    <div className={card}>
      <div className={row}>
        <span className="text-neutral-500 uppercase tracking-wider font-bold">Detection Sensitivity</span>
        <span className="text-purple-400 font-bold">{sensitivity}%</span>
      </div>
      <input type="range" min="10" max="90" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className={slider} />
      <p className="text-[8px] text-neutral-600 leading-normal">OpenCV adaptive contrast limit. Higher values sweep light colored bubble boundaries aggressively.</p>
      <div className="mt-2 text-[8px] font-mono text-emerald-500 bg-emerald-950/15 border border-emerald-950/30 px-2 py-1 rounded-lg">
        💡 Target Recommendation: {sensitivity > 55 ? "Light/Day pages" : "Dark/Night panel mode (Thresh optimized)"}
      </div>
    </div>
  );
}
