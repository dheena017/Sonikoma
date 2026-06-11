import React, { useState } from "react";
import { Sparkles, Brain, ArrowRight, Eye, RefreshCw } from "lucide-react";

export function AutoCropEngineComparison({
  firstImageUrl, sensitivity, bgMode, overlapMerge, aspectRatio,
  cannyLow, cannyHigh, closeKernel
}: {
  firstImageUrl: string | null;
  sensitivity: number;
  bgMode: string;
  overlapMerge: number;
  aspectRatio: string;
  cannyLow: number;
  cannyHigh: number;
  closeKernel: number;
}) {
  const [activeEngine, setActiveEngine] = useState<"opencv" | "gemini">("opencv");
  const [opencvPanels, setOpencvPanels] = useState<any[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  const runPreview = async () => {
    if (!firstImageUrl) return;
    setIsDetecting(true);
    try {
      const resp = await fetch(firstImageUrl);
      const blob = await resp.blob();
      const reader = new FileReader();
      const b64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(blob);
      });

      const detectResp = await fetch("/api/py/panels/detect-b64", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: b64,
          sensitivity,
          background_mode: bgMode,
          min_width_pct: 0.15,
          min_height_px: 60,
          merge_threshold: overlapMerge,
          aspect_ratio: aspectRatio,
          canny_low: cannyLow,
          canny_high: cannyHigh,
          close_kernel_size: closeKernel
        })
      });

      const data = await detectResp.json();
      if (data.success) {
        setOpencvPanels(data.panels);
      }
    } catch (err) {
      console.error("Preview failed:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <div className="bg-neutral-950/40 border border-neutral-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Engine Strategy Comparison</span>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={runPreview}
             disabled={isDetecting || !firstImageUrl || activeEngine === 'gemini'}
             className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[8px] font-bold uppercase hover:bg-cyan-500/20 disabled:opacity-20"
           >
             {isDetecting ? <RefreshCw className="h-2.5 w-2.5 animate-spin" /> : <Eye className="h-2.5 w-2.5" />}
           </button>
           <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
              <button onClick={() => setActiveEngine("opencv")} className={`px-2 py-1 text-[8px] rounded-md font-bold uppercase transition-all ${activeEngine === "opencv" ? "bg-cyan-500 text-black shadow-lg" : "text-neutral-500"}`}>OpenCV</button>
              <button onClick={() => setActiveEngine("gemini")} className={`px-2 py-1 text-[8px] rounded-md font-bold uppercase transition-all ${activeEngine === "gemini" ? "bg-indigo-500 text-white shadow-lg" : "text-neutral-500"}`}>Gemini AI</button>
           </div>
        </div>
      </div>

      <div className="relative aspect-video rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900">
         {firstImageUrl ? (
            <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${firstImageUrl})` }} />
         ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <Brain className="h-12 w-12 text-white" />
            </div>
         )}

         {/* Detection Result Overlays */}
         <div className="absolute inset-0 p-4">
            {activeEngine === "opencv" ? (
               <>
                  {opencvPanels.length > 0 ? (
                    opencvPanels.map((p, i) => (
                      <div key={i} className="absolute border border-cyan-400 bg-cyan-400/10 shadow-[0_0_8px_rgba(34,211,238,0.2)]"
                        style={{
                          top: `${p.top_pct * 100}%`,
                          left: `${p.left_pct * 100}%`,
                          width: `${(1 - p.left_pct - p.right_pct) * 100}%`,
                          height: `${(1 - p.top_pct - p.bottom_pct) * 100}%`
                        }} />
                    ))
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-40">
                       <span className="text-[8px] font-mono text-cyan-300">CLICK EYE TO RUN OPENCV SCAN</span>
                    </div>
                  )}
               </>
            ) : (
               <div className="absolute inset-0 border-2 border-indigo-500/40 bg-indigo-500/5 rounded flex items-center justify-center">
                  <div className="w-3/4 h-3/4 border border-indigo-400 bg-indigo-400/10 rounded flex items-center justify-center p-4 text-center">
                     <span className="text-[9px] font-mono font-bold text-indigo-300 animate-pulse uppercase">Gemini Vision detects semantic boundaries using visual comprehension. (Simulation only - requires AI token)</span>
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800/50">
        <p className="text-[9px] text-neutral-400 leading-normal flex items-start gap-2">
           <ArrowRight className="h-3 w-3 mt-0.5 text-indigo-400 shrink-0" />
           {activeEngine === "opencv"
             ? "OpenCV uses pixel-contrast gradients to find hard lines. Effective for standard manga pages."
             : "Gemini AI understands scene context, allowing it to segment panels even in complex webtoons with overlaps."}
        </p>
      </div>
    </div>
  );
}
