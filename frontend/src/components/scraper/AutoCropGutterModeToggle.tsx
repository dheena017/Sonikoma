import React from "react";
import { Layers } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { BG_MODE_OPTIONS } from "./autoCropConfig";

interface Props {
  cropBackgroundMode: string;
  setCropBackgroundMode: (v: string) => void;
}

export function AutoCropGutterModeToggle({ cropBackgroundMode, setCropBackgroundMode }: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Layers className="h-3 w-3" />}>Background Gutter Mode</SectionTitle>
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
