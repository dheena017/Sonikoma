import React, { useState } from "react";
import { Layers, Wand2, Loader2 } from "lucide-react";
import SectionTitle from "../../shared/SectionTitle";
import { BG_MODE_OPTIONS } from "./autoCropConfig";

interface Props {
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;
  firstImageUrl: string | null;
  addNotification?: (msg: string, type: any) => void;
}

export function AutoCropGutterModeToggle({
  cropBackgroundMode,
  setCropBackgroundMode,
  firstImageUrl,
  addNotification,
}: Props) {
  const [isDetecting, setIsDetecting] = useState(false);

  const detectGutterColor = async () => {
    if (!firstImageUrl) return;
    setIsDetecting(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setIsDetecting(false);
        return;
      }
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const samples: number[] = [];
      const step = 0.1; // 10 samples per edge

      // Sample Edges
      for (let i = 0; i <= 1; i += step) {
        // Top edge
        const t = ctx.getImageData(Math.floor(img.width * i), 5, 1, 1).data;
        samples.push((t[0] + t[1] + t[2]) / 3);

        // Bottom edge
        const b = ctx.getImageData(
          Math.floor(img.width * i),
          img.height - 5,
          1,
          1
        ).data;
        samples.push((b[0] + b[1] + b[2]) / 3);

        // Left edge
        const l = ctx.getImageData(5, Math.floor(img.height * i), 1, 1).data;
        samples.push((l[0] + l[1] + l[2]) / 3);

        // Right edge
        const r = ctx.getImageData(
          img.width - 5,
          Math.floor(img.height * i),
          1,
          1
        ).data;
        samples.push((r[0] + r[1] + r[2]) / 3);
      }

      const avgBrightness =
        samples.reduce((acc, s) => acc + s, 0) / samples.length;

      let detected: "white" | "black" | "auto" = "auto";
      if (avgBrightness > 215) detected = "white";
      else if (avgBrightness < 40) detected = "black";

      setCropBackgroundMode(detected);
      addNotification?.(
        `Smart Gutter Detection: Set to ${detected.toUpperCase()} (Avg brightness: ${Math.round(
          avgBrightness
        )})`,
        "info"
      );
      setIsDetecting(false);
    };
    img.onerror = () => {
      setIsDetecting(false);
      addNotification?.(
        "Failed to sample image for gutter detection.",
        "error"
      );
    };
    img.src = firstImageUrl;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Layers className="h-3 w-3" />}>
          Background Gutter Mode
        </SectionTitle>
        <button
          onClick={detectGutterColor}
          disabled={!firstImageUrl || isDetecting}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[9px] font-bold uppercase hover:bg-indigo-500/20 transition-all disabled:opacity-20"
        >
          {isDetecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3" />
          )}
          Edge-Sample Detect
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {BG_MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCropBackgroundMode(opt.value)}
            className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-center transition-all cursor-pointer ${
              cropBackgroundMode === opt.value
                ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]"
                : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
            }`}
          >
            <div
              className={`h-3 w-3 rounded-full border ${
                opt.value === "white"
                  ? "bg-white border-neutral-400"
                  : opt.value === "black"
                  ? "bg-black border-neutral-600"
                  : "bg-indigo-500 border-indigo-400"
              }`}
            />
            <span
              className={`text-[10px] font-bold font-mono ${
                cropBackgroundMode === opt.value
                  ? "text-white"
                  : "text-neutral-400"
              }`}
            >
              {opt.label.split(" ")[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
