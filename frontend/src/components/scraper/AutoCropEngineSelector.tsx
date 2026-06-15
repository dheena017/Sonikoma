import React from "react";
import { Cpu, ChevronDown } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";

interface Props {
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
  cropModel: string;
  setCropModel: (v: string) => void;
}

export function AutoCropEngineSelector({
  useLocalCV,
  setUseLocalCV,
  cropModel,
  setCropModel,
}: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Cpu className="h-3 w-3" />}>
        Panel Detection Engine
      </SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setUseLocalCV(true)}
          className={`flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${
            useLocalCV
              ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.15)]"
              : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-white">OPENCV ONLY</span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                useLocalCV ? "bg-cyan-400" : "bg-neutral-800"
              }`}
            />
          </div>
          <p className="text-[10px] text-neutral-400 leading-normal font-sans">
            Server-side Python OpenCV edge finder. Uses canny filtering for
            rapid page gutter cutting. Offline capable and reliable.
          </p>
        </button>
        <button
          type="button"
          onClick={() => setUseLocalCV(false)}
          className={`flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${
            !useLocalCV
              ? "bg-indigo-950/20 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.15)]"
              : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-bold text-white">
              GEMINI VISION AI
            </span>
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                !useLocalCV ? "bg-indigo-400 animate-pulse" : "bg-neutral-800"
              }`}
            />
          </div>
          <p className="text-[10px] text-neutral-400 leading-normal font-sans">
            AI visual panel layout segmenter. Understands illustration boxes
            semantically even on complex overlap gutters.
          </p>
        </button>
      </div>

      {!useLocalCV && (
        <div className="space-y-2.5 p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl animate-fadeIn">
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">
            Gemini Vision Model
          </label>
          <div className="relative">
            <select
              value={cropModel}
              onChange={(e) => {
                setCropModel(e.target.value);
                console.log(
                  `[AutoCropEngineSelector] Crop model changed to: ${e.target.value}`
                );
              }}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3.5 py-2 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700"
            >
              <option value="gemini-3.5-flash">
                Gemini 3.5 Flash (Fast, Visual Layout)
              </option>
              <option value="gemini-3.5-pro">
                Gemini 3.5 Pro (Deep Visual Comprehension)
              </option>
              <option value="gemini-2.5-flash">
                Gemini 2.5 Flash (Fast, Visual Layout)
              </option>
              <option value="gemini-2.5-pro">
                Gemini 2.5 Pro (Deep Visual Comprehension)
              </option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      )}
    </div>
  );
}
