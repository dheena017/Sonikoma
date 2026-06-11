/**
 * AutoCropLayoutTab — Aspect ratio lock, background gutter mode, padding slider,
 * and ratio estimator with live visual lock guide.
 */
import React, { useState, useEffect } from "react";
import { Maximize2, Layers, Settings, Info, LayoutGrid } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { BG_MODE_OPTIONS, ASPECT_RATIO_OPTIONS } from "./autoCropConfig";
import { AutoCropSharedProps } from "./tabTypes";

interface AutoCropLayoutTabProps
  extends Pick<
    AutoCropSharedProps,
    | "cropPaddingPx"
    | "setCropPaddingPx"
    | "cropBackgroundMode"
    | "setCropBackgroundMode"
    | "aspectRatioLock"
    | "setAspectRatioLock"
    | "scrapedImages"
    | "selectedScraped"
  > {}

export function AutoCropLayoutTab({
  cropPaddingPx,
  setCropPaddingPx,
  cropBackgroundMode,
  setCropBackgroundMode,
  aspectRatioLock,
  setAspectRatioLock,
  scrapedImages,
  selectedScraped,
}: AutoCropLayoutTabProps) {
  const firstImageUrl =
    selectedScraped.length > 0 ? selectedScraped[0] : scrapedImages.length > 0 ? scrapedImages[0] : null;
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!firstImageUrl) { setImageSize(null); return; }
    const img = new Image();
    img.onload = () => setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = firstImageUrl;
  }, [firstImageUrl]);

  const getRecommendation = () => {
    if (!imageSize) return { label: "No image selected", desc: "Select panels in the deck to auto-detect sizes.", style: "Free Ratio or Auto" };
    const ratio = imageSize.height / imageSize.width;
    if (ratio > 2.5) return { label: `Tall Webtoon Strip detected (${imageSize.width}x${imageSize.height}px)`, desc: `High aspect ratio (${ratio.toFixed(1)}:1). Recommended parameters:`, style: "Free Lock, Auto-Split strips ON, 1.5% Min Panel Area" };
    if (ratio < 0.8) return { label: `Landscape Scene detected (${imageSize.width}x${imageSize.height}px)`, desc: `Wide strip layout (${(1/ratio).toFixed(1)}:1). Recommended parameters:`, style: "16:9 Aspect Ratio Lock, Auto-Split OFF, 10px Padding" };
    return { label: `Standard Comic Page detected (${imageSize.width}x${imageSize.height}px)`, desc: "Standard manga page box. Recommended parameters:", style: "Free or 3:4 Aspect Ratio Lock, Auto-Split OFF, White BG Mode" };
  };
  const rec = getRecommendation();

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Aspect Ratio Lock */}
          <div className="space-y-3">
            <SectionTitle icon={<Maximize2 className="h-3 w-3" />}>Aspect Ratio Lock</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setAspectRatioLock(opt.value)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-3.5 rounded-xl border text-center transition-all cursor-pointer ${aspectRatioLock === opt.value ? "bg-violet-900/30 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
                  <span className={`text-[12px] font-bold font-mono ${aspectRatioLock === opt.value ? "text-violet-300" : "text-neutral-300"}`}>{opt.label}</span>
                  <span className="text-[8px] text-neutral-600 font-sans leading-tight">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Gutter Mode */}
          <div className="space-y-3">
            <SectionTitle icon={<Layers className="h-3 w-3" />}>Background Gutter Mode</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {BG_MODE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setCropBackgroundMode(opt.value)}
                  className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-all cursor-pointer ${cropBackgroundMode === opt.value ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
                  <div className={`h-3 w-3 rounded-full border ${opt.value === "white" ? "bg-white border-neutral-400" : opt.value === "black" ? "bg-black border-neutral-600" : "bg-indigo-500 border-indigo-400"}`} />
                  <span className={`text-[10px] font-bold font-mono ${cropBackgroundMode === opt.value ? "text-white" : "text-neutral-400"}`}>{opt.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Padding slider */}
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
        </div>

        {/* Right info column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Ratio estimator */}
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4.5 space-y-2 font-mono">
            <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
              <Info className="h-3.5 w-3.5" />
              <span>RATIO ESTIMATOR & INFO</span>
            </div>
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider mt-1">{rec.label}</h4>
            <p className="text-[9px] text-neutral-500 leading-normal font-sans">{rec.desc}</p>
            <div className="text-[9px] bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-lg text-emerald-400 font-semibold mt-1">{rec.style}</div>
          </div>

          {/* Visual lock guide */}
          <div className="flex flex-col items-center justify-center p-4 bg-neutral-950/30 border border-neutral-800 rounded-2xl min-h-[180px]">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono mb-2.5">Visual Lock Guide</span>
            <div className="relative border border-neutral-700/60 rounded-lg overflow-hidden transition-all duration-300 w-full max-w-[150px] aspect-[3/4] bg-cover bg-center"
              style={{ backgroundColor: cropBackgroundMode === "white" ? "#ffffff" : cropBackgroundMode === "black" ? "#0a0a0a" : "#171717", backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none" }}>
              {!firstImageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center select-none opacity-40">
                  <div className="h-10 w-10 rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center"><LayoutGrid className="h-4 w-4 text-neutral-500" /></div>
                  <span className="text-[7px] text-neutral-400 font-mono">NO IMAGE DECK</span>
                </div>
              )}
              <div className="absolute border-2 border-dashed border-emerald-500/80 transition-all duration-200"
                style={{ top: `${cropPaddingPx / 2.5}px`, bottom: `${cropPaddingPx / 2.5}px`, left: `${cropPaddingPx / 2.5}px`, right: `${cropPaddingPx / 2.5}px`,
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.6)",
                  aspectRatio: aspectRatioLock === "1:1" ? "1/1" : aspectRatioLock === "16:9" ? "16/9" : aspectRatioLock === "9:16" ? "9/16" : aspectRatioLock === "4:3" ? "4/3" : aspectRatioLock === "3:4" ? "3/4" : "auto",
                  position: "absolute", margin: "auto", inset: `${cropPaddingPx / 2.5}px` }} />
            </div>
            <span className="text-[8px] text-neutral-600 font-mono mt-2 text-center">Dashed guide box scales with selected locks & spacing.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
