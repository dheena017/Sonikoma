/**
 * BubbleCleanerHelpTab — Parameter manual, bubble type legend,
 * concentric magnifier visualizer, doodle sandbox, and API crash simulator.
 */
import React, { useRef, useEffect, useState } from "react";
import { HelpCircle, Layers, Info } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { LEGEND } from "./bubbleCleanerConfig";

interface Props {
  eraseMethod: string;
  bubbleDilation: number;
  bubbleInpaintRadius: number;
  addNotification?: (msg: string, type: any) => void;
}

export function BubbleCleanerHelpTab({
  eraseMethod, bubbleDilation, bubbleInpaintRadius, addNotification,
}: Props) {
  // Doodle sandbox
  const sandboxCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sandboxBrushColor, setSandboxBrushColor] = useState("#ffffff");

  const drawCartoonTemplate = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.fillStyle = "#1e1b4b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#818cf8"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(120, 100, 40, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(120, 100, 25, 0, Math.PI); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.strokeStyle = "#000000"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(130, 60, 50, 25, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.beginPath(); ctx.moveTo(120, 80); ctx.lineTo(135, 75); ctx.lineTo(125, 95); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#000000"; ctx.font = "bold 10px monospace";
    ctx.fillText("HELLO WORLD!", 95, 63);
  };

  useEffect(() => {
    const canvas = sandboxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) drawCartoonTemplate(ctx, canvas);
  }, []);

  const startSandboxDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sandboxCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const drawInSandbox = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = sandboxCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = sandboxBrushColor; ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
  };

  const runSandboxClean = () => {
    const canvas = sandboxCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const [r, g, b] = [d[i], d[i+1], d[i+2]];
      if (r > 240 && g > 240 && b > 240) {
        if (eraseMethod === "solid_black") { d[i] = 0; d[i+1] = 0; d[i+2] = 0; }
        else if (eraseMethod === "blur")   { d[i] = 40; d[i+1] = 35; d[i+2] = 90; }
        else                               { d[i] = 30; d[i+1] = 27; d[i+2] = 75; }
      }
      if (r < 15 && g < 15 && b < 15) { d[i] = 30; d[i+1] = 27; d[i+2] = 75; }
    }
    ctx.putImageData(imgData, 0, 0);
    addNotification?.("Sandbox cleaned speech bubbles successfully!", "success");
  };

  const resetSandbox = () => {
    const canvas = sandboxCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    drawCartoonTemplate(ctx, canvas);
  };

  const dilR = Math.max(22, 20 + (bubbleDilation === -1 ? 4 : bubbleDilation) * 1.2);
  const inpR = Math.max(24, dilR + bubbleInpaintRadius * 1.5);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.2s_ease-out]">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Parameter manual */}
          <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-purple-400">
              <HelpCircle className="h-4.5 w-4.5" />
              <h3 className="font-bold font-mono text-xs uppercase tracking-wider">Bubble Parameter Manual</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9.5px] leading-relaxed">
              {[
                { title: "🔮 Detection Styles", body: "Use All Bubbles to clean narration cards and standard circles. Use White only if you just want white dialogue spheres without touching caption backgrounds." },
                { title: "🧱 Mask Dilation", body: "Extends boundaries slightly outwards. Prevents dark border ghosts from smudging backgrounds in the inpainter output." },
                { title: "🌫️ Gaussian blur vs inpaint", body: "Gaussian blur completely hides text inside colored blocks while preserving gradient colors. TELEA inpainting reconstructs drawing textures beneath clean white bubbles." },
                { title: "🎨 Custom Color filters", body: "Helpful if a webtoon uses colored thought bubbles (e.g. yellow or blue dialogue text panels) by target-masking that exact hex range." },
              ].map(({ title, body }) => (
                <div key={title} className="p-3.5 bg-neutral-900/30 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="font-mono font-bold text-white block">{title}</span>
                  <p className="text-neutral-500 font-sans">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bubble type legend */}
          <div className="space-y-3">
            <SectionTitle icon={<Layers className="h-3 w-3 text-purple-400" />}>Bubble Type Legend</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {LEGEND.map((item) => (
                <div key={item.label} className="flex items-start gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-4 py-3">
                  <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-[10px] font-bold text-neutral-200 font-mono">{item.label}</p>
                    <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Concentric magnifier */}
          <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Magnifier Mask Visualizer</span>
            <div className="relative w-full max-w-[200px] aspect-square rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#262626" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="50" cy="50" r={dilR} fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r={inpR} fill="none" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="5,2" />
              </svg>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[7px] font-mono text-neutral-600 bg-neutral-900/60 p-1.5 rounded-lg border border-neutral-900">
                <span className="text-purple-400">Core</span>
                <span className="text-pink-400">Dilation</span>
                <span className="text-indigo-400">Inpaint Radius</span>
              </div>
            </div>
            <span className="text-[8px] text-neutral-600 font-mono text-center">SVG rings reflect stroke protection & bleed boundaries.</span>
          </div>

          {/* Doodle sandbox */}
          <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-[9px] font-mono">
              <span className="text-neutral-500 font-bold uppercase">doodle sandBox</span>
              <span className="text-purple-400 font-bold">Draw & Clean</span>
            </div>
            <div className="relative rounded-2xl overflow-hidden border border-neutral-800">
              <canvas ref={sandboxCanvasRef} width={240} height={160}
                onMouseDown={startSandboxDrawing} onMouseMove={drawInSandbox}
                onMouseUp={() => setIsDrawing(false)} onMouseLeave={() => setIsDrawing(false)}
                className="bg-neutral-900 cursor-crosshair block" />
            </div>
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-[8px] font-mono">
                <span className="text-neutral-500">Select Doodle Brush:</span>
                <div className="flex gap-1.5">
                  {[["#ffffff", "bg-white"], ["#000000", "bg-black"], ["#818cf8", "bg-[#818cf8]"]].map(([color, bg]) => (
                    <button key={color} onClick={() => setSandboxBrushColor(color)}
                      className={`w-4 h-4 rounded-full border ${bg} ${sandboxBrushColor === color ? "border-purple-500 ring-1 ring-purple-500" : "border-neutral-700"}`} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={runSandboxClean} className="py-1.5 rounded-lg border border-purple-800 bg-purple-950/20 hover:bg-purple-500/10 text-purple-300 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer">Clean speech bubble</button>
                <button type="button" onClick={resetSandbox} className="py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer">Reset SandBox</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Crash Simulator */}
      <div className="border border-red-950 bg-red-950/10 rounded-3xl p-5 space-y-3.5 animate-fadeIn">
        <div className="flex items-center gap-2 text-red-400 text-[10px] font-bold font-mono">
          <Info className="h-4.5 w-4.5" />
          <span>GEMINI VISION API DISPATCH FAILURE SIMULATOR</span>
        </div>
        <p className="text-[9px] text-neutral-500 font-sans leading-normal">Toggle this simulator to inspect how the frontend intercepts backend speech-bubble exceptions (like 503 API Server Offline or model timeouts) and displays the CV fallback alert popup in real-time.</p>
        <button type="button"
          onClick={() => addNotification?.("API Exception Simulator: Gemini AI went offline. Speech bubble cleaning fell back to local OpenCV threshold filters.", "error")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-900/40 bg-red-900/20 hover:bg-red-900/35 text-red-400 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer">
          Trigger API Failure Alert simulation
        </button>
      </div>
    </>
  );
}
