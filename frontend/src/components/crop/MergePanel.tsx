import React, { useState } from "react";
import { Layers, RefreshCw, ArrowDown, ArrowUp, ChevronUp, ChevronDown, Link2, Image as ImageIcon, Settings2, Columns, Rows } from "lucide-react";

interface MergePanelProps {
  editingImageIdx: number;
  scrapedImages: string[];
  isMerging: boolean;
  onMerge: (
    count: number,
    config: {
      direction: "next" | "prev";
      layout: "vertical" | "horizontal";
      spacing: number;
      spacingColor: string;
      scaleToFit: boolean;
      alignMode: "center" | "start" | "end";
      padding: number;
    }
  ) => Promise<void>;
}

export default function MergePanel({
  editingImageIdx,
  scrapedImages,
  isMerging,
  onMerge,
}: MergePanelProps) {
  const [mergeCount, setMergeCount] = useState<number>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [spacing, setSpacing] = useState<number>(0);
  const [spacingColor, setSpacingColor] = useState<string>("white");
  const [padding, setPadding] = useState<number>(0);
  const [scaleToFit, setScaleToFit] = useState<boolean>(true);
  const [alignMode, setAlignMode] = useState<"center" | "start" | "end">("center");

  const maxNext = scrapedImages.length - 1 - editingImageIdx;
  const maxPrev = editingImageIdx;
  const maxMergeable = direction === "next" ? maxNext : maxPrev;
  const canMerge = maxMergeable > 0;

  // Build a preview list of which image indices will be merged
  const previewIndices: number[] = [];
  if (direction === "next") {
    for (let i = editingImageIdx; i <= editingImageIdx + mergeCount && i < scrapedImages.length; i++) {
      previewIndices.push(i);
    }
  } else {
    const startIdx = Math.max(0, editingImageIdx - mergeCount);
    for (let i = startIdx; i <= editingImageIdx; i++) {
      previewIndices.push(i);
    }
  }

  const increment = () => setMergeCount((v) => Math.min(v + 1, Math.min(maxMergeable, 9)));
  const decrement = () => setMergeCount((v) => Math.max(1, v - 1));

  // When direction changes, make sure count doesn't exceed new max
  const handleDirectionChange = (newDir: "next" | "prev") => {
    setDirection(newDir);
    const newMax = newDir === "next" ? maxNext : maxPrev;
    if (mergeCount > newMax) {
      setMergeCount(Math.max(1, newMax));
    }
  };

  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-teal-500/10 border border-teal-500/15">
          <Link2 className="h-3 w-3 text-teal-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Advanced Panel Stitching
        </span>
      </div>

      {/* ── Configuration Options ── */}
      <div className="space-y-3 bg-black/20 border border-white/5 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Settings2 className="h-3 w-3 text-neutral-500" />
          <span className="text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-widest block">
            Stitch Options
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Direction toggle */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Direction</label>
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => handleDirectionChange("prev")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                  direction === "prev" ? "bg-teal-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <ArrowUp className="h-2.5 w-2.5" /> Prev
              </button>
              <button
                type="button"
                onClick={() => handleDirectionChange("next")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                  direction === "next" ? "bg-teal-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Next <ArrowDown className="h-2.5 w-2.5" />
              </button>
            </div>
          </div>

          {/* Layout toggle */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Layout</label>
            <div className="flex gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setLayout("vertical")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                  layout === "vertical" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Rows className="h-2.5 w-2.5" /> Vert
              </button>
              <button
                type="button"
                onClick={() => setLayout("horizontal")}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded text-[9px] font-mono font-bold transition-all ${
                  layout === "horizontal" ? "bg-indigo-600 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                <Columns className="h-2.5 w-2.5" /> Horz
              </button>
            </div>
          </div>
        </div>

        {/* Spacing & Color */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Gap Spacing</label>
              <span className="text-[8px] font-mono text-teal-400">{spacing}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Gap Color</label>
            <select
              value={spacingColor}
              onChange={(e) => setSpacingColor(e.target.value)}
              disabled={spacing === 0}
              className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40"
            >
              <option value="white">White</option>
              <option value="black">Black</option>
              <option value="transparent">Transparent</option>
            </select>
          </div>
        </div>

        {/* Scale & Align */}
        <div className="grid grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Scale Mode</label>
            <select
              value={scaleToFit ? "fit" : "original"}
              onChange={(e) => setScaleToFit(e.target.value === "fit")}
              className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none"
            >
              <option value="fit">Scale to Fit</option>
              <option value="original">Keep Original Size</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Alignment</label>
            <select
              value={alignMode}
              onChange={(e) => setAlignMode(e.target.value as any)}
              disabled={scaleToFit}
              className="w-full bg-black/40 border border-white/5 text-neutral-300 rounded-lg px-2 py-1 text-[9px] font-mono focus:outline-none disabled:opacity-40"
            >
              <option value="center">Center</option>
              <option value="start">{layout === "vertical" ? "Left" : "Top"}</option>
              <option value="end">{layout === "vertical" ? "Right" : "Bottom"}</option>
            </select>
          </div>
        </div>

        {/* Global Padding */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between">
            <label className="text-[8px] font-mono font-bold text-neutral-500 uppercase">Global Padding</label>
            <span className="text-[8px] font-mono text-teal-400">{padding}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={padding}
            onChange={(e) => setPadding(Number(e.target.value))}
            className="w-full accent-teal-500 h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer"
          />
        </div>
      </div>

      {!canMerge ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-center space-y-2">
          <ImageIcon className="h-6 w-6 text-neutral-600 mx-auto" />
          <p className="text-[10px] text-neutral-500 font-mono">
            {direction === "next"
              ? "This is the last image in the deck. No next images available to merge."
              : "This is the first image in the deck. No previous images available to merge."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Number selector ── */}
          <div className="bg-black/30 border border-white/6 rounded-2xl p-4 space-y-3">
            <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest block">
              Images to merge with
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={mergeCount <= 1 || isMerging}
                className="p-2 rounded-xl bg-black/40 border border-white/6 hover:bg-teal-500/10 hover:border-teal-500/30 text-neutral-500 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="flex-1 flex flex-col items-center gap-0.5">
                <span className="text-5xl font-black font-mono text-white tabular-nums leading-none"
                  style={{ textShadow: "0 0 30px rgba(45,212,191,0.4)" }}>
                  {mergeCount}
                </span>
                <span className="text-[9px] font-mono text-neutral-600">
                  {direction === "next" ? "next image" : "previous image"}{mergeCount !== 1 ? "s" : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={increment}
                disabled={mergeCount >= Math.min(maxMergeable, 9) || isMerging}
                className="p-2 rounded-xl bg-black/40 border border-white/6 hover:bg-teal-500/10 hover:border-teal-500/30 text-neutral-500 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5].filter((n) => n <= maxMergeable).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMergeCount(n)}
                  className={`px-3 py-1 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95 ${
                    mergeCount === n
                      ? "bg-teal-600/25 border-teal-500/50 text-teal-300 shadow-[0_0_8px_rgba(45,212,191,0.15)]"
                      : "bg-black/20 border-white/6 text-neutral-500 hover:text-neutral-200 hover:border-white/15"
                  }`}
                >
                  +{n}
                </button>
              ))}
              
              {maxMergeable > 5 && mergeCount !== maxMergeable && (
                <button
                  type="button"
                  onClick={() => setMergeCount(maxMergeable)}
                  className="px-3 py-1 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95 bg-purple-600/20 border-purple-500/40 text-purple-300 hover:bg-purple-600/40 hover:border-purple-400"
                >
                  Merge All Remaining
                </button>
              )}
            </div>
          </div>

          {/* ── Preview list of frames to merge ── */}
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest block">
              Frames to be merged ({previewIndices.length} total)
            </span>
            <div className={`space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin flex ${layout === "horizontal" ? "flex-row gap-2 overflow-x-auto overflow-y-hidden" : "flex-col"}`}>
              {previewIndices.map((imgIdx, i) => {
                const imgUrl = scrapedImages[imgIdx];
                const isCurrent = imgIdx === editingImageIdx;
                const isLast = i === previewIndices.length - 1;
                return (
                  <React.Fragment key={imgIdx}>
                    <div
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border flex-shrink-0 ${
                        isCurrent
                          ? "bg-teal-950/30 border-teal-800/40"
                          : "bg-black/20 border-white/5"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900">
                        <img
                          src={imgUrl}
                          alt={`Frame ${imgIdx + 1}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[10px] font-bold font-mono ${isCurrent ? "text-teal-300" : "text-neutral-400"}`}>
                          Frame #{imgIdx + 1}
                        </span>
                        {isCurrent && (
                          <span className="ml-2 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-950 text-teal-400 border border-teal-800/50">
                            CURRENT
                          </span>
                        )}
                      </div>
                    </div>
                    {!isLast && layout === "vertical" && (
                      <div className="flex justify-center">
                        <ArrowDown className="h-3 w-3 text-teal-700/60" />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Result summary ── */}
          <div className="flex items-center gap-2.5 bg-teal-950/20 border border-teal-800/30 rounded-xl px-3 py-2.5">
            <Layers className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />
            <p className="text-[10px] text-teal-300/80 font-sans leading-snug">
              <strong>{previewIndices.length} images</strong> → <strong>1 merged panel</strong>
              {" "}(frames{" "}
              <span className="font-mono">
                #{previewIndices[0] + 1}–#{previewIndices[previewIndices.length - 1] + 1}
              </span>
              {" "}will be removed from the deck)
            </p>
          </div>

          {/* ── Merge button ── */}
          <button
            type="button"
            onClick={() => onMerge(mergeCount, { direction, layout, spacing, spacingColor, scaleToFit, alignMode, padding })}
            disabled={isMerging || !canMerge}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-600 hover:to-emerald-600 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-teal-900/30"
            style={{ boxShadow: isMerging ? undefined : "0 0 20px rgba(20,184,166,0.2)" }}
          >
            {isMerging ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Merging Frames…</span>
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" />
                <span>Merge Frame #{editingImageIdx + 1} + {direction === "next" ? "Next" : "Prev"} {mergeCount}</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}

