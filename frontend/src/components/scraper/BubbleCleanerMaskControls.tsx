import React from "react";

interface Props {
  bubbleDilation: number;
  setBubbleDilation: (v: number) => void;
  bubbleInpaintRadius: number;
  setBubbleInpaintRadius: (v: number) => void;
}

export function BubbleCleanerMaskControls({ bubbleDilation, setBubbleDilation, bubbleInpaintRadius, setBubbleInpaintRadius }: Props) {
  const getDilationSuggestion = () => bubbleDilation !== -1 ? `${bubbleDilation}px (Custom override)` : "Auto-Dilation (Recommended: 4px to 6px based on image resolution)";

  const card = "space-y-1.5 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl";
  const row = "flex justify-between items-center text-[10px] font-mono";
  const slider = "w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500";

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className={card}>
        <div className={row}>
          <span className="text-neutral-500 uppercase tracking-wider font-bold">Mask Dilation (Stroke Expansion)</span>
          <span className="text-purple-400 font-bold">{bubbleDilation === -1 ? "Auto (-1)" : `${bubbleDilation}px`}</span>
        </div>
        <input type="range" min="-1" max="15" value={bubbleDilation} onChange={(e) => setBubbleDilation(Number(e.target.value))} className={slider} />
        <p className="text-[8px] text-neutral-600 leading-normal">Expands the detection mask to wrap thick black outlines of bubbles, avoiding ghost rings.</p>
        <div className="text-[8px] font-mono text-neutral-500 italic mt-1">Suggested offset: {getDilationSuggestion()}</div>
      </div>

      <div className={card}>
        <div className={row}>
          <span className="text-neutral-500 uppercase tracking-wider font-bold">Inpaint radius (TELEA blending)</span>
          <span className="text-purple-400 font-bold">{bubbleInpaintRadius}px</span>
        </div>
        <input type="range" min="1" max="10" value={bubbleInpaintRadius} onChange={(e) => setBubbleInpaintRadius(Number(e.target.value))} className={slider} />
        <p className="text-[8px] text-neutral-600 leading-normal">Size of the pixel neighborhood used to reconstruct color gradients inside the erased spaces.</p>
      </div>
    </div>
  );
}
