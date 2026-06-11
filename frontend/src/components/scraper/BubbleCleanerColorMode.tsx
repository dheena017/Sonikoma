import React, { useState, useRef } from "react";
import { Pipette, SlidersHorizontal } from "lucide-react";

interface Props {
  maskColor: string;
  setMaskColor: (v: string) => void;
  firstImageUrl: string | null;
  tolerance: number;
  setTolerance: (v: number) => void;
}

export function BubbleCleanerColorMode({ maskColor, setMaskColor, firstImageUrl, tolerance, setTolerance }: Props) {
  const [targetColorOption, setTargetColorOption] = useState("auto");
  const [customColorHex, setCustomColorHex] = useState("#ffffff");
  const [isPicking, setIsPicking] = useState(false);

  const quickPalettes = [
    { name: "Pure White", hex: "#ffffff" },
    { name: "Off-White", hex: "#fcfcfc" },
    { name: "Parchment", hex: "#f5f5dc" },
    { name: "Night Mode", hex: "#1a1a1a" },
    { name: "Comic Yellow", hex: "#fff9c4" },
  ];

  const handlePipetteClick = () => {
     if (!firstImageUrl) return;
     setIsPicking(!isPicking);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl">
          <div className="flex items-center justify-between">
             <span className="text-neutral-500 uppercase tracking-wider font-bold text-[9px] font-mono block">Target Bubble Color Mode</span>
             <button
               onClick={handlePipetteClick}
               className={`p-1 rounded-md transition-all ${isPicking ? 'bg-purple-500 text-white animate-pulse' : 'text-neutral-500 hover:text-white'}`}
               title="Sample Center Color"
             >
                <Pipette className="h-3.5 w-3.5" />
             </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <button onClick={() => setTargetColorOption("auto")} className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${targetColorOption === "auto" ? "bg-purple-950/20 border-purple-500 text-purple-300" : "bg-neutral-900 border-neutral-800 text-neutral-500"}`}>Auto-Detect White</button>
            <button onClick={() => setTargetColorOption("custom")} className={`py-1.5 rounded-lg border text-center transition-all cursor-pointer ${targetColorOption === "custom" ? "bg-purple-950/20 border-purple-500 text-purple-300" : "bg-neutral-900 border-neutral-800 text-neutral-500"}`}>Custom Selector</button>
          </div>
          {targetColorOption === "custom" && (
            <div className="flex items-center gap-3 pt-1.5 border-t border-neutral-900 animate-fadeIn">
              <span className="text-[8px] font-mono text-neutral-500">Pick Target Hex:</span>
              <input type="color" value={customColorHex} onChange={(e) => setCustomColorHex(e.target.value)} className="h-6 w-10 bg-transparent border-0 cursor-pointer rounded-md focus:outline-none" />
              <span className="text-[8px] font-mono font-bold text-white uppercase">{customColorHex}</span>
            </div>
          )}
        </div>

        <div className="space-y-2 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl">
          <span className="text-neutral-500 uppercase tracking-wider font-bold text-[9px] font-mono block">Preview Mask Color</span>
          <div className="grid grid-cols-4 gap-1.5 text-[8px] font-mono text-center">
            {[
              { label: "💜 Purple", val: "rgba(168, 85, 247, 0.45)", active: "border-purple-500 text-purple-400 bg-purple-950/15" },
              { label: "❤️ Red",    val: "rgba(239, 68, 68, 0.45)",  active: "border-red-500 text-red-400 bg-red-950/15" },
              { label: "💚 Green",  val: "rgba(16, 185, 129, 0.45)", active: "border-emerald-500 text-emerald-400 bg-emerald-950/15" },
              { label: "💙 Cyan",   val: "rgba(6, 182, 212, 0.45)",  active: "border-cyan-500 text-cyan-400 bg-cyan-950/15" },
            ].map(({ label, val, active }) => (
              <button key={val} onClick={() => setMaskColor(val)} className={`py-1.5 rounded-lg border cursor-pointer ${maskColor === val ? active : "border-neutral-900 text-neutral-500"}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         {targetColorOption === "custom" && (
           <div className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl space-y-3 animate-fadeIn">
              <span className="text-neutral-500 uppercase tracking-wider font-bold text-[8px] font-mono block">Quick Palette Library</span>
              <div className="flex flex-wrap gap-2">
                 {quickPalettes.map(p => (
                    <button key={p.hex} onClick={() => setCustomColorHex(p.hex)}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 transition-all ${customColorHex === p.hex ? 'border-purple-500/50 bg-purple-500/10' : ''}`}>
                       <div className="w-3 h-3 rounded-full border border-neutral-700" style={{ backgroundColor: p.hex }} />
                       <span className="text-[9px] font-mono text-neutral-300">{p.name}</span>
                    </button>
                 ))}
              </div>
           </div>
         )}

         <div className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Color Tolerance Tuning</span>
               </div>
               <span className="text-purple-400 font-mono font-bold text-[10px]">{tolerance}%</span>
            </div>
            <input type="range" min="1" max="50" value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
            <p className="text-[7.5px] text-neutral-600 leading-normal">Determines the allowed variance from the target color. Higher values expand the mask into nearby shades.</p>
         </div>
      </div>
    </div>
  );
}
