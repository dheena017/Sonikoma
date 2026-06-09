import React from "react";
import SectionTitle from "../crop/SectionTitle";
import { Filter } from "lucide-react";

interface AutoCropRightColumnProps {
  sensitivity: number;
  setSensitivity: (v: number) => void;
  padding: number;
  setPadding: (v: number) => void;
  minPanelAreaPct: number;
  setMinPanelAreaPct: (v: number) => void;
  overlapMergeThreshold: number;
  setOverlapMergeThreshold: (v: number) => void;
  autoSplitTallStrips: boolean;
  setAutoSplitTallStrips: (v: boolean) => void;
  useLocalCV: boolean;
  setUseLocalCV: (v: boolean) => void;
}

export default function AutoCropRightColumn({
  sensitivity,
  setSensitivity,
  padding,
  setPadding,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  autoSplitTallStrips,
  setAutoSplitTallStrips,
  useLocalCV,
  setUseLocalCV,
}: AutoCropRightColumnProps) {
  return (
    <div className="lg:col-span-5 space-y-6">
      {/* SECTION 4: SENSITIVITY */}
      <div className="space-y-3">
        <SectionTitle>Detection Sensitivity</SectionTitle>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-300 font-sans">
                Threshold tolerance
              </p>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                Adjusts background boundary sensitivity.
              </p>
            </div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {sensitivity}
              <span className="text-sm text-neutral-400 ml-0.5">%</span>
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="90"
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
            <span>← High Tolerance</span>
            <span>Strict Borders →</span>
          </div>
        </div>
      </div>

      {/* SECTION 5: MARGIN PADDING */}
      <div className="space-y-3">
        <SectionTitle>Margin Padding</SectionTitle>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-300 font-sans">
                Outer border padding
              </p>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                Keeps whitespace border around panels.
              </p>
            </div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {padding}
              <span className="text-sm text-neutral-400 ml-0.5">px</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="w-full accent-indigo-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
            <span>0px (Tight)</span>
            <span>50px (Wide)</span>
          </div>
        </div>
      </div>

      {/* SECTION 6: MIN PANEL AREA */}
      <div className="space-y-3">
        <SectionTitle icon={<Filter className="h-3 w-3" />}>
          Noise Filter · Min Panel Area
        </SectionTitle>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-300 font-sans">
                Minimum detected area
              </p>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                Panels smaller than this % of total area are discarded as noise.
              </p>
            </div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {minPanelAreaPct}
              <span className="text-sm text-neutral-400 ml-0.5">%</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={minPanelAreaPct}
            onChange={(e) => setMinPanelAreaPct(Number(e.target.value))}
            className="w-full accent-emerald-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
            <span>0% (Keep all)</span>
            <span>20% (Aggressive filter)</span>
          </div>
        </div>
      </div>

      {/* SECTION 7: OVERLAP MERGE THRESHOLD */}
      <div className="space-y-3">
        <SectionTitle>Overlap Merge Threshold</SectionTitle>
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-neutral-300 font-sans">
                Merge overlapping boxes
              </p>
              <p className="text-[10px] text-neutral-600 font-sans mt-0.5">
                Boxes overlapping by more than this % of the smaller box are
                merged together.
              </p>
            </div>
            <span className="text-2xl font-bold text-white font-mono tabular-nums">
              {overlapMergeThreshold}
              <span className="text-sm text-neutral-400 ml-0.5">%</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="80"
            step="5"
            value={overlapMergeThreshold}
            onChange={(e) => setOverlapMergeThreshold(Number(e.target.value))}
            className="w-full accent-amber-500 bg-neutral-800 rounded-full h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600 font-mono">
            <span>0% (No merging)</span>
            <span>80% (Aggressive merge)</span>
          </div>
        </div>
      </div>

      {/* SECTION 8: TOGGLES */}
      <div className="bg-neutral-950/60 border border-neutral-800 rounded-2xl p-4 space-y-3">
        <label className="relative flex items-center gap-3 bg-neutral-900/30 border border-neutral-800 rounded-xl px-4 py-3 cursor-pointer hover:bg-neutral-900 transition-all select-none">
          <input
            type="checkbox"
            checked={autoSplitTallStrips}
            onChange={(e) => setAutoSplitTallStrips(e.target.checked)}
            className="accent-indigo-500 h-4 w-4 rounded cursor-pointer"
          />
          <div className="flex flex-col">
            <span className="text-[12px] font-bold text-white">
              Auto-Split Strips
            </span>
            <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
              Automatically slices long vertical webtoon strips into individual
              scenes.
            </span>
          </div>
        </label>

        <label
          className={`relative flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all select-none ${
            useLocalCV
              ? "bg-cyan-950/30 border-cyan-800/60 hover:bg-cyan-950/50"
              : "bg-neutral-900/30 border-neutral-800 hover:bg-neutral-900"
          }`}
        >
          <input
            type="checkbox"
            checked={useLocalCV}
            onChange={(e) => setUseLocalCV(e.target.checked)}
            className="accent-cyan-500 h-4 w-4 rounded cursor-pointer"
          />
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-white">
                Use Local CV Engine
              </span>
              <span
                className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded-md border ${
                  useLocalCV
                    ? "bg-cyan-950 text-cyan-400 border-cyan-800/60"
                    : "bg-neutral-800 text-neutral-500 border-neutral-700"
                }`}
              >
                {useLocalCV ? "OPENCV" : "JS-ONLY"}
              </span>
            </div>
            <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">
              Uses server-side Python OpenCV for faster, more accurate panel
              detection. Requires Python + opencv-python installed.
            </span>
          </div>
        </label>
      </div>
    </div>
  );
}
