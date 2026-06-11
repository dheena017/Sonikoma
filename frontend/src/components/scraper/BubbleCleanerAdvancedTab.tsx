/**
 * BubbleCleanerAdvancedTab — Detection sensitivity, target bubble color,
 * mask dilation, inpaint radius, preview mask color, SFX protection toggle,
 * and JSON payload debugger.
 */
import React, { useState } from "react";
import { FileJson, ChevronDown } from "lucide-react";
import { BubbleCleanerSharedProps } from "./tabTypes";

interface Props extends BubbleCleanerSharedProps {}

export function BubbleCleanerAdvancedTab({
  detectionStyle,
  eraseMethod,
  sensitivity, setSensitivity,
  bubbleDilation, setBubbleDilation,
  bubbleInpaintRadius, setBubbleInpaintRadius,
}: Props) {
  const [targetColorOption, setTargetColorOption] = useState("auto");
  const [customColorHex, setCustomColorHex] = useState("#ffffff");
  const [sfxProtection, setSfxProtection] = useState(true);
  const [maskColor, setMaskColor] = useState("rgba(168, 85, 247, 0.45)");
  const [showJsonDebugger, setShowJsonDebugger] = useState(false);

  const getDilationSuggestion = () => bubbleDilation !== -1 ? `${bubbleDilation}px (Custom override)` : "Auto-Dilation (Recommended: 4px to 6px based on image resolution)";

  const jsonPayload = JSON.stringify({
    method: eraseMethod,
    sensitivity,
    detection_style: detectionStyle,
    dilation: bubbleDilation,
    inpaint_radius: bubbleInpaintRadius,
    target_color_mode: targetColorOption,
    target_color_hex: targetColorOption === "custom" ? customColorHex : null,
    sfx_protection: sfxProtection,
  }, null, 2);

  const card = "space-y-1.5 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl";
  const row = "flex justify-between items-center text-[10px] font-mono";
  const slider = (accent: string) => `w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-${accent}-500`;

  return (
    <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
      {/* Row 1: Sensitivity + Color Mode */}
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <div className={row}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Detection Sensitivity</span>
            <span className="text-purple-400 font-bold">{sensitivity}%</span>
          </div>
          <input type="range" min="10" max="90" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} className={slider("purple")} />
          <p className="text-[8px] text-neutral-600 leading-normal">OpenCV adaptive contrast limit. Higher values sweep light colored bubble boundaries aggressively.</p>
          <div className="mt-2 text-[8px] font-mono text-emerald-500 bg-emerald-950/15 border border-emerald-950/30 px-2 py-1 rounded-lg">
            💡 Target Recommendation: {sensitivity > 55 ? "Light/Day pages" : "Dark/Night panel mode (Thresh optimized)"}
          </div>
        </div>

        <div className="space-y-2 p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl">
          <span className="text-neutral-500 uppercase tracking-wider font-bold text-[9px] font-mono block">Target Bubble Color Mode</span>
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
      </div>

      {/* Row 2: Dilation + Inpaint Radius */}
      <div className="grid grid-cols-2 gap-4">
        <div className={card}>
          <div className={row}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Mask Dilation (Stroke Expansion)</span>
            <span className="text-purple-400 font-bold">{bubbleDilation === -1 ? "Auto (-1)" : `${bubbleDilation}px`}</span>
          </div>
          <input type="range" min="-1" max="15" value={bubbleDilation} onChange={(e) => setBubbleDilation(Number(e.target.value))} className={slider("purple")} />
          <p className="text-[8px] text-neutral-600 leading-normal">Expands the detection mask to wrap thick black outlines of bubbles, avoiding ghost rings.</p>
          <div className="text-[8px] font-mono text-neutral-500 italic mt-1">Suggested offset: {getDilationSuggestion()}</div>
        </div>

        <div className={card}>
          <div className={row}>
            <span className="text-neutral-500 uppercase tracking-wider font-bold">Inpaint radius (TELEA blending)</span>
            <span className="text-purple-400 font-bold">{bubbleInpaintRadius}px</span>
          </div>
          <input type="range" min="1" max="10" value={bubbleInpaintRadius} onChange={(e) => setBubbleInpaintRadius(Number(e.target.value))} className={slider("purple")} />
          <p className="text-[8px] text-neutral-600 leading-normal">Size of the pixel neighborhood used to reconstruct color gradients inside the erased spaces.</p>
        </div>
      </div>

      {/* Row 3: Mask Overlay Color + SFX Protection */}
      <div className="grid grid-cols-2 gap-4">
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

        <label className="flex items-center gap-3.5 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-5 py-4 cursor-pointer hover:bg-neutral-900 transition-all select-none">
          <input type="checkbox" checked={sfxProtection} onChange={(e) => setSfxProtection(e.target.checked)} className="accent-purple-500 h-4.5 w-4.5 rounded cursor-pointer" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-white">SFX & Face Detail Protection</span>
            <span className="text-[8.5px] text-neutral-500 leading-normal mt-0.5">Filters text stroke groupings intersecting complex illustration contours (eyes, screen tones) to protect character faces from distortions.</span>
          </div>
        </label>
      </div>

      {/* JSON Payload Debugger */}
      <div className="border border-neutral-800 rounded-2xl overflow-hidden bg-neutral-950/50">
        <button type="button" onClick={() => setShowJsonDebugger(!showJsonDebugger)}
          className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900/40 hover:bg-neutral-900/80 transition-colors border-b border-neutral-800 text-neutral-400 hover:text-white cursor-pointer select-none">
          <div className="flex items-center gap-2 text-[9px] font-mono font-bold tracking-wider uppercase">
            <FileJson className="h-3.5 w-3.5 text-purple-400" />
            <span>API JSON Request Payload Debugger</span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showJsonDebugger ? "rotate-180 text-purple-400" : ""}`} />
        </button>
        {showJsonDebugger && (
          <div className="p-4 bg-[#08080c] font-mono text-[9px] text-neutral-300 leading-relaxed overflow-x-auto select-all max-h-[160px] animate-fadeIn">
            <pre>{jsonPayload}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
