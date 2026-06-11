import React from "react";
import { Maximize2 } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { ASPECT_RATIO_OPTIONS } from "./autoCropConfig";

interface Props {
  aspectRatioLock: string;
  setAspectRatioLock: (v: string) => void;
}

export function AutoCropRatioLockSelector({ aspectRatioLock, setAspectRatioLock }: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Maximize2 className="h-3 w-3" />}>Aspect Ratio Lock</SectionTitle>
      <div className="grid grid-cols-3 gap-2">
        {ASPECT_RATIO_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setAspectRatioLock(opt.value)}
            className={`flex flex-col items-center gap-0.5 px-3 py-3.5 rounded-xl border text-center transition-all cursor-pointer ${aspectRatioLock === opt.value ? "bg-violet-900/30 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
            <span className={`text-[12px] font-bold font-mono ${aspectRatioLock === opt.value ? "text-violet-300" : "text-neutral-300"}`}>{opt.label}</span>
            <span className="text-[8px] text-neutral-600 font-sans leading-tight">{opt.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
