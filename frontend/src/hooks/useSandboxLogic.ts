import { useState, useCallback, useRef, useEffect } from "react";

interface SandboxState {
  brushColor: string;
  brushSize: number;
  isDrawing: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

export function useSandboxLogic(canvasRef: React.RefObject<HTMLCanvasElement | null>, addNotification?: (msg: string, type: any) => void) {
  const [state, setState] = useState<SandboxState>({
    brushColor: "#ffffff",
    brushSize: 14,
    isDrawing: false,
    canUndo: false,
    canRedo: false,
  });

  const historyRef = useRef<ImageData[]>([]);
  const redoStackRef = useRef<ImageData[]>([]);

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(imageData);
    if (historyRef.current.length > 20) historyRef.current.shift();
    redoStackRef.current = [];

    setState(prev => ({ ...prev, canUndo: historyRef.current.length > 0, canRedo: false }));
  }, [canvasRef]);

  const undo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || historyRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    redoStackRef.current.push(currentImageData);

    const prevImageData = historyRef.current.pop()!;
    ctx.putImageData(prevImageData, 0, 0);

    setState(prev => ({ ...prev, canUndo: historyRef.current.length > 0, canRedo: true }));
  }, [canvasRef]);

  const redo = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(currentImageData);

    const nextImageData = redoStackRef.current.pop()!;
    ctx.putImageData(nextImageData, 0, 0);

    setState(prev => ({ ...prev, canUndo: true, canRedo: redoStackRef.current.length > 0 }));
  }, [canvasRef]);

  const startDrawing = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveToHistory();

    ctx.beginPath();
    ctx.moveTo(x, y);
    setState(prev => ({ ...prev, isDrawing: true }));
  }, [canvasRef, saveToHistory]);

  const draw = useCallback((x: number, y: number) => {
    if (!state.isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = state.brushColor;
    ctx.lineWidth = state.brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [canvasRef, state.isDrawing, state.brushColor, state.brushSize]);

  const stopDrawing = useCallback(() => {
    setState(prev => ({ ...prev, isDrawing: false }));
  }, []);

  const clearCanvas = useCallback((templateDrawer: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveToHistory();
    templateDrawer(ctx, canvas);
    addNotification?.("Sandbox reset to template.", "info");
  }, [canvasRef, saveToHistory, addNotification]);

  const simulateInpaint = useCallback((eraseMethod: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    saveToHistory();

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;

    // Simple color-based replacement to simulate cleaning
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];

      // If it's "drawn" text (white-ish)
      if (r > 230 && g > 230 && b > 230) {
        if (eraseMethod === "solid_black") { d[i]=0; d[i+1]=0; d[i+2]=0; }
        else if (eraseMethod === "blur")   { d[i]=40; d[i+1]=35; d[i+2]=90; } // Simulated blur color
        else if (eraseMethod === "solid_white") { d[i]=255; d[i+1]=255; d[i+2]=255; }
        else { d[i]=30; d[i+1]=27; d[i+2]=75; } // Simulated inpaint/auto
      }

      // If it's black-ish text
      if (r < 25 && g < 25 && b < 25) {
         d[i]=30; d[i+1]=27; d[i+2]=75;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    addNotification?.(`Simulated ${eraseMethod} cleaning complete!`, "success");
  }, [canvasRef, saveToHistory, addNotification]);

  return {
    ...state,
    setBrushColor: (color: string) => setState(prev => ({ ...prev, brushColor: color })),
    setBrushSize: (size: number) => setState(prev => ({ ...prev, brushSize: size })),
    undo,
    redo,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    simulateInpaint
  };
}
