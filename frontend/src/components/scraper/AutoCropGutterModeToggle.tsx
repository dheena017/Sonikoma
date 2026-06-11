import React from "react";
import { Layers, Wand2 } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { BG_MODE_OPTIONS } from "./autoCropConfig";

interface Props {
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;
  firstImageUrl: string | null;
}

export function AutoCropGutterModeToggle({ cropBackgroundMode, setCropBackgroundMode, firstImageUrl }: Props) {
  const detectGutterColor = async () => {
    if (!firstImageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Sample 4 corners
      const corners = [
        ctx.getImageData(0, 0, 1, 1).data,
        ctx.getImageData(img.width - 1, 0, 1, 1).data,
        ctx.getImageData(0, img.height - 1, 1, 1).data,
        ctx.getImageData(img.width - 1, img.height - 1, 1, 1).data
      ];

      const avgBrightness = corners.reduce((acc, c) => acc + (c[0] + c[1] + c[2]) / 3, 0) / 4;

      if (avgBrightness > 200) setCropBackgroundMode("white");
      else if (avgBrightness < 50) setCropBackgroundMode("black");
      else setCropBackgroundMode("auto");
    };
    img.src = firstImageUrl;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
         <SectionTitle icon={<Layers className="h-3 w-3" />}>Background Gutter Mode</SectionTitle>
         <button
           onClick={detectGutterColor}
           disabled={!firstImageUrl}
           className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] font-bold uppercase hover:bg-indigo-500/20 transition-all disabled:opacity-20"
         >
            <Wand2 className="h-2.5 w-2.5" />
            Smart Detect
         </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BG_MODE_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setCropBackgroundMode(opt.value)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-all cursor-pointer ${cropBackgroundMode === opt.value ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
            <div className={`h-3 w-3 rounded-full border ${opt.value === "white" ? "bg-white border-neutral-400" : opt.value === "black" ? "bg-black border-neutral-600" : "bg-indigo-500 border-indigo-400"}`} />
            <span className={`text-[10px] font-bold font-mono ${cropBackgroundMode === opt.value ? "text-white" : "text-neutral-400"}`}>{opt.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
