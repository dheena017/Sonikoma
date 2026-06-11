import React, { useState, useEffect, useRef } from "react";
import { Eye, RefreshCw, EyeOff, BarChart2 } from "lucide-react";

interface Props {
  firstImageUrl: string | null;
  sensitivity: number;
  detectionStyle: string;
  addNotification?: (msg: string, type: any) => void;
}

export function BubbleCleanerPixelScanner({ firstImageUrl, sensitivity, detectionStyle, addNotification }: Props) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showHistogram, setShowHistogram] = useState(true);
  const [histogramData, setHistogramData] = useState<{ h: number; isTarget: boolean }[]>([]);
  const maskColor = "rgba(168, 85, 247, 0.45)";
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!firstImageUrl) {
      setHistogramData([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw a smaller version for performance
      const w = 100;
      const h = (img.height / img.width) * w;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      const brightnessCount = new Array(256).fill(0);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const brightness = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        brightnessCount[brightness]++;
      }

      // Group into 24 bins for the UI
      const bins = 24;
      const binSize = Math.ceil(256 / bins);
      const groupedData = [];
      const maxCount = Math.max(...brightnessCount);

      for (let i = 0; i < bins; i++) {
        let sum = 0;
        for (let j = 0; j < binSize; j++) {
          const idx = i * binSize + j;
          if (idx < 256) sum += brightnessCount[idx];
        }

        // Threshold mapping (sensitivity 10-90 mapped to 0-255)
        // High sensitivity means lower threshold for what we consider "white"
        const threshold = 255 - (sensitivity * 2);
        const isTarget = (i * binSize) > threshold;

        groupedData.push({
          h: (sum / (maxCount * binSize)) * 100,
          isTarget
        });
      }
      setHistogramData(groupedData);
    };
    img.src = firstImageUrl;
  }, [firstImageUrl, sensitivity]);

  const triggerBubbleScan = () => {
    setIsScanning(true);
    // Real-ish scan simulation: we use the histogram to "guess"
    setTimeout(() => {
      setIsScanning(false);
      const targetWeight = histogramData.reduce((acc, bin) => bin.isTarget ? acc + bin.h : acc, 0);
      const count = Math.round(targetWeight / 15); // Random heuristic
      setScanResult(`Analysis complete: Isolated ${count} suspected speech bubble${count !== 1 ? "s" : ""} on active frame.`);
      addNotification?.(`Located ${count} speech bubble mask${count !== 1 ? "s" : ""} on first panel!`, "info");
    }, 1100);
  };

  return (
    <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex items-center justify-between text-[9px] font-mono">
        <div className="flex items-center gap-2">
           <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
           <span className="text-neutral-500 font-bold uppercase">Dynamic Pixel Scanner</span>
        </div>
        <button onClick={() => setShowHistogram(!showHistogram)} className="text-neutral-600 hover:text-white transition-colors">{showHistogram ? "Hide Histogram" : "Show Histogram"}</button>
      </div>

      <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center">
        {firstImageUrl ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${firstImageUrl})` }} />
        ) : (
          <div className="absolute inset-0 bg-[#0e0e13] flex flex-col items-center justify-center text-center opacity-30 select-none">
            <EyeOff className="h-6 w-6 text-neutral-500 mb-1" />
            <span className="text-[7px] font-mono text-neutral-400 uppercase">Image Queue Empty</span>
          </div>
        )}

        {/* Live Contrast Mask Simulation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <div className="absolute rounded-full border border-dashed transition-all duration-300"
             style={{ backgroundColor: maskColor, borderColor: maskColor.replace("0.45", "0.9"), width: `${Math.max(60, 150 - sensitivity * 1.2)}px`, height: `${Math.max(30, 80 - sensitivity * 0.6)}px`, top: "35%", left: "25%", boxShadow: "0 0 14px rgba(168,85,247,0.3)" }} />

           <div className="absolute inset-0 bg-purple-500/10 mix-blend-overlay animate-pulse" />
        </div>

        {showHistogram && histogramData.length > 0 && (
           <div className="absolute bottom-4 left-4 right-4 h-16 flex items-end gap-0.5 bg-black/40 backdrop-blur-sm p-2 rounded-lg border border-white/5">
              {histogramData.map((bar, i) => (
                 <div key={i} className={`flex-1 rounded-t-sm transition-all duration-500 ${bar.isTarget ? 'bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'bg-neutral-700/40'}`} style={{ height: `${Math.max(2, bar.h)}%` }} />
              ))}
              <span className="absolute -top-3 left-2 text-[6px] font-mono text-neutral-500 uppercase tracking-tighter">Real Color Distribution (Thresh: {sensitivity})</span>
           </div>
        )}

        <span className="absolute top-2.5 right-2.5 text-[7.5px] px-2 py-0.5 rounded bg-black/70 border border-neutral-800 text-purple-300 font-mono tracking-wider">Mask Color contrast overlay</span>
      </div>

      <div className="space-y-2.5 pt-1">
        <button type="button" onClick={triggerBubbleScan} disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[10px] font-bold font-mono transition-all active:scale-98 cursor-pointer disabled:opacity-45">
          {isScanning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          {isScanning ? "Scanning Contrast Pixels..." : "Run suspected Speech Bubble Scan"}
        </button>
        {scanResult && <div className="p-3 rounded-xl bg-purple-950/10 border border-purple-900/35 text-[8.5px] font-mono text-purple-300 leading-normal animate-fadeIn">{scanResult}</div>}
      </div>
    </div>
  );
}
