import React, { useState, useRef } from "react";
import { Paintbrush, Layers } from "lucide-react";

interface Props {
  firstImageUrl: string | null;
  eraseMethod: string;
}

export function BubbleCleanerSplitSlider({ firstImageUrl, eraseMethod }: Props) {
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSplitMove = (clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    setSliderPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  return (
    <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-[9px] font-mono">
        <span className="text-neutral-500 font-bold uppercase">Split-Compare Slider</span>
        <span className="text-purple-400 font-bold">TELEA Inpaint vs Text</span>
      </div>
      <div ref={splitContainerRef} onMouseMove={(e) => { if (e.buttons === 1) handleSplitMove(e.clientX); }} onTouchMove={(e) => { if (e.touches[0]) handleSplitMove(e.touches[0].clientX); }}
        className="relative w-full max-w-[240px] aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 select-none cursor-ew-resize shadow-lg">
        {/* Cleaned side */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none", backgroundColor: "#171717", filter: eraseMethod === "blur" ? "contrast(1.05)" : "none" }}>
          {!firstImageUrl && <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-indigo-950/20 text-center opacity-40"><div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center"><Paintbrush className="h-6 w-6 text-indigo-400" /></div><span className="text-[8px] font-mono mt-2 text-neutral-300">CLEANED ILLUST</span></div>}
          <div className="absolute top-[38%] left-[20%] w-[100px] h-[50px] bg-[#2e1065]/10 rounded-full" />
        </div>
        {/* Original side */}
        <div className="absolute inset-y-0 right-0 overflow-hidden transition-all duration-75 border-l border-purple-500/30 shadow-[-4px_0_12px_rgba(0,0,0,0.4)]"
          style={{ left: `${sliderPosition}%`, backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none", backgroundSize: "240px 320px", backgroundPosition: `${-sliderPosition}% center`, backgroundColor: "#202020" }}>
          {!firstImageUrl && <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-900 text-center select-none"><div className="w-14 h-14 rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center"><Layers className="h-6 w-6 text-neutral-500" /></div><span className="text-[8px] font-mono mt-2 text-neutral-500">ORIGINAL TEXT</span></div>}
          <div className="absolute top-[38%] left-[20%] w-[100px] h-[50px] bg-white border border-black rounded-full flex items-center justify-center shadow-md select-none"><span className="text-[8px] font-mono text-black font-bold tracking-tight">WAIT, WHAT?!</span></div>
        </div>
        {/* Slider thumb */}
        <div className="absolute inset-y-0 w-[2px] bg-purple-400/60 pointer-events-none" style={{ left: `${sliderPosition}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-neutral-900 text-purple-300 flex items-center justify-center border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.4)] font-mono text-[9px] font-bold">↔</div>
        </div>
      </div>
      <p className="text-[8px] text-neutral-600 font-sans text-center">Drag the divider bar to verify the inpainting restoration.</p>
    </div>
  );
}
