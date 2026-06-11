import React, { useState, useEffect } from "react";
import { Activity, Thermometer } from "lucide-react";

export function AutoCropComplexityAnalysis({ firstImageUrl }: { firstImageUrl: string | null }) {
  const [complexity, setComplexity] = useState<{ score: number; level: string; color: string } | null>(null);

  useEffect(() => {
    if (!firstImageUrl) { setComplexity(null); return; }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 100;
      canvas.height = (img.height / img.width) * 100;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let diffSum = 0;

      // Simple Sobel-ish edge density approximation
      for (let i = 0; i < data.length - 4; i += 4) {
         const gray1 = (data[i] + data[i+1] + data[i+2]) / 3;
         const gray2 = (data[i+4] + data[i+5] + data[i+6]) / 3;
         diffSum += Math.abs(gray1 - gray2);
      }

      const score = Math.min(100, Math.round((diffSum / (data.length / 4)) * 2));
      let level = "Low";
      let color = "text-emerald-400";

      if (score > 60) { level = "High (Complex)"; color = "text-red-400"; }
      else if (score > 30) { level = "Medium"; color = "text-amber-400"; }

      setComplexity({ score, level, color });
    };
    img.src = firstImageUrl;
  }, [firstImageUrl]);

  if (!complexity) return null;

  return (
    <div className="p-4 bg-neutral-950/40 border border-neutral-800 rounded-2xl space-y-3">
       <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="flex items-center gap-2 text-neutral-500 uppercase font-bold">
             <Activity className="h-3 w-3" />
             <span>Edge Complexity Analysis</span>
          </div>
          <span className={`${complexity.color} font-bold`}>{complexity.level}</span>
       </div>
       <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-1000 ${complexity.color.replace('text', 'bg')}`} style={{ width: `${complexity.score}%` }} />
       </div>
       <p className="text-[8px] text-neutral-500 leading-normal">
          Image edge density score: <span className="text-white font-mono">{complexity.score}</span>.
          {complexity.score > 50 ? " High complexity detected. Consider increasing Canny High threshold." : " Clean edges detected. Default sensitivity should be optimal."}
       </p>
    </div>
  );
}
