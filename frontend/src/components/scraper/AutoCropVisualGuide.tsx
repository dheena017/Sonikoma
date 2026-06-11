import React, { useState, useEffect } from "react";
import { Info, LayoutGrid, AlertCircle } from "lucide-react";

interface Props {
  firstImageUrl: string | null;
  cropPaddingPx: number;
  aspectRatioLock: string;
  cropBackgroundMode: string;
  autoSplit: boolean;
  overlapMerge: number;
}

export function AutoCropVisualGuide({ firstImageUrl, cropPaddingPx, aspectRatioLock, cropBackgroundMode, autoSplit, overlapMerge }: Props) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!firstImageUrl) { setImageSize(null); return; }
    const img = new Image();
    img.onload = () => setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = firstImageUrl;
  }, [firstImageUrl]);

  const getRecommendation = () => {
    if (!imageSize) return { label: "No image selected", desc: "Select panels in the deck to auto-detect sizes.", style: "Free Ratio or Auto", warning: null };
    const ratio = imageSize.height / imageSize.width;
    if (ratio > 2.5) {
      return {
        label: `Tall Webtoon Strip detected (${imageSize.width}x${imageSize.height}px)`,
        desc: `High aspect ratio (${ratio.toFixed(1)}:1).`,
        style: "Free Lock, Auto-Split strips ON",
        warning: !autoSplit ? "Warning: Auto-Split is OFF. Tall strips might be too long for single frames." : null
      };
    }
    if (ratio < 0.8) return { label: `Landscape Scene detected (${imageSize.width}x${imageSize.height}px)`, desc: `Wide strip layout (${(1/ratio).toFixed(1)}:1).`, style: "16:9 Aspect Ratio Lock, Auto-Split OFF", warning: null };
    return { label: `Standard Comic Page detected (${imageSize.width}x${imageSize.height}px)`, desc: "Standard manga page box.", style: "Free or 3:4 Aspect Ratio Lock", warning: null };
  };
  const rec = getRecommendation();

  // Simulated Split Seams
  const splitSeams = autoSplit ? [30, 65] : [];

  return (
    <div className="lg:col-span-5 space-y-4">
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4.5 space-y-2 font-mono">
        <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
          <Info className="h-3.5 w-3.5" />
          <span>RATIO ESTIMATOR & INFO</span>
        </div>
        <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">{rec.label}</h4>
        <p className="text-[9px] text-neutral-500 leading-normal font-sans">{rec.desc}</p>
        <div className="text-[9px] bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-emerald-400 font-semibold mt-1">{rec.style}</div>
        {rec.warning && (
          <div className="flex items-center gap-2 text-[8px] text-amber-400 bg-amber-950/20 border border-amber-900/40 p-2 rounded-lg mt-2 animate-pulse">
            <AlertCircle className="h-3 w-3" />
            <span>{rec.warning}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center p-4 bg-neutral-950/30 border border-neutral-800 rounded-2xl min-h-[180px]">
        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono mb-2.5">Visual Lock Guide</span>
        <div className="relative border border-neutral-700/60 rounded-lg overflow-hidden transition-all duration-300 w-full max-w-[150px] aspect-[3/4] bg-cover bg-center"
          style={{ backgroundColor: cropBackgroundMode === "white" ? "#ffffff" : cropBackgroundMode === "black" ? "#0a0a0a" : "#171717", backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none" }}>

          {/* Simulated Split Lines */}
          {splitSeams.map(pos => (
            <div key={pos} className="absolute w-full h-[1px] bg-indigo-500/50 border-b border-dashed border-indigo-400/80 z-10" style={{ top: `${pos}%` }}>
               <span className="absolute right-0 -top-2 text-[6px] text-indigo-300 bg-black/50 px-1">SPLIT</span>
            </div>
          ))}

          {!firstImageUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center select-none opacity-40">
              <div className="h-10 w-10 rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center"><LayoutGrid className="h-4 w-4 text-neutral-500" /></div>
              <span className="text-[7px] text-neutral-400 font-mono">NO IMAGE DECK</span>
            </div>
          )}

          <div className="absolute border-2 border-dashed border-emerald-500/80 transition-all duration-200"
            style={{
              top: `${cropPaddingPx / 2.5}%`,
              bottom: `${cropPaddingPx / 2.5}%`,
              left: `${cropPaddingPx / 2.5}%`,
              right: `${cropPaddingPx / 2.5}%`,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, ${0.4 + (overlapMerge/200)})`,
              aspectRatio: aspectRatioLock === "1:1" ? "1/1" : aspectRatioLock === "16:9" ? "16/9" : aspectRatioLock === "9:16" ? "9/16" : aspectRatioLock === "4:3" ? "4/3" : aspectRatioLock === "3:4" ? "3/4" : "auto",
              position: "absolute", margin: "auto", inset: `${cropPaddingPx / 2.5}%`
            }} />
        </div>
        <div className="flex flex-col items-center mt-2 space-y-1">
          <span className="text-[8px] text-neutral-600 font-mono text-center">Dashed guide box scales with selected locks & spacing.</span>
          {autoSplit && <span className="text-[7px] text-indigo-400 font-bold uppercase tracking-tighter">Auto-Split seams active (Indigo)</span>}
        </div>
      </div>
    </div>
  );
}
