import React, { useState, useEffect } from "react";
import { Info, LayoutGrid, AlertCircle, Eye, RefreshCw } from "lucide-react";

interface Props {
  firstImageUrl: string | null;
  cropPaddingPx: number;
  aspectRatioLock: string;
  cropBackgroundMode: string;
  autoSplit: boolean;
  overlapMerge: number;
  sensitivity: number;
  cannyLow: number;
  cannyHigh: number;
  closeKernel: number;
}

export function AutoCropVisualGuide({
  firstImageUrl, cropPaddingPx, aspectRatioLock, cropBackgroundMode, autoSplit, overlapMerge,
  sensitivity, cannyLow, cannyHigh, closeKernel
}: Props) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [detectedPanels, setDetectedPanels] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (!firstImageUrl) { setImageSize(null); setDetectedPanels([]); return; }
    const img = new Image();
    img.onload = () => setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = firstImageUrl;
  }, [firstImageUrl]);

  const runLivePreview = async () => {
    if (!firstImageUrl) return;
    setIsDetecting(true);
    try {
      // 1. Fetch the image and convert to base64
      const resp = await fetch(firstImageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();

      const b64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      // 2. Call the backend detect-b64 endpoint
      const detectResp = await fetch("/api/py/panels/detect-b64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: b64,
          sensitivity,
          background_mode: cropBackgroundMode,
          min_width_pct: 0.15,
          min_height_px: 60,
          merge_threshold: overlapMerge,
          aspect_ratio: aspectRatioLock,
          canny_low: cannyLow,
          canny_high: cannyHigh,
          close_kernel_size: closeKernel
        })
      });

      const data = await detectResp.json();
      if (data.success) {
        setDetectedPanels(data.panels);
      }
    } catch (err) {
      console.error("Live preview failed:", err);
    } finally {
      setIsDetecting(false);
    }
  };

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

  return (
    <div className="lg:col-span-5 space-y-4">
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4.5 space-y-2 font-mono relative overflow-hidden">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold">
             <Info className="h-3.5 w-3.5" />
             <span>RATIO ESTIMATOR & INFO</span>
           </div>
           <button
             onClick={runLivePreview}
             disabled={isDetecting || !firstImageUrl}
             className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-bold uppercase hover:bg-indigo-500/20 transition-all disabled:opacity-30"
           >
             {isDetecting ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
             Run Live Preview
           </button>
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
        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono mb-2.5">Visual Preview Guide</span>
        <div className="relative border border-neutral-700/60 rounded-lg overflow-hidden transition-all duration-300 w-full max-w-[150px] aspect-[3/4] bg-cover bg-center"
          style={{ backgroundColor: cropBackgroundMode === "white" ? "#ffffff" : cropBackgroundMode === "black" ? "#0a0a0a" : "#171717", backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none" }}>

          {/* Real Detected Panels */}
          {detectedPanels.map((p, i) => (
            <div key={i} className="absolute border border-emerald-400 bg-emerald-400/10 z-20 shadow-[0_0_4px_rgba(52,211,153,0.3)]"
              style={{
                top: `${p.top_pct * 100}%`,
                left: `${p.left_pct * 100}%`,
                width: `${(1 - p.left_pct - p.right_pct) * 100}%`,
                height: `${(1 - p.top_pct - p.bottom_pct) * 100}%`
              }}>
              <span className="absolute top-0 left-0 bg-emerald-500 text-black text-[5px] px-0.5 font-bold">{i+1}</span>
            </div>
          ))}

          {!firstImageUrl && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center select-none opacity-40">
              <div className="h-10 w-10 rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center"><LayoutGrid className="h-4 w-4 text-neutral-500" /></div>
              <span className="text-[7px] text-neutral-400 font-mono">NO IMAGE DECK</span>
            </div>
          )}

          <div className="absolute border-2 border-dashed border-white/20 transition-all duration-200 pointer-events-none"
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
          <span className="text-[8px] text-neutral-600 font-mono text-center">
            {detectedPanels.length > 0 ? `Showing ${detectedPanels.length} detected panels.` : "Dashed guide box represents theoretical lock."}
          </span>
          {autoSplit && <span className="text-[7px] text-indigo-400 font-bold uppercase tracking-tighter">Auto-Split seams active</span>}
        </div>
      </div>
    </div>
  );
}
