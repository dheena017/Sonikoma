import React, { useState } from "react";
import { Sparkles, Brain, ArrowRight } from "lucide-react";

export function AutoCropEngineComparison({ firstImageUrl }: { firstImageUrl: string | null }) {
  const [activeEngine, setActiveEngine] = useState<"opencv" | "gemini">("opencv");

  return (
    <div className="bg-neutral-950/40 border border-neutral-800 rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider font-mono">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Engine Strategy Comparison</span>
        </div>
        <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
           <button onClick={() => setActiveEngine("opencv")} className={`px-2 py-1 text-[8px] rounded-md font-bold uppercase transition-all ${activeEngine === "opencv" ? "bg-cyan-500 text-black shadow-lg" : "text-neutral-500"}`}>OpenCV</button>
           <button onClick={() => setActiveEngine("gemini")} className={`px-2 py-1 text-[8px] rounded-md font-bold uppercase transition-all ${activeEngine === "gemini" ? "bg-indigo-500 text-white shadow-lg" : "text-neutral-500"}`}>Gemini AI</button>
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

         {/* Simulated Detection Result Overlays */}
         <div className="absolute inset-0 p-4 flex flex-col gap-2">
            {activeEngine === "opencv" ? (
               <>
                  <div className="w-1/2 h-1/3 border border-cyan-400/60 bg-cyan-400/10 rounded relative shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                     <span className="absolute -top-3 left-0 text-[6px] font-mono text-cyan-400">EDGE_DETECT_A</span>
                  </div>
                  <div className="w-1/3 h-1/2 border border-cyan-400/60 bg-cyan-400/10 rounded self-end relative shadow-[0_0_8px_rgba(34,211,238,0.2)]">
                     <span className="absolute -top-3 right-0 text-[6px] font-mono text-cyan-400">EDGE_DETECT_B</span>
                  </div>
               </>
            ) : (
               <>
                  <div className="w-full h-full border-2 border-indigo-500/40 bg-indigo-500/5 rounded relative flex items-center justify-center">
                     <div className="w-3/4 h-3/4 border border-indigo-400 bg-indigo-400/10 rounded flex items-center justify-center">
                        <span className="text-[10px] font-mono font-bold text-indigo-300 animate-pulse">SEMANTIC_PANEL_RECOGNITION</span>
                     </div>
                  </div>
               </>
            )}
         </div>
      </div>

      <div className="bg-neutral-900/60 rounded-xl p-3 border border-neutral-800/50">
        <p className="text-[9px] text-neutral-400 leading-normal flex items-start gap-2">
           <ArrowRight className="h-3 w-3 mt-0.5 text-indigo-400 shrink-0" />
           {activeEngine === "opencv"
             ? "OpenCV uses pixel-contrast gradients to find hard lines. Best for traditional manga with clear gutters."
             : "Gemini Vision uses LLM-vision to understand scene boundaries even when frames overlap or bleed into gutters."}
        </p>
      </div>
    </div>
  );
}
