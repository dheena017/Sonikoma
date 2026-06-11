import React, { useRef, useEffect } from "react";
import { LayoutPanelTop, Paintbrush, Eraser } from "lucide-react";
import { useSandboxLogic } from "../../hooks/useSandboxLogic";

interface Props {
  eraseMethod: string;
  addNotification?: (msg: string, type: any) => void;
  firstImageUrl?: string | null;
}

export function BubbleCleanerSandbox({ eraseMethod, addNotification, firstImageUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    brushColor, setBrushColor,
    brushSize, setBrushSize,
    brushMode, setBrushMode,
    undo, redo, canUndo, canRedo,
    startDrawing, draw, stopDrawing, clearCanvas, simulateInpaint, setOriginalData
  } = useSandboxLogic(canvasRef, addNotification);

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

  const loadActivePanel = () => {
    if (!firstImageUrl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const x = (canvas.width / 2) - (img.width / 2) * scale;
      const y = (canvas.height / 2) - (img.height / 2) * scale;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      setOriginalData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      addNotification?.("Active panel loaded into sandbox!", "info");
    };
    img.src = firstImageUrl;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
         drawCartoonTemplate(ctx, canvas);
         setOriginalData(ctx.getImageData(0, 0, canvas.width, canvas.height));
      }
    }
  }, [setOriginalData]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  };

  return (
    <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-2">
           <span className="text-neutral-500 font-bold uppercase">doodle sandBox</span>
           <button
             onClick={loadActivePanel}
             disabled={!firstImageUrl}
             className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[7px] hover:bg-purple-500/20 disabled:opacity-20"
           >
              <LayoutPanelTop className="h-2.5 w-2.5" />
              LOAD PANEL
           </button>
        </div>
        <div className="flex gap-2">
           <button onClick={undo} disabled={!canUndo} className="px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 disabled:opacity-30">Undo</button>
           <button onClick={redo} disabled={!canRedo} className="px-2 py-0.5 rounded border border-neutral-800 bg-neutral-900 text-neutral-400 disabled:opacity-30">Redo</button>
        </div>
      </div>
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800">
        <canvas ref={canvasRef} width={240} height={160}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
          className="bg-neutral-900 cursor-crosshair block" />
      </div>
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between">
           <div className="flex bg-neutral-900 rounded-lg p-0.5 border border-neutral-800">
              <button onClick={() => setBrushMode("paint")} className={`p-1 rounded ${brushMode === 'paint' ? 'bg-purple-600 text-white' : 'text-neutral-500'}`} title="Paint Mode"><Paintbrush className="h-3 w-3" /></button>
              <button onClick={() => setBrushMode("restore")} className={`p-1 rounded ${brushMode === 'restore' ? 'bg-indigo-600 text-white' : 'text-neutral-500'}`} title="Restore Original"><Eraser className="h-3 w-3" /></button>
           </div>
           <div className="flex items-center gap-3">
             <input type="range" min="2" max="30" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-20 h-1 bg-neutral-800 accent-purple-500" />
            <div className="flex gap-1.5">
              {[["#ffffff", "bg-white"], ["#000000", "bg-black"], ["#818cf8", "bg-[#818cf8]"]].map(([color, bg]) => (
                <button key={color} onClick={() => { setBrushColor(color); setBrushMode("paint"); }}
                  className={`w-4 h-4 rounded-full border ${bg} ${brushColor === color && brushMode === 'paint' ? "border-purple-500 ring-1 ring-purple-500" : "border-neutral-700"}`} />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => simulateInpaint(eraseMethod)} className="py-1.5 rounded-lg border border-purple-800 bg-purple-950/20 hover:bg-purple-500/10 text-purple-300 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer">Clean speech bubble</button>
          <button type="button" onClick={() => clearCanvas(drawCartoonTemplate)} className="py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 text-[9px] font-bold font-mono transition-all active:scale-95 cursor-pointer">Reset SandBox</button>
        </div>
      </div>
    </div>
  );
}
